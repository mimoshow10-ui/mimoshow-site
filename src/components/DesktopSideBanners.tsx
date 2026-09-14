'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Flame, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Maximize2, 
  Heart, 
  ExternalLink 
} from 'lucide-react';

function InstagramIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface PromoProduct {
  id: string;
  nome: string;
  slug: string;
  preco: number;
  preco_promocional?: number | null;
  imagens?: string[] | null;
}

interface DesktopSideBannersProps {
  produtosPromocao: PromoProduct[];
}

export default function DesktopSideBanners({ produtosPromocao }: DesktopSideBannersProps) {
  // Estado para os banners (aberto ou minimizado)
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // Rotação de produtos promocionais (a cada 3 segundos)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const total = produtosPromocao?.length || 0;
  const currentProduct = total > 0 ? produtosPromocao[currentIndex] : null;

  // Coleção de fotos para o grid do celular (Instagram)
  const promoImages = (produtosPromocao || [])
    .flatMap(p => p.imagens || [])
    .filter(img => img && typeof img === 'string' && img.length > 5);

  const defaultPhotos = [
    '/logo-mimoshow.png',
    '/banner-pet.jpg',
    '/logo-luxo.jpg',
    '/logo-mimoshow.jpg'
  ];

  const instaPhotos = Array.from(new Set([...promoImages, ...defaultPhotos]));

  // Timer para rotação de 3 segundos (sem travar a CPU do navegador)
  useEffect(() => {
    if (total <= 1 || isPaused || !leftOpen) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 3000);

    return () => clearInterval(interval);
  }, [total, isPaused, leftOpen]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const calculateDiscount = (de: number, por?: number | null) => {
    if (!por || por >= de) return null;
    return Math.round(((de - por) / de) * 100);
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. LATERAL ESQUERDA: OFERTAS RELÂMPAGO (ROTAÇÃO 3S -20%)   */}
      {/* ========================================================= */}
      {total > 0 && currentProduct && (
        <aside 
          aria-label="Ofertas Relâmpago"
          className="hidden xl:block fixed left-2 2xl:left-3 top-[220px] z-40 select-none animate-in fade-in slide-in-from-left-4 duration-300"
        >
          {leftOpen ? (
            <div 
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="w-40 2xl:w-44 bg-white/95 backdrop-blur-md rounded-xl border-2 border-orange-300 shadow-xl overflow-hidden transition-all hover:border-orange-400 group"
            >
              {/* Barra de Progresso de 3 Segundos */}
              <div className="w-full bg-orange-100 h-1 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-full transition-all duration-75 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Header com Botão de Minimizar */}
              <div className="flex items-center justify-between px-2.5 pt-2 pb-0.5">
                <div className="flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                  <h3 className="text-[10px] font-heading font-black text-red-600 uppercase tracking-tight flex items-center gap-0.5">
                    <Flame size={12} className="text-orange-500 fill-orange-500 animate-pulse" />
                    Oferta Relâmpago
                  </h3>
                </div>
                <button
                  onClick={() => setLeftOpen(false)}
                  title="Minimizar ofertas"
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-0.5 rounded transition cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Produto em Destaque */}
              <div className="p-2.5 pt-1 space-y-2">
                {/* Foto do Produto */}
                <Link 
                  href={`/produto/${currentProduct.slug}`}
                  className="relative block w-full h-28 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 group/img"
                >
                  {currentProduct.imagens && currentProduct.imagens.length > 0 ? (
                    <Image
                      src={currentProduct.imagens[0]}
                      alt={currentProduct.nome}
                      fill
                      className="object-contain p-1.5 group-hover/img:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px] font-bold">
                      Sem foto
                    </div>
                  )}

                  {/* Badge de Desconto */}
                  {calculateDiscount(currentProduct.preco, currentProduct.preco_promocional) ? (
                    <span className="absolute top-1.5 left-1.5 bg-red-600 text-white font-black text-[9px] uppercase px-1.5 py-0.5 rounded-full shadow-sm">
                      -{calculateDiscount(currentProduct.preco, currentProduct.preco_promocional)}%
                    </span>
                  ) : (
                    <span className="absolute top-1.5 left-1.5 bg-orange-500 text-white font-black text-[8px] uppercase px-1.5 py-0.5 rounded-full shadow-sm">
                      Destaque
                    </span>
                  )}
                </Link>

                {/* Título do Produto */}
                <Link href={`/produto/${currentProduct.slug}`}>
                  <h4 
                    title={currentProduct.nome}
                    className="text-[11px] font-bold text-gray-800 line-clamp-2 hover:text-primary transition leading-tight min-h-[1.75rem]"
                  >
                    {currentProduct.nome}
                  </h4>
                </Link>

                {/* Preços */}
                <div className="bg-orange-50/70 p-2 rounded-lg border border-orange-100">
                  {currentProduct.preco_promocional && currentProduct.preco_promocional > 0 ? (
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-gray-400 line-through block">
                        De: R$ {Number(currentProduct.preco).toFixed(2).replace('.', ',')}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[10px] font-bold text-gray-500">Por:</span>
                        <strong className="text-sm font-black text-red-600">
                          R$ {Number(currentProduct.preco_promocional).toFixed(2).replace('.', ',')}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[9px] text-gray-500 font-bold block">Preço:</span>
                      <strong className="text-sm font-black text-primary">
                        R$ {Number(currentProduct.preco).toFixed(2).replace('.', ',')}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Botão de Ação */}
                <Link
                  href={`/produto/${currentProduct.slug}`}
                  className="block w-full text-center text-[10px] font-black uppercase py-2 px-2 rounded-lg bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:opacity-95 text-white shadow-sm hover:shadow transition-all"
                >
                  Aproveitar
                </Link>

                {/* Controles e Indicador de Paginação */}
                <div className="flex items-center justify-between text-[9px] text-gray-500 pt-0.5 border-t border-gray-100">
                  <button
                    onClick={handlePrev}
                    title="Oferta anterior"
                    className="p-0.5 hover:bg-gray-100 rounded transition text-gray-600 hover:text-secondary font-bold cursor-pointer"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <span className="font-bold text-gray-600 text-[9px]">
                    {currentIndex + 1}/{total}
                  </span>
                  <button
                    onClick={handleNext}
                    title="Próxima oferta"
                    className="p-0.5 hover:bg-gray-100 rounded transition text-gray-600 hover:text-secondary font-bold cursor-pointer"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Aba Minimizado na Esquerda */
            <button
              onClick={() => setLeftOpen(true)}
              className="flex items-center gap-2 bg-white/95 backdrop-blur-md border-2 border-orange-400 text-red-600 hover:text-orange-700 font-black text-xs px-3 py-2.5 rounded-r-2xl shadow-xl hover:shadow-2xl transition-all hover:translate-x-1 cursor-pointer"
              title="Expandir Ofertas Relâmpago"
            >
              <Flame size={16} className="text-orange-500 fill-orange-500" />
              <span className="[writing-mode:vertical-lr] rotate-180 text-[11px] tracking-widest font-black uppercase">
                🔥 Ofertas Relâmpago
              </span>
              <Maximize2 size={12} className="text-gray-400" />
            </button>
          )}
        </aside>
      )}

      {/* ========================================================= */}
      {/* 2. LATERAL DIREITA: SMARTPHONE INSTAGRAM (ESCALA -20%)     */}
      {/* ========================================================= */}
      <aside 
        aria-label="Instagram Mimoshow Oficial"
        className="hidden xl:block fixed right-2 2xl:left-auto 2xl:right-3 top-[190px] z-40 select-none animate-in fade-in slide-in-from-right-4 duration-300"
      >
        {rightOpen ? (
          <div className="w-42 2xl:w-46 bg-slate-950 rounded-[30px] p-2 shadow-xl border-2 border-slate-800 relative transition-all hover:scale-[1.02] group">
            
            {/* Notch / Dynamic Island do Smartphone */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-2.5 bg-black rounded-full z-20 flex items-center justify-center gap-1 shadow-xs">
              <div className="w-1 h-1 rounded-full bg-slate-800"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-700"></div>
            </div>

            {/* Botão de Minimizar */}
            <button
              onClick={() => setRightOpen(false)}
              title="Minimizar Instagram"
              className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-0.5 rounded-full z-30 transition cursor-pointer"
            >
              <X size={11} />
            </button>

            {/* Tela do Celular */}
            <div className="bg-white rounded-[22px] overflow-hidden pt-3 pb-1.5 border border-slate-200 shadow-inner flex flex-col text-slate-800">
              
              {/* Header da Conta do Instagram */}
              <a 
                href="https://instagram.com/mimoshoweva" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100 bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 hover:bg-pink-100 transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-6 h-6 rounded-full p-[1px] bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex-shrink-0 shadow-xs">
                    <div className="w-full h-full bg-white rounded-full p-0.5 flex items-center justify-center overflow-hidden">
                      <Image 
                        src="/logo-mimoshow.png" 
                        alt="MimoShow Instagram" 
                        width={20} 
                        height={20} 
                        className="object-contain" 
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-900 truncate leading-tight flex items-center gap-0.5">
                      mimoshoweva
                      <span className="text-blue-500 font-black text-[8px]">✓</span>
                    </p>
                    <p className="text-[7.5px] font-bold text-gray-500 leading-none">Instagram</p>
                  </div>
                </div>

                <span className="text-[8px] font-black text-white bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 px-2 py-0.5 rounded-full shadow-xs hover:brightness-110 transition">
                  Seguir
                </span>
              </a>

              {/* Título de Fotos do Feed */}
              <div className="px-2 pt-1.5 pb-0.5 flex items-center justify-between">
                <span className="text-[8.5px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                  <InstagramIcon size={10} className="text-pink-600" /> Postagens
                </span>
                <span className="text-[7.5px] font-bold text-pink-600 flex items-center gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-pink-500 animate-ping"></span> Ao vivo
                </span>
              </div>

              {/* Grid 2x2 de Publicações do Instagram */}
              <div className="px-1.5 py-1">
                <a 
                  href="https://instagram.com/mimoshoweva" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="grid grid-cols-2 gap-1 group/grid cursor-pointer"
                >
                  {instaPhotos.slice(0, 4).map((imgUrl, idx) => (
                    <div key={idx} className="relative h-15 bg-gray-100 rounded-lg overflow-hidden border border-gray-100 group/post">
                      <Image 
                        src={imgUrl} 
                        alt={`Post Instagram ${idx + 1}`} 
                        fill 
                        className="object-cover group-hover/post:scale-110 transition duration-300" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover/post:opacity-100 transition flex items-end justify-center p-1 text-white">
                        <span className="flex items-center gap-0.5 text-[8px] text-white font-black">
                          <Heart size={9} className="fill-red-500 text-red-500" /> {124 + (idx * 47)}
                        </span>
                      </div>
                    </div>
                  ))}
                </a>
              </div>

              {/* Subtítulo & Chamada de Ação */}
              <div className="px-2 pt-1 pb-0.5 text-center space-y-1">
                <p className="text-[8.5px] font-bold text-slate-600 leading-tight">
                  Novos lançamentos no Instagram! 📸✨
                </p>

                <a
                  href="https://instagram.com/mimoshoweva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center text-[9px] font-black uppercase py-1.5 px-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:brightness-110 text-white shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <InstagramIcon size={11} />
                  <span>@mimoshoweva</span>
                  <ExternalLink size={9} />
                </a>
              </div>

            </div>

            {/* Home Bar do Celular */}
            <div className="w-10 h-0.5 bg-slate-700 rounded-full mx-auto mt-1.5"></div>
          </div>
        ) : (
          /* Aba Minimizado na Direita com Visual Instagram */
          <button
            onClick={() => setRightOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-b from-purple-600 via-pink-600 to-amber-500 text-white font-black text-xs px-2.5 py-3 rounded-l-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-x-1 cursor-pointer"
            title="Expandir Instagram @mimoshoweva"
          >
            <InstagramIcon size={16} className="text-white animate-pulse" />
            <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] 2xl:text-[11px] tracking-widest font-black uppercase">
              📲 Instagram @mimoshoweva
            </span>
            <Maximize2 size={11} className="text-white/80" />
          </button>
        )}
      </aside>
    </>
  );
}
