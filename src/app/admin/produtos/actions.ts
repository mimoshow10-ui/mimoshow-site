'use server'

import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { setProdutoOcultoVitrine } from '@/lib/vitrineManager';

export async function atualizarProduto(formData: FormData) {
  const id = formData.get('id') as string;
  const nome = (formData.get('nome') as string || '').trim();
  
  const preco_raw = (formData.get('preco') as string || '0').replace(/[^0-9.,]/g, '').replace(',', '.');
  const preco = parseFloat(preco_raw) || 0;
  
  const preco_promocional_raw = (formData.get('preco_promocional') as string || '').replace(/[^0-9.,]/g, '').replace(',', '.');
  const preco_promocional = preco_promocional_raw ? parseFloat(preco_promocional_raw) || null : null;

  const estoque_raw = (formData.get('estoque') as string || '0').replace(/[^0-9]/g, '');
  const estoque = parseInt(estoque_raw, 10) || 0;

  const categoria_id = (formData.get('categoria_id') as string) || null;
  
  // Convert imagens textarea content to array
  const imagensTxt = formData.get('imagens') as string;
  const imagensArr = imagensTxt ? imagensTxt.split(/[\r\n,]+/).map(s => s.trim()).filter(s => s) : [];
  
  // Video URL
  const video_url = formData.get('video_url') as string;

  // Extract related products
  const relacionadosTxt = (formData.get('relacionados') as string) || '';
  const relacionadosArr = relacionadosTxt ? relacionadosTxt.split(',').map(s => s.trim()).filter(s => s) : [];

  const codigo_barras = ((formData.get('codigo_barras') || formData.get('sku')) as string || '').trim();
  if (!codigo_barras) {
    redirect(`/admin/produtos/${id}?erro=O SKU / Código de Barras é obrigatório.`);
  }

  // Data de Início do Período de Promoção
  const promocao_inicio_em = formData.get('promocao_inicio_em') as string;
  let inicioIso = null;
  if (promocao_inicio_em) {
    const dateStr = promocao_inicio_em.length === 16 ? `${promocao_inicio_em}:00-03:00` : promocao_inicio_em;
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) inicioIso = d.toISOString();
    } catch {}
  }

  // Data de Fim do Período de Promoção
  const promocao_expira_em = formData.get('promocao_expira_em') as string;
  let expiraIso = null;
  if (promocao_expira_em) {
    const dateStr = promocao_expira_em.length === 16 ? `${promocao_expira_em}:00-03:00` : promocao_expira_em;
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) expiraIso = d.toISOString();
    } catch {}
  }

  const destaque_home = formData.get('destaque_home') as string;
  const isSuperPromo = destaque_home === 'super_promocao';

  const payload: any = { 
    nome, 
    codigo_barras,
    preco, 
    preco_promocional,
    estoque, 
    video_url: video_url || null,
    categoria_id: categoria_id || null, 
    imagens: imagensArr.length > 0 ? imagensArr : null,
    produtos_relacionados: relacionadosArr.length > 0 ? relacionadosArr : null,
    destaque_super_promocao: isSuperPromo,
    promocao_expira_em: expiraIso
  };

  if (inicioIso) {
    payload.promocao_inicio_em = inicioIso;
  }

  let { error } = await supabase.from('produtos').update(payload).eq('id', id);
  
  // Resiliência de esquema: caso o banco não tenha certas colunas opcionais, remove e retenta
  while (error && (error.code === 'PGRST204' || error.message?.includes('schema cache'))) {
    const match = error.message && error.message.match(/Could not find the '([^']+)' column/);
    if (match && match[1] && match[1] in payload) {
      delete payload[match[1]];
      const res = await supabase.from('produtos').update(payload).eq('id', id);
      error = res.error;
    } else {
      break;
    }
  }

  if (error) {
    redirect(`/admin/produtos/${id}?erro=Erro ao salvar: ${error.message}`);
  }

  // Salvar Visibilidade na Vitrine (Oculto da Vitrine / Apenas Variação)
  try {
    const ocultar_na_vitrine = formData.get('ocultar_na_vitrine') === 'true';
    await setProdutoOcultoVitrine(id, ocultar_na_vitrine);
  } catch (errVitrine) {
    console.error('Erro ao atualizar visibilidade na vitrine:', errVitrine);
  }

  // Salvar Categorias Adicionais em configuracoes
  try {
    const categorias_adicionais_str = formData.get('categorias_adicionais') as string;
    const adicionaisArr: string[] = categorias_adicionais_str ? JSON.parse(categorias_adicionais_str) : [];
    
    const { data: currentCatMap } = await supabase.from('configuracoes').select('valor').eq('chave', 'produtos_categorias_adicionais').single();
    let mapAtual = currentCatMap?.valor || {};
    mapAtual[id] = adicionaisArr;

    await supabase.from('configuracoes').upsert({
      chave: 'produtos_categorias_adicionais',
      valor: mapAtual
    }, { onConflict: 'chave' });
  } catch (err) {
    console.error("Erro ao salvar categorias adicionais:", err);
  }

  // Atualizar listas de destaques da Home em configuracoes
  try {
    const { data: configCurrent } = await supabase.from('configuracoes').select('valor').eq('chave', 'vitrine_destaques').single();
    let valorAtual = configCurrent?.valor || { mais_vendidos: [], novidades: [] };

    let mvList: string[] = (valorAtual.mais_vendidos || []).filter((prodId: string) => prodId !== id);
    let novList: string[] = (valorAtual.novidades || []).filter((prodId: string) => prodId !== id);

    if (destaque_home === 'mais_vendidos') {
      mvList.unshift(id);
    } else if (destaque_home === 'lancamento') {
      novList.unshift(id);
    }

    await supabase.from('configuracoes').upsert({
      chave: 'vitrine_destaques',
      valor: {
        mais_vendidos: Array.from(new Set(mvList)),
        novidades: Array.from(new Set(novList))
      }
    }, { onConflict: 'chave' });
  } catch {}

  revalidatePath('/admin/produtos');
  revalidatePath('/');
  
  const ret_params = (formData.get('ret_params') as string) || '';

  const { data: prodExistente } = await supabase.from('produtos').select('slug').eq('id', id).single();
  if (prodExistente) {
    revalidatePath(`/produto/${prodExistente.slug}`);
  }

  if (categoria_id) {
    const { data: cat } = await supabase.from('categorias').select('slug').eq('id', categoria_id).single();
    if (cat) revalidatePath(`/categoria/${cat.slug}`);
  }
  
  const p = new URLSearchParams(ret_params);
  p.set('msg', 'Produto atualizado com sucesso!');
  redirect(`/admin/produtos?${p.toString()}`);
}

