import { supabase } from '@/lib/supabase';

export async function getOcultosVitrine(): Promise<Set<string>> {
  try {
    const { data } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'produtos_ocultos_vitrine')
      .maybeSingle();

    if (data?.valor && Array.isArray(data.valor)) {
      return new Set(data.valor.map((id: any) => String(id)));
    }
    return new Set();
  } catch (err) {
    console.error('[VITRINE MANAGER] Erro ao buscar produtos ocultos da vitrine:', err);
    return new Set();
  }
}

export async function setProdutoOcultoVitrine(productId: string, ocultar: boolean): Promise<void> {
  try {
    const ocultos = await getOcultosVitrine();
    if (ocultar) {
      ocultos.add(String(productId));
    } else {
      ocultos.delete(String(productId));
    }

    await supabase.from('configuracoes').upsert({
      chave: 'produtos_ocultos_vitrine',
      valor: Array.from(ocultos),
    }, { onConflict: 'chave' });
  } catch (err) {
    console.error('[VITRINE MANAGER] Erro ao atualizar visibilidade de produto:', err);
  }
}

export async function setProdutosOcultosVitrineEmMassa(productIds: string[], ocultar: boolean): Promise<void> {
  try {
    const ocultos = await getOcultosVitrine();
    for (const id of productIds) {
      if (ocultar) {
        ocultos.add(String(id));
      } else {
        ocultos.delete(String(id));
      }
    }

    await supabase.from('configuracoes').upsert({
      chave: 'produtos_ocultos_vitrine',
      valor: Array.from(ocultos),
    }, { onConflict: 'chave' });
  } catch (err) {
    console.error('[VITRINE MANAGER] Erro ao atualizar produtos ocultos em lote:', err);
  }
}
