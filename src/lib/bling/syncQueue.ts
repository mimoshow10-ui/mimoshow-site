import { supabase } from '@/lib/supabase';
import { enviarPedidoVendaBling, EnvioBlingResultado } from './blingService';

// Intervalos de retentativa em milissegundos: 1m, 5m, 15m, 30m, 60m
const RETRY_INTERVALS_MS = [
  1 * 60 * 1000,   // Tentativa 1: 1 min
  5 * 60 * 1000,   // Tentativa 2: 5 min
  15 * 60 * 1000,  // Tentativa 3: 15 min
  30 * 60 * 1000,  // Tentativa 4: 30 min
  60 * 60 * 1000,  // Tentativa 5: 60 min
];

export const MAX_RETRY_ATTEMPTS = 5;

export interface SincronizacaoOpcoes {
  forcarReenvio?: boolean;
  origemChamada?: string; // 'webhook_mercadopago' | 'painel_admin' | 'cron_retry'
}

/**
 * Executa a sincronização segura de um pedido com o Bling ERP.
 * Controla idempotência, estados de fila, retries automáticos e logs de histórico.
 */
export async function sincronizarPedidoComBling(
  numeroOuId: string,
  opcoes: SincronizacaoOpcoes = {}
): Promise<{ sucesso: boolean; mensagem: string; bling_id?: string; pedido?: any }> {
  try {
    const { data: config } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'pedidos_db')
      .maybeSingle();

    const pedidos: any[] = Array.isArray(config?.valor) ? config.valor : [];
    const index = pedidos.findIndex(
      (p) =>
        String(p.numero_pedido || p.id).replace(/\D/g, '') === String(numeroOuId).replace(/\D/g, '') ||
        p.id === numeroOuId
    );

    if (index < 0) {
      return { sucesso: false, mensagem: `Pedido #${numeroOuId} não foi encontrado no banco de dados.` };
    }

    const pedido = pedidos[index];

    // Verificar se já está transmitido com sucesso
    if (!opcoes.forcarReenvio && pedido.bling_status === 'OK' && pedido.bling_id) {
      return {
        sucesso: true,
        mensagem: `Pedido #${numeroOuId} já está sincronizado com o Bling (ID: #${pedido.bling_id}).`,
        bling_id: pedido.bling_id,
        pedido,
      };
    }

    // Trava de concorrência: se já está processando nos últimos 30 segundos, ignorar evento concorrente
    const agoraMs = Date.now();
    if (
      pedido.bling_status === 'PROCESSANDO' &&
      pedido.bling_processando_inicio &&
      agoraMs - new Date(pedido.bling_processando_inicio).getTime() < 30000
    ) {
      return {
        sucesso: false,
        mensagem: `Pedido #${numeroOuId} já está em processamento no momento. Aguarde alguns instantes.`,
        pedido,
      };
    }

    // Marcar como PROCESSANDO temporariamente para bloquear race conditions
    pedido.bling_status = 'PROCESSANDO';
    pedido.bling_processando_inicio = new Date().toISOString();
    pedidos[index] = pedido;
    await supabase.from('configuracoes').upsert({
      chave: 'pedidos_db',
      valor: pedidos,
    }, { onConflict: 'chave' });

    // ── DISPARAR ENVIO PARA O BLING ──
    const resultadoEnvio: EnvioBlingResultado = await enviarPedidoVendaBling(pedido, opcoes.forcarReenvio);

    const historicoAtual = Array.isArray(pedido.bling_historico) ? pedido.bling_historico : [];

    if (resultadoEnvio.sucesso) {
      pedido.bling_status = 'OK';
      pedido.bling_id = resultadoEnvio.bling_id;
      pedido.bling_numero = resultadoEnvio.numero_pedido_bling;
      pedido.bling_sincronizado_em = new Date().toISOString();
      pedido.bling_tentativas = (pedido.bling_tentativas || 0) + 1;
      delete pedido.bling_processando_inicio;
      delete pedido.bling_proxima_tentativa;
      pedido.bling_erro = null;

      historicoAtual.push({
        data: new Date().toISOString(),
        tipo: 'sucesso',
        origem: opcoes.origemChamada || 'auto',
        mensagem: resultadoEnvio.ja_existia
          ? `Pedido já existia no Bling (ID: #${resultadoEnvio.bling_id}). Registro reconciliado.`
          : `Transmitido com sucesso ao Bling ERP. ID gerado: #${resultadoEnvio.bling_id}.`,
      });
      pedido.bling_historico = historicoAtual;
      pedido.atualizado_em = new Date().toISOString();

      pedidos[index] = pedido;
      await supabase.from('configuracoes').upsert({
        chave: 'pedidos_db',
        valor: pedidos,
      }, { onConflict: 'chave' });

      return {
        sucesso: true,
        mensagem: `Pedido #${numeroOuId} sincronizado com sucesso no Bling! ID: #${resultadoEnvio.bling_id}`,
        bling_id: resultadoEnvio.bling_id,
        pedido,
      };
    } else {
      // ── TRATAMENTO DE FALHA & AGENDAMENTO DE RETRY ──
      const tentativas = (pedido.bling_tentativas || 0) + 1;
      pedido.bling_tentativas = tentativas;
      pedido.bling_status = 'ERRO';
      pedido.bling_erro = resultadoEnvio.erro || 'Erro não especificado pelo Bling.';
      delete pedido.bling_processando_inicio;

      // Calcular próxima tentativa
      if (tentativas <= MAX_RETRY_ATTEMPTS) {
        const delayMs = RETRY_INTERVALS_MS[tentativas - 1] || (60 * 60 * 1000);
        const dataProxima = new Date(agoraMs + delayMs).toISOString();
        pedido.bling_proxima_tentativa = dataProxima;
      } else {
        delete pedido.bling_proxima_tentativa; // Esgotou tentativas automáticas
      }

      historicoAtual.push({
        data: new Date().toISOString(),
        tipo: 'erro',
        origem: opcoes.origemChamada || 'auto',
        tentativa: tentativas,
        mensagem: resultadoEnvio.erro || 'Falha ao sincronizar com o Bling.',
      });
      pedido.bling_historico = historicoAtual;
      pedido.atualizado_em = new Date().toISOString();

      pedidos[index] = pedido;
      await supabase.from('configuracoes').upsert({
        chave: 'pedidos_db',
        valor: pedidos,
      }, { onConflict: 'chave' });

      return {
        sucesso: false,
        mensagem: `Falha ao sincronizar com o Bling (tentativa ${tentativas}/${MAX_RETRY_ATTEMPTS}): ${resultadoEnvio.erro}`,
        pedido,
      };
    }
  } catch (err: any) {
    console.error(`[SYNC QUEUE] Exceção ao sincronizar pedido #${numeroOuId}:`, err);
    return {
      sucesso: false,
      mensagem: err.message || 'Erro inesperado na fila de sincronização.',
    };
  }
}

