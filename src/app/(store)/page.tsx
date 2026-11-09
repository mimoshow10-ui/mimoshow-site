import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CountdownTimer from "@/components/CountdownTimer";
import BannerCarousel from "@/components/BannerCarousel";
import HomeCouponsBanner from "@/components/HomeCouponsBanner";
import ProductCard from "@/components/ProductCard";
import SafeComponent from "@/components/SafeComponent";
import BenefitsBar from "@/components/BenefitsBar";
import DesktopSideBanners from "@/components/DesktopSideBanners";
import QuemSomosSection from "@/components/QuemSomosSection";
import OfficialDistributorSection from "@/components/OfficialDistributorSection";
import QuickCategoryShortcuts from "@/components/QuickCategoryShortcuts";
import QuemConfiaSection from "@/components/QuemConfiaSection";

import { hasValidPhoto } from "@/lib/productFilter";
import { getOcultosVitrine } from "@/lib/vitrineManager";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function Home() {
  const ocultosVitrine = await getOcultosVitrine();

  const defaultBanners = [
    { url: '/banner-pet.jpg', link_url: '/categoria/pet' },
    { url: '/banner-kids.jpg', link_url: '/categoria/criancas' },
    { url: '/banner-decor.jpg', link_url: '/categoria/decoracao' }
  ];

  const { data: configs } = await supabase.from('configuracoes').select('*');
  const bannersConfig = configs?.find(c => c.chave === 'marketing_banners')?.valor;
  let banners: Array<{ url: string; link_url?: string }> = [];
  if (bannersConfig?.items && Array.isArray(bannersConfig.items) && bannersConfig.items.length > 0) {
    banners = bannersConfig.items;
  } else if (bannersConfig?.urls && Array.isArray(bannersConfig.urls) && bannersConfig.urls.length > 0) {
    banners = bannersConfig.urls.map((u: string) => ({ url: u, link_url: '' }));
  } else {
    banners = defaultBanners;
  }

  const cuponsConfig = configs?.find(c => c.chave === 'cupons_config')?.valor || { posicao_home: 'topo' };
  const posicaoCupons = cuponsConfig.posicao_home || 'topo';

  // Destaques da vitrine
  const destaquesConfig = configs?.find(c => c.chave === 'vitrine_destaques')?.valor || { mais_vendidos: [], novidades: [] };
  const idsNovidades: string[] = destaquesConfig.novidades || [];
  const idsMaisVendidos: string[] = destaquesConfig.mais_vendidos || [];

  const explicitIds = Array.from(new Set([...idsNovidades, ...idsMaisVendidos]));

  // Buscar produtos explicitamente selecionados por ID ou SKU
  let produtosEspecificos: any[] = [];
  if (explicitIds.length > 0) {
    const { data: specById } = await supabase
      .from('produtos')
      .select('*')
      .in('id', explicitIds)
      .eq('ativo', true);
    const { data: specBySku } = await supabase
      .from('produtos')
      .select('*')
      .in('codigo_barras', explicitIds)
      .eq('ativo', true);
    produtosEspecificos = [...(specById || []), ...(specBySku || [])];
  }

  // Puxar todos os produtos ativos na vitrine
  const { data: todosProdutos } = await supabase
    .from('produtos')
    .select('*')
    .eq('ativo', true)
    .order('criado_em', { ascending: false });

  // Buscar todos os produtos em promoção
  const { data: superPromocoes } = await supabase
    .from('produtos')
    .select('*')
    .or('destaque_super_promocao.eq.true,and(preco_promocional.not.is.null,preco_promocional.gt.0)')
    .eq('ativo', true)
    .order('criado_em', { ascending: false });

  const produtos = (todosProdutos || []).filter(p => !ocultosVitrine.has(String(p.id)));
  const produtosComFoto = produtos.filter(hasValidPhoto);

  // Apenas produtos com promoção explicitamente válida
  const agora = Date.now();
  const produtosPromocao = (superPromocoes || []).filter((prod) => {
    if (!hasValidPhoto(prod)) return false;
    if (ocultosVitrine.has(String(prod.id))) return false;
    if (prod.estoque !== null && prod.estoque !== undefined && Number(prod.estoque) <= 0) return false;
    
    if (prod.promocao_inicio_em) {
      const inicio = new Date(prod.promocao_inicio_em).getTime();
      if (!isNaN(inicio) && inicio > agora) return false;
    }

    if (prod.promocao_expira_em) {
      const expira = new Date(prod.promocao_expira_em).getTime();
      if (isNaN(expira) || expira <= agora) return false;
    }

    return true;
  });

  // Mapeador de produtos por ID e SKU
  const prodMap = new Map<string, any>();
  produtos.forEach(p => {
    prodMap.set(p.id, p);
    if (p.sku) prodMap.set(p.sku, p);
  });
  produtosEspecificos.forEach(p => {
    prodMap.set(p.id, p);
    if (p.sku) prodMap.set(p.sku, p);
  });

  // Novidades
  let produtosNovidades = idsNovidades
    .map(id => prodMap.get(id))
    .filter(hasValidPhoto);

  if (produtosNovidades.length === 0) {
    produtosNovidades = produtosComFoto.slice(0, 12);
  }

  // Mais Vendidos
  let produtosMaisVendidos = idsMaisVendidos
    .map(id => prodMap.get(id))
    .filter(hasValidPhoto);

  if (produtosMaisVendidos.length === 0) {
    produtosMaisVendidos = produtosComFoto.slice(12, 24);
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* BANNERS LATERAIS PARA COMPUTADOR */}
      <DesktopSideBanners 
        produtosPromocao={produtosPromocao.length > 0 ? produtosPromocao : (produtosNovidades.length > 0 ? produtosNovidades : produtosMaisVendidos)} 
      />

      {/* 1. FAIXA DE CUPONS NO TOPO */}
      {posicaoCupons === 'topo' && <HomeCouponsBanner />}

      {/* CONTAINER PRINCIPAL DO TOPO */}
      <div className="max-w-7xl xl:max-w-5xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 w-full">
        {/* CARROSSEL DE BANNERS */}
        <section className="w-full rounded-2xl overflow-hidden shadow-xs">
          <BannerCarousel banners={banners} />
        </section>
      </div>

      {/* 2. FAIXA DE CUPONS LOGO ABAIXO DO BANNER */}
      {posicaoCupons === 'abaixo_banner' && <HomeCouponsBanner />}

      {/* BARRA DE BENEFÍCIOS E DIFERENCIAIS INDUSTRIAIS */}
      <BenefitsBar />

      {/* 3. FAIXA DE CUPONS ABAIXO DOS BENEFÍCIOS */}
      {posicaoCupons === 'abaixo_beneficios' && <HomeCouponsBanner />}

      {/* SEÇÃO PRINCIPAL DE VITRINE DA LOJA */}
      <div className="max-w-7xl xl:max-w-5xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 w-full">
        
        {/* 4. ATALHOS VISUAIS PARA CATEGORIAS CHAVE */}
        <QuickCategoryShortcuts />

        {/* 5. FAIXA DE CUPONS ACIMA DAS OFERTAS */}
        {posicaoCupons === 'acima_ofertas' && <HomeCouponsBanner />}

        {/* 6. SUPER PROMOÇÃO (QUANDO ATIVA E PERTINENTE) */}
        {produtosPromocao.length > 0 && (
          <section className="py-8 px-6 bg-red-50/60 rounded-3xl border border-red-100 shadow-xs">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-heading font-black text-red-600 uppercase tracking-tight flex items-center gap-2">
                  🔥 Super Ofertas por Tempo Limitado
                </h2>
                <p className="text-red-500 font-bold text-xs md:text-sm mt-0.5">Ofertas exclusivas com preço de fábrica!</p>
              </div>
              <Link href="/categoria/todas" className="text-red-600 font-bold hover:underline text-xs md:text-sm hidden md:block">
                Ver todas as ofertas &rarr;
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {produtosPromocao.map((prod) => (
                <SafeComponent key={`promo-${prod.id}`}>
                  <ProductCard produto={prod} />
                </SafeComponent>
              ))}
            </div>
          </section>
        )}

        {/* 7. MAIS VENDIDOS */}
        {produtosMaisVendidos.length > 0 && (
          <section className="py-8 px-6 bg-amber-50/60 rounded-3xl border border-amber-100 shadow-xs">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-heading font-black text-amber-900 uppercase tracking-tight flex items-center gap-2">
                  ⭐ Os Mais Vendidos para Pet Shop
                </h2>
                <p className="text-amber-700 font-bold text-xs md:text-sm mt-0.5">Os queridinhos dos profissionais de banho e tosa em todo o Brasil!</p>
              </div>
              <Link href="/busca?q=kit" className="text-amber-800 font-bold hover:underline text-xs md:text-sm hidden md:block">
                Ver mais kits populares &rarr;
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {produtosMaisVendidos.map((prod) => (
                <SafeComponent key={`best-${prod.id}`}>
                  <ProductCard produto={prod} />
                </SafeComponent>
              ))}
            </div>
          </section>
        )}

        {/* 8. NOVIDADES E LANÇAMENTOS */}
        <section className="py-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-secondary flex items-center gap-2">
                🆕 Lançamentos Recentes
              </h2>
              <p className="text-gray-500 text-xs md:text-sm mt-0.5">Novidades e modelos recém-saídos da linha de produção</p>
            </div>
            <Link href="/busca?ordem=mais_recentes" className="text-primary font-bold hover:underline text-xs md:text-sm hidden md:block">
              Ver todos os lançamentos &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {produtosNovidades && produtosNovidades.length > 0 ? (
              produtosNovidades.map((prod) => (
                <SafeComponent key={prod.id}>
                  <ProductCard produto={prod} />
                </SafeComponent>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <p className="text-base font-bold mb-1">Catálogo em atualização!</p>
                <p className="text-xs text-gray-400">Novos produtos estão sendo carregados.</p>
              </div>
            )}
          </div>
        </section>

        {/* 9. DISTRIBUIDORES E ATACADISTAS PARCEIROS (DEPOIS DOS PRODUTOS) */}
        <QuemConfiaSection />

        {/* 10. FABRICANTE OFICIAL MIMO SHOW - POSICIONAMENTO DA INDÚSTRIA */}
        <OfficialDistributorSection />

      </div>
    </div>
  );
}
