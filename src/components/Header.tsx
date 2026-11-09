import { ShoppingCart, User, Heart, Factory } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import TopBar from './TopBar';
import SearchBar from './SearchBar';
import CategoryNav from './CategoryNav';
import CartCountBadge from './CartCountBadge';

export default async function Header() {
  const { data: configs } = await supabase.from('configuracoes').select('*');
  const topbar = configs?.find(c => c.chave === 'marketing_topbar')?.valor || {
    texto1: '🚚 Frete grátis acima de R$ 99,00 para o Estado de SP',
    texto2: '💳 Parcele em até 6x sem juros no cartão',
    visibilidade: 'todas',
    cor: 'bg-primary'
  };

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      <TopBar topbar={topbar} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Linha Principal do Cabeçalho */}
        <div className="flex justify-between items-center py-1 sm:py-2 gap-2 sm:gap-4">
          
          {/* Logo do Site (Compacto no mobile, grande no desktop) */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/">
              <div className="relative w-36 sm:w-48 md:w-[220px] lg:w-[260px] h-11 sm:h-14 md:h-16 cursor-pointer overflow-visible flex items-center">
                <Image 
                  src="/logo-mimoshow.png" 
                  alt="MimoShow Logo" 
                  fill 
                  className="object-contain object-left scale-[1.05] md:scale-[1.15] origin-left" 
                  priority 
                />
              </div>
            </Link>
          </div>

          {/* Botão Conheça Nossa Fábrica (Desktop e Tablet - no espaço ao lado da barra de busca) */}
          <Link
            href="/conheca-a-mimoshow"
            className="hidden md:flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100/70 hover:from-orange-100 hover:to-amber-100 border border-orange-200/90 text-orange-950 transition-all duration-200 shadow-2xs hover:shadow-xs group flex-shrink-0 cursor-pointer"
            title="Conheça a fábrica Mimo Show — Fabricação própria de acessórios pet"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all">
              <Factory size={15} />
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[12px] font-black text-secondary tracking-tight group-hover:text-primary transition-colors">
                Conheça nossa fábrica
              </span>
              <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                Clique aqui <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">&rarr;</span>
              </span>
            </div>
          </Link>

          {/* Barra de Pesquisa (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-2 lg:mx-4">
            <SearchBar />
          </div>

          {/* Ícones de Conta, Favoritos e Carrinho (Sempre visíveis, nunca cortados) */}
          <div className="flex items-center gap-2.5 sm:gap-4 md:gap-6 text-secondary flex-shrink-0">
            <Link href="/minhaconta" className="flex flex-col items-center hover:text-primary transition p-1" title="Minha Conta">
              <User size={22} className="sm:w-6 sm:h-6" />
              <span className="text-[11px] sm:text-xs font-bold mt-0.5 hidden sm:block">Conta</span>
            </Link>
            <Link href="/favoritos" className="flex flex-col items-center hover:text-primary transition relative p-1" title="Favoritos">
              <Heart size={22} className="sm:w-6 sm:h-6" />
              <span className="absolute -top-0.5 -right-1 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span>
              <span className="text-[11px] sm:text-xs font-bold mt-0.5 hidden sm:block">Favoritos</span>
            </Link>
            <Link href="/carrinho" className="flex flex-col items-center hover:text-primary transition relative p-1" title="Meu Carrinho">
              <ShoppingCart size={22} className="sm:w-6 sm:h-6" />
              <CartCountBadge />
              <span className="text-[11px] sm:text-xs font-bold mt-0.5 hidden sm:block">Carrinho</span>
            </Link>
          </div>

        </div>

        {/* Barra de Pesquisa Mobile (Segunda linha dedicada no celular) */}
        <div className="block md:hidden pb-2 pt-0.5 space-y-1.5">
          <SearchBar />
          <Link
            href="/conheca-a-mimoshow"
            className="flex items-center justify-center gap-1.5 py-1 px-2.5 text-[11px] font-bold text-orange-900 bg-orange-50/90 border border-orange-200/70 rounded-lg hover:bg-orange-100 transition shadow-2xs"
          >
            <Factory size={13} className="text-primary" />
            <span>Conheça nossa fábrica —</span>
            <span className="text-primary underline font-extrabold">Clique aqui &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Menu Superior Horizontal de Categorias (Exibido em todas as páginas) */}
      <CategoryNav />
    </header>
  );
}
