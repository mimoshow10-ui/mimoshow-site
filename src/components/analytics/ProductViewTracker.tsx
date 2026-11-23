'use client';

import { useEffect } from 'react';
import { trackViewItem } from '@/lib/analytics/events';

interface Props {
  produto: {
    id: string;
    nome: string;
    preco: number;
    preco_promocional?: number | null;
    codigo_barras?: string | null;
    sku?: string | null;
    categoria?: string | null;
  };
}

export default function ProductViewTracker({ produto }: Props) {
  useEffect(() => {
    if (produto && produto.id) {
      trackViewItem(produto);
    }
  }, [produto?.id]);

  return null;
}
