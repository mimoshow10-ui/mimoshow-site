'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/imageExtractor';
import { trackSelectPromotion } from '@/lib/analytics/events';

interface BannerItem {
  url: string;
  link_url?: string;
  alt?: string;
}

interface BannerCarouselProps {
  banners?: BannerItem[];
}

const defaultBanners: BannerItem[] = [
  { url: '/banner-pet.jpg', link_url: '/categoria/pet', alt: 'Linha Pet Mimoshow' },
  { url: '/banner-kids.jpg', link_url: '/categoria/mascaras', alt: 'Linha Infantil Mimoshow' },
  { url: '/banner-decor.jpg', link_url: '/categoria/quadros-mdf', alt: 'Linha Decoração Mimoshow' }
];

export default function BannerCarousel({ banners }: BannerCarouselProps) {
  const activeBanners = banners && banners.length > 0 ? banners : defaultBanners;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Estados para Gestos de Toque (Swipe no Celular)
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const minSwipeDistance = 45;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === activeBanners.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  return (
    <div 
      className="relative w-full overflow-hidden group bg-gray-100 aspect-[3/1] max-h-[420px] rounded-2xl shadow-xs select-none touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="flex transition-transform duration-700 ease-in-out w-full h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {activeBanners.map((banner, idx) => {
          const bannerSrc = getOptimizedImageUrl(banner.url, 1200, 80);
          const content = (
            <img 
              src={bannerSrc}
              alt={banner.alt || `Banner ${idx + 1}`}
              loading={idx === 0 ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={idx === 0 ? 'high' : 'auto'}
              className="w-full h-full object-cover sm:object-cover select-none pointer-events-none"
              onError={(e) => {
                if ((e.target as HTMLImageElement).src !== banner.url && banner.url) {
                  (e.target as HTMLImageElement).src = banner.url;
                }
              }}
            />
          );

          return (
            <div key={idx} className="min-w-full h-full flex-shrink-0 relative">
              {banner.link_url ? (
                <Link
                  href={banner.link_url}
                  onClick={() => trackSelectPromotion(banner.alt || `Banner ${idx + 1}`, idx, banner.link_url)}
                  className="block w-full h-full cursor-pointer"
                >
                  {content}
                </Link>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>

      {/* Controles de Navegação (Setas visíveis e amigáveis ao toque no celular) */}
      {activeBanners.length > 1 && (
        <>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }} 
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-md z-10 active:scale-90 cursor-pointer"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }} 
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-md z-10 active:scale-90 cursor-pointer"
            aria-label="Próximo banner"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Dots Indicadores com área de toque aumentada */}
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-10 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-full">
            {activeBanners.map((_, idx) => (
              <button 
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentIndex 
                    ? "w-6 sm:w-8 h-2 sm:h-2.5 bg-primary shadow-md" 
                    : "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/70 hover:bg-white"
                }`}
                aria-label={`Ir para Slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

