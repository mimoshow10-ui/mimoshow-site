import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getFamilyConfig } from '@/lib/familyManager';
import { ordenarProdutosPorQuantidade } from '@/lib/quantityExtractor';
import CountdownTimer from '@/components/CountdownTimer';
import VariationSelector from '@/components/VariationSelector';
import FreteCalculator from '@/components/FreteCalculator';
import ProductMediaGallery from '@/components/ProductMediaGallery';
import { extractImageUrls } from '@/lib/imageExtractor';
import ProductAiAssistant from '@/components/ProductAiAssistant';
import ProductCouponsBanner from '@/components/ProductCouponsBanner';
import AddToCartButtons from '@/components/AddToCartButtons';
import SafeComponent from '@/components/SafeComponent';
import { notFound } from 'next/navigation';
import { hasValidPhoto } from '@/lib/productFilter';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function buscarProdutoMultiEstagio(slugOrQuery: string) {
  const raw = decodeURIComponent(slugOrQuery || '').trim();
  if (!raw) return null;

  try {
    // 1. Busca exata por slug
    const { data: pSlug } = await supabase.from('produtos').select('*').eq('slug', raw).maybeSingle();
    if (pSlug) return pSlug;

    // 2. Busca exata por ID
    const { data: pId } = await supabase.from('produtos').select('*').eq('id', raw).maybeSingle();
    if (pId) return pId;

    // 3. Busca exata por código de barras ou SKU (campo codigo_barras)
    const { data: pBarra } = await supabase.from('produtos').select('*').eq('codigo_barras', raw).maybeSingle();
    if (pBarra) return pBarra;
  } catch (err) {
    console.error('[PRODUTO LOOKUP] Erro no buscarProdutoMultiEstagio:', err);
  }

  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const produto = await buscarProdutoMultiEstagio(slug);

    if (!produto) return { title: 'Produto não encontrado | MIMO Show' };

    const title = String(produto.seo_title || `${produto.nome || 'Produto'} | MIMO Show`).slice(0, 70);
    const rawDesc = String(produto.seo_description || produto.descricao_curta || `Compre ${produto.nome || 'produtos'} no MIMO Show!`);
    const description = rawDesc.replace(/<[^>]*>?/gm, '').replace(/[\r\n]+/g, ' ').slice(0, 160).trim();

    let imagem = '/logo-mimoshow.png';
    try {
      const fotos = extractImageUrls(produto.imagens);
      if (fotos.length > 0) imagem = fotos[0];
    } catch {}

    return {
      title,
      description,
      openGraph: { title, description, images: [imagem], type: 'website' },
      twitter: { card: 'summary_large_image', title, description, images: [imagem] }
    };
  } catch {
    return { title: 'MIMO Show' };
  }
}

