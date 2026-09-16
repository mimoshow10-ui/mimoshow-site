'use client'

import { extractImageUrls } from '@/lib/imageExtractor';
import { ordenarProdutosPorQuantidade } from '@/lib/quantityExtractor';

export default function VariationSelector({
  currentSlug,
  family,
  customOrderIds,
}: {
  currentSlug: string;
  family: any[];
  customOrderIds?: string[];
}) {
  if (!family || family.length <= 1) return null;

  // Garante a ordenação rigorosa da MENOR para a MAIOR quantidade (ex: 10 -> 20 -> 30 -> 50 -> 100...)
  const sortedFamily = ordenarProdutosPorQuantidade(family);

  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-secondary text-xs uppercase tracking-wide flex items-center gap-1.5">
          <span>📦 Opções de Quantidade Disponíveis:</span>
        </h3>
        <span className="text-[11px] text-gray-500 font-medium">
          (Menor para Maior)
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {sortedFamily.map((item) => {
          if (!item || !item.slug) return null;
          const isActive = item.slug === currentSlug || item.id === currentSlug;
          const fotos = extractImageUrls(item.imagens);
          const image = fotos[0] || null;
          const priceVal = Number(item.preco_promocional || item.preco || 0);

          return (
            <a 
              key={item.id || item.slug} 
              href={`/produto/${item.slug}`}
              className={`group relative flex items-center gap-2 p-2 rounded-xl border-2 transition-all cursor-pointer select-none ${
                isActive
                  ? 'border-primary bg-orange-50/40 shadow-sm ring-2 ring-primary/20 scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-primary/50 hover:shadow-xs opacity-90 hover:opacity-100'
              }`}
            >
              {image && (
                <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                  <img
                    src={image}
                    alt={item.nome || 'Opção'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                    }}
                  />
                </div>
              )}
              <div className="flex flex-col pr-1">
                <span className={`text-[11px] font-extrabold line-clamp-1 max-w-[140px] ${isActive ? 'text-primary' : 'text-gray-800'}`}>
                  {item.nome || 'Opção'}
                </span>
                <span className="text-[11px] font-black text-secondary">
                  R$ {priceVal.toFixed(2).replace('.', ',')}
                </span>
              </div>
              
              {isActive && (
                <div className="absolute -top-1.5 -right-1.5 bg-primary text-white rounded-full p-0.5 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
