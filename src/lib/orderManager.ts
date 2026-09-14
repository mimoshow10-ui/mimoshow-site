import { supabase } from '@/lib/supabase';

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

    // Tentar enviar o pedido para o Melhor Envio
    const resultadoMelhorEnvio = await enviarParaMelhorEnvio(pedido);
    if (resultadoMelhorEnvio.sucesso) {
      pedido.melhor_envio_id = resultadoMelhorEnvio.cartId;
      pedido.melhor_envio_status = 'CADASTRADO';
    } else {
      pedido.melhor_envio_erro = resultadoMelhorEnvio.erro;
    }

    pedidos[index] = pedido;

    await supabase.from('configuracoes').upsert({
      chave: 'pedidos_db',
      valor: pedidos
    }, { onConflict: 'chave' });

    console.log(`[ORDER MANAGER] Pedido #${numeroPedido} aprovado com sucesso!`);
    return { sucesso: true, pedido };
  } catch (err: any) {
    console.error(`[ORDER MANAGER] Erro ao aprovar pedido #${numeroPedido}:`, err);
    return { sucesso: false, erro: err.message };
  }
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
        name: 'MIMO Show',
        phone: '11999999999',
        email: 'contato@mimoshow.com.br',
        address: 'Rua Principal',
        number: '100',
        district: 'Centro',
        city: 'São Paulo',
        state_abbr: 'SP',
        country_id: 'BR',
        postal_code: '01001000'
      },
      to: {
        name: pedido.cliente?.nome_completo || 'Cliente MIMO Show',
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
