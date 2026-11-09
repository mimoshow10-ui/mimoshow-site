'use client';

import { useState, useEffect } from 'react';
import { Check, Sparkles, Tag } from 'lucide-react';
import { CupomDesconto } from '@/lib/types/coupon';

export default function HomeCouponsBanner() {
  const [cupons, setCupons] = useState<CupomDesconto[]>([]);
  const [coletados, setColetados] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function carregarCupons() {
      try {
        const res = await fetch('/api/cupons/disponiveis');
        if (res.ok) {
          const data = await res.json();
          setCupons(data.cupons || []);
        }
      } catch {}
    }

    try {
      const raw = localStorage.getItem('cupons_coletados');
      if (raw) setColetados(JSON.parse(raw));
    } catch {}

    carregarCupons();
  }, []);

  function coletarCupom(c: Partial<CupomDesconto>) {
    try {
      if (!c.codigo) return;
      const novos = { ...coletados, [c.codigo]: true };
      setColetados(novos);
      localStorage.setItem('cupons_coletados', JSON.stringify(novos));
      localStorage.setItem('cupom_ativo_codigo', c.codigo);
      navigator.clipboard.writeText(c.codigo);
    } catch {}
  }

  const listaExibida: Partial<CupomDesconto>[] = cupons.length > 0 ? cupons : [
    { id: '1', codigo: 'BEMVINDO10', tipo: 'percentual', valor: 10, compra_minima: 50, nome_interno: 'Cupom de Boas-Vindas 10% OFF' },
    { id: '2', codigo: 'FRETEGRATIS', tipo: 'frete_gratis', valor: 0, compra_minima: 99, nome_interno: 'Cupom Frete Grátis acima R$ 99' },
    { id: '3', codigo: 'MIMO15', tipo: 'fixo', valor: 15, compra_minima: 120, nome_interno: 'Super Desconto R$ 15 OFF' },
  ];

  return (
    <div className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-500 py-3.5 px-4 text-white shadow-sm border-b border-indigo-700/40">
      <div className="max-w-7xl xl:max-w-[980px] 2xl:max-w-6xl min-[1800px]:max-w-7xl mx-auto">
        {/* Grid de Cupons no estilo Azul com Rosa adaptativo */}
        <div className={`grid gap-3 ${
          listaExibida.length === 1
            ? 'grid-cols-1 max-w-md mx-auto'
            : listaExibida.length === 2
            ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
            : listaExibida.length === 4
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
        }`}>
          {listaExibida.map((c) => {
            const isColetado = !!coletados[c.codigo!];
            const tipo = (c as any).tipo_desconto || c.tipo;
            const valor = (c as any).valor_desconto !== undefined ? (c as any).valor_desconto : c.valor;
            const badgeTexto = tipo === 'percentual'
              ? `${valor}% OFF`
              : tipo === 'fixo'
              ? `R$ ${valor} OFF`
              : 'FRETE GRÁTIS';

            return (
              <div
                key={c.codigo}
                className="bg-white text-gray-900 rounded-2xl p-3 md:p-3.5 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-pink-500 border border-gray-200 flex items-center justify-between gap-3 group relative"
              >
                {/* Detalhes do Cupom */}
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-gradient-to-r from-pink-600 to-rose-500 text-white font-black text-xs md:text-sm px-2 py-0.5 rounded-md uppercase tracking-tight shadow-2xs">
                      {badgeTexto}
                    </span>
                    <span className="font-mono font-black text-xs bg-blue-50 text-blue-900 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
                      <Tag size={11} className="text-pink-500" />
                      {c.codigo}
                    </span>
                  </div>
                  
                  {/* Nome/Descrição do Cupom */}
                  <p className="text-xs md:text-sm font-black text-gray-900 line-clamp-1 group-hover:text-blue-600 transition leading-snug">
                    {c.nome_interno}
                  </p>
                </div>

                {/* Botão de Coletar Rosa/Azul */}
                <button
                  type="button"
                  onClick={() => coletarCupom(c)}
                  className={`px-4 py-2 rounded-xl text-xs md:text-sm font-black transition-all duration-200 flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                    isColetado
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-xs active:scale-95'
                  }`}
                >
                  {isColetado ? (
                    <>
                      <Check size={14} />
                      <span>Coletado</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Pegar</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
