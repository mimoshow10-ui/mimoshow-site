import { supabase } from '@/lib/supabase';
import { Transportadora, OpcaoFrete, ItemCarrinho } from '@/lib/types/checkout';

export async function getTransportadorasAtivas(): Promise<Transportadora[]> {
  try {
    const { data: config } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'transportadoras')
      .single();

    const lista: Transportadora[] = config?.valor || [];
    return lista.filter(t => t.ativo).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  } catch {
    return [];
  }
}

export async function calcularFretesCarrinho(
  itens: ItemCarrinho[],
  cepDestino: string
): Promise<OpcaoFrete[]> {
  const cepLimpo = cepDestino.replace(/\D/g, '');

  if (cepLimpo.length !== 8 || itens.length === 0) {
    return [];
  }

  // Puxar configuracoes de frete do Supabase (CEP Origem e Token do Melhor Envio)
  let cepOrigem = '09210360';
  let tokenFrete = '';
  let usarRetirada = true;

  try {
    const { data: cfgFrete } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'frete_config')
      .maybeSingle();

    if (cfgFrete?.valor) {
      if (cfgFrete.valor.cep_origem) cepOrigem = cfgFrete.valor.cep_origem.replace(/\D/g, '');
      if (cfgFrete.valor.token_frete) tokenFrete = cfgFrete.valor.token_frete.trim();
      if (typeof cfgFrete.valor.usar_retirada === 'boolean') usarRetirada = cfgFrete.valor.usar_retirada;
    }
  } catch (e) {}

  const valorTotalProdutos = itens.reduce((acc, item) => {
    return acc + (item.preco_unitario || 0) * (item.quantidade || 1);
  }, 0);

  const pesoTotal = itens.reduce((acc, item) => {
    return acc + (item.peso_kg || 0.2) * (item.quantidade || 1);
  }, 0);

  const opcoes: OpcaoFrete[] = [];

  // Option 1: Opção de Retirada na Loja
  if (usarRetirada) {
    opcoes.push({
      id: 'retirada-loja',
      transportadora_id: 'retirada',
      nome: 'Retirada na Loja Física',
      nome_transportadora: 'Loja Física',
      valor: 0,
      prazo_dias: 0,
      prazo_estimado_texto: 'Pronto para retirada após confirmação',
      descricao: 'Retire gratuitamente em nossa loja física.',
      is_gratis: true,
    });
  }

  // Option 2: Cotacao em Tempo Real via API Oficial do MELHOR ENVIO V2
  let cotouMelhorEnvioComSucesso = false;

  if (tokenFrete && tokenFrete.length > 20) {
    try {
      const response = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/calculate', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenFrete}`,
          'User-Agent': 'MimoShowPet (contato@banhoetosapet.com.br)'
        },
        body: JSON.stringify({
          from: { postal_code: cepOrigem || '09210360' },
          to: { postal_code: cepLimpo },
          products: itens.map((item, idx) => ({
            id: item.id || `item-${idx}`,
            width: item.largura_cm || 11,
            height: item.altura_cm || 11,
            length: item.comprimento_cm || 16,
            weight: item.peso_kg || 0.2,
            insurance_value: item.preco_unitario || 10,
            quantity: item.quantidade || 1
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const validos = data.filter((opt: any) => {
            if (opt.error || !(opt.price || opt.custom_price)) return false;
            
            // Filtrar apenas transportadoras solicitadas pelo cliente
            const nomeStr = `${opt.company?.name || ''} ${opt.name || ''}`.toLowerCase();
            const permitidas = ['correios', 'sedex', 'pac', 'jadlog', 'jad log', 'jad', 'loggi', 'j&t', 'j&d', 'jet'];
            
            return permitidas.some(p => nomeStr.includes(p));
          });

          if (validos.length > 0) {
            cotouMelhorEnvioComSucesso = true;
            for (const opt of validos) {
              const precoBase = Number(opt.custom_price || opt.price || 0);
              const prazo = Number(opt.custom_delivery_time || opt.delivery_time || 1);
              const isFreteGratis = valorTotalProdutos >= 99; // Regra de Frete Gratis acima de R$ 99

              opcoes.push({
                id: `melhor-${opt.company?.name || 'trans'}-${opt.id}`,
                transportadora_id: `melhorenvio-${opt.id}`,
                nome: `${opt.company?.name || 'Transportadora'} (${opt.name})`,
                nome_transportadora: opt.company?.name || 'Melhor Envio',
                valor: isFreteGratis ? 0 : Math.max(0, precoBase),
                prazo_dias: prazo,
                prazo_estimado_texto: `Chegará em ${prazo} a ${prazo + 2} dias úteis`,
                descricao: isFreteGratis ? 'Promoção de Frete Grátis aplicada!' : `Cotação oficial via ${opt.company?.name || 'Melhor Envio'}`,
                is_gratis: isFreteGratis,
              });
            }
          }
        }
      } else {
        console.error('[MELHOR ENVIO API ERRO]', await response.text());
      }
    } catch (e: any) {
      console.error('[MELHOR ENVIO API EXCECAO]', e.message || e);
    }
  }

  // Fallback inteligente caso o Token nao esteja configurado ou a API fique indisponivel temporariamente
  if (!cotouMelhorEnvioComSucesso) {
    const uf = await buscarUfPorCep(cepLimpo);
    const sudesteSul = ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS'];
    const eProximo = sudesteSul.includes(uf);

    let valorPac = (eProximo ? 14.90 : 24.90) + (pesoTotal > 1 ? (pesoTotal - 1) * 4 : 0);
    let prazoPac = (eProximo ? 4 : 8);
    const isFreteGratis = valorTotalProdutos >= 99;

    opcoes.push({
      id: 'correios-pac-fallback',
      transportadora_id: 'correios-pac',
      nome: 'Correios (PAC Econômico)',
      nome_transportadora: 'Correios',
      valor: isFreteGratis ? 0 : Math.max(0, valorPac),
      prazo_dias: prazoPac,
      prazo_estimado_texto: `Chegará entre ${prazoPac} e ${prazoPac + 2} dias úteis`,
      descricao: isFreteGratis ? 'Promoção de Frete Grátis aplicada!' : 'Entrega garantida pelos Correios',
      is_gratis: isFreteGratis,
    });

    let valorSedex = valorPac + (eProximo ? 10 : 20);
    let prazoSedex = Math.max(1, Math.floor(prazoPac / 2));

    opcoes.push({
      id: 'correios-sedex-fallback',
      transportadora_id: 'correios-sedex',
      nome: 'Correios (SEDEX Expresso)',
      nome_transportadora: 'Correios',
      valor: Math.max(0, valorSedex),
      prazo_dias: prazoSedex,
      prazo_estimado_texto: `Chegará em ${prazoSedex} a ${prazoSedex + 1} dias úteis`,
      descricao: 'Opção mais rápida com rastreamento prioritário.',
    });
  }

  return opcoes;
}

async function buscarUfPorCep(cep: string): Promise<string> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();
    return data.uf || 'SP';
  } catch {
    return 'SP';
  }
}
