'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Atualiza o status do pedido, codigo de rastreamento e historico no banco de dados.
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
      .single();

    let pedidos: any[] = config?.valor || [];
    const idx = pedidos.findIndex(p => p.id === pedidoId || p.numero_pedido === pedidoId);

    if (idx === -1) {
      return { sucesso: false, erro: 'Pedido não encontrado no banco de dados.' };
    }

    const pedido = pedidos[idx];
    pedido.status = novoStatus;
    if (codigoRastreio) {
      pedido.codigo_rastreio = codigoRastreio.trim().toUpperCase();
    }
    pedido.atualizado_em = new Date().toISOString();

    // Se o pagamento for aprovado e o Bling ainda nao tiver recebido, tenta enviar ao Bling automaticamente
    let msgBling = '';
    if ((novoStatus === 'PAGAMENTO_APROVADO' || novoStatus === 'ENVIADO') && pedido.bling_status !== 'OK') {
      try {
        const resBling = await enviarPedidoBlingInterno(pedido);
        if (resBling.sucesso) {
          pedido.bling_status = 'OK';
          pedido.bling_id = resBling.bling_id;
          msgBling = ` | Transmitido ao Bling (#${resBling.bling_id})`;
        }
      } catch (e: any) {
        console.error('[ERRO BLING AUTOMATICO]', e);
      }
    }

    pedidos[idx] = pedido;

    const { error } = await supabase.from('configuracoes').upsert(
      { chave: 'pedidos_db', valor: pedidos },
      { onConflict: 'chave' }
    );

    if (error) {
      return { sucesso: false, erro: 'Erro ao salvar alteração: ' + error.message };
    }

    revalidatePath(`/admin/pedidos/${pedidoId}`);
    revalidatePath('/admin/pedidos');
    return { sucesso: true, mensagem: `Status atualizado para ${novoStatus}${msgBling}!` };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao atualizar pedido.' };
  }
}

/**
 * Transmite manualmente um pedido para o Bling ERP (API V3)
 */
export async function transmitirPedidoBling(formData: FormData) {
  try {
    const pedidoId = formData.get('pedido_id') as string;
    if (!pedidoId) return { sucesso: false, erro: 'ID do pedido é obrigatório.' };

    const { data: config } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'pedidos_db')
      .single();

    let pedidos: any[] = config?.valor || [];
    const idx = pedidos.findIndex(p => p.id === pedidoId || p.numero_pedido === pedidoId);

    if (idx === -1) return { sucesso: false, erro: 'Pedido não encontrado.' };

    const pedido = pedidos[idx];
    const resBling = await enviarPedidoBlingInterno(pedido);

    if (resBling.sucesso) {
      pedido.bling_status = 'OK';
      pedido.bling_id = resBling.bling_id;
      pedido.atualizado_em = new Date().toISOString();
      pedidos[idx] = pedido;

      await supabase.from('configuracoes').upsert(
        { chave: 'pedidos_db', valor: pedidos },
        { onConflict: 'chave' }
      );

      revalidatePath(`/admin/pedidos/${pedidoId}`);
      revalidatePath('/admin/pedidos');
      return { sucesso: true, mensagem: `Pedido transmitido ao Bling com sucesso! ID no Bling: #${resBling.bling_id}` };
    } else {
      return { sucesso: false, erro: resBling.erro || 'Erro ao transmitir pedido ao Bling.' };
    }
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao conectar com o Bling.' };
  }
}

/**
 * Funcao interna de integracao com Bling V3 API
 */
export async function enviarPedidoBlingInterno(pedido: any): Promise<{ sucesso: boolean; bling_id?: string; erro?: string }> {
  try {
    const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'bling_tokens').single();
    let token = cfg?.valor?.access_token;
    const refreshToken = cfg?.valor?.refresh_token;

    const { data: creds } = await supabase.from('configuracoes').select('valor').eq('chave', 'bling_credentials').single();
    const clientId = creds?.valor?.client_id;
    const clientSecret = creds?.valor?.client_secret;

    if (!token && refreshToken && clientId && clientSecret) {
      const resToken = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken })
      });
      const tokenData = await resToken.json();
      if (tokenData.access_token) {
        token = tokenData.access_token;
        await supabase.from('configuracoes').upsert({
          chave: 'bling_tokens',
          valor: { access_token: tokenData.access_token, refresh_token: tokenData.refresh_token || refreshToken }
        }, { onConflict: 'chave' });
      }
    }

    if (!token) {
      return { sucesso: false, erro: 'Token do Bling não configurado nas Configurações.' };
    }

    // Payload de Vendas Bling API V3
    const payloadBling = {
      numero: pedido.numero_pedido,
      data: new Date(pedido.criado_em || Date.now()).toISOString().split('T')[0],
      contato: {
        nome: pedido.cliente?.nome_completo || 'Cliente Site',
        cpfCnpj: (pedido.cliente?.cpf_cnpj || '').replace(/\D/g, ''),
        email: pedido.cliente?.email || '',
        telefone: (pedido.cliente?.telefone || '').replace(/\D/g, '')
      },
      itens: (pedido.itens || []).map((item: any) => ({
        codigo: item.sku || '',
        descricao: item.nome || 'Produto',
        quantidade: item.quantidade || 1,
        valor: item.preco_unitario || 0
      })),
      transporte: {
        fretePorConta: 0,
        frete: pedido.valor_frete || 0,
        etiqueta: {
          nome: pedido.cliente?.nome_completo,
          endereco: pedido.endereco_entrega?.logradouro,
          numero: pedido.endereco_entrega?.numero,
          complemento: pedido.endereco_entrega?.complemento,
          municipio: pedido.endereco_entrega?.cidade,
          uf: pedido.endereco_entrega?.uf,
          cep: (pedido.endereco_entrega?.cep || '').replace(/\D/g, ''),
          bairro: pedido.endereco_entrega?.bairro
        }
      }
    };

    const resBling = await fetch('https://api.bling.com.br/Api/v3/pedidos/vendas', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payloadBling)
    });

    const resData = await resBling.json();
    if (resBling.ok && resData?.data?.id) {
      return { sucesso: true, bling_id: String(resData.data.id) };
    } else {
      const errMsg = resData?.error?.message || resData?.description || JSON.stringify(resData);
      return { sucesso: false, erro: `Bling retornou erro: ${errMsg}` };
    }
  } catch (e: any) {
    return { sucesso: false, erro: e.message || 'Exceção ao conectar no Bling' };
  }
}
