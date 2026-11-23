'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Zap, Check } from 'lucide-react';
import { ItemCarrinho } from '@/lib/types/checkout';
import { trackAddToCart } from '@/lib/analytics/events';

interface Props {
  produto: {
    id: string;
    nome: string;
    slug: string;
    preco: number;
    preco_promocional?: number | null;
    imagens?: string[] | string;
    codigo_barras?: string;
    peso?: number;
    largura?: number;
    altura?: number;
    comprimento?: number;
  };
}

export default function AddToCartButtons({ produto }: Props) {
  const router = useRouter();
  const [adicionado, setAdicionado] = useState(false);

  function extrairFotoPrimeira(img: any): string {
    if (!img) return 'https://http2.mlstatic.com/D_NQ_NP_2X_736630-MLB72661556093_112023-F.webp';
    if (typeof img === 'string') {
      return img.split(/[\r\n,]+/)[0]?.trim() || 'https://http2.mlstatic.com/D_NQ_NP_2X_736630-MLB72661556093_112023-F.webp';
    }
    if (Array.isArray(img) && img.length > 0) {
      return extrairFotoPrimeira(img[0]);
    }
    return 'https://http2.mlstatic.com/D_NQ_NP_2X_736630-MLB72661556093_112023-F.webp';
  }

  function adicionarItem(redirecionarPara: 'carrinho' | 'checkout') {
    try {
      const precoEfetivo = produto.preco_promocional && Number(produto.preco_promocional) < Number(produto.preco)
        ? Number(produto.preco_promocional)
        : Number(produto.preco);

      const novoItem: ItemCarrinho = {
        id: produto.id,
        nome: produto.nome,
        slug: produto.slug,
        imagem: extrairFotoPrimeira(produto.imagens),
        preco_unitario: precoEfetivo,
        quantidade: 1,
        sku: produto.codigo_barras || '',
        peso_kg: produto.peso || 0.2,
        largura_cm: produto.largura || 15,
        altura_cm: produto.altura || 5,
        comprimento_cm: produto.comprimento || 20,
      };

      const raw = localStorage.getItem('carrinho');
      let itens: ItemCarrinho[] = raw ? JSON.parse(raw) : [];

      const idx = itens.findIndex(i => i.id === produto.id);
      if (idx >= 0) {
        itens[idx].quantidade += 1;
      } else {
        itens.push(novoItem);
      }

      localStorage.setItem('carrinho', JSON.stringify(itens));

      // Disparar evento para o Data Layer (GA4 / GTM / Clarity)
      trackAddToCart(novoItem, 1);

      // Notificar o Header para atualizar o contador (badge)
      window.dispatchEvent(new Event('cart-updated'));

      setAdicionado(true);
      setTimeout(() => setAdicionado(false), 2000);

      if (redirecionarPara === 'checkout') {
        router.push('/checkout');
      } else {
        router.push('/carrinho');
      }
    } catch {
      router.push('/carrinho');
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2.5 mt-1">
      <button
        type="button"
        onClick={() => adicionarItem('carrinho')}
        className="flex-1 bg-accent text-text text-center font-bold text-sm md:text-base py-3.5 rounded-xl hover:bg-yellow-400 transition shadow-2xs border border-yellow-300 flex items-center justify-center gap-2 cursor-pointer"
      >
        {adicionado ? (
          <>
            <Check size={18} className="text-green-700" />
            <span>Adicionado!</span>
          </>
        ) : (
          <>
            <ShoppingCart size={18} />
            <span>Adicionar ao Carrinho</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => adicionarItem('checkout')}
        className="flex-1 bg-primary text-white text-center font-bold text-sm md:text-base py-3.5 rounded-xl hover:bg-orange-600 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        <Zap size={18} />
        <span>Comprar Agora</span>
      </button>
    </div>
  );
}
