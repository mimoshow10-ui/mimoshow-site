import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, cliente, frete, total } = body;

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

    // Criar o objeto do pedido
    const novoPedido = {
      id: idPedido,
      numero_pedido: numeroPedido,
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
      subtotal: (items || []).reduce((sum: number, item: any) => sum + (Number(item.preco_unitario || item.preco || 0) * Number(item.quantidade || 1)), 0),
      valor_frete: Number(frete?.valor || 0),
      total: Number(total || 0),
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

    // Formatar itens para o Mercado Pago
    const mpItems = (items || []).map((item: any) => ({
      id: String(item.id || item.sku || 'item'),
      title: String(item.nome || 'Produto Pet'),
      quantity: Number(item.quantidade || 1),
      unit_price: Number(item.preco_unitario || item.preco || 0),
      currency_id: 'BRL',
    }));

    // Adicionar frete se houver valor
    if (frete && frete.valor > 0) {
      mpItems.push({
        id: 'frete',
        title: `Frete - ${frete.nome || 'Entrega'}`,
        quantity: 1,
        unit_price: Number(frete.valor),
        currency_id: 'BRL',
      });
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const resPref = await preference.create({
      body: {
        items: mpItems,
        statement_descriptor: 'MIMOSHOWPET',
        external_reference: numeroPedido,
        payer: {
          name: cliente?.nomeCompleto || 'Cliente MIMO Show',
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
