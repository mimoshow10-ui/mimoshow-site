import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CountdownTimer from "@/components/CountdownTimer";
import BannerCarousel from "@/components/BannerCarousel";
import HomeCouponsBanner from "@/components/HomeCouponsBanner";
import ProductCard from "@/components/ProductCard";
import BenefitsBar from "@/components/BenefitsBar";
import DesktopSideBanners from "@/components/DesktopSideBanners";
import OfficialDistributorSection from "@/components/OfficialDistributorSection";

import { hasValidPhoto } from "@/lib/productFilter";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function Home() {
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
  const novidadesSet = new Set(idsNovidades);
  const maisVendidosSet = new Set(idsMaisVendidos);

  const explicitIds = Array.from(new Set([...idsNovidades, ...idsMaisVendidos]));

  // Buscar produtos explicitamente selecionados por ID ou SKU para garantir exibicao imediata
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
      .in('sku', explicitIds)
      .eq('ativo', true);
    produtosEspecificos = [...(specById || []), ...(specBySku || [])];
  }

  // Puxar todos os produtos ativos na vitrine
  const { data: todosProdutos } = await supabase
    .from('produtos')
    .select('*')
    .eq('ativo', true)
    .order('criado_em', { ascending: false });

  // Buscar todos os produtos em promoção (destaque super promoção ou com preço promocional ativo)
  const { data: superPromocoes } = await supabase
    .from('produtos')
    .select('*')
    .or('destaque_super_promocao.eq.true,and(preco_promocional.not.is.null,preco_promocional.gt.0)')
    .eq('ativo', true)
    .order('criado_em', { ascending: false });

  const produtos = (todosProdutos || []).filter(p => !ocultosVitrine.has(String(p.id)));
  const produtosComFoto = produtos;

  // Apenas produtos com PROMOCAO EXPLICITAMENTE MARCADA E DENTRO DO PERIODO
  const agora = Date.now();
  const produtosPromocao = (superPromocoes || []).filter((prod) => {
    if (ocultosVitrine.has(String(prod.id))) return false;
    if (prod.estoque !== null && prod.estoque !== undefined && Number(prod.estoque) <= 0) return false;
    
    // Checagem do Inicio da Promocao (se cadastrado)
    if (prod.promocao_inicio_em) {
      const inicio = new Date(prod.promocao_inicio_em).getTime();
      if (!isNaN(inicio) && inicio > agora) return false;
    }

    // Checagem de Validade / Fim da Promocao (se cadastrado)
    if (prod.promocao_expira_em) {
      const expira = new Date(prod.promocao_expira_em).getTime();
      if (isNaN(expira) || expira <= agora) return false;
    }

    return true;
  });

  // Mapeador de produtos por ID e SKU para manter a ordem exata escolhida pelo usuario no Admin
  const prodMap = new Map<string, any>();
  produtos.forEach(p => {
    prodMap.set(p.id, p);
    if (p.sku) prodMap.set(p.sku, p);
  });
  produtosEspecificos.forEach(p => {
    prodMap.set(p.id, p);
    if (p.sku) prodMap.set(p.sku, p);
  });

  // Novidades: APENAS produtos com foto valida
  let produtosNovidades = idsNovidades
    .map(id => prodMap.get(id))
    .filter(hasValidPhoto);

  if (produtosNovidades.length === 0) {
    produtosNovidades = produtosComFoto.slice(0, 12);
  }

  // Mais Vendidos: APENAS produtos com foto valida
  let produtosMaisVendidos = idsMaisVendidos
    .map(id => prodMap.get(id))
    .filter(hasValidPhoto);

  if (produtosMaisVendidos.length === 0) {
    produtosMaisVendidos = produtosComFoto.slice(12, 24);
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* BANNERS LATERAIS PARA COMPUTADOR (DISTRIBUIDOR OFICIAL NA DIREITA + OFERTAS ROTATIVAS 3S NA ESQUERDA) */}
      <DesktopSideBanners 
        produtosPromocao={produtosPromocao.length > 0 ? produtosPromocao : (produtosNovidades.length > 0 ? produtosNovidades : produtosMaisVendidos)} 
      />

      {/* 1. FAIXA DE CUPONS NO TOPO */}
      {posicaoCupons === 'topo' && <HomeCouponsBanner />}

      {/* BANNER PRINCIPAL COM CARROSEL (FOTOS DOS ANIMAIS NO TAMANHO ORIGINAL) */}
      <section className="w-full">
        <BannerCarousel banners={banners} />
      </section>

      {/* 2. FAIXA DE CUPONS LOGO ABAIXO DO BANNER */}
      {posicaoCupons === 'abaixo_banner' && <HomeCouponsBanner />}

      {/* BARRA DE BENEFÍCIOS E DIFERENCIAIS */}
      <BenefitsBar />

      {/* 3. FAIXA DE CUPONS ABAIXO DOS BENEFÍCIOS */}
      {posicaoCupons === 'abaixo_beneficios' && <HomeCouponsBanner />}

      {/* SEÇÃO PRINCIPAL DE VITRINE DA LOJA */}
      <div className="max-w-7xl xl:max-w-5xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 w-full">
        
        {/* 4. FAIXA DE CUPONS ACIMA DAS OFERTAS */}
        {posicaoCupons === 'acima_ofertas' && <HomeCouponsBanner />}

        {/* 1. Super Promoção do Dia (APENAS DENTRO DO PERÍODO) */}
        {produtosPromocao.length > 0 && (
          <section className="py-8 px-6 bg-red-50/60 rounded-3xl border border-red-100 shadow-xs">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-heading font-black text-red-600 uppercase tracking-tight flex items-center gap-2">
                  🔥 Super Ofertas por Tempo Limitado
                </h2>
                <p className="text-red-500 font-bold text-xs md:text-sm mt-0.5">Ofertas exclusivas no período promocional!</p>
              </div>
              <Link href="/categoria/todas" className="text-red-600 font-bold hover:underline text-xs md:text-sm hidden md:block">
                Ver todas as ofertas &rarr;
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {produtosPromocao.map((prod) => (
                <ProductCard key={`promo-${prod.id}`} produto={prod} />
              ))}
            </div>
          </section>
        )}

        {/* 2. Mais Vendidos */}
        {produtosMaisVendidos.length > 0 && (
          <section className="py-8 px-6 bg-amber-50/60 rounded-3xl border border-amber-100 shadow-xs">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-heading font-black text-amber-900 uppercase tracking-tight flex items-center gap-2">
                  ⭐ Os Mais Vendidos
                </h2>
                <p className="text-amber-700 font-bold text-xs md:text-sm mt-0.5">Os queridinhos dos nossos clientes pet shop!</p>
              </div>
              <Link href="/categoria/todas" className="text-amber-800 font-bold hover:underline text-xs md:text-sm hidden md:block">
                Ver todos os mais vendidos &rarr;
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {produtosMaisVendidos.map((prod) => (
                <ProductCard key={`best-${prod.id}`} produto={prod} />
              ))}
            </div>
          </section>
        )}

        {/* 3. Nossas Novidades */}
        <section className="py-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-secondary flex items-center gap-2">
                🆕 Nossas Novidades
              </h2>
              <p className="text-gray-500 text-xs md:text-sm mt-0.5">Últimos lançamentos adicionados ao catálogo</p>
            </div>
            <Link href="/categoria/todas" className="text-primary font-bold hover:underline text-xs md:text-sm hidden md:block">
              Ver todos os lançamentos &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {produtosNovidades && produtosNovidades.length > 0 ? (
              produtosNovidades.map((prod) => (
                <ProductCard key={prod.id} produto={prod} />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <p className="text-base font-bold mb-1">A vitrine está vazia!</p>
                <p className="text-xs text-gray-400">Os produtos cadastrados no Painel Admin aparecerão aqui.</p>
              </div>
            )}
          </div>
        </section>

        {/* DISTRIBUIDOR OFICIAL MIMOSHOW - SEÇÃO COMPACTA ABAIXO DE TODOS OS PRODUTOS */}
        <OfficialDistributorSection />

      </div>
    </div>
  );
}
