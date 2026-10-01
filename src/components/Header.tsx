import { ShoppingCart, User, Heart } from 'lucide-react';
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
    texto1: '🚚 Frete grátis acima de R$ 99,00',
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
              <div className="relative w-36 sm:w-48 md:w-[280px] h-11 sm:h-14 md:h-16 cursor-pointer overflow-visible flex items-center">
                <Image 
                  src="/logo-mimoshow.png" 
                  alt="MimoShow Logo" 
                  fill 
                  className="object-contain object-left scale-[1.1] md:scale-[1.2] origin-left" 
                  priority 
                />
              </div>
            </Link>
          </div>

          {/* Barra de Pesquisa (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-4 lg:mx-6">
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
        <div className="block md:hidden pb-2 pt-0.5">
          <SearchBar />
        </div>
      </div>

      {/* Menu Superior Horizontal de Categorias (Exibido em todas as páginas) */}
      <CategoryNav />
    </header>
  );
}
