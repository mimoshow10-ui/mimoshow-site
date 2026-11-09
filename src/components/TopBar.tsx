'use client';

import { usePathname } from 'next/navigation';

export default function TopBar({ topbar }: { topbar: any }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  const showTopbar = topbar.visibilidade === 'todas' || (topbar.visibilidade === 'home' && isHome);

  if (!showTopbar || topbar.visibilidade === 'nenhuma') {
    return null;
  }

  const frasePrincipal = (topbar.texto1 || topbar.texto || '🚚 Frete grátis acima de R$ 99,00 para SP').trim();
  const fraseSecundaria = topbar.texto2 && topbar.texto2.trim() !== frasePrincipal ? topbar.texto2.trim() : null;

  // Frases que serão repetidas com espaçamento uniforme
  const frasesBase = fraseSecundaria
    ? [frasePrincipal, fraseSecundaria, frasePrincipal, fraseSecundaria]
    : [frasePrincipal, frasePrincipal, frasePrincipal, frasePrincipal];

  // Duplicação exata para efeito de looping infinito contínuo da direita para a esquerda (0 a -50%)
  const frasesLoop = [...frasesBase, ...frasesBase];

  const defaultBg = 'bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500';
  const bgClass = topbar.cor && topbar.cor !== 'bg-primary' ? topbar.cor : defaultBg;

  return (
    <div className={`w-full ${bgClass} text-white py-1.5 sm:py-2 overflow-hidden shadow-xs relative select-none z-30`}>
      <style>{`
        @keyframes topbarMarquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-topbar-marquee {
          display: flex;
          width: max-content;
          animation: topbarMarquee 28s linear infinite;
          will-change: transform;
        }
        .animate-topbar-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Letreiro Dinâmico da Direita para a Esquerda em Linha Única */}
      <div className="flex items-center overflow-hidden">
        <div className="animate-topbar-marquee flex items-center">
          {frasesLoop.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 mx-6 sm:mx-10 flex-shrink-0 text-xs sm:text-sm font-black tracking-wide drop-shadow-xs"
            >
              <span className="text-amber-200">✨</span>
              <span>{item}</span>
              <span className="text-amber-200">✨</span>
              <span className="text-white/40 ml-4 sm:ml-6 font-normal">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
