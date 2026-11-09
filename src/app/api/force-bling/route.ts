import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { sincronizarPedidoComBling } from '@/lib/bling/syncQueue';

export async function POST(req: Request) {
  try {
    // Validação de segurança: apenas administradores com sessão ativa podem forçar transmissão
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session')?.value;

    if (!adminSession) {
      return NextResponse.json({ erro: 'Acesso restrito ao administrador.' }, { status: 401 });
    }

    const { id } = await req.json();

    const { data: config } = await supabase.from('configuracoes').select('valor').eq('chave', 'pedidos_db').maybeSingle();
    const pedidos = config?.valor || [];
    const pedido = pedidos.find((p: any) => p.numero_pedido === id || p.id === id);

    if (!pedido) {
      return NextResponse.json({ erro: 'Pedido não encontrado no banco de dados.' }, { status: 404 });
    }

    const res = await sincronizarPedidoComBling(id, {
      forcarReenvio: true,
      origemChamada: 'api_force_bling',
    });

    return NextResponse.json(res);
  } catch(e: any) {
    return NextResponse.json({ erro: e.message || 'Erro ao processar' }, { status: 500 });
  }
}
