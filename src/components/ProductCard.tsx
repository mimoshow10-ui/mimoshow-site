'use client';

import Link from 'next/link';
import CountdownTimer from './CountdownTimer';
import { extractImageUrls } from '@/lib/imageExtractor';

interface ProdutoCardProps {
  produto: {
    id: string;
    nome: string;
    slug: string;
    preco: number;
    preco_promocional?: number | null;
    promocao_expira_em?: string | null;
    imagens?: any;
    codigo_barras?: string | null;
    sku?: string | null;
  };
}

import { useState } from 'react';
import { hasValidPhoto } from '@/lib/productFilter';

export default function ProductCard({ produto }: ProdutoCardProps) {
  const [imageError, setImageError] = useState(false);

  // Regra Estrita: produto SÓ aparece na tela de vendas se tiver foto válida e funcional
  if (!hasValidPhoto(produto) || imageError) {
    return null;
  }

  const fotos = extractImageUrls(produto.imagens);
  let foto = (imageError || !fotos[0]) ? null : fotos[0];

  if (!foto) {
    return null;
  }
    
  if (foto && foto.startsWith('http://')) {
    foto = foto.replace(/^http:\/\//i, 'https://');
  }
  const sku = produto.codigo_barras || produto.sku || null;

  const precoNormal = Number(produto.preco || 0);
  const temPromo =
    produto.preco_promocional && Number(produto.preco_promocional) < precoNormal;
  const precoPromo = temPromo ? Number(produto.preco_promocional) : null;
  const pctDesconto = temPromo && precoNormal > 0
    ? Math.round(((precoNormal - precoPromo!) / precoNormal) * 100)
    : 0;

  const agora = Date.now();
  const expiraTime = produto.promocao_expira_em ? new Date(produto.promocao_expira_em).getTime() : null;
  const timerAtivo = temPromo && expiraTime !== null && !isNaN(expiraTime) && expiraTime > agora;

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-2xs hover:shadow-md transition-all border border-gray-200 overflow-hidden group">
      {/* Imagem do Produto com Badge de Desconto e Badge de SKU */}
      <Link href={`/produto/${produto.slug}`}>
        <div className="aspect-square bg-white relative overflow-hidden flex items-center justify-center p-1">
          {foto && (
            <img
              src={foto}
              alt={produto.nome || 'Produto'}
              className="w-full h-full object-contain group-hover:scale-105 transition duration-300 bg-white"
              onError={() => setImageError(true)}
            />
          )}

          {/* Badge Pequeno do SKU no Canto Inferior da Imagem */}
          {sku && (
            <span className="absolute bottom-1.5 left-1.5 bg-gray-900/80 backdrop-blur-xs text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-2xs z-10 pointer-events-none uppercase">
              SKU: {sku}
            </span>
          )}

          {temPromo && pctDesconto > 0 && (
            <span className="absolute top-2.5 right-2.5 bg-red-600 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-md z-10 animate-pulse">
              -{pctDesconto}% OFF
            </span>
          )}
        </div>
      </Link>

      {/* Conteúdo do Card */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <Link href={`/produto/${produto.slug}`}>
            <h3 className="font-bold text-xs md:text-sm line-clamp-2 hover:text-primary transition text-secondary leading-snug">
              {produto.nome}
            </h3>
          </Link>
        </div>

        <div className="mt-auto space-y-2">
          {/* Preço Cheio x Preço com Desconto */}
          {temPromo && precoPromo !== null ? (
            <div>
              <span className="text-xs text-gray-400 line-through font-medium block">
                R$ {precoNormal.toFixed(2).replace('.', ',')}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl md:text-2xl font-heading font-black text-primary">
                  R$ {precoPromo.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xl md:text-2xl font-heading font-black text-primary block">
              R$ {precoNormal.toFixed(2).replace('.', ',')}
            </span>
          )}

          {/* Badge de Validade Promocional Leve */}
          {timerAtivo && (
            <div className="pt-1 border-t border-red-100 flex items-center justify-between text-[10px] text-red-600 font-bold bg-red-50/50 px-2 py-1 rounded-lg">
              <span>⚡ Oferta Especial</span>
              <span className="bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-mono font-black">EXPIRA HOJE</span>
            </div>
          )}

          {/* Botão Ver Produto */}
          <Link
            href={`/produto/${produto.slug}`}
            className="w-full bg-secondary hover:bg-blue-900 text-white py-2 rounded-xl font-bold transition text-xs flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
          >
            Ver Produto
          </Link>
        </div>
      </div>
    </div>
  );
}
