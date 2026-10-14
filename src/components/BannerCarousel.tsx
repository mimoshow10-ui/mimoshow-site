'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/imageExtractor';

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

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === activeBanners.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  return (
    <div className="relative w-full overflow-hidden group bg-gray-100 h-[160px] sm:h-[220px] md:h-[270px] lg:h-[300px]">
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
              className="w-full h-full object-cover select-none"
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
                <Link href={banner.link_url} className="block w-full h-full">
                  {content}
                </Link>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>

      {/* Controles de Navegação */}
      {activeBanners.length > 1 && (
        <>
          <button 
            onClick={prevSlide} 
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition shadow-md z-10"
            aria-label="Banner anterior"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={nextSlide} 
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition shadow-md z-10"
            aria-label="Próximo banner"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots Indicadores */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {activeBanners.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? "w-8 bg-primary shadow-md" : "w-2.5 bg-white/70 hover:bg-white"
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

