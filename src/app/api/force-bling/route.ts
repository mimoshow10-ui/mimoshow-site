import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'bling_tokens').single();
    const token = cfg?.valor?.access_token;

    const { data: config } = await supabase.from('configuracoes').select('valor').eq('chave', 'pedidos_db').maybeSingle();
    const pedidos = config?.valor || [];
    const pedido = pedidos.find((p: any) => p.numero_pedido === id || p.id === id);

    const payloadBling = {
        data: new Date().toISOString().split('T')[0],
        numero: pedido.numero_pedido,
        contato: {
          nome: pedido.cliente?.nome_completo || 'Cliente sem nome',
          tipoPessoa: pedido.cliente?.cpf_cnpj?.length > 14 ? 'J' : 'F',
          numeroDocumento: pedido.cliente?.cpf_cnpj ? String(pedido.cliente.cpf_cnpj).replace(/\D/g, '') : ''
        },
        itens: pedido.itens.map((i: any) => ({
          codigo: i.sku,
          descricao: i.nome,
          unidade: 'UN',
          quantidade: i.quantidade,
          valor: i.preco_unitario
        })),
        transporte: {
          fretePorConta: 0,
          frete: pedido.valor_frete || 0,
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
    return NextResponse.json({ status: resBling.status, data: resData, payload: payloadBling });
  } catch(e: any) {
    return NextResponse.json({ error: e.message });
  }
}
