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

    // 1. TRANSMISSÃO 100% AUTOMÁTICA PARA O BLING ERP
    try {
      if (pedido.bling_status !== 'OK') {
        const resultadoBling = await enviarParaBling(pedido);
        if (resultadoBling.sucesso && resultadoBling.bling_id) {
          pedido.bling_status = 'OK';
          pedido.bling_id = resultadoBling.bling_id;
          pedido.bling_enviado_em = new Date().toISOString();
          console.log(`[BLING AUTOMATICO] Pedido #${numeroPedido} integrado com sucesso ao Bling! ID: ${resultadoBling.bling_id}`);
        } else {
          pedido.bling_erro = resultadoBling.erro;
          console.error(`[BLING AUTOMATICO] Falha ao enviar pedido #${numeroPedido} ao Bling:`, resultadoBling.erro);
        }
      }
    } catch (e: any) {
      console.error(`[BLING AUTOMATICO] Exceção ao integrar Bling:`, e);
      pedido.bling_erro = e?.message || 'Erro de conexão';
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
 * Envia o pedido 100% automaticamente para o Bling ERP API V3
 */
export async function enviarParaBling(pedido: any): Promise<{ sucesso: boolean; bling_id?: string; erro?: string }> {
  try {
    const { data: tokens } = await supabase.from('configuracoes').select('valor').eq('chave', 'bling_tokens').maybeSingle();
    let token = tokens?.valor?.access_token;
    const refreshToken = tokens?.valor?.refresh_token;

    const { data: creds } = await supabase.from('configuracoes').select('valor').eq('chave', 'bling_credentials').maybeSingle();
    const clientId = creds?.valor?.client_id;
    const clientSecret = creds?.valor?.client_secret;

    // Testar token e renovar automaticamente se necessário
    let testRes = await fetch('https://api.bling.com.br/Api/v3/pedidos/vendas?limite=1', {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (testRes.status === 401 && refreshToken && clientId && clientSecret) {
      console.log('[BLING] Token expirado. Realizando auto-refresh...');
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

    // 1. Buscar ou cadastrar o contato no Bling
    const docLimpo = (pedido.cliente?.cpf_cnpj || '').replace(/\D/g, '');
    let contatoId = null;

    if (docLimpo) {
      try {
        const searchRes = await fetch(`https://api.bling.com.br/Api/v3/contatos?numeroDocumento=${docLimpo}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const searchData = await searchRes.json();
        if (searchData?.data && searchData.data.length > 0) {
          contatoId = searchData.data[0].id;
        }
      } catch {}
    }

    if (!contatoId) {
      // Criar novo contato no Bling
      const createRes = await fetch('https://api.bling.com.br/Api/v3/contatos', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: pedido.cliente?.nome_completo || 'Cliente Loja Virtual',
          tipo: pedido.cliente?.tipo_pessoa === 'PJ' ? 'J' : 'F',
          situacao: 'A',
          numeroDocumento: docLimpo,
          email: pedido.cliente?.email || '',
          telefone: (pedido.cliente?.telefone || '').replace(/\D/g, ''),
          endereco: {
            geral: {
              endereco: pedido.endereco_entrega?.logradouro || '',
              numero: pedido.endereco_entrega?.numero || 'S/N',
              complemento: pedido.endereco_entrega?.complemento || '',
              bairro: pedido.endereco_entrega?.bairro || '',
              cep: (pedido.endereco_entrega?.cep || '').replace(/\D/g, ''),
              municipio: pedido.endereco_entrega?.cidade || '',
              uf: pedido.endereco_entrega?.uf || 'SP'
            }
          }
        })
      });
      const createData = await createRes.json();
      contatoId = createData?.data?.id;
    }

    // 2. Mapear itens e buscar IDs dos produtos no Bling
    const itensBling: any[] = [];
    for (const item of (pedido.itens || [])) {
      let produtoId = null;
      if (item.sku) {
        try {
          const prodRes = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(item.sku)}`, {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const prodData = await prodRes.json();
          if (prodData?.data && prodData.data.length > 0) {
            produtoId = prodData.data[0].id;
          }
        } catch {}
      }

      itensBling.push({
        codigo: item.sku || '',
        descricao: item.nome || 'Produto Pet',
        quantidade: Number(item.quantidade || 1),
        valor: Number(item.preco_unitario || item.preco || 0),
        produto: produtoId ? { id: produtoId } : undefined
      });
    }

    // 3. Montar payload do pedido de venda
    const payloadVenda: any = {
      numeroLoja: String(pedido.numero_pedido || ''),
      data: new Date(pedido.criado_em || Date.now()).toISOString().split('T')[0],
      dataSaida: new Date().toISOString().split('T')[0],
      contato: contatoId ? { id: contatoId } : { nome: pedido.cliente?.nome_completo || 'Cliente' },
      itens: itensBling,
      transporte: {
        fretePorConta: Number(pedido.valor_frete || 0) > 0 ? 0 : 1,
        frete: Number(pedido.valor_frete || 0),
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
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payloadVenda)
    });

    const resData = await resBling.json();
    if (resBling.ok && resData?.data?.id) {
      return { sucesso: true, bling_id: String(resData.data.id) };
    } else {
      const errMsg = resData?.error?.message || resData?.description || JSON.stringify(resData);
      return { sucesso: false, erro: `Bling: ${errMsg}` };
    }
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Exceção ao conectar no Bling' };
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
