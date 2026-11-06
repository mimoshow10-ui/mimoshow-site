'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, ShoppingBag } from 'lucide-react';

export default function GlobalStoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro de renderização na loja:', error);
  }, [error]);

  return (
    <div className="min-h-[65vh] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center space-y-6">
        
        <div className="w-16 h-16 bg-orange-100 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag size={32} />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-bold text-secondary">
            Ops! Algo deu errado
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Houve uma oscilação temporária de conexão. Clique no botão abaixo para tentar novamente.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 bg-primary hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw size={16} />
            <span>Tentar Novamente</span>
          </button>
          
          <Link
            href="/"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-secondary font-bold py-3 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2"
          >
            <Home size={16} />
            <span>Página Inicial</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
