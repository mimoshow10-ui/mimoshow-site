'use client';
import { useState } from 'react';
import { Play } from 'lucide-react';
import { extractImageUrls } from '@/lib/imageExtractor';

export { extractImageUrls };

interface Props {
  imagens: any;
  videoUrl?: string | null;
  nome: string;
  sku?: string | null;
}

export default function ProductMediaGallery({ imagens, videoUrl, nome, sku }: Props) {
  const [activeMedia, setActiveMedia] = useState<'video' | number>(videoUrl ? 'video' : 0);

  const safeImages = extractImageUrls(imagens);

  const getYouTubeId = (url: string) => {
    try {
      if (url.includes('v=')) return url.split('v=')[1]?.split('&')[0];
      if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0];
    } catch {}
    return null;
  };

  const videoId = videoUrl ? getYouTubeId(videoUrl) : null;
  const currentImg = typeof activeMedia === 'number' && safeImages[activeMedia] ? safeImages[activeMedia] : (safeImages[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E");

  return (
    <div className="flex flex-col gap-4">
      {/* CAIXA DE MÍDIA PRINCIPAL */}
      <div className="w-full aspect-square bg-white rounded-2xl border border-border relative overflow-hidden flex items-center justify-center shadow-xs">
        {sku && (
          <span className="absolute bottom-2 left-2 bg-gray-900/80 backdrop-blur-xs text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs z-10 pointer-events-none uppercase">
            SKU: {sku}
          </span>
        )}

        {activeMedia === 'video' && videoUrl ? (
          videoId ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&rel=0&controls=0`}
              title="Vídeo do Produto"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video autoPlay loop muted playsInline className="w-full h-full object-cover">
              <source src={videoUrl} />
            </video>
          )
        ) : (
          <img
            src={currentImg}
            alt={nome || 'Foto do Produto'}
            className="w-full h-full object-contain p-2 bg-white"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
            }}
          />
        )}
      </div>

      {/* MINIATURAS */}
      {(videoUrl || safeImages.length > 1) && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {videoUrl && (
            <button
              type="button"
              onClick={() => setActiveMedia('video')}
              className={`w-20 h-20 bg-gray-900 rounded-xl border-2 flex flex-col items-center justify-center flex-shrink-0 relative overflow-hidden transition cursor-pointer ${
                activeMedia === 'video' ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                <Play size={16} className="fill-white ml-0.5" />
              </div>
              <span className="text-[10px] font-bold text-white mt-1 uppercase tracking-wider">Vídeo</span>
            </button>
          )}

          {safeImages.map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveMedia(index)}
              className={`w-20 h-20 bg-white rounded-xl border-2 flex-shrink-0 relative overflow-hidden transition cursor-pointer ${
                activeMedia === index ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
