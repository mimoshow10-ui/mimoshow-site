import { supabase } from '@/lib/supabase';

export interface BlingTokenData {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
}

export interface BlingCredentials {
  client_id: string;
  client_secret: string;
  loja_id_banho_tosa?: string;
  loja_id_mimo_show?: string;
}

export interface EnvioBlingResultado {
  sucesso: boolean;
  bling_id?: string;
  numero_pedido_bling?: string;
  ja_existia?: boolean;
  erro?: string;
  detalhes?: any;
}

/**
 * Obtém as credenciais cadastradas do Bling ERP no Supabase
 */
export async function obterCredenciaisBling(): Promise<BlingCredentials | null> {
  const { data } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'bling_credentials')
    .maybeSingle();

  if (!data?.valor?.client_id || !data?.valor?.client_secret) {
    return null;
  }

  return data.valor as BlingCredentials;
}

/**
 * Obtém os tokens salvos do Bling ERP no Supabase
 */
export async function obterTokensBling(): Promise<BlingTokenData | null> {
  const { data } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'bling_tokens')
    .maybeSingle();

  if (!data?.valor?.access_token) {
    return null;
  }

  return data.valor as BlingTokenData;
}

/**
 * Realiza a renovação do access_token utilizando o refresh_token do Bling (OAuth 2.0)
 */
export async function renovarTokenBling(): Promise<{ sucesso: boolean; access_token?: string; erro?: string }> {
  try {
    const creds = await obterCredenciaisBling();
    const tokens = await obterTokensBling();

    if (!creds?.client_id || !creds?.client_secret) {
      return { sucesso: false, erro: 'Credenciais do Bling (Client ID / Secret) não encontradas.' };
    }

    if (!tokens?.refresh_token) {
      return { sucesso: false, erro: 'Refresh token do Bling não encontrado nas configurações.' };
    }

    const basicAuth = Buffer.from(`${creds.client_id}:${creds.client_secret}`).toString('base64');

    const res = await fetch('https://api.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.access_token) {
      const errMsg = data?.error?.description || data?.error || JSON.stringify(data);
      console.error('[BLING OAUTH] Falha ao renovar token:', errMsg);
      return { sucesso: false, erro: `Falha na renovação OAuth do Bling: ${errMsg}` };
    }

    // Salvar novos tokens no banco
    const novosTokens: BlingTokenData = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || tokens.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type || 'Bearer',
    };

    await supabase.from('configuracoes').upsert({
      chave: 'bling_tokens',
      valor: novosTokens,
    }, { onConflict: 'chave' });

    console.log('[BLING OAUTH] Token renovado com sucesso!');
    return { sucesso: true, access_token: data.access_token };
  } catch (err: any) {
    console.error('[BLING OAUTH] Exceção ao renovar token:', err);
    return { sucesso: false, erro: err.message || 'Erro inesperado ao renovar token do Bling.' };
  }
}

/**
 * Obtém um access_token garantidamente válido. Se o token atual retornar 401 ou estiver prestes a expirar, renova.
 */