export async function importarSKU(formData: FormData) {
  const rawSku = formData.get('sku') as string;
  const sku = rawSku ? rawSku.trim() : '';
  const currentParamsStr = (formData.get('currentParams') as string) || '';

  if (!sku) return;

  const urlParams = new URLSearchParams(currentParamsStr);
  urlParams.set('imported_sku', sku);

  function makeUrl(key: 'msg' | 'erro', message: string) {
    const p = new URLSearchParams(urlParams);
    p.set(key, message);
    if (key === 'msg') {
      p.set('q', sku);
    }
    return `/admin/produtos?${p.toString()}`;
  }

  let redirectTo = '';

  try {
    let tokenCfg: any = null;
    const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
    let token = cfg?.valor?.access_token;
    const refreshToken = cfg?.valor?.refresh_token;

    // Auto-refresh token if credentials are present
    const { data: creds } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_credentials').single();
    const clientId = creds?.valor?.client_id;
    const clientSecret = creds?.valor?.client_secret;

    if ((!token || token.length < 5) && refreshToken && clientId && clientSecret) {
      try {
        const res = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
            'Accept': '1.0'
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
          })
        });
        const dataRef = await res.json();
        if (dataRef.access_token) {
          token = dataRef.access_token;
          await supabase.from('configuracoes').upsert({
            chave: 'bling_tokens',
            valor: {
              access_token: dataRef.access_token,
              refresh_token: dataRef.refresh_token || refreshToken
            }
          }, { onConflict: 'chave' });
        }
      } catch (e) {}
    }

    if (!token) {
      redirectTo = makeUrl('erro', 'Token do Bling não encontrado. Vá nas Configurações e autorize o app.');
    } else {
      let response = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(sku)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let data = await response.json();

      // If token expired, try refreshing once
      if ((response.status === 401 || data?.error?.type === 'invalid_token') && refreshToken && clientId && clientSecret) {
        try {
          const res = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
              'Accept': '1.0'
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: refreshToken
            })
          });
          const dataRef = await res.json();
          if (dataRef.access_token) {
            token = dataRef.access_token;
            await supabase.from('configuracoes').upsert({
              chave: 'bling_tokens',
              valor: {
                access_token: dataRef.access_token,
                refresh_token: dataRef.refresh_token || refreshToken
              }
            }, { onConflict: 'chave' });

            response = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(sku)}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            data = await response.json();
          }
        } catch (e) {}
      }

      // If still no results by codigo, search by pesquisa param
      if (!data.data || data.data.length === 0) {
        const fallbackRes = await fetch(`https://api.bling.com.br/Api/v3/produtos?pesquisa=${encodeURIComponent(sku)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackData?.data && fallbackData.data.length > 0) {
          data = fallbackData;
        }
      }

      if (response.status === 401 || data?.error?.type === 'invalid_token') {
        redirectTo = makeUrl('erro', 'Token do Bling expirado. Vá em Configurações e autorize o aplicativo novamente!');
      } else if (!data.data || data.data.length === 0) {
        redirectTo = makeUrl('erro', `Bling não encontrou nenhum produto com o SKU: '${sku}'. Verifique se o código está correto no Bling.`);
      } else {
        const produtoBuscado = data.data.find(
          (p: any) =>
            (p.codigo && p.codigo.trim().toLowerCase() === sku.toLowerCase()) ||
            String(p.id) === sku
        );
        
        if (!produtoBuscado) {
          redirectTo = makeUrl('erro', `Bling não encontrou o SKU exato: '${sku}'. Verifique a digitação.`);
          redirect(redirectTo);
          return;
        }

        async function fetchAndInsertBlingProduct(prodCompletoBase: any, parent_id: string | null = null): Promise<{ success: boolean; id?: string; error?: string }> {
          try {
            const prodId = String(prodCompletoBase.id);
            const detalhesReq = await fetch(`https://api.bling.com.br/Api/v3/produtos/${prodId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const detalhesJson = await detalhesReq.json();
            const prodCompleto = detalhesJson.data || prodCompletoBase;

            let estoqueAtual = 0;
            try {
              const estoqueReq = await fetch(`https://api.bling.com.br/Api/v3/estoques/saldos?idsProdutos[]=${prodId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const estoqueJson = await estoqueReq.json();
              estoqueAtual = estoqueJson.data?.[0]?.saldoFisicoTotal || 0;
            } catch(e) {}

            let imagensBling: string[] = [];
            const externas = prodCompleto.midia?.imagens?.externas?.map((img: any) => img.link) || [];
            const internas = prodCompleto.midia?.imagens?.internas?.map((img: any) => img.link) || [];
            imagensBling = [...externas, ...internas].filter(Boolean);

            if (imagensBling.length === 0 && Array.isArray(prodCompleto.midia)) {
              imagensBling = prodCompleto.midia.map((m: any) => m.url || m.link).filter(Boolean);
            }

            if (imagensBling.length === 0 && prodCompleto.imagemURL) {
              imagensBling = [prodCompleto.imagemURL];
            }

            let queryExistente = supabase.from('produtos').select('id, imagens, origem');
            if (prodCompleto.codigo) {
              queryExistente = queryExistente.or(`bling_id.eq.${prodId},codigo_barras.eq.${prodCompleto.codigo}`);
            } else {
              queryExistente = queryExistente.eq('bling_id', prodId);
            }
            const { data: existentes } = await queryExistente.limit(1);
            const prodExistente = existentes && existentes.length > 0 ? existentes[0] : null;

            let imagensFinais: string[] | null = null;
            try {
              const { uploadBlingImagesToSupabase } = await import('@/lib/upload-images');
              let imagensPermanentes: string[] | null = null;
              if (imagensBling.length > 0) {
                imagensPermanentes = await uploadBlingImagesToSupabase(imagensBling, prodId);
              }
              if (prodExistente?.origem === 'MANUAL') {
                imagensFinais = prodExistente.imagens;
              } else if (imagensPermanentes && imagensPermanentes.length > 0) {
                imagensFinais = imagensPermanentes;
              } else if (imagensBling && imagensBling.length > 0) {
                imagensFinais = imagensBling;
              }
            } catch (e: any) {
              console.error("Erro ao processar imagens:", e);
              imagensFinais = imagensBling.length > 0 ? imagensBling : null;
            }

            const finalSku = (prodCompleto.codigo || prodCompleto.gtin || sku || '').trim();
            if (!finalSku) {
              return { success: false, error: `O produto '${prodCompleto.nome || prodId}' não possui código SKU cadastrado no Bling. O SKU é obrigatório.` };
            }

            if (prodExistente) {
              const { error: updateErr } = await supabase.from('produtos').update({
                nome: prodCompleto.nome || undefined,
                preco: prodCompleto.preco,
                estoque: estoqueAtual,
                codigo_barras: finalSku,
                imagens: imagensFinais || prodExistente.imagens,
                ativo: prodCompleto.situacao === 'A'
              }).eq('id', prodExistente.id);

              if (updateErr) {
                return { success: false, error: `Erro ao atualizar no banco: ${updateErr.message}` };
              }

              return { success: true, id: prodExistente.id };
            } else {
              const baseSlug = (prodCompleto.nome || `produto-${prodId}`)
                .toLowerCase()
                .replace(/ /g, '-')
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9-]/g, "");
              const slug = `${baseSlug}-${prodId}`;

              const produtoParaInserir = {
                bling_id: prodId,
                codigo_barras: finalSku,
                nome: prodCompleto.nome || `Produto ${prodId}`,
                preco: prodCompleto.preco || 0,
                estoque: estoqueAtual,
                slug: slug,
                ativo: prodCompleto.situacao === 'A',
                peso_liquido: prodCompleto.pesoLiquido || 0,
                peso_bruto: prodCompleto.pesoBruto || 0,
                largura: prodCompleto.dimensoes?.largura || 0,
                altura: prodCompleto.dimensoes?.altura || 0,
                profundidade: prodCompleto.dimensoes?.profundidade || 0,
                marca: prodCompleto.marca || '',
                ncm: prodCompleto.tributacao?.ncm || '',
                descricao_curta: prodCompleto.descricaoCurta || '',
                imagens: imagensFinais,
                parent_id: parent_id
              };

              const { data: insertedData, error: insertErr } = await supabase.from('produtos').insert([produtoParaInserir]).select('id').single();
              if (insertErr) {
                if (insertErr.message.includes('duplicate key') || insertErr.code === '23505') {
                  const { data: retryExistente } = await supabase.from('produtos').select('id').or(`bling_id.eq.${prodId},codigo_barras.eq.${prodCompleto.codigo}`).limit(1);
                  if (retryExistente && retryExistente.length > 0) {
                    await supabase.from('produtos').update({
                      nome: prodCompleto.nome || undefined,
                      preco: prodCompleto.preco,
                      estoque: estoqueAtual,
                      imagens: imagensFinais || undefined,
                      ativo: prodCompleto.situacao === 'A'
                    }).eq('id', retryExistente[0].id);
                    return { success: true, id: retryExistente[0].id };
                  }
                }
                console.error("Insert error ao importar SKU:", insertErr);
                return { success: false, error: `Erro no banco Supabase: ${insertErr.message}` };
              }
              return { success: true, id: insertedData.id };
            }
          } catch (e: any) {
            return { success: false, error: e.message || 'Erro inesperado ao salvar produto.' };
          }
        }

        const parentResult = await fetchAndInsertBlingProduct(produtoBuscado, null);
        if (!parentResult.success) {
          redirectTo = makeUrl('erro', parentResult.error || 'Erro ao salvar produto importado do Bling.');
        } else {
          redirectTo = makeUrl('msg', `Produto para SKU ${sku} processado com sucesso!`);
        }
      }
    }
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Erro geral ao importar SKU:', error);
    redirectTo = makeUrl('erro', `Erro ao importar: ${encodeURIComponent(error.message)}`);
  }
  
  if (redirectTo) {
    redirect(redirectTo);
  }
}

export async function excluirProduto(id: string, currentParamsStr?: string) {
  const { error } = await supabase.from('produtos').delete().eq('id', id);
  const p = new URLSearchParams(currentParamsStr || '');
  if (error) {
    p.set('erro', `Erro ao excluir produto: ${error.message}`);
  } else {
    p.set('msg', 'Produto excluído com sucesso!');
  }
  revalidatePath('/admin/produtos');
  revalidatePath('/', 'layout');
  redirect(`/admin/produtos?${p.toString()}`);
}
