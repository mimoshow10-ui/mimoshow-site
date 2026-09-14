import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { linkProductToFamily, removeMemberFromFamily } from '@/lib/familyManager';
import { setProdutosOcultosVitrineEmMassa } from '@/lib/vitrineManager';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ids, acao, valor, modo, categoria_id, promocao_expira_em } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ erro: 'Nenhum produto selecionado.' }, { status: 400 });
    }

    if (!acao) {
      return NextResponse.json({ erro: 'Selecione uma ação em massa válida.' }, { status: 400 });
    }

    // ── 1. ALTERAÇÃO DE GRUPO & SUBGRUPO ──
    if (acao === 'categoria') {
      const catTarget = categoria_id || null;
      const { error } = await supabase.from('produtos').update({ categoria_id: catTarget }).in('id', ids);
      if (error) throw new Error(`Erro ao atualizar categorias: ${error.message}`);

      const catsAdicionaisArr: string[] = Array.isArray(body.categorias_adicionais) ? body.categorias_adicionais : [];
      const finalCats = catsAdicionaisArr.length > 0 ? catsAdicionaisArr : (catTarget ? [catTarget] : []);

      try {
        const { data: currentCatMap } = await supabase.from('configuracoes').select('valor').eq('chave', 'produtos_categorias_adicionais').single();
        let mapAtual = currentCatMap?.valor || {};
        for (const prodId of ids) {
          if (finalCats.length > 0) {
            mapAtual[prodId] = finalCats;
          } else {
            delete mapAtual[prodId];
          }
        }
        await supabase.from('configuracoes').upsert({
          chave: 'produtos_categorias_adicionais',
          valor: mapAtual,
        }, { onConflict: 'chave' });
      } catch (errAdic) {
        console.error('Erro ao atualizar categorias adicionais:', errAdic);
      }

    // ── 2. REAJUSTE DE PREÇO NORMAL (R$ / %) ──
    } else if (acao === 'preco') {
      const rawVal = parseFloat(String(valor || '0').replace(',', '.'));
      if (isNaN(rawVal) || rawVal < 0) {
        return NextResponse.json({ erro: 'Informe um valor numérico válido para o preço.' }, { status: 400 });
      }

      if (modo === 'fixo') {
        await supabase.from('produtos').update({ preco: rawVal }).in('id', ids);
      } else {
        const { data: prods } = await supabase.from('produtos').select('id, preco').in('id', ids);
        if (prods) {
          for (const p of prods) {
            const precoAtual = Number(p.preco || 0);
            let novoPreco = precoAtual;
            if (modo === 'aumentar_pct') {
              novoPreco = Number((precoAtual * (1 + rawVal / 100)).toFixed(2));
            } else if (modo === 'diminuir_pct') {
              novoPreco = Number((precoAtual * (1 - rawVal / 100)).toFixed(2));
            }
            await supabase.from('produtos').update({ preco: Math.max(0, novoPreco) }).eq('id', p.id);
          }
        }
      }

    // ── 3. PREÇO PROMOCIONAL (R$ / % / REMOVER) ──
    } else if (acao === 'preco_promocional') {
      const expira7DiasIso = promocao_expira_em
        ? (isNaN(new Date(promocao_expira_em).getTime()) ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : new Date(promocao_expira_em).toISOString())
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      if (modo === 'remover') {
        await supabase.from('produtos').update({ preco_promocional: null, destaque_super_promocao: false, promocao_expira_em: null }).in('id', ids);
      } else if (modo === 'fixo') {
        const rawVal = parseFloat(String(valor || '0').replace(',', '.'));
        const pVal = isNaN(rawVal) ? null : rawVal;
        await supabase.from('produtos').update({
          preco_promocional: pVal,
          destaque_super_promocao: true,
          promocao_expira_em: expira7DiasIso
        }).in('id', ids);
      } else if (modo === 'desconto_pct') {
        const rawVal = parseFloat(String(valor || '0').replace(',', '.'));
        if (isNaN(rawVal) || rawVal <= 0 || rawVal >= 100) {
          return NextResponse.json({ erro: 'Informe uma porcentagem de desconto válida (entre 1% e 99%).' }, { status: 400 });
        }
        const { data: prods } = await supabase.from('produtos').select('id, preco').in('id', ids);
        if (prods) {
          for (const p of prods) {
            const precoAtual = Number(p.preco || 0);
            const promoPreco = Number((precoAtual * (1 - rawVal / 100)).toFixed(2));
            await supabase.from('produtos').update({
              preco_promocional: Math.max(0, promoPreco),
              destaque_super_promocao: true,
              promocao_expira_em: expira7DiasIso
            }).eq('id', p.id);
          }
        }
      }

    // ── 4. VITRINES E DESTAQUES ──
    } else if (acao === 'destaque') {
      const isSuperPromo = valor === 'super_promocao';
      
      if (isSuperPromo) {
        // Desmarca produtos anteriores para garantir que APENAS os selecionados fiquem na vitrine de promoção
        await supabase.from('produtos').update({ destaque_super_promocao: false }).eq('destaque_super_promocao', true);

        const expiraIso = promocao_expira_em
          ? (isNaN(new Date(promocao_expira_em).getTime()) ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : new Date(promocao_expira_em).toISOString())
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        await supabase.from('produtos').update({
          destaque_super_promocao: true,
          promocao_expira_em: expiraIso,
        }).in('id', ids);
      } else {
        await supabase.from('produtos').update({ destaque_super_promocao: false }).in('id', ids);
      }

      const { data: currentConfig } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'vitrine_destaques')
        .single();

      let valorAtual = currentConfig?.valor || { mais_vendidos: [], novidades: [] };
      let mvList: string[] = (valorAtual.mais_vendidos || []).filter((prodId: string) => !ids.includes(prodId));
      let novList: string[] = (valorAtual.novidades || []).filter((prodId: string) => !ids.includes(prodId));

      if (valor === 'mais_vendidos') {
        mvList = [...ids, ...mvList];
      } else if (valor === 'lancamento') {
        novList = [...ids, ...novList];
      }

      await supabase.from('configuracoes').upsert({
        chave: 'vitrine_destaques',
        valor: {
          mais_vendidos: Array.from(new Set(mvList)),
          novidades: Array.from(new Set(novList)),
        },
      }, { onConflict: 'chave' });

    // ── 5. STATUS ATIVO / INATIVO ──
    } else if (acao === 'status') {
      const ativo = valor === true || valor === 'true';
      await supabase.from('produtos').update({ ativo }).in('id', ids);

    // ── 6. EXCLUSÃO EM MASSA ──
    } else if (acao === 'excluir') {
      await supabase.from('produtos').delete().in('id', ids);

    // ── 7. AGRUPAR VARIAÇÕES NA MESMA FAMÍLIA ──
    } else if (acao === 'agrupar_variacoes') {
      if (ids.length < 2) {
        return NextResponse.json({ erro: 'Selecione pelo menos 2 produtos para agrupar na mesma família.' }, { status: 400 });
      }
      const targetId = valor || ids[0];

      await supabase.from('produtos').update({ parent_id: null }).in('id', ids);

      for (const itemChildId of ids) {
        if (itemChildId !== targetId) {
          await linkProductToFamily(targetId, itemChildId);
        }
      }

    // ── 8. DESVINCULAR VARIAÇÕES (REMOVE MEMBROS DA FAMÍLIA) ──
    } else if (acao === 'desvincular_variacoes') {
      await supabase.from('produtos').update({ parent_id: null }).in('id', ids);
      for (const prodId of ids) {
        await removeMemberFromFamily(prodId);
      }

    // ── 9. OCULTAR / EXIBIR NA VITRINE (VENDA APENAS COMO VARIAÇÃO) ──
    } else if (acao === 'ocultar_vitrine') {
      await setProdutosOcultosVitrineEmMassa(ids, true);
    } else if (acao === 'exibir_vitrine') {
      await setProdutosOcultosVitrineEmMassa(ids, false);
    } else {
      return NextResponse.json({ erro: 'Ação em massa inválida.' }, { status: 400 });
    }

    revalidatePath('/admin/produtos');
    revalidatePath('/', 'layout');

    return NextResponse.json({ sucesso: true, mensagem: `Edição em massa concluída com sucesso para ${ids.length} produto(s)!` });
  } catch (err: any) {
    return NextResponse.json({ erro: err.message || 'Erro ao processar edição em massa.' }, { status: 500 });
  }
}
