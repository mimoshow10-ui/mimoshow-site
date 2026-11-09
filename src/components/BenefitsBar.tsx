'use client';

import { CreditCard, Percent, Factory, ShieldCheck, Sparkles, Store } from 'lucide-react';

export default function BenefitsBar() {
  const diferenciais = [
    {
      icon: Factory,
      titulo: 'DIRETO DA FÁBRICA',
      subtitulo: 'Produção própria sem intermediários',
      bgColor: 'bg-gradient-to-br from-orange-500 to-amber-600',
      boxBg: 'hover:bg-orange-50/50',
      borderColor: 'border-orange-200',
      tagColor: 'text-orange-700',
    },
    {
      icon: Percent,
      titulo: '5% OFF NO PIX',
      subtitulo: 'Desconto automático imediato',
      bgColor: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      boxBg: 'hover:bg-emerald-50/50',
      borderColor: 'border-emerald-200',
      tagColor: 'text-emerald-700',
    },
    {
      icon: CreditCard,
      titulo: 'ATÉ 4X SEM JUROS',
      subtitulo: 'Parcelamento no cartão de crédito',
      bgColor: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      boxBg: 'hover:bg-purple-50/50',
      borderColor: 'border-purple-200',
      tagColor: 'text-purple-700',
    },
    {
      icon: Store,
      titulo: 'ATACADO & PET SHOPS',
      subtitulo: 'Condições para revenda e banho e tosa',
      bgColor: 'bg-gradient-to-br from-sky-500 to-blue-600',
      boxBg: 'hover:bg-sky-50/50',
      borderColor: 'border-sky-200',
      tagColor: 'text-blue-700',
    },
  ];

  return (
    <div className="w-full bg-white border-y border-gray-100 py-4 px-4 shadow-xs">
      <div className="max-w-7xl xl:max-w-[980px] 2xl:max-w-6xl min-[1800px]:max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {diferenciais.map((item, index) => {
          const Icone = item.icon;
          return (
            <div
              key={index}
              className={`flex items-center gap-3.5 p-2.5 rounded-2xl ${item.boxBg} border border-transparent hover:border-gray-200 transition-all duration-200`}
            >
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${item.bgColor} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icone size={22} strokeWidth={2.4} />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-heading font-black text-xs sm:text-sm text-gray-900 uppercase tracking-tight leading-tight">
                  {item.titulo}
                </h4>
                <p className="text-[11px] font-semibold text-gray-500 leading-tight">
                  {item.subtitulo}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
