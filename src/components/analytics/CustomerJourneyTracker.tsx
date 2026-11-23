'use client';

import { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView, trackCartAbandonment } from '@/lib/analytics/events';

function TrackerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string>('');

  // 1. Rastreamento automático de mudança de rota (SPA Page Views)
  useEffect(() => {
    if (!pathname) return;

    const queryString = searchParams?.toString();
    const fullPath = queryString ? `${pathname}?${queryString}` : pathname;

    if (fullPath !== lastPathRef.current) {
      lastPathRef.current = fullPath;
      trackPageView(fullPath);
    }
  }, [pathname, searchParams]);

  // 2. Detecção de Abandono de Carrinho (ao fechar aba ou sair do site com itens no carrinho)
  useEffect(() => {
    function handleBeforeUnload() {
      try {
        // Não disparar abandono se o usuário estiver concluindo compra no rastreamento
        if (window.location.pathname.includes('/rastreamento')) return;

        const cartRaw = localStorage.getItem('carrinho');
        if (!cartRaw) return;

        const itens = JSON.parse(cartRaw);
        if (Array.isArray(itens) && itens.length > 0) {
          const total = itens.reduce(
            (sum: number, item: any) => sum + (Number(item.preco_unitario || item.preco || 0) * Number(item.quantidade || 1)),
            0
          );
          trackCartAbandonment(itens, total);
        }
      } catch {}
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return null;
}

export default function CustomerJourneyTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerContent />
    </Suspense>
  );
}
