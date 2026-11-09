import { supabase } from '@/lib/supabase';
import { sincronizarPedidoComBling } from '@/lib/bling/syncQueue';
import { enviarPedidoVendaBling } from '@/lib/bling/blingService';

export async function aprovarPedidoEGerarEtiqueta(numeroPedido: string, paymentData?: any) {
  try {
    const { data: config } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'pedidos_db')
      .maybeSingle();

    let pedidos: any[] = Array.isArray(config?.valor) ? config.valor : [];
    const index = pedidos.findIndex((p) => String(p.numero_pedido || p.id).replace(/\D/g, '') === String(numeroPedido).replace(/\D/g, ''));

    if (index < 0) {
      console.log(`[ORDER MANAGER] Pedido #${numeroPedido} não encontrado no banco.`);
      return { sucesso: false, erro: 'Pedido não encontrado' };
    }

    const pedido = pedidos[index];
    
    // Atualizar status para APROVADO se ainda estava pendente
    pedido.status = 'PAGAMENTO_APROVADO';
    pedido.status_pagamento = 'approved';
    pedido.pago_em = pedido.pago_em || new Date().toISOString();
    if (paymentData) {
      pedido.dados_pagamento = paymentData;
    }

    // Se ainda não estava na fila ou OK, marcar na fila do Bling
    if (pedido.bling_status !== 'OK') {
      pedido.bling_status = 'FILA';
    }

    pedidos[index] = pedido;
    await supabase.from('configuracoes').upsert({
      chave: 'pedidos_db',
      valor: pedidos
    }, { onConflict: 'chave' });

    // 1. TRANSMISSÃO 100% AUTOMÁTICA E RESILIENTE PARA O BLING ERP
    try {
      if (pedido.bling_status !== 'OK') {
        const resultadoBling = await sincronizarPedidoComBling(numeroPedido, {
          origemChamada: 'webhook_pagamento'
        });
        if (resultadoBling.sucesso) {
          console.log(`[BLING AUTOMATICO] Pedido #${numeroPedido} integrado com sucesso ao Bling! ID: ${resultadoBling.bling_id}`);
        } else {
          console.warn(`[BLING AUTOMATICO] Pedido #${numeroPedido} agendado na fila com retry:`, resultadoBling.mensagem);
        }
      }
    } catch (e: any) {
      console.error(`[BLING AUTOMATICO] Exceção ao integrar Bling:`, e);
    }

    // 2. Tentar enviar o pedido para o Melhor Envio (se configurado)
    try {
      const resultadoMelhorEnvio = await enviarParaMelhorEnvio(pedido);
      if (resultadoMelhorEnvio.sucesso) {
        pedido.melhor_envio_id = resultadoMelhorEnvio.cartId;
        pedido.melhor_envio_status = 'CADASTRADO';
      } else {
        pedido.melhor_envio_erro = resultadoMelhorEnvio.erro;
      }
    } catch (e: any) {
      console.error(`[MELHOR ENVIO] Erro ao cadastrar etiqueta:`, e);
    }

    // 3. Incrementar utilização do cupom se houver
    if (pedido.cupom?.codigo) {
      try {
        const { data: configCupons } = await supabase
          .from('configuracoes')
          .select('valor')
          .eq('chave', 'cupons_db')
          .maybeSingle();

        let cuponsList: any[] = Array.isArray(configCupons?.valor) ? configCupons.valor : [];
        const cupomIdx = cuponsList.findIndex((c: any) => c.codigo?.toUpperCase() === pedido.cupom.codigo?.toUpperCase());
        if (cupomIdx >= 0) {
          cuponsList[cupomIdx].usos_realizados = (cuponsList[cupomIdx].usos_realizados || 0) + 1;
          await supabase.from('configuracoes').upsert({
            chave: 'cupons_db',
            valor: cuponsList
          }, { onConflict: 'chave' });
        }
      } catch (errCupom) {
        console.error('[CUPOM] Erro ao registrar uso do cupom:', errCupom);
      }
    }

    pedidos[index] = pedido;

    await supabase.from('configuracoes').upsert({
      chave: 'pedidos_db',
      valor: pedidos
    }, { onConflict: 'chave' });

    console.log(`[ORDER MANAGER] Pedido #${numeroPedido} aprovado e processado com sucesso!`);
    return { sucesso: true, pedido };
  } catch (err: any) {
    console.error(`[ORDER MANAGER] Erro ao aprovar pedido #${numeroPedido}:`, err);
    return { sucesso: false, erro: err.message };
  }
}