export default async function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const rawProduto = await buscarProdutoMultiEstagio(slug);

  // Regra Estrita: produto SÓ aparece na tela de vendas se tiver foto
  if (!rawProduto || !hasValidPhoto(rawProduto)) notFound();

  // O produto ativo é exatamente o produto individual clicado pelo cliente
  const produto = { ...rawProduto };

  // Buscar família de variações permanente completa
  let family: any[] = [];
  let customOrderIds: string[] | undefined = undefined;
  try {
    const familyConfig = await getFamilyConfig();
    const famId = familyConfig.productToFamilyMap[rawProduto.id];
    const familyData = famId ? familyConfig.familias[famId] : null;

    let memberIds: string[] = [];
    if (familyData && Array.isArray(familyData.members) && familyData.members.length > 0) {
      memberIds = familyData.members;
    } else {
      memberIds = [rawProduto.id];
    }

    const { data: familyDataRaw } = await supabase
      .from('produtos')
      .select('id, nome, slug, imagens, preco, preco_promocional, estoque, ativo')
      .in('id', memberIds)
      .eq('ativo', true);

    if (familyDataRaw && familyDataRaw.length > 0) {
      const familyComFoto = familyDataRaw.filter(hasValidPhoto);
      family = ordenarProdutosPorQuantidade(familyComFoto);
      customOrderIds = family.map(p => p.id);
    }
  } catch (errFam) {
    console.error('[PRODUTO STOREFRONT] Erro ao carregar família:', errFam);
  }

  const temVariacoes = Array.isArray(family) && family.length > 1;
  const preco = Number(produto.preco || 0);
  const agora = Date.now();
  const expiraTime = produto.promocao_expira_em ? new Date(produto.promocao_expira_em).getTime() : null;
  const promoExpirada = expiraTime !== null && (isNaN(expiraTime) || expiraTime <= agora);

  const precoPromoVal = produto.preco_promocional ? Number(produto.preco_promocional) : null;
  const promoValida = precoPromoVal !== null && !isNaN(precoPromoVal) && precoPromoVal < preco && !promoExpirada;
  const precoPromo = promoValida ? precoPromoVal : null;
  const precoAtual = precoPromo ? precoPromo : preco;
  const parcelas = 3;
  const valorParcela = precoAtual / parcelas;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">

      {/* ── Bloco principal: Foto | Info ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">

        {/* COLUNA ESQUERDA — Galeria de fotos e vídeo */}
        <SafeComponent>
          <ProductMediaGallery
            imagens={produto.imagens || []}
            videoUrl={produto.video_url}
            nome={produto.nome || 'Produto'}
            sku={produto.codigo_barras || produto.sku}
          />
        </SafeComponent>

        {/* COLUNA DIREITA — Nome, preço, variações, botões, frete */}
        <div className="flex flex-col gap-4">

          {/* Nome */}
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-secondary leading-tight">
            {produto.nome || 'Produto'}
          </h1>

          {/* Preço */}
          <div className="flex items-end gap-3">
            {precoPromo ? (
              <>
                <span className="text-lg text-gray-400 line-through">R$ {preco.toFixed(2).replace('.', ',')}</span>
                <span className="text-4xl font-black text-primary">R$ {precoPromo.toFixed(2).replace('.', ',')}</span>
              </>
            ) : (
              <span className="text-4xl font-black text-primary block">R$ {preco.toFixed(2).replace('.', ',')}</span>
            )}
            <div className="text-sm md:text-base font-semibold text-emerald-500 mt-1">
              em {parcelas}x R$ {valorParcela.toFixed(2).replace('.', ',')} sem juros
            </div>
            {promoValida && produto.promocao_expira_em && (
              <div className="ml-2">
                <SafeComponent>
                  <CountdownTimer targetDate={produto.promocao_expira_em} />
                </SafeComponent>
              </div>
            )}
          </div>

          {/* Variações da Família */}
          {temVariacoes && (
            <SafeComponent>
              <div>
                <p className="text-sm font-bold text-gray-500 mb-2">Escolha uma opção:</p>
                <VariationSelector currentSlug={rawProduto.slug} family={family || []} customOrderIds={customOrderIds} />
              </div>
            </SafeComponent>
          )}

          {/* Tamanhos (se houver) */}
          {Array.isArray(produto.tamanhos) && produto.tamanhos.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-500 mb-2">Tamanho:</p>
              <div className="flex gap-2 flex-wrap">
                {produto.tamanhos.map((tam: string) => (
                  <button key={tam} className="px-4 py-2 rounded-lg border-2 border-border font-bold text-secondary hover:border-primary transition text-sm">
                    {tam}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Botões de compra interativos de e-commerce */}
          <SafeComponent>
            <AddToCartButtons produto={produto} />
          </SafeComponent>

          {/* Cupons da Loja Disponíveis (Shopee Style) */}
          <SafeComponent>
            <ProductCouponsBanner
              produtoId={produto.id}
              categoriaId={produto.categoria_id}
              sku={produto.codigo_barras}
            />
          </SafeComponent>

          {/* Calculadora de Frete por CEP */}
          <SafeComponent>
            <FreteCalculator />
          </SafeComponent>

          {/* Campo Pergunte sobre este Produto (IA Assistente) */}
          <SafeComponent>
            <ProductAiAssistant produto={produto} />
          </SafeComponent>

          {/* Estoque */}
          {Number(produto.estoque) > 0 && Number(produto.estoque) < 20 && (
            <p className="text-orange-600 font-bold text-sm">⚠️ Apenas {produto.estoque} em estoque!</p>
          )}
        </div>
      </div>

      {/* ── Descrição completa abaixo ── */}
      {(produto.descricao_curta || produto.descricao) && (
        <div className="border-t border-border pt-10">
          <h2 className="text-2xl font-heading font-bold text-secondary mb-6">Descrição do Produto</h2>
          <div
            className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: String(produto.descricao_curta || produto.descricao || '') }}
          />
        </div>
      )}

    </div>
  );
}