export async function obterTokenBlingValido(forcarRenovacao = false): Promise<string | null> {
  let tokens = await obterTokensBling();

  if (!tokens?.access_token || forcarRenovacao) {
    const resRenova = await renovarTokenBling();
    if (resRenova.sucesso && resRenova.access_token) {
      return resRenova.access_token;
    }
    return null;
  }

  // Testar rapidamente a validade do token com uma chamada leve
  try {
    const testRes = await fetch('https://api.bling.com.br/Api/v3/pedidos/vendas?limite=1', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (testRes.status === 401) {
      console.log('[BLING API] Token expirado detectado (HTTP 401). Renovando...');
      const resRenova = await renovarTokenBling();
      if (resRenova.sucesso && resRenova.access_token) {
        return resRenova.access_token;
      }
      return null;
    }

    return tokens.access_token;
  } catch (e) {
    console.warn('[BLING API] Aviso ao testar token, prosseguindo com token atual:', e);
    return tokens.access_token;
  }
}

/**
 * Consulta se já existe um pedido cadastrado no Bling com este número de loja (IDEMPOTÊNCIA).
 * Evita criar pedidos duplicados em retransmissões ou quedas de rede.
 */
export async function consultarPedidoBlingPorNumeroLoja(
  numeroLoja: string,
  token: string
): Promise<{ existe: boolean; bling_id?: string; numero?: string }> {
  try {
    if (!numeroLoja) return { existe: false };

    const res = await fetch(`https://api.bling.com.br/Api/v3/pedidos/vendas?numeroLoja=${encodeURIComponent(numeroLoja)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return { existe: false };
    }

    const data = await res.json().catch(() => ({}));
    if (Array.isArray(data?.data) && data.data.length > 0) {
      const pedidoExistente = data.data[0];
      return {
        existe: true,
        bling_id: String(pedidoExistente.id),
        numero: String(pedidoExistente.numero || pedidoExistente.id),
      };
    }

    return { existe: false };
  } catch (err) {
    console.error('[BLING IDEMPOTENCIA] Erro ao verificar duplicidade no Bling:', err);
    return { existe: false };
  }
}

/**
 * Localiza ou cria o contato (cliente) no Bling ERP API V3
 */
async function obterOuCriarContatoBling(pedido: any, token: string): Promise<number | null> {
  const docLimpo = (pedido.cliente?.cpf_cnpj || '').replace(/\D/g, '');
  const tipoPessoa = docLimpo.length > 11 ? 'J' : 'F';
  const nomeCliente = pedido.cliente?.nome_completo || 'Cliente Site Mimo Show';

  // 1. Tentar buscar por documento no Bling
  if (docLimpo) {
    try {
      const searchRes = await fetch(`https://api.bling.com.br/Api/v3/contatos?numeroDocumento=${docLimpo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const searchData = await searchRes.json().catch(() => ({}));
      if (Array.isArray(searchData?.data) && searchData.data.length > 0) {
        return searchData.data[0].id;
      }
    } catch (e) {
      console.warn('[BLING CONTATO] Erro ao buscar contato por documento:', e);
    }
  }

  // 2. Criar novo contato
  try {
    const endereco = pedido.endereco_entrega || {};
    const payloadContato = {
      nome: nomeCliente,
      tipo: tipoPessoa,
      situacao: 'A',
      numeroDocumento: docLimpo || undefined,
      email: pedido.cliente?.email || undefined,
      telefone: (pedido.cliente?.telefone || '').replace(/\D/g, '') || undefined,
      endereco: {
        geral: {
          endereco: endereco.logradouro || '',
          numero: endereco.numero || 'S/N',
          complemento: endereco.complemento || '',
          bairro: endereco.bairro || '',
          cep: (endereco.cep || '').replace(/\D/g, ''),
          municipio: endereco.cidade || '',
          uf: (endereco.uf || 'SP').toUpperCase(),
        },
      },
    };

    const createRes = await fetch('https://api.bling.com.br/Api/v3/contatos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadContato),
    });

    const createData = await createRes.json().catch(() => ({}));
    if (createData?.data?.id) {
      return createData.data.id;
    }

    // Se falhar e tiver retornado contato duplicado com ID no erro
    if (createData?.error?.fields) {
      const docField = createData.error.fields.find((f: any) => f.code === 'DUPLICIDADE' || f.id);
      if (docField?.id) return docField.id;
    }
  } catch (e) {
    console.error('[BLING CONTATO] Erro ao criar contato no Bling:', e);
  }

  // 3. Fallback: criar contato genérico com o nome
  try {
    const resGen = await fetch('https://api.bling.com.br/Api/v3/contatos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nome: nomeCliente }),
    });
    const dataGen = await resGen.json().catch(() => ({}));
    return dataGen?.data?.id || null;
  } catch {
    return null;
  }
}