/**
 * Envia o pedido para o Bling ERP API V3 utilizando o serviço unificado e resiliente
 */
export async function enviarParaBling(pedido: any): Promise<{ sucesso: boolean; bling_id?: string; erro?: string }> {
  const res = await enviarPedidoVendaBling(pedido);
  return {
    sucesso: res.sucesso,
    bling_id: res.bling_id,
    erro: res.erro,
  };
}



export async function enviarParaMelhorEnvio(pedido: any): Promise<{ sucesso: boolean; cartId?: string; erro?: string }> {
  try {
    // Puxar token do Melhor Envio das transportadoras configuradas
    const { data: configTrans } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'transportadoras')
      .maybeSingle();

    const transportadoras: any[] = configTrans?.valor || [];
    const meTrans = transportadoras.find((t: any) => t.tipo_integracao === 'melhorenvio' && t.token);

    const token = meTrans?.token || process.env.MELHORENVIO_TOKEN;

    if (!token) {
      console.log('[MELHOR ENVIO] Token não configurado no Admin > Entregas e Transportadoras.');
      return { sucesso: false, erro: 'Token do Melhor Envio não configurado no Admin' };
    }

    const isSandbox = token.startsWith('eyJ') && (token.includes('sandbox') || token.includes('test'));
    const baseUrl = isSandbox
      ? 'https://sandbox.melhorenvio.com.br/api/v2/me/cart'
      : 'https://melhorenvio.com.br/api/v2/me/cart';

    const volumes = (pedido.itens || []).map((item: any) => ({
      name: item.nome || 'Produto Pet',
      quantity: item.quantidade || 1,
      unitary_value: Number(item.preco_unitario || item.preco || 10),
      weight: item.peso_kg || 0.2,
      width: item.largura_cm || 15,
      height: item.altura_cm || 5,
      length: item.profundidade_cm || 20,
    }));

    const payloadME = {
      service: 1, // PAC Padrão Correios / Melhor Envio
      agency: 1,
      from: {
        name: 'Banho & Tosa Pet',
        phone: '11930813280',
        email: 'sac@mimoshow.com.br',
        document: '00000000000000',
        address: 'Rua Principal',
        number: '100',
        postal_code: meTrans?.cep_origem || '01000-000',
        city: 'São Paulo',
        state_abbr: 'SP',
        country_id: 'BR',
      },
      to: {
        name: pedido.cliente?.nome_completo || 'Cliente Banho & Tosa',
        phone: pedido.cliente?.telefone || '11999999999',
        email: pedido.cliente?.email || 'cliente@email.com',
        document: (pedido.cliente?.cpf_cnpj || '').replace(/\D/g, ''),
        address: pedido.endereco_entrega?.logradouro || '',
        number: pedido.endereco_entrega?.numero || 'S/N',
        district: pedido.endereco_entrega?.bairro || '',
        city: pedido.endereco_entrega?.cidade || '',
        state_abbr: pedido.endereco_entrega?.uf || 'SP',
        country_id: 'BR',
        postal_code: (pedido.endereco_entrega?.cep || '').replace(/\D/g, ''),
      },
      products: volumes,
      volumes: [
        {
          height: 10,
          width: 20,
          length: 25,
          weight: 0.5,
        }
      ],
      options: {
        insurance_value: Number(pedido.total || 0),
        receipt: false,
        own_hand: false,
        reverse: false,
        non_commercial: true,
      }
    };

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'BanhoETosaPet (sac@mimoshow.com.br)'
      },
      body: JSON.stringify(payloadME)
    });

    const data = await res.json();
    if (res.ok && data?.id) {
      console.log(`[MELHOR ENVIO] Pedido enviado para o carrinho do Melhor Envio com sucesso! ID: ${data.id}`);
      return { sucesso: true, cartId: String(data.id) };
    } else {
      console.error('[MELHOR ENVIO] Erro ao cadastrar no Melhor Envio:', data);
      return { sucesso: false, erro: data.message || JSON.stringify(data) };
    }
  } catch (err: any) {
    console.error('[MELHOR ENVIO] Exceção ao comunicar com Melhor Envio:', err);
    return { sucesso: false, erro: err.message };
  }
}

