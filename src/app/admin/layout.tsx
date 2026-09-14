import Link from 'next/link';
import { cookies } from 'next/headers';
import { Package, Tags, ShoppingCart, Settings, Home, LogOut, Bot, Truck, Users, Ticket } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_session')?.value;

  // Se NÃO estiver autenticado, exibe APENAS a tela de login (SEM a coluna lateral de ícones)
  if (!sessionToken || !sessionToken.startsWith('admin_session_')) {
    return <>{children}</>;
  }

  // APÓS LOGAR: Exibe a coluna lateral do painel com os ícones e a área principal
  return (
    <div className="h-screen bg-gray-100 flex flex-row font-sans overflow-hidden">
      
      {/* Sidebar / Menu Lateral com Ícones (Visível Apenas Após Logar) */}
      <aside className="w-64 bg-[#0B2545] text-white flex flex-col flex-shrink-0 h-screen sticky top-0 border-r border-blue-900 shadow-xl z-40">
        
        {/* Topo da Sidebar */}
        <div className="p-5 border-b border-blue-800/60 bg-blue-950/50 flex-shrink-0">
          <h2 className="font-heading font-black text-xl text-amber-400 tracking-wide flex items-center gap-2">
            <span>🐾 Painel Admin</span>
          </h2>
          <p className="text-xs text-blue-200 mt-1 font-semibold">MIMO Show</p>
        </div>
        
        {/* Navegação Principal Rola Internamente */}
        <nav className="flex-1 p-3 flex flex-col gap-1.5 overflow-y-auto">
          <Link href="/admin" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-blue-800/80 transition text-xs font-bold bg-blue-900/90 text-white shadow-2xs">
            <Home size={18} className="text-amber-400" />
            <span>Dashboard</span>
          </Link>

          <Link href="/admin/produtos" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-blue-800/80 transition text-xs font-bold text-blue-100 hover:text-white">
            <Package size={18} className="text-blue-300" />
            <span>Produtos</span>
          </Link>

          <Link href="/admin/categorias" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-blue-800/80 transition text-xs font-bold text-blue-100 hover:text-white">
            <Tags size={18} className="text-blue-300" />
            <span>Grupos e Subgrupos</span>
          </Link>

          <Link href="/admin/pedidos" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-blue-800/80 transition text-xs font-bold text-blue-100 hover:text-white">
            <ShoppingCart size={18} className="text-blue-300" />
            <span>Pedidos</span>
          </Link>

          <Link href="/admin/cupons" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-orange-950/50 hover:bg-orange-900/60 transition text-xs font-bold text-orange-200 border border-orange-500/30">
            <Ticket size={18} className="text-orange-400" />
            <span>Cupons de Desconto</span>
          </Link>

          <Link href="/admin/transportadoras" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-blue-800/80 transition text-xs font-bold text-blue-100 hover:text-white">
            <Truck size={18} className="text-blue-300" />
            <span>Transportadoras (Fretes)</span>
          </Link>

          <Link href="/admin/clientes" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-blue-800/80 transition text-xs font-bold text-blue-100 hover:text-white">
            <Users size={18} className="text-blue-300" />
            <span>Clientes</span>
          </Link>

          <Link href="/admin/marketing" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-blue-800/80 transition text-xs font-bold text-blue-100 hover:text-white">
            <Settings size={18} className="text-blue-300" />
            <span>Marketing (Banners)</span>
          </Link>

          <Link href="/admin/configuracoes" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-blue-800/80 transition text-xs font-bold text-blue-100 hover:text-white">
            <Settings size={18} className="text-blue-300" />
            <span>Configurações</span>
          </Link>

          <Link href="/admin/treinamento-ia" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 transition border border-purple-500/30 text-purple-200 text-xs font-bold mt-1">
            <Bot size={18} className="text-purple-400" />
            <span>Treinar IA (Robô)</span>
          </Link>
        </nav>

        {/* Rodapé Fixo no Fundo da Sidebar */}
        <div className="p-3.5 border-t border-blue-800/60 bg-blue-950/50 flex flex-col gap-2 flex-shrink-0">
          <Link href="/" target="_blank" className="flex items-center gap-2 px-3 py-2 bg-amber-400 text-blue-950 font-black rounded-xl hover:bg-amber-300 transition text-xs justify-center shadow-xs">
            <Home size={16} />
            <span>Visualizar Loja</span>
          </Link>
          <form action={async () => {
            'use server';
            const c = await cookies();
            c.delete('admin_session');
          }}>
            <button type="submit" className="w-full flex items-center gap-2 px-3 py-1.5 text-red-300 hover:text-red-100 hover:bg-red-900/30 rounded-xl transition text-xs font-bold justify-center cursor-pointer">
              <LogOut size={16} />
              <span>Sair do Painel</span>
            </button>
          </form>
        </div>

      </aside>

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto h-screen">
        {children}
      </main>

    </div>
  );
}
