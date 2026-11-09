'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { sincronizarPedidoComBling } from '@/lib/bling/syncQueue';
import { enviarPedidoVendaBling } from '@/lib/bling/blingService';

/**
 * Atualiza o status do pedido, código de rastreamento e dispara sincronização com o Bling se o pagamento for aprovado.
 */
export async function atualizarStatusPedido(formData: FormData) {
  try {
    const pedidoId = formData.get('pedido_id') as string;
    const novoStatus = formData.get('status') as string;
    const codigoRastreio = (formData.get('codigo_rastreio') as string) || '';

    if (!pedidoId || !novoStatus) {
      return { sucesso: false, erro: 'ID do pedido e novo status são obrigatórios.' };
    }

    const { data: config } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'pedidos_db')
      .maybeSingle();

    let pedidos: any[] = Array.isArray(config?.valor) ? config.valor : [];
    const idx = pedidos.findIndex(p => p.id === pedidoId || p.numero_pedido === pedidoId);

    if (idx === -1) {
      return { sucesso: false, erro: 'Pedido não encontrado no banco de dados.' };
    }

    const pedido = pedidos[idx];
    const statusAnterior = pedido.status;
    pedido.status = novoStatus;
    if (codigoRastreio) {
      pedido.codigo_rastreio = codigoRastreio.trim().toUpperCase();
    }
    pedido.atualizado_em = new Date().toISOString();

    pedidos[idx] = pedido;

    const { error } = await supabase.from('configuracoes').upsert(
      { chave: 'pedidos_db', valor: pedidos },
      { onConflict: 'chave' }
    );

    if (error) {
      return { sucesso: false, erro: 'Erro ao salvar alteração: ' + error.message };
    }

    // Se o pagamento for aprovado (e antes não era) e o Bling ainda não tiver recebido, sincronizar com o Bling
    let msgBling = '';
    if ((novoStatus === 'PAGAMENTO_APROVADO' || novoStatus === 'ENVIADO') && pedido.bling_status !== 'OK') {
      try {
        const resSync = await sincronizarPedidoComBling(pedidoId, {
          origemChamada: 'painel_admin',
        });
        if (resSync.sucesso) {
          msgBling = ` | Transmitido ao Bling (#${resSync.bling_id})`;
        } else {
          msgBling = ` | Agendado na fila do Bling`;
        }
      } catch (e: any) {
        console.error('[ERRO BLING AO ALTERAR STATUS]', e);
      }
    }

    revalidatePath(`/admin/pedidos/${pedidoId}`);
    revalidatePath('/admin/pedidos');
    return { sucesso: true, mensagem: `Status atualizado para ${novoStatus}${msgBling}!` };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao atualizar pedido.' };
  }
}

/**
 * Transmite manualmente um pedido para o Bling ERP (API V3) com recuperação automática de tokens.
 * Mantém o acionamento manual como recurso de contingência para o lojista.
 */
export async function transmitirPedidoBling(formData: FormData) {
  try {
    const pedidoId = formData.get('pedido_id') as string;
    if (!pedidoId) return { sucesso: false, erro: 'ID do pedido é obrigatório.' };

    const resSync = await sincronizarPedidoComBling(pedidoId, {
      forcarReenvio: true,
      origemChamada: 'painel_admin_manual',
    });

    revalidatePath(`/admin/pedidos/${pedidoId}`);
    revalidatePath('/admin/pedidos');

    if (resSync.sucesso) {
      return {
        sucesso: true,
        mensagem: `Pedido transmitido ao Bling com sucesso! ID no Bling: #${resSync.bling_id}`,
        bling_id: resSync.bling_id,
      };
    } else {
      return {
        sucesso: false,
        erro: resSync.mensagem || 'Erro ao transmitir pedido ao Bling.',
      };
    }
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao conectar com o Bling.' };
  }
}

/**
 * Função interna mantida para retrocompatibilidade
 */
export async function enviarPedidoBlingInterno(pedido: any): Promise<{ sucesso: boolean; bling_id?: string; erro?: string }> {
  const res = await enviarPedidoVendaBling(pedido, true);
  return {
    sucesso: res.sucesso,
    bling_id: res.bling_id,
    erro: res.erro,
  };
}
