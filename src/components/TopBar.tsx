'use client';

import { usePathname } from 'next/navigation';

export default function TopBar({ topbar }: { topbar: any }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  const showTopbar = topbar.visibilidade === 'todas' || (topbar.visibilidade === 'home' && isHome);

  if (!showTopbar || topbar.visibilidade === 'nenhuma') {
    return null;
  }

  const frase1 = topbar.texto1 || topbar.texto || '🚚 Frete grátis acima de R$ 99,00 para SP';
  const frase2 = topbar.texto2 || '';

  const defaultBg = 'bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500';
  const bgClass = topbar.cor && topbar.cor !== 'bg-primary' ? topbar.cor : defaultBg;

  return (
    <div className={`w-full ${bgClass} text-white py-2 px-4 shadow-xs`}>
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-0.5 text-center font-sans">
        {/* Linha 1 */}
        <span className="text-xs sm:text-sm font-black tracking-wide leading-tight drop-shadow-xs flex items-center justify-center gap-1.5">
          <span>✨</span>
          <span>{frase1}</span>
          <span>✨</span>
        </span>

        {/* Linha 2 (Abaixo da Linha 1, se preenchida) */}
        {frase2 && frase2.trim() && (
          <span className="text-[11px] sm:text-xs font-bold text-white/95 tracking-wide leading-tight border-t border-white/20 pt-1 mt-0.5 w-full max-w-xl">
            {frase2}
          </span>
        )}
      </div>
    </div>
  );
}
