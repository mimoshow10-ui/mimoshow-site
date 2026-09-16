import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import {
  linkProductToFamily,
  reorderFamilyMembers,
  removeMemberFromFamily
} from '@/lib/familyManager';

// GET: buscar produtos para vincular como variação em tempo real em todo o catálogo
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQ = (searchParams.get('q') || '').trim();

    if (!rawQ || rawQ.length < 2) {
      return NextResponse.json({ produtos: [] });
    }

    const qClean = rawQ.replace(/[\s\-_]+/g, '');
    const numOnly = rawQ.replace(/\D/g, '');

    const filters: string[] = [
      `nome.ilike.%${rawQ}%`,
      `codigo_barras.ilike.%${rawQ}%`,
    ];

    if (qClean && qClean !== rawQ) {
      filters.push(`codigo_barras.ilike.%${qClean}%`);
      filters.push(`nome.ilike.%${qClean}%`);
    }

    if (numOnly.length >= 3 && numOnly !== rawQ && numOnly !== qClean) {
      filters.push(`codigo_barras.ilike.%${numOnly}%`);
      filters.push(`bling_id.eq.${numOnly}`);
    }

    const { data: produtos, error } = await supabase
      .from('produtos')
      .select('id, nome, codigo_barras, imagens, preco, parent_id')
      .or(filters.join(','))
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ produtos: produtos || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao buscar produtos' }, { status: 500 });
  }
}

// POST: vincular produtos à mesma família permanente de variações
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const targetId = body.targetProductId || body.paiId;
    const memberId = body.newMemberId || body.filhoId;

    if (!targetId || !memberId) {
      return NextResponse.json({ error: 'IDs dos produtos obrigatórios' }, { status: 400 });
    }

    const familiaAtualizada = await linkProductToFamily(targetId, memberId);

    revalidatePath('/admin/produtos');
    revalidatePath('/', 'layout');

    return NextResponse.json({ ok: true, family: familiaAtualizada });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao vincular variação' }, { status: 500 });
  }
}

// PUT: reordenar exibição das variações dentro da mesma família
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, familyId, ordemIds, memberId } = body;

    if (action === 'reordenar') {
      const memberIdTarget = memberId || familyId || (Array.isArray(ordemIds) && ordemIds[0]);
      if (!memberIdTarget || !Array.isArray(ordemIds)) {
        return NextResponse.json({ error: 'memberId/ordemIds são obrigatórios' }, { status: 400 });
      }

      await reorderFamilyMembers(memberIdTarget, ordemIds);

      revalidatePath('/admin/produtos');
      revalidatePath('/', 'layout');

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao processar requisição' }, { status: 500 });
  }
}

// DELETE: desvincular variação mantendo a integridade dos demais membros
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const targetMemberId = body.memberId || body.filhoId;

    if (!targetMemberId) {
      return NextResponse.json({ error: 'memberId obrigatório' }, { status: 400 });
    }

    await removeMemberFromFamily(targetMemberId);

    revalidatePath('/admin/produtos');
    revalidatePath('/', 'layout');

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao desvincular variação' }, { status: 500 });
  }
}
