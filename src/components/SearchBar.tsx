'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { hasValidPhoto } from '@/lib/productFilter';

interface ProdutoBusca {
  id: string;
  nome: string;
  slug: string;
  preco: number;
  preco_promocional: number | null;
  imagens: string[];
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<ProdutoBusca[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca em tempo real com debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResultados([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from('produtos')
        .select('id, nome, slug, preco, preco_promocional, imagens')
        .eq('ativo', true)
        .or(`nome.ilike.%${query}%,codigo_barras.ilike.%${query}%`)
        .limit(12);

      const validos = (data || []).filter(hasValidPhoto).slice(0, 6);
      setResultados(validos);
      setOpen(true);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/busca?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Buscar acessórios para seu pet..."
          className="w-full bg-gray-100 rounded-full py-2 sm:py-2.5 pl-4 pr-10 text-xs sm:text-sm border border-transparent focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition shadow-inner"
        />
        {query ? (
          <button
            type="button"
            onClick={() => { setQuery(''); setResultados([]); setOpen(false); }}
            className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={16} />
          </button>
        ) : null}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary p-1.5 rounded-full transition"
          title="Pesquisar"
        >
          <Search size={18} />
        </button>
      </form>

      {/* Dropdown de Resultados em Tempo Real */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 divide-y divide-gray-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-400">Buscando produtos...</div>
          ) : resultados.length > 0 ? (
            <>
              {resultados.map((p) => {
                const precoExibido = p.preco_promocional && p.preco_promocional < p.preco
                  ? p.preco_promocional
                  : p.preco;
                const foto = p.imagens?.[0];

                return (
                  <Link
                    key={p.id}
                    href={`/produto/${p.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 transition group"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg relative overflow-hidden flex-shrink-0 border border-gray-200">
                      {foto ? (
                        <Image src={foto} alt={p.nome} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold">Sem Foto</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-gray-800 truncate group-hover:text-primary transition">
                        {p.nome}
                      </p>
                      <p className="text-primary font-black text-xs mt-0.5">
                        R$ {Number(precoExibido).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </Link>
                );
              })}
              <button
                onClick={handleSubmit}
                className="w-full py-3 bg-gray-50 text-center font-bold text-xs text-secondary hover:bg-gray-100 transition block"
              >
                Ver todos os resultados para "{query}" &rarr;
              </button>
            </>
          ) : (
            <div className="p-4 text-center text-sm text-gray-400">
              Nenhum produto encontrado para "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