/**
 * Transmite o pedido de venda para o Bling ERP API V3
 * ATENÇÃO: NÃO emite Notas Fiscais (apenas cadastra o pedido de venda em aberto).
 */
export async function enviarPedidoVendaBling(
  pedido: any,
  forcarReenvio = false
): Promise<EnvioBlingResultado> {
  try {
    const creds = await obterCredenciaisBling();
    let token = await obterTokenBlingValido();

    if (!token) {
      return {
        sucesso: false,
        erro: 'Não foi possível obter um token válido do Bling. Verifique as credenciais no painel de Configurações.',
      };
    }

    const numeroLoja = String(pedido.numero_pedido || pedido.id || '').replace(/\D/g, '');

    // ── 1. VERIFICAÇÃO DE IDEMPOTÊNCIA ──
    // Se não for reenvio forçado e o pedido já tiver bling_id gravado, não reenviar
    if (!forcarReenvio && pedido.bling_id && pedido.bling_status === 'OK') {
      return {
        sucesso: true,
        bling_id: pedido.bling_id,
        ja_existia: true,
      };
    }

    // Consultar no próprio Bling se já existe pedido com este numeroLoja para evitar duplicação
    if (numeroLoja && !forcarReenvio) {
      const checkExistente = await consultarPedidoBlingPorNumeroLoja(numeroLoja, token);
      if (checkExistente.existe && checkExistente.bling_id) {
        console.log(`[BLING IDEMPOTENCIA] Pedido #${numeroLoja} já existia no Bling com ID #${checkExistente.bling_id}`);
        return {
          sucesso: true,
          bling_id: checkExistente.bling_id,
          numero_pedido_bling: checkExistente.numero,
          ja_existia: true,
        };
      }
    }

    // ── 2. OBTER OU CRIAR CONTATO ──
    const contatoId = await obterOuCriarContatoBling(pedido, token);

    // ── 3. MAPEAR ITENS E RESOLVER IDS DE PRODUTOS NO BLING ──
    const itensPayload: any[] = [];
    for (const item of (pedido.itens || [])) {
      let produtoId: number | null = null;

      // Se o item já tiver bling_id gravado
      if (item.bling_id && !isNaN(Number(item.bling_id))) {
        produtoId = Number(item.bling_id);
      } else if (item.sku) {
        // Tentar buscar por SKU no Bling
        try {
          const resProd = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(item.sku)}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const prodData = await resProd.json().catch(() => ({}));
          if (Array.isArray(prodData?.data) && prodData.data.length > 0) {
            produtoId = Number(prodData.data[0].id);
          }
        } catch (e) {
          console.warn(`[BLING ITENS] Não foi possível buscar SKU ${item.sku} no Bling:`, e);
        }
      }

      itensPayload.push({
        codigo: item.sku || '',
        descricao: item.nome || 'Produto Pet',
        quantidade: Number(item.quantidade || 1),
        valor: Number(item.preco_unitario || item.preco || 0),
        ...(produtoId ? { produto: { id: produtoId } } : {}),
      });
    }

    if (itensPayload.length === 0) {
      return { sucesso: false, erro: 'O pedido não possui nenhum item válido para transmissão.' };
    }

    // ── 4. IDENTIFICAR CANAL / LOJA NO BLING ──
    let idLojaBling: number | null = null;
    const origem = String(pedido.origem_loja || pedido.origem_host || '').toLowerCase();
    if (origem.includes('mimo') && creds?.loja_id_mimo_show) {
      idLojaBling = Number(creds.loja_id_mimo_show);
    } else if (origem.includes('banho') && creds?.loja_id_banho_tosa) {
      idLojaBling = Number(creds.loja_id_banho_tosa);
    } else if (creds?.loja_id_mimo_show) {
      idLojaBling = Number(creds.loja_id_mimo_show);
    } else if (creds?.loja_id_banho_tosa) {
      idLojaBling = Number(creds.loja_id_banho_tosa);
    }

    // ── 5. CALCULAR DESCONTO ──
    let valorDesconto = Number(pedido.valor_desconto || 0);
    if (!valorDesconto) {
      const subtotal = Number(pedido.subtotal || 0);
      const frete = Number(pedido.valor_frete || 0);
      const total = Number(pedido.total || 0);
      const diff = subtotal + frete - total;
      if (diff > 0.01) {
        valorDesconto = diff;
      }
    }

    const dataPedido = new Date(pedido.criado_em || Date.now()).toISOString().split('T')[0];
    const dataHoje = new Date().toISOString().split('T')[0];

    const endereco = pedido.endereco_entrega || {};

    // ── 6. MONTAR PAYLOAD V3 ──
    const payloadVenda: any = {
      numeroLoja: numeroLoja || undefined,
      data: dataPedido,
      dataSaida: dataHoje,
      contato: contatoId ? { id: contatoId } : { nome: pedido.cliente?.nome_completo || 'Cliente Site' },
      itens: itensPayload,
      transporte: {
        fretePorConta: Number(pedido.valor_frete || 0) > 0 ? 0 : 1,
        frete: Number(pedido.valor_frete || 0),
        etiqueta: {
          nome: pedido.cliente?.nome_completo || 'Cliente Site',
          endereco: endereco.logradouro || '',
          numero: endereco.numero || 'S/N',
          complemento: endereco.complemento || '',
          bairro: endereco.bairro || '',
          cep: (endereco.cep || '').replace(/\D/g, ''),
          municipio: endereco.cidade || '',
          uf: (endereco.uf || 'SP').toUpperCase(),
        },
      },
    };

    if (idLojaBling && !isNaN(idLojaBling) && idLojaBling > 0) {
      payloadVenda.loja = { id: idLojaBling };
    }

    if (valorDesconto > 0) {
      payloadVenda.desconto = { valor: Number(valorDesconto.toFixed(2)) };
    }

    if (pedido.cupom?.codigo) {
      payloadVenda.observacoes = `Cupom aplicado no site: ${pedido.cupom.codigo}`;
    }

    // ── 7. DISPARAR POST PARA A API V3 DO BLING ──
    let resBling = await fetch('https://api.bling.com.br/Api/v3/pedidos/vendas', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payloadVenda),
    });

    // Se deu 401 durante o POST, tentar renovar uma vez e reenviar
    if (resBling.status === 401) {
      console.warn('[BLING API] 401 retornado durante criação do pedido. Renovando token e retentando...');
      const novoToken = await obterTokenBlingValido(true);
      if (novoToken) {
        token = novoToken;
        resBling = await fetch('https://api.bling.com.br/Api/v3/pedidos/vendas', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payloadVenda),
        });
      }
    }

    const resData = await resBling.json().catch(() => ({}));

    if (resBling.ok && resData?.data?.id) {
      const blingId = String(resData.data.id);
      const blingNumero = String(resData.data.numero || resData.data.id);
      console.log(`[BLING SUCESSO] Pedido #${numeroLoja} transmitido com sucesso ao Bling! ID: ${blingId}`);
      return {
        sucesso: true,
        bling_id: blingId,
        numero_pedido_bling: blingNumero,
      };
    } else {
      let errMsg = resData?.error?.message || resData?.description || JSON.stringify(resData);
      if (Array.isArray(resData?.error?.fields)) {
        const fieldDetails = resData.error.fields.map((f: any) => `${f.field || 'campo'}: ${f.msg || f.message}`).join('; ');
        errMsg += ` (${fieldDetails})`;
      }
      console.error(`[BLING ERRO] Falha ao transmitir pedido #${numeroLoja}:`, errMsg);
      return {
        sucesso: false,
        erro: `Bling rejeitou o pedido: ${errMsg}`,
        detalhes: resData,
      };
    }
  } catch (err: any) {
    console.error('[BLING EXCEÇÃO] Erro inesperado ao integrar com o Bling:', err);
    return {
      sucesso: false,
      erro: err.message || 'Exceção ao comunicar com a API do Bling.',
    };
  }
}
