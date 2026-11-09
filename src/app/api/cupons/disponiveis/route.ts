import { NextResponse } from 'next/server';
import { getCupons } from '@/lib/coupons';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const todos = await getCupons();
    const agora = Date.now();

    const { data: configPos } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'cupons_config')
      .maybeSingle();

    const cuponsHomeIds: string[] = configPos?.valor?.cupons_home_ids || [];

    // Retorna apenas cupons ativos, dentro do prazo e NÃO EXCLUSIVOS DE E-MAIL
    let cuponsValidos = todos.filter(c => {
      if (!c.ativo) return false;
      if (c.exclusivo_email === true || c.origem === 'email_marketing') return false;
      if (c.codigo?.startsWith('OBRIGADO-')) return false;
      if (c.nome_interno?.includes('Pós-Venda')) return false;
      if (c.data_inicio && new Date(c.data_inicio).getTime() > agora) return false;
      if (c.data_fim && new Date(c.data_fim).getTime() < agora) return false;
      if (c.limite_usos_total && c.usos_realizados >= c.limite_usos_total) return false;
      return true;
    });

    // Se o usuário selecionou cupons específicos para a tela de vendas, filtrar e ordenar conforme selecionado
    if (cuponsHomeIds.length > 0) {
      const map = new Map<string, any>();
      cuponsValidos.forEach(c => map.set(c.id, c));
      const ordenados = cuponsHomeIds.map(id => map.get(id)).filter(Boolean);
      if (ordenados.length > 0) {
        cuponsValidos = ordenados;
      }
    }

    return NextResponse.json({ cupons: cuponsValidos });
  } catch (e: any) {
    return NextResponse.json({ cupons: [] });
  }
}