/**
 * Processa a fila de pedidos pendentes de reenvio automático ao Bling.
 * Critérios:
 * 1. Pagamento aprovado
 * 2. Status Bling seja 'ERRO' ou 'FILA' (não 'OK')
 * 3. Tentativas < MAX_RETRY_ATTEMPTS (5)
 * 4. Data de proxima tentativa <= data atual
 * 5. ATENÇÃO: NÃO toca em pedidos legados sem permissão.
 */
export async function processarFilaBlingPendentes(): Promise<{
  processados: number;
  sucessos: number;
  erros: number;
  detalhes: Array<{ numero: string; status: string; mensagem: string }>;
}> {
  const relatorio = {
    processados: 0,
    sucessos: 0,
    erros: 0,
    detalhes: [] as Array<{ numero: string; status: string; mensagem: string }>,
  };

  try {
    const { data: config } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'pedidos_db')
      .maybeSingle();

    const pedidos: any[] = Array.isArray(config?.valor) ? config.valor : [];
    const agora = new Date();

    // Filtrar apenas pedidos elegíveis para retry automático
    const fila = pedidos.filter((p) => {
      const isPago = p.status === 'PAGAMENTO_APROVADO' || p.status === 'EM_SEPARACAO' || p.status === 'ENVIADO';
      const isBlingNaoOk = p.bling_status === 'ERRO' || p.bling_status === 'FILA';
      const tentativas = Number(p.bling_tentativas || 0);
      const temTentativasRestantes = tentativas < MAX_RETRY_ATTEMPTS;

      if (!isPago || !isBlingNaoOk || !temTentativasRestantes) {
        return false;
      }

      // Se tiver data agendada, respeitar
      if (p.bling_proxima_tentativa) {
        return new Date(p.bling_proxima_tentativa) <= agora;
      }

      // Se for status FILA recente
      return p.bling_status === 'FILA';
    });

    for (const pedido of fila) {
      const num = pedido.numero_pedido || pedido.id;
      relatorio.processados++;

      const res = await sincronizarPedidoComBling(num, {
        origemChamada: 'cron_retry',
      });

      if (res.sucesso) {
        relatorio.sucessos++;
        relatorio.detalhes.push({ numero: num, status: 'sucesso', mensagem: res.mensagem });
      } else {
        relatorio.erros++;
        relatorio.detalhes.push({ numero: num, status: 'erro', mensagem: res.mensagem });
      }
    }

    return relatorio;
  } catch (err: any) {
    console.error('[SYNC QUEUE CRON] Erro ao varrer fila de pedidos:', err);
    return relatorio;
  }
}
