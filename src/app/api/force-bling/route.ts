import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { enviarPedidoBlingInterno } from '@/app/admin/pedidos/actions';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    const { data: config } = await supabase.from('configuracoes').select('valor').eq('chave', 'pedidos_db').maybeSingle();
    const pedidos = config?.valor || [];
    const pedido = pedidos.find((p: any) => p.numero_pedido === id || p.id === id);

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido nao encontrado' });
    }

    const res = await enviarPedidoBlingInterno(pedido);
    return NextResponse.json(res);
  } catch(e: any) {
    return NextResponse.json({ error: e.message });
  }
}
