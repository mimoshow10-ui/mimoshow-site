import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { skus, textoCsv } = body;

    let listaSkus: string[] = [];

    if (Array.isArray(skus)) {
      listaSkus = skus;
    } else if (typeof skus === 'string') {
      listaSkus = skus.split(/[\r\n,;\t]+/);
    } else if (typeof textoCsv === 'string') {
      listaSkus = textoCsv.split(/[\r\n,;\t]+/);
    }

    const skusLimpos = Array.from(
      new Set(listaSkus.map(s => String(s).trim()).filter(Boolean))
    );

    if (skusLimpos.length === 0) {
      return NextResponse.json({ erro: 'Nenhum SKU válido fornecido para importação.' }, { status: 400 });
    }

    const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
    const token = cfg?.valor?.access_token;

    if (!token) {
      return NextResponse.json({ erro: 'Token do Bling não configurado no sistema.' }, { status: 401 });
    }

    const resultados: any[] = [];

    for (const rawSku of skusLimpos) {
      const sku = String(rawSku).trim();
      if (!sku) continue;

      try {
        let response = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(sku)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let data = await response.json();

        // Se não encontrar por codigo exato, tenta por pesquisa
        if (!data.data || data.data.length === 0) {
          const fallbackRes = await fetch(`https://api.bling.com.br/Api/v3/produtos?pagina=1&limite=50&pesquisa=${encodeURIComponent(sku)}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const fallbackData = await fallbackRes.json();
          if (fallbackData?.data && fallbackData.data.length > 0) {
            data = fallbackData;
          }
        }

        if (response.status === 401 || data?.error?.type === 'invalid_token') {
          resultados.push({ sku, status: 'erro', mensagem: 'Token do Bling expirado' });
          break;
        }

        if (!data.data || data.data.length === 0) {
          resultados.push({ sku, status: 'erro', mensagem: 'Produto não encontrado no Bling' });
          continue;
        }

        const produtoBuscado = data.data.find(
          (p: any) =>
            (p.codigo && p.codigo.trim().toLowerCase() === sku.toLowerCase()) ||
            String(p.id) === sku
        );

        if (!produtoBuscado) {
          resultados.push({ sku, status: 'erro', mensagem: `Nenhum produto correspondente a '${sku}'` });
          continue;
        }

        const prodId = String(produtoBuscado.id);
        const detalhesReq = await fetch(`https://api.bling.com.br/Api/v3/produtos/${prodId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const detalhesJson = await detalhesReq.json();
        const prodCompleto = detalhesJson.data || produtoBuscado;

        let estoqueAtual = 0;
        try {
          const estoqueReq = await fetch(`https://api.bling.com.br/Api/v3/estoques/saldos?idsProdutos[]=${prodId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const estoqueJson = await estoqueReq.json();
          estoqueAtual = estoqueJson.data?.[0]?.saldoFisicoTotal || 0;
        } catch {}

        let imagensBling: string[] = [];
        const ext = prodCompleto.midia?.imagens?.externas?.map((img: any) => img.link) || [];
        const int = prodCompleto.midia?.imagens?.internas?.map((img: any) => img.link) || [];
        imagensBling = [...ext, ...int].filter(Boolean);

        if (imagensBling.length === 0 && Array.isArray(prodCompleto.midia)) {
          imagensBling = prodCompleto.midia.map((m: any) => m.url || m.link).filter(Boolean);
        }

        if (imagensBling.length === 0 && prodCompleto.imagemURL) {
          imagensBling = [prodCompleto.imagemURL];
        }

        const { uploadBlingImagesToSupabase } = await import('@/lib/upload-images');
        let imagensPermanentes: string[] | null = null;
        if (imagensBling.length > 0) {
          imagensPermanentes = await uploadBlingImagesToSupabase(imagensBling, String(prodCompleto.id));
        }

        const imagensFinais = (imagensPermanentes && imagensPermanentes.length > 0)
          ? imagensPermanentes
          : (imagensBling && imagensBling.length > 0)
            ? imagensBling
            : null;

        const finalSku = (prodCompleto.codigo || prodCompleto.gtin || sku || '').trim();
        if (!finalSku) {
          resultados.push({ sku: sku || String(prodCompleto.id), status: 'erro', mensagem: 'Produto sem SKU no Bling. O SKU é obrigatório para cadastrar produtos.' });
          continue;
        }

        const { data: prodExistente } = await supabase.from('produtos').select('id, imagens').eq('bling_id', prodId).maybeSingle();

        if (prodExistente) {
          await supabase.from('produtos').update({
            preco: prodCompleto.preco,
            estoque: estoqueAtual,
            codigo_barras: finalSku,
            imagens: imagensFinais || prodExistente.imagens
          }).eq('id', prodExistente.id);

          resultados.push({ sku: finalSku, status: 'sucesso', nome: prodCompleto.nome });
        } else {
          const baseSlug = prodCompleto.nome.toLowerCase().replace(/ /g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const slug = `${baseSlug}-${prodCompleto.id}`;

          const payload = {
            bling_id: prodId,
            codigo_barras: finalSku,
            nome: prodCompleto.nome,
            preco: prodCompleto.preco,
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
          };

          const { data: inserted, error } = await supabase
            .from('produtos')
            .insert([payload])
            .select('id, nome, codigo_barras')
            .single();

          if (error) {
            resultados.push({ sku: finalSku, status: 'erro', mensagem: error.message });
          } else {
            resultados.push({ sku: inserted.codigo_barras || finalSku, status: 'sucesso', nome: inserted.nome });
          }
        }
      } catch (err: any) {
        resultados.push({ sku, status: 'erro', mensagem: err.message || 'Erro ao processar' });
      }
    }

    const sucessos = resultados.filter(r => r.status === 'sucesso').length;
    const erros = resultados.filter(r => r.status === 'erro').length;

    return NextResponse.json({
      total: resultados.length,
      sucessos,
      erros,
      resultados
    });
  } catch (err: any) {
    return NextResponse.json({ erro: err.message || 'Erro interno na importação.' }, { status: 500 });
  }
}
