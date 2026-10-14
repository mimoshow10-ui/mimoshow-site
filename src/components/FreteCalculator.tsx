'use client'

import { useState } from 'react';
import { Truck } from 'lucide-react';

export default function FreteCalculator() {
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ prazo: string; valor: string } | null>(null);
  const [erro, setErro] = useState('');

  async function calcular() {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setErro('CEP inválido. Digite 8 números.');
      return;
    }

    setLoading(true);
    setErro('');
    setResultado(null);

    try {
      const r = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await r.json();

      if (dados.erro) {
        setErro('CEP não encontrado. Verifique e tente novamente.');
        setLoading(false);
        return;
      }

      await new Promise(res => setTimeout(res, 400));
      const uf = dados.uf;
      if (uf === 'SP') {
        setResultado({ prazo: '2 a 5 dias úteis', valor: 'Frete Grátis para SP acima de R$ 99 | Ou R$ 14,90' });
      } else {
        setResultado({ prazo: '5 a 12 dias úteis', valor: 'Consulte as opções e prazos no checkout' });
      }
    } catch {
      setErro('Erro ao consultar o CEP. Tente novamente.');
    }

    setLoading(false);
  }

  return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/80 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-secondary flex items-center gap-2 text-base md:text-lg">
          <Truck size={20} className="text-primary" />
          Calcular Frete e Prazo
        </h4>
        <a
          href="https://buscacepinter.correios.com.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline font-medium"
        >
          Não sei meu CEP
        </a>
      </div>
      <div className="flex gap-2.5">
        <input
          type="text"
          value={cep}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 8);
            setCep(v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v);
            setResultado(null);
            setErro('');
          }}
          placeholder="00000-000"
          maxLength={9}
          className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary bg-white font-medium"
          onKeyDown={e => e.key === 'Enter' && calcular()}
        />
        <button
          type="button"
          onClick={calcular}
          disabled={loading}
          className="bg-secondary text-white font-bold px-5 py-2.5 rounded-xl text-sm md:text-base hover:bg-blue-900 transition disabled:opacity-50 shadow-xs"
        >
          {loading ? '...' : 'OK'}
        </button>
      </div>

      {erro && <p className="text-red-500 text-xs md:text-sm mt-2 font-semibold">{erro}</p>}

      {resultado && (
        <div className="mt-3 bg-white border border-green-200 rounded-xl p-3 text-xs md:text-sm">
          <p className="text-gray-500">Previsão de entrega: <strong className="text-secondary font-bold">{resultado.prazo}</strong></p>
          <p className="text-gray-500 mt-1">Frete: <strong className="text-primary font-bold">{resultado.valor}</strong></p>
        </div>
      )}
    </div>
  );
}
