import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import SafeComponent from '@/components/SafeComponent';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

import { hasValidPhoto } from '@/lib/productFilter';
import { getOcultosVitrine } from '@/lib/vitrineManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface BuscaPageProps {
  searchParams: Promise<{
    q?: string;
    ordem?: string;
  }>;
}

export default async function BuscaPage({ searchParams }: BuscaPageProps) {
  const params = await searchParams;
  const q = (params.q || '').trim();
  const ordem = params.ordem || 'relevantes';

  const ocultosVitrine = await getOcultosVitrine();
  const PROD_FIELDS = 'id, nome, slug, preco, preco_promocional, promocao_expira_em, imagens, codigo_barras, ativo, criado_em';

  let produtos: any[] = [];

  try {
    if (q) {
      const qClean = q.replace(/[\s\-_]+/g, '');
      const numOnly = q.replace(/\D/g, '');

      // Normalizar e extrair termos para busca fonética e flexível
      const termos = q.toLowerCase().split(/\s+/).filter(Boolean);

      const filters = [
        `nome.ilike.%${q}%`,
        `codigo_barras.ilike.%${q}%`,
      ];

      // Sinônimos comuns pet shop
      if (q.toLowerCase().includes('laco') || q.toLowerCase().includes('laço')) {
        filters.push('nome.ilike.%lacinho%', 'nome.ilike.%laço%', 'nome.ilike.%laco%');
      }
      if (q.toLowerCase().includes('gravata')) {
        filters.push('nome.ilike.%gravata%', 'nome.ilike.%gravatinha%');
      }
      if (q.toLowerCase().includes('adesivo')) {
        filters.push('nome.ilike.%adesivo%', 'nome.ilike.%piercing%');
      }
      if (q.toLowerCase().includes('colarinho')) {
        filters.push('nome.ilike.%colarinho%', 'nome.ilike.%gargantilha%');
      }

      if (q.length > 3 && q.endsWith('s')) {
        filters.push(`nome.ilike.%${q.slice(0, -1)}%`);
      }

      if (qClean && qClean !== q) {
        filters.push(`codigo_barras.ilike.%${qClean}%`);
        filters.push(`nome.ilike.%${qClean}%`);
      }
      if (numOnly.length >= 3 && numOnly !== q && numOnly !== qClean) {
        filters.push(`codigo_barras.ilike.%${numOnly}%`);
      }

      const orQuery = Array.from(new Set(filters)).join(',');

      const { data } = await supabase
        .from('produtos')
        .select(PROD_FIELDS)
        .eq('ativo', true)
        .or(orQuery);

      if (data) {
        produtos = data.filter(p => !ocultosVitrine.has(String(p.id)) && hasValidPhoto(p));
      }
    } else {
      // Sem termo de busca: catálogo geral
      const { data } = await supabase
        .from('produtos')
        .select(PROD_FIELDS)
        .eq('ativo', true)
        .order('criado_em', { ascending: false })
        .limit(60);

      if (data) {
        produtos = data.filter(p => !ocultosVitrine.has(String(p.id)) && hasValidPhoto(p));
      }
    }
  } catch (err) {
    console.error('[BUSCA ERRO]', err);
  }

  // Ordenação
  if (ordem === 'preco_menor') {
    produtos.sort((a, b) => Number(a.preco_promocional || a.preco || 0) - Number(b.preco_promocional || b.preco || 0));
  } else if (ordem === 'preco_maior') {
    produtos.sort((a, b) => Number(b.preco_promocional || b.preco || 0) - Number(a.preco_promocional || a.preco || 0));
  } else if (ordem === 'mais_recentes') {
    produtos.sort((a, b) => new Date(b.criado_em || 0).getTime() - new Date(a.criado_em || 0).getTime());
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500">
        <Link href="/" className="hover:text-primary transition">Home</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-secondary font-bold">
          {q ? `Busca por "${q}"` : 'Catálogo Completo'}
        </span>
      </nav>

      {/* Topo da Busca com Controles de Ordenação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-secondary flex items-center gap-2">
            <Search size={26} className="text-primary" />
            {q ? (
              <span>Resultados para "{q}" <span className="text-gray-400 font-normal text-lg">({produtos.length})</span></span>
            ) : (
              <span>Catálogo Geral de Produtos <span className="text-gray-400 font-normal text-lg">({produtos.length})</span></span>
            )}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Linha oficial de fábrica para banho & tosa, estética animal e pet shops.
          </p>
        </div>

        {/* Seletor de Ordenação */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ArrowUpDown size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500 font-bold">Ordenar:</span>
          <div className="flex gap-1.5 text-xs">
            <Link
              href={`/busca?${new URLSearchParams({ ...(q ? { q } : {}), ordem: 'relevantes' }).toString()}`}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                ordem === 'relevantes' ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Relevantes
            </Link>
            <Link
              href={`/busca?${new URLSearchParams({ ...(q ? { q } : {}), ordem: 'preco_menor' }).toString()}`}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                ordem === 'preco_menor' ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Menor Preço
            </Link>
            <Link
              href={`/busca?${new URLSearchParams({ ...(q ? { q } : {}), ordem: 'mais_recentes' }).toString()}`}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                ordem === 'mais_recentes' ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Lançamentos
            </Link>
          </div>
        </div>
      </div>

      {/* Grid de Produtos */}
      {produtos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
          {produtos.map((prod) => (
            <SafeComponent key={prod.id}>
              <ProductCard produto={prod} />
            </SafeComponent>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-300 max-w-md mx-auto space-y-4">
          <Search size={44} className="mx-auto text-gray-300" />
          <h2 className="text-xl font-bold text-secondary">Nenhum produto encontrado</h2>
          <p className="text-xs text-gray-500 leading-relaxed px-4">
            Não encontramos itens com o termo "{q}". Tente buscar por categorias como "gravatas", "lacinhos", "adesivos" ou "bandanas".
          </p>
          <Link
            href="/busca"
            className="inline-block bg-primary hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-xs"
          >
            Ver Todo o Catálogo
          </Link>
        </div>
      )}
    </div>
  );
}
