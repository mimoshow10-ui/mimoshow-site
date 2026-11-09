import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getFamilyConfig } from '@/lib/familyManager';
import { ordenarProdutosPorQuantidade, calcularPrecoUnitario } from '@/lib/quantityExtractor';
import CountdownTimer from '@/components/CountdownTimer';
import VariationSelector from '@/components/VariationSelector';
import FreteCalculator from '@/components/FreteCalculator';
import ProductMediaGallery from '@/components/ProductMediaGallery';
import ProductCard from '@/components/ProductCard';
import { extractImageUrls } from '@/lib/imageExtractor';
import ProductAiAssistant from '@/components/ProductAiAssistant';
import ProductCouponsBanner from '@/components/ProductCouponsBanner';
import AddToCartButtons from '@/components/AddToCartButtons';
import SafeComponent from '@/components/SafeComponent';
import { notFound } from 'next/navigation';
import { hasValidPhoto } from '@/lib/productFilter';
import { Sparkles, Tag, ShieldCheck, Factory } from 'lucide-react';
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

    // 3. Busca exata por código de barras ou SKU
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

  // Cálculo de economia por unidade no kit
  const infoUnitario = calcularPrecoUnitario(produto.nome || '', precoAtual);

  // Buscar produtos complementares (da mesma categoria ou ativos com foto)
  let complementares: any[] = [];
  try {
    let queryComp = supabase
      .from('produtos')
      .select('id, nome, slug, preco, preco_promocional, imagens, ativo')
      .eq('ativo', true)
      .neq('id', produto.id)
      .limit(8);

    if (produto.categoria_id) {
      queryComp = queryComp.eq('categoria_id', produto.categoria_id);
    }

    const { data: compData } = await queryComp;
    if (compData && compData.length > 0) {
      complementares = compData.filter(hasValidPhoto).slice(0, 4);
    }
  } catch (e) {
    console.warn('[PRODUTOS COMPLEMENTARES]', e);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-10 space-y-10">

      {/* ── Bloco principal: Foto e Descrição | Info e Compra ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-start">

        {/* COLUNA ESQUERDA — Galeria de fotos e vídeo + Descrição do Produto */}
        <div className="flex flex-col gap-6">
          <SafeComponent>
            <ProductMediaGallery
              imagens={produto.imagens || []}
              videoUrl={produto.video_url}
              nome={produto.nome || 'Produto'}
              sku={produto.codigo_barras || produto.sku}
            />
          </SafeComponent>

          {/* ── Descrição do Produto (começa abaixo da foto) ── */}
          <div className="bg-white p-5 sm:p-7 rounded-3xl border border-gray-200/90 shadow-xs space-y-4">
            {/* Frase solicitada pelo cliente: Aqui você compra direto da fábrica. */}
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-white font-black text-base sm:text-lg px-4 py-3 rounded-2xl flex items-center gap-3 shadow-xs">
              <Factory className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-white" />
              <span className="tracking-tight">Aqui você compra direto da fábrica.</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-heading font-black text-secondary pt-1">
              Especificações & Descrição do Produto
            </h2>

            <div
              className="text-gray-700 leading-relaxed text-sm prose prose-sm max-w-none break-words"
              dangerouslySetInnerHTML={{
                __html: String(produto.descricao_curta || produto.descricao || "Produto oficial Mimo Show com garantia de qualidade, produção própria e pronta entrega para banho e tosa.").replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, "$1<br />$2")
              }}
            />
          </div>
        </div>

        {/* COLUNA DIREITA — Nome, preço, economia unitária, variações, botões, frete */}
        <div className="flex flex-col gap-4 md:sticky md:top-24 md:self-start">

          {/* Selo de Fabricação Própria */}
          <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-900 border border-orange-200 text-[11px] font-black uppercase px-2.5 py-1 rounded-full w-fit">
            <Factory size={13} className="text-primary" />
            <span>Fabricação Própria Mimo Show — Direto da Fábrica</span>
          </div>

          {/* Nome */}
          <h1 className="text-2xl md:text-3xl font-heading font-black text-secondary leading-tight">
            {produto.nome || 'Produto'}
          </h1>

          {/* Preço e Economia por Unidade */}
          <div className="space-y-1 bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80">
            <div className="flex items-end gap-3 flex-wrap">
              {precoPromo ? (
                <>
                  <span className="text-base text-gray-400 line-through">R$ {preco.toFixed(2).replace('.', ',')}</span>
                  <span className="text-3xl md:text-4xl font-black text-primary">R$ {precoPromo.toFixed(2).replace('.', ',')}</span>
                </>
              ) : (
                <span className="text-3xl md:text-4xl font-black text-primary block">R$ {preco.toFixed(2).replace('.', ',')}</span>
              )}
              {promoValida && produto.promocao_expira_em && (
                <div className="ml-2">
                  <SafeComponent>
                    <CountdownTimer targetDate={produto.promocao_expira_em} />
                  </SafeComponent>
                </div>
              )}
            </div>

            {/* Destaque de Economia Real por Unidade no Kit */}
            {infoUnitario && infoUnitario.quantidade > 1 && (
              <div className="pt-1.5 flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <Tag size={14} className="text-emerald-600" />
                <span>
                  Apenas <strong>{infoUnitario.textoFormatado}</strong> por unidade no kit ({infoUnitario.quantidade} un)
                </span>
              </div>
            )}

            {/* Parcelamento */}
            <div className="text-xs md:text-sm font-semibold text-emerald-700 pt-1">
              💳 em até <strong>{parcelas}x de R$ {valorParcela.toFixed(2).replace('.', ',')}</strong> sem juros no cartão
            </div>
          </div>

          {/* Variações da Família */}
          {temVariacoes && (
            <SafeComponent>
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <p className="text-xs font-black uppercase text-gray-600 mb-2 tracking-wider">
                  Escolha a quantidade ou kit desejado:
                </p>
                <VariationSelector currentSlug={rawProduto.slug} family={family || []} customOrderIds={customOrderIds} />
              </div>
            </SafeComponent>
          )}

          {/* Tamanhos (se houver) */}
          {Array.isArray(produto.tamanhos) && produto.tamanhos.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1">Tamanho:</p>
              <div className="flex gap-2 flex-wrap">
                {produto.tamanhos.map((tam: string) => (
                  <button key={tam} className="px-3 py-1.5 rounded-lg border-2 border-border font-bold text-secondary hover:border-primary transition text-xs">
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

          {/* Cupons da Loja Disponíveis */}
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
            <p className="text-orange-600 font-bold text-xs">⚠️ Restam apenas {produto.estoque} kits em estoque!</p>
          )}
        </div>
      </div>

      {/* ── SEÇÃO: PRODUTOS COMPLEMENTARES (COMPRE JUNTO) ── */}
      {complementares.length > 0 && (
        <div className="border-t border-border pt-10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase text-primary tracking-wider block">
                Complete seu Estoque
              </span>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-secondary">
                Quem comprou este kit também levou
              </h2>
            </div>
            <Link href="/" className="text-xs font-bold text-secondary hover:text-primary transition underline">
              Ver mais na loja
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {complementares.map((comp) => (
              <SafeComponent key={comp.id}>
                <ProductCard produto={comp} />
              </SafeComponent>
            ))}
          </div>
        </div>
      )}

      {/* ── Schema.org Structured Data (Google Rich Snippets) ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: produto.nome,
            image: extractImageUrls(produto.imagens),
            description: produto.descricao_curta || produto.descricao || produto.nome,
            sku: produto.codigo_barras || produto.sku || produto.id,
            brand: {
              '@type': 'Brand',
              name: 'Mimo Show',
            },
            offers: {
              '@type': 'Offer',
              url: `https://www.mimoshow.com.br/produto/${produto.slug}`,
              priceCurrency: 'BRL',
              price: precoAtual,
              availability: Number(produto.estoque ?? 1) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              seller: {
                '@type': 'Organization',
                name: 'Mimo Show',
              },
            },
          }),
        }}
      />

    </div>
  );
}
