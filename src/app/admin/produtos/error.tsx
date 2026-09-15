'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-8 bg-red-50 border border-red-200 rounded-lg m-8">
      <h2 className="text-2xl font-bold text-red-700 mb-4">Algo deu errado nesta página!</h2>
      <div className="bg-white p-4 rounded border border-red-100 overflow-auto mb-4">
        <p className="font-mono text-sm text-red-600 font-bold mb-2">Mensagem do Erro:</p>
        <p className="font-mono text-xs text-gray-800">{error.message}</p>
        
        <p className="font-mono text-sm text-red-600 font-bold mt-4 mb-2">Pilha de Execução (Stack):</p>
        <pre className="font-mono text-xs text-gray-600">{error.stack}</pre>
      </div>
      <button
        onClick={() => reset()}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
      >
        Tentar Novamente
      </button>
    </div>
  );
}
