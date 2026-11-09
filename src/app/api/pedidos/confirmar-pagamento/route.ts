import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { aprovarPedidoEGerarEtiqueta } from '@/lib/orderManager';

/**
 * Endpoint para confirmação de pagamento acionado pelo retorno do checkout.
 * SEGURANÇA MÁXIMA: NUNCA aprova pedidos apenas com base no número do pedido.
 * Exige validação direta com a API oficial do Mercado Pago no servidor.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { numeroPedido, paymentId } = body;

    if (!numeroPedido) {
      return NextResponse.json(
        { erro: 'Número do pedido é obrigatório.' },
        { status: 400 }
      );
    }

    // Se não informou paymentId, rejeitar aprovação cega
    if (!paymentId) {
      console.warn(`[SECURITY] Tentativa de confirmação de pagamento sem paymentId para pedido #${numeroPedido}`);
      return NextResponse.json(
        { erro: 'Comprovante ou ID de pagamento é obrigatório para validação.' },
        { status: 403 }
      );
    }

    // ── 1. OBTER ACCESS TOKEN DO MERCADO PAGO ──
    let accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      const { data: mpCfg } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'mercadopago_config')
        .maybeSingle();
      accessToken = mpCfg?.valor?.access_token;
    }

    if (!accessToken) {
      return NextResponse.json(
        { erro: 'Gateway de pagamento não configurado no servidor.' },
        { status: 500 }
      );
    }

    // ── 2. CONSULTAR PAGAMENTO REAL NA API DO MERCADO PAGO ──
    const idLimpo = String(paymentId).replace(/\D/g, '');
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${idLimpo}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!mpRes.ok) {
      console.warn(`[SECURITY] Pagamento ID #${idLimpo} não foi localizado no Mercado Pago. Status: ${mpRes.status}`);
      return NextResponse.json(
        { erro: 'Não foi possível validar o pagamento junto ao Mercado Pago.' },
        { status: 403 }
      );
    }

    const paymentData = await mpRes.json();
    const mpStatus = paymentData.status;
    const extRef = paymentData.external_reference;

    // ── 3. VALIDAÇÃO DE AUTENTICIDADE E IDEMPOTÊNCIA ──
    const numLimpo = String(numeroPedido).replace(/\D/g, '');
    const refLimpo = String(extRef || '').replace(/\D/g, '');

    if (numLimpo !== refLimpo) {
      console.warn(`[SECURITY DIVERGÊNCIA] Pedido informado (#${numLimpo}) difere do external_reference do Mercado Pago (#${refLimpo})`);
      return NextResponse.json(
        { erro: 'O pagamento informado não pertence a este número de pedido.' },
        { status: 403 }
      );
    }

    if (mpStatus !== 'approved') {
      console.log(`[PAGAMENTO PENDENTE] Pedido #${numeroPedido} com status no Mercado Pago: ${mpStatus}`);
      return NextResponse.json({
        sucesso: false,
        status: mpStatus,
        mensagem: `Pagamento ainda não aprovado (status atual: ${mpStatus}).`,
      });
    }

    // ── 4. APROVAÇÃO OFICIAL E DISPARO RESILIENTE PARA O BLING ──
    console.log(`[PAGAMENTO VALIDADO] Pedido #${numeroPedido} validado com sucesso via Mercado Pago (Payment ID #${idLimpo})!`);
    const resAprovacao = await aprovarPedidoEGerarEtiqueta(numeroPedido, paymentData);

    return NextResponse.json({
      sucesso: true,
      mensagem: `Pagamento validado e aprovado com sucesso!`,
      detalhes: resAprovacao,
    });
  } catch (err: any) {
    console.error('[CONFIRMAR PAGAMENTO] Exceção no processamento:', err);
    return NextResponse.json({ erro: err.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}
