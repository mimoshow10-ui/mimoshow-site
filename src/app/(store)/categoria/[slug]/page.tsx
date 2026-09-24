import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import { notFound } from 'next/navigation';
import { hasValidPhoto } from '@/lib/productFilter';
import { getOcultosVitrine } from '@/lib/vitrineManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: catAtual } = await supabase
    .from('categorias')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!catAtual && slug !== 'todas') {
    return notFound();
  }

  let produtos: any[] = [];
  let subgrupos: any[] = [];
  let grupoPai: any = null;

  const PROD_FIELDS = 'id, nome, slug, preco, preco_promocional, promocao_expira_em, imagens, codigo_barras, ativo, categoria_id';

  const ocultosVitrine = await getOcultosVitrine();

  if (slug === 'todas') {
    const { data } = await supabase
      .from('produtos')
      .select(PROD_FIELDS)
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(120);
    if (data) produtos = data.filter(p => !ocultosVitrine.has(String(p.id)));
  } else if (catAtual) {
    const { data: allCategories } = await supabase
      .from('categorias')
      .select('id, nome, slug, parent_id')
      .order('nome');

    const allCats = allCategories || [];
    const allCatsMap = new Map(allCats.map(c => [c.id, c]));

    if (catAtual.parent_id) {
      grupoPai = allCatsMap.get(catAtual.parent_id) || null;
    }

    // Coleta todos os IDs da categoria e suas subcategorias
    function getDescendantIds(catId: string): string[] {
      const ids: string[] = [catId];
      const children = allCats.filter(c => c.parent_id === catId);
      for (const child of children) {
        ids.push(...getDescendantIds(child.id));
      }
      return Array.from(new Set(ids));
    }

    const idsRelacionados = getDescendantIds(catAtual.id);
    subgrupos = allCats.filter(c => c.parent_id === catAtual.id);

    // 1. Consulta direta por categoria_id
    const { data: directProds } = await supabase
      .from('produtos')
      .select(PROD_FIELDS)
      .eq('ativo', true)
      .in('categoria_id', idsRelacionados)
      .order('criado_em', { ascending: false })
      .limit(1000);

    // 2. Consulta por produtos vinculados via categorias adicionais
    let additionalProds: any[] = [];
    try {
      const { data: addCatDb } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'produtos_categorias_adicionais')
        .maybeSingle();

      const mapAdicionais: Record<string, string[]> = addCatDb?.valor || {};
      const addProdIds: string[] = [];
      for (const [prodId, catIds] of Object.entries(mapAdicionais)) {
        if (Array.isArray(catIds) && idsRelacionados.some(id => catIds.includes(id))) {
          addProdIds.push(prodId);
        }
      }

      if (addProdIds.length > 0) {
        const { data: addData } = await supabase
          .from('produtos')
          .select(PROD_FIELDS)
          .eq('ativo', true)
          .in('id', addProdIds.slice(0, 500));
        if (addData) additionalProds = addData;
      }
    } catch {}

    const todos = [...(directProds || []), ...additionalProds];
    const unicos = Array.from(new Map(todos.map(p => [p.id, p])).values());

    produtos = unicos.filter(p => !ocultosVitrine.has(String(p.id)));
  }

  const produtosFiltrados = produtos.filter(hasValidPhoto);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8 flex items-center flex-wrap gap-2">
        <Link href="/" className="hover:text-primary transition font-bold">Home</Link>
        <span>&gt;</span>
        <Link href="/categoria/todas" className="hover:text-primary transition font-bold">Categorias</Link>

        {grupoPai && (
          <>
            <span>&gt;</span>
            <Link href={`/categoria/${grupoPai.slug}`} className="hover:text-primary transition font-bold">
              {grupoPai.nome}
            </Link>
          </>
        )}

        <span>&gt;</span>
        <span className="text-secondary font-black">{catAtual ? catAtual.nome : 'Todas as Categorias'}</span>
      </nav>

      {/* Cabeçalho da Categoria */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black text-secondary">
          {catAtual ? catAtual.nome : 'Todas as Categorias'}
        </h1>
        {catAtual?.descricao && (
          <p className="text-gray-500 text-sm mt-1">{catAtual.descricao}</p>
        )}
      </div>

      {/* Subgrupos pills */}
      {subgrupos.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {subgrupos.map((s) => (
            <Link
              key={s.id}
              href={`/categoria/${s.slug}`}
              className="px-4 py-2 bg-gray-100 hover:bg-primary hover:text-white text-secondary text-xs font-bold rounded-full transition shadow-2xs"
            >
              🏷️ {s.nome}
            </Link>
          ))}
        </div>
      )}

      {/* Contagem de Produtos */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Exibindo {produtosFiltrados.length} produto(s)
        </span>
      </div>

      {/* Grid de Produtos */}
      {produtosFiltrados.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {produtosFiltrados.map((prod) => (
            <ProductCard key={prod.id} produto={prod} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-lg font-bold text-gray-700">Nenhum produto publicado nesta categoria ainda.</p>
          <p className="text-xs text-gray-400 mt-1">Navegue pelas outras categorias para conferir nossos produtos!</p>
        </div>
      )}
    </div>
  );
}
