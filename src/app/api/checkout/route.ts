import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { supabase } from '@/lib/supabase';
import { validarCupomNoServidor } from '@/lib/coupons';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, cliente, frete, total, cupom, desconto } = body;

    // 1. Puxar lista de pedidos existente para gerar o número do pedido incremental
    const { data: configPedidos } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'pedidos_db')
      .maybeSingle();

    const pedidosExistentes: any[] = Array.isArray(configPedidos?.valor) ? configPedidos.valor : [];

    // Calcular próximo número de pedido (ex: 10001, 10002, 10295...)
    let maiorNumero = 10000;
    pedidosExistentes.forEach((p: any) => {
      const num = parseInt(String(p.numero_pedido || '').replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > maiorNumero) {
        maiorNumero = num;
      }
    });
    const proximoNumero = maiorNumero + 1;
    const numeroPedido = String(proximoNumero);
    const idPedido = `ped-${numeroPedido}`;

    // Identificar automaticamente a loja de origem
    const host = request.headers.get('host') || '';
    let origemLoja = 'Banho e Tosa Pet';
    if (host.toLowerCase().includes('mimo')) {
      origemLoja = 'Mimo Show';
    } else if (host.toLowerCase().includes('banhoeto') || host.toLowerCase().includes('pet')) {
      origemLoja = 'Banho e Tosa Pet';
    }

    // 2. Calcular subtotal, validar cupom e calcular desconto
    const subtotalCalculado = (items || []).reduce(
      (sum: number, item: any) => sum + (Number(item.preco_unitario || item.preco || 0) * Number(item.quantidade || 1)),
      0
    );
    const freteCalculado = Number(frete?.valor || 0);

    let valorDesconto = 0;
    let cupomInfo: any = null;

    if (cupom?.codigo) {
      try {
        const resVal = await validarCupomNoServidor(cupom.codigo, items, freteCalculado);
        if (resVal.valido) {
          valorDesconto = resVal.descontoAplicado;
          cupomInfo = {
            codigo: resVal.cupom.codigo,
            desconto: valorDesconto,
            nome: resVal.cupom.nome_interno,
            tipo_desconto: resVal.cupom.tipo_desconto
          };
        } else if (Number(desconto) > 0) {
          valorDesconto = Math.min(subtotalCalculado, Number(desconto));
          cupomInfo = cupom;
        }
      } catch {
        if (Number(desconto) > 0) {
          valorDesconto = Math.min(subtotalCalculado, Number(desconto));
          cupomInfo = cupom;
        }
      }
    } else if (Number(desconto) > 0) {
      valorDesconto = Math.min(subtotalCalculado, Number(desconto));
    }

    const totalCalculado = Math.max(0, Math.round((subtotalCalculado - valorDesconto + freteCalculado) * 100) / 100);

    // Criar o objeto do pedido
    const novoPedido = {
      id: idPedido,
      numero_pedido: numeroPedido,
      origem_loja: origemLoja,
      origem_host: host,
      cliente: {
        nome_completo: cliente?.nomeCompleto || '',
        cpf_cnpj: cliente?.cpfCnpj || '',
        email: cliente?.email || '',
        telefone: cliente?.telefone || '',
        tipo_pessoa: cliente?.tipoPessoa || 'PF',
      },
      endereco_entrega: cliente?.endereco || {},
      frete_selecionado: frete || {},
      itens: items || [],
      subtotal: subtotalCalculado,
      valor_frete: freteCalculado,
      cupom: cupomInfo,
      valor_desconto: valorDesconto,
      total: totalCalculado,
      status: 'PENDENTE',
      bling_status: 'PENDENTE',
      criado_em: new Date().toISOString()
    };

    // Salvar o pedido no banco de dados Supabase
    const novaListaPedidos = [novoPedido, ...pedidosExistentes];
    await supabase.from('configuracoes').upsert({
      chave: 'pedidos_db',
      valor: novaListaPedidos
    });

    let accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      const { data: mpCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'mercadopago_config').maybeSingle();
      if (mpCfg?.valor?.access_token) {
        accessToken = mpCfg.valor.access_token;
      }
    }

    // Se o token do Mercado Pago não estiver configurado nas variáveis nem no painel, simular checkout
    if (!accessToken) {
      console.log('[MERCADO PAGO] Access Token não configurado. Simulando Checkout.');
      const mockCheckoutUrl = 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock-banho-e-tosa-12345';
      return NextResponse.json({
        sucesso: true,
        checkoutUrl: mockCheckoutUrl,
        modo: 'simulacao',
        numeroPedido: numeroPedido,
        mensagem: 'Simulação realizada. Insira o Access Token nas Configurações do Painel para gerar cobranças reais.'
      });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    // 3. Montar os itens para o Mercado Pago com o desconto aplicado exatamente
    const mpItems: any[] = [];
    const isFreteGratisCupom = cupomInfo?.tipo_desconto === 'frete_gratis';

    if (isFreteGratisCupom) {
      // Cupom de frete grátis: desconto no frete
      (items || []).forEach((item: any) => {
        mpItems.push({
          id: String(item.id || item.sku || 'item'),
          title: String(item.nome || 'Produto Pet'),
          quantity: Number(item.quantidade || 1),
          unit_price: Number(item.preco_unitario || item.preco || 0),
          currency_id: 'BRL',
        });
      });

      const freteComDesconto = Math.max(0, Math.round((freteCalculado - valorDesconto) * 100) / 100);
      if (freteComDesconto > 0) {
        mpItems.push({
          id: 'frete',
          title: `Frete - ${frete?.nome || 'Entrega'}`,
          quantity: 1,
          unit_price: freteComDesconto,
          currency_id: 'BRL',
        });
      }
    } else if (valorDesconto > 0 && subtotalCalculado > 0) {
      // Cupom de desconto em produtos (percentual ou fixo): ratear proporcionalmente
      const targetProductsSubtotal = Math.max(0.01, Math.round((subtotalCalculado - valorDesconto) * 100) / 100);

      let allocatedTotal = 0;
      const lineAllocations = (items || []).map((item: any, idx: number) => {
        const itemSubtotal = Number(item.preco_unitario || item.preco || 0) * Number(item.quantidade || 1);
        let lineTarget: number;
        if (idx === (items || []).length - 1) {
          lineTarget = Math.max(0.01 * Number(item.quantidade || 1), Math.round((targetProductsSubtotal - allocatedTotal) * 100) / 100);
        } else {
          lineTarget = Math.max(0.01 * Number(item.quantidade || 1), Math.round(((itemSubtotal / subtotalCalculado) * targetProductsSubtotal) * 100) / 100);
          allocatedTotal += lineTarget;
        }
        return { item, lineTarget };
      });

      // Ajuste fino de centavos na última linha para garantir igualdade exata
      const currentSum = lineAllocations.reduce((sum: number, l: any) => sum + l.lineTarget, 0);
      const diff = Math.round((targetProductsSubtotal - currentSum) * 100) / 100;
      if (diff !== 0 && lineAllocations.length > 0) {
        lineAllocations[lineAllocations.length - 1].lineTarget = Math.max(
          0.01 * Number(lineAllocations[lineAllocations.length - 1].item.quantidade || 1),
          Math.round((lineAllocations[lineAllocations.length - 1].lineTarget + diff) * 100) / 100
        );
      }

      lineAllocations.forEach(({ item, lineTarget }: any) => {
        const qty = Number(item.quantidade || 1);
        const title = String(item.nome || 'Produto Pet');
        const id = String(item.id || item.sku || 'item');

        const cents = Math.round(lineTarget * 100);
        const baseUnitCents = Math.floor(cents / qty);
        const remainderCents = cents % qty;

        if (remainderCents === 0) {
          mpItems.push({
            id,
            title,
            quantity: qty,
            unit_price: baseUnitCents / 100,
            currency_id: 'BRL',
          });
        } else {
          if (remainderCents > 0) {
            mpItems.push({
              id,
              title,
              quantity: remainderCents,
              unit_price: (baseUnitCents + 1) / 100,
              currency_id: 'BRL',
            });
          }
          if (qty - remainderCents > 0) {
            mpItems.push({
              id,
              title,
              quantity: qty - remainderCents,
              unit_price: baseUnitCents / 100,
              currency_id: 'BRL',
            });
          }
        }
      });

      // Adicionar frete
      if (freteCalculado > 0) {
        mpItems.push({
          id: 'frete',
          title: `Frete - ${frete?.nome || 'Entrega'}`,
          quantity: 1,
          unit_price: freteCalculado,
          currency_id: 'BRL',
        });
      }
    } else {
      // Sem cupom / sem desconto
      (items || []).forEach((item: any) => {
        mpItems.push({
          id: String(item.id || item.sku || 'item'),
          title: String(item.nome || 'Produto Pet'),
          quantity: Number(item.quantidade || 1),
          unit_price: Number(item.preco_unitario || item.preco || 0),
          currency_id: 'BRL',
        });
      });

      if (freteCalculado > 0) {
        mpItems.push({
          id: 'frete',
          title: `Frete - ${frete?.nome || 'Entrega'}`,
          quantity: 1,
          unit_price: freteCalculado,
          currency_id: 'BRL',
        });
      }
    }

    const reqHost = request.headers.get('host') || 'localhost:3000';
    const protocol = reqHost.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${reqHost}`;

    const resPref = await preference.create({
      body: {
        items: mpItems,
        statement_descriptor: 'MIMOSHOWPET',
        external_reference: numeroPedido,
        metadata: {
          numero_pedido: numeroPedido,
          cupom: cupomInfo?.codigo || null,
          desconto: valorDesconto,
          subtotal: subtotalCalculado,
          frete: freteCalculado,
          total: totalCalculado
        },
        payer: {
          name: cliente?.nomeCompleto || 'Cliente Banho & Tosa',
          email: cliente?.email || 'cliente@email.com',
          identification: cliente?.cpfCnpj ? {
            type: cliente?.tipoPessoa === 'PJ' ? 'CNPJ' : 'CPF',
            number: cliente.cpfCnpj.replace(/\D/g, '')
          } : undefined
        },
        back_urls: {
          success: `${baseUrl}/rastreamento?pedido=${numeroPedido}&status=sucesso`,
          failure: `${baseUrl}/checkout?status=falha`,
          pending: `${baseUrl}/rastreamento?pedido=${numeroPedido}&status=pendente`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      }
    });

    return NextResponse.json({
      sucesso: true,
      checkoutUrl: resPref.init_point,
      sandboxUrl: resPref.sandbox_init_point,
      preferenceId: resPref.id,
      numeroPedido: numeroPedido
    });
  } catch (error: any) {
    console.error('[MERCADO PAGO] Erro ao criar preferência de pagamento:', error);
    return NextResponse.json(
      { erro: 'Falha ao processar pagamento no Mercado Pago: ' + (error?.message || 'Erro interno') },
      { status: 500 }
    );
  }
}
