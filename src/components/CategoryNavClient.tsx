'use client';

import Link from 'next/link';
import { ChevronDown, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Categoria {
  id: string;
  nome: string;
  slug: string;
  parent_id: string | null;
}

interface Props {
  pais: Categoria[];
  all: Categoria[];
  emojis?: Record<string, string>;
}

const THEMATIC_SLUGS = new Set([
  'dia-das-maes',
  'dia-dos-pais',
  'dia-das-criancas',
  'halloween',
  'carnaval',
  'pascoa',
  'natal',
  'ano-novo',
  'dia-dos-namorados',
  'outubro-rosa',
  'novembro-azul',
  'festa-junina'
]);

const CATEGORY_EMOJIS: Record<string, string> = {
  'dia-das-maes': '🌸',
  'dia-dos-pais': '👔',
  'dia-das-criancas': '🎈',
  'halloween': '🎃',
  'carnaval': '🎭',
  'pascoa': '🐰',
  'natal': '🎄',
  'ano-novo': '🎆',
  'dia-dos-namorados': '❤️',
  'outubro-rosa': '🎀',
  'novembro-azul': '💙',
  'festa-junina': '🌽',
  'adesivos': '🏷️',
  'bandanas': '🧣',
  'gargantilhas': '📿',
  'gravatinhas': '👔',
  'lacinhos': '🎀'
};

// Grupos definidos para o menu Infantil
const GRUPOS_INFANTIL = [
  { nome: 'Máscaras', slug: 'mascaras', emoji: '🎭' },
  { nome: 'Bolsas', slug: 'bolsas', emoji: '👜' },
  { nome: 'Tiaras', slug: 'tiaras', emoji: '🎀' },
  { nome: 'Jogos', slug: 'jogos', emoji: '🎲' },
  { nome: 'Quebra-Cabeça', slug: 'quebra-cabeca', emoji: '🧩' },
  { nome: 'Didático', slug: 'didatico', emoji: '📚' },
];

// Grupos definidos para o menu Decoração
const GRUPOS_DECORACAO = [
  { nome: 'Quadros MDF', slug: 'quadros-mdf', emoji: '🪵' },
  { nome: 'Quadros Impressos', slug: 'quadros-impressos', emoji: '🖼️' },
  { nome: 'Decor Ambientes', slug: 'decor-ambientes', emoji: '🛋️' },
  { nome: 'Faixas Decorativas', slug: 'faixas-decorativas', emoji: '🎏' },
];

export default function CategoryNavClient({ pais, all }: Props) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Slugs reservados que NÃO devem aparecer avulsos na barra principal
  const reservedSlugs = new Set([
    ...Array.from(THEMATIC_SLUGS),
    'infantil',
    'decoracao',
    'decorac-o',
    'criancas',
    'brinquedos',
    'decoracao-ambientes',
    ...GRUPOS_INFANTIL.map(g => g.slug),
    ...GRUPOS_DECORACAO.map(g => g.slug)
  ]);

  // Categorias normais (Linha Pet: Adesivos, Bandanas, Gargantilhas, Gravatinhas, Lacinhos)
  const padraoPais = pais
    .filter(c => {
      const slugLower = (c.slug || '').toLowerCase();
      const nomeLower = (c.nome || '').toLowerCase();
      if (reservedSlugs.has(slugLower)) return false;
      if (nomeLower.includes('decora') || nomeLower.includes('infantil') || nomeLower.includes('criança')) return false;
      return true;
    })
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));

  const getCleanCategoryName = (nome: string) => {
    if (nome.toLowerCase().includes('adesivo')) return 'Adesivos';
    return nome;
  };

  // Categorias de eventos/datas comemorativas
  const tematicosCats = pais
    .filter(c => THEMATIC_SLUGS.has(c.slug))
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));

  const getSubcategorias = (paiId: string) => {
    return all
      .filter(c => c.parent_id === paiId)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getCategoryLink = (slug: string) => {
    const existing = all.find(c => c.slug === slug);
    if (existing) return `/categoria/${existing.slug}`;
    return `/categoria/${slug}`;
  };

  return (
    <nav className="w-full bg-white border-t border-gray-100 shadow-2xs relative z-40" ref={navRef}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5">
        <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
          
          {/* Categorias Padrão (Adesivos, Bandanas, Gargantilhas, Gravatinhas, Lacinhos) */}
          {padraoPais.map((cat) => {
            const subs = getSubcategorias(cat.id);
            const temSub = subs.length > 0;
            const emoji = CATEGORY_EMOJIS[cat.slug];
            const isOpen = activeDropdown === cat.id;

            return (
              <div 
                key={cat.id} 
                className="relative flex-shrink-0"
                onMouseEnter={() => temSub && setActiveDropdown(cat.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div className="flex items-center">
                  <Link
                    href={`/categoria/${cat.slug}`}
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-center gap-1.5 bg-white border border-gray-200 text-slate-800 hover:border-pink-400 hover:text-pink-600 rounded-full px-3 py-1.5 text-xs md:text-[13px] font-bold transition shadow-2xs hover:shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    {emoji && <span className="text-xs">{emoji}</span>}
                    <span>{getCleanCategoryName(cat.nome)}</span>
                  </Link>
                  {temSub && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(isOpen ? null : cat.id);
                      }}
                      className="-ml-3 pl-1 pr-2 py-1.5 text-gray-400 hover:text-pink-600 cursor-pointer z-10"
                      aria-label="Subcategorias"
                    >
                      <ChevronDown size={13} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-pink-600' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Subcategorias Dropdown */}
                {temSub && isOpen && (
                  <div 
                    className="absolute left-0 top-full pt-1.5 min-w-[210px]"
                    style={{ zIndex: 99999 }}
                  >
                    <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl py-2">
                      <div className="px-3 py-1 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-100 mb-1">
                        Subcategorias
                      </div>
                      <div className="max-h-[320px] overflow-y-auto">
                        {subs.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/categoria/${sub.slug}`}
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition rounded-lg mx-1"
                          >
                            <span>{sub.nome}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* 1. BOTÃO "TEMÁTICOS PET" */}
          {tematicosCats.length > 0 && (
            <div 
              className="relative flex-shrink-0"
              onMouseEnter={() => setActiveDropdown('tematicos')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'tematicos' ? null : 'tematicos');
                }}
                className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 hover:border-amber-400 font-extrabold rounded-full px-3.5 py-1.5 text-xs md:text-[13px] transition shadow-2xs hover:shadow-xs cursor-pointer whitespace-nowrap"
              >
                <Sparkles size={13} className="text-amber-600 animate-pulse" />
                <span>Temáticos Pet</span>
                <ChevronDown size={13} className={`text-amber-700 transition-transform duration-200 ${activeDropdown === 'tematicos' ? 'rotate-180' : ''}`} />
              </button>

              {/* Lista de Categorias Temáticas */}
              {activeDropdown === 'tematicos' && (
                <div 
                  className="absolute left-0 top-full pt-1.5 min-w-[240px] max-w-[320px]"
                  style={{ zIndex: 99999 }}
                >
                  <div className="bg-white border border-amber-200 shadow-2xl rounded-2xl py-2">
                    <div className="px-3 py-1 text-[10px] font-black uppercase text-amber-600 tracking-wider border-b border-amber-100 mb-1 flex items-center justify-between">
                      <span>Datas & Eventos Pet</span>
                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">
                        {tematicosCats.length}
                      </span>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto">
                      {tematicosCats.map((tCat) => {
                        const tEmoji = CATEGORY_EMOJIS[tCat.slug];
                        const tSubs = getSubcategorias(tCat.id);

                        return (
                          <Link
                            key={tCat.id}
                            href={`/categoria/${tCat.slug}`}
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-center justify-between px-4 py-2 text-xs font-bold text-gray-800 hover:bg-amber-50 hover:text-amber-900 transition rounded-lg mx-1"
                          >
                            <div className="flex items-center gap-2">
                              {tEmoji && <span className="text-sm">{tEmoji}</span>}
                              <span>{tCat.nome}</span>
                            </div>
                            {tSubs.length > 0 && (
                              <span className="text-[10px] text-gray-400 font-semibold bg-gray-100 px-1.5 py-0.5 rounded-full">
                                {tSubs.length}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. BOTÃO "INFANTIL" */}
          <div 
            className="relative flex-shrink-0"
            onMouseEnter={() => setActiveDropdown('infantil')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <Link
              href="/categoria/infantil"
              onClick={() => setActiveDropdown(null)}
              className="flex items-center gap-1.5 bg-pink-50 text-pink-900 border border-pink-300 hover:bg-pink-100 hover:border-pink-400 font-extrabold rounded-full px-3.5 py-1.5 text-xs md:text-[13px] transition shadow-2xs hover:shadow-xs cursor-pointer whitespace-nowrap"
            >
              <span className="text-xs">🎈</span>
              <span>Infantil</span>
              <ChevronDown size={13} className={`text-pink-700 transition-transform duration-200 ${activeDropdown === 'infantil' ? 'rotate-180' : ''}`} />
            </Link>

            {/* Menu Dropdown Infantil */}
            {activeDropdown === 'infantil' && (
              <div 
                className="absolute left-0 sm:left-auto right-0 top-full pt-1.5 min-w-[230px] max-w-[280px]"
                style={{ zIndex: 99999 }}
              >
                <div className="bg-white border border-pink-200 shadow-2xl rounded-2xl py-2">
                  <div className="px-3 py-1 text-[10px] font-black uppercase text-pink-600 tracking-wider border-b border-pink-100 mb-1 flex items-center justify-between">
                    <span>Linha Infantil</span>
                    <span className="text-[9px] bg-pink-100 text-pink-800 px-1.5 py-0.5 rounded-full font-bold">
                      {GRUPOS_INFANTIL.length} grupos
                    </span>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {GRUPOS_INFANTIL.map((item) => (
                      <Link
                        key={item.slug}
                        href={getCategoryLink(item.slug)}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-gray-800 hover:bg-pink-50 hover:text-pink-700 transition rounded-lg mx-1"
                      >
                        <span className="text-sm">{item.emoji}</span>
                        <span>{item.nome}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. BOTÃO "DECORAÇÃO" */}
          <div 
            className="relative flex-shrink-0"
            onMouseEnter={() => setActiveDropdown('decoracao')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <Link
              href="/categoria/decoracao"
              onClick={() => setActiveDropdown(null)}
              className="flex items-center gap-1.5 bg-sky-50 text-sky-900 border border-sky-300 hover:bg-sky-100 hover:border-sky-400 font-extrabold rounded-full px-3.5 py-1.5 text-xs md:text-[13px] transition shadow-2xs hover:shadow-xs cursor-pointer whitespace-nowrap"
            >
              <span className="text-xs">✨</span>
              <span>Decoração</span>
              <ChevronDown size={13} className={`text-sky-700 transition-transform duration-200 ${activeDropdown === 'decoracao' ? 'rotate-180' : ''}`} />
            </Link>

            {/* Menu Dropdown Decoração */}
            {activeDropdown === 'decoracao' && (
              <div 
                className="absolute right-0 top-full pt-1.5 min-w-[240px] max-w-[300px]"
                style={{ zIndex: 99999 }}
              >
                <div className="bg-white border border-sky-200 shadow-2xl rounded-2xl py-2">
                  <div className="px-3 py-1 text-[10px] font-black uppercase text-sky-600 tracking-wider border-b border-sky-100 mb-1 flex items-center justify-between">
                    <span>Linha Decoração</span>
                    <span className="text-[9px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded-full font-bold">
                      {GRUPOS_DECORACAO.length} grupos
                    </span>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {GRUPOS_DECORACAO.map((item) => (
                      <Link
                        key={item.slug}
                        href={getCategoryLink(item.slug)}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-gray-800 hover:bg-sky-50 hover:text-sky-700 transition rounded-lg mx-1"
                      >
                        <span className="text-sm">{item.emoji}</span>
                        <span>{item.nome}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botão Ver Tudo */}
          <Link
            href="/categoria/todas"
            className="flex-shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold rounded-full px-4 py-1.5 text-xs md:text-[13px] hover:from-pink-600 hover:to-rose-600 transition shadow-2xs active:scale-95 whitespace-nowrap"
          >
            <span>Ver Tudo</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
