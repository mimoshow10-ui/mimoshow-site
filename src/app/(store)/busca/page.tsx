import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';

import { hasValidPhoto } from '@/lib/productFilter';
import { getOcultosVitrine } from '@/lib/vitrineManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || '';

  let produtos: any[] = [];
  const ocultosVitrine = await getOcultosVitrine();

  if (q) {
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .eq('ativo', true)
      .or(`nome.ilike.%${q}%,codigo_barras.ilike.%${q}%,descricao.ilike.%${q}%`)
      .order('criado_em', { ascending: false });

    if (data) {
      produtos = data.filter(p => !ocultosVitrine.has(String(p.id)));
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-primary transition">Home</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-text font-semibold">Busca por "{q}"</span>
      </nav>

      <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
        <h1 className="text-2xl font-bold text-secondary">
          Resultados para "{q}" ({produtos.length})
        </h1>
      </div>

      {produtos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {produtos.map((prod) => (
            <ProductCard key={prod.id} produto={prod} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-border">
          <p className="text-gray-500 font-bold mb-2">Nenhum produto encontrado para "{q}".</p>
          <p className="text-sm text-gray-400 mb-4">Tente buscar por termos mais genéricos como "gravata", "laço" ou "adesivo".</p>
          <Link href="/categoria/todas" className="inline-block bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-orange-600 transition text-sm">
            Ver Todos os Produtos
          </Link>
        </div>
      )}
    </div>
  );
}
