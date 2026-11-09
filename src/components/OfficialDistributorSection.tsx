import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Award, Factory, Sparkles, Truck, CheckCircle2 } from 'lucide-react';

export default function OfficialDistributorSection() {
  return (
    <section className="w-full bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-blue-500/10 rounded-2xl border border-amber-200/80 p-3 md:p-4 shadow-2xs">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Lado Esquerdo: Logo Mimoshow & Selos de Fabricante */}
        <div className="flex items-center gap-3 text-left flex-shrink-0">
          <div className="relative w-28 h-14 bg-white rounded-xl p-2 shadow-2xs border border-amber-100 flex items-center justify-center flex-shrink-0">
            <Image
              src="/logo-mimoshow.png"
              alt="Mimo Show — Fabricante Oficial de Acessórios Pet"
              width={110}
              height={45}
              className="object-contain max-h-10 w-auto"
            />
            <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white p-0.5 rounded-full shadow-2xs" title="Fabricação Própria">
              <Award size={12} />
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs">
              <Factory size={11} className="text-orange-700" />
              Fabricante Oficial — Produção Própria
            </span>
            <h3 className="text-xs md:text-sm font-heading font-black text-secondary">
              MIMO SHOW Indústria & Acessórios Pet
            </h3>
            <p className="text-[10px] text-gray-500 font-medium max-w-sm leading-tight">
              Venda direta da fábrica sem intermediários. Fornecimento contínuo para pet shops, banho & tosa e distribuidores autorizados em todo o Brasil.
            </p>
          </div>
        </div>

        {/* Lado Direito: 4 Pilares da Indústria */}
        <div className="grid grid-cols-2 gap-2 w-full md:max-w-md">
          <div className="bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-amber-100/90 shadow-2xs flex items-center gap-2">
            <div className="p-1 bg-amber-100 text-amber-800 rounded-lg flex-shrink-0">
              <Factory size={13} />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-gray-900 leading-tight">Direto da Fábrica</h4>
              <p className="text-[9px] text-gray-500 leading-tight">Preço real de produtor.</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-blue-100/90 shadow-2xs flex items-center gap-2">
            <div className="p-1 bg-blue-100 text-blue-800 rounded-lg flex-shrink-0">
              <Sparkles size={13} />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-gray-900 leading-tight">Acabamento Premium</h4>
              <p className="text-[9px] text-gray-500 leading-tight">EVA glitter atóxico.</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-green-100/90 shadow-2xs flex items-center gap-2">
            <div className="p-1 bg-green-100 text-green-800 rounded-lg flex-shrink-0">
              <CheckCircle2 size={13} />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-gray-900 leading-tight">100% Autêntico</h4>
              <p className="text-[9px] text-gray-500 leading-tight">Garantia Mimo Show.</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-orange-100/90 shadow-2xs flex items-center gap-2">
            <div className="p-1 bg-orange-100 text-orange-800 rounded-lg flex-shrink-0">
              <Truck size={13} />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-gray-900 leading-tight">Pronta Entrega</h4>
              <p className="text-[9px] text-gray-500 leading-tight">Despacho ágil diário.</p>
            </div>
          </div>
        </div>

      </div>

      <div className="mt-2 pt-2 border-t border-amber-200/50 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] font-bold text-amber-900">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span>Indústria brasileira especializada em estética animal, banho & tosa e venda direta para atacadistas e pet shops.</span>
        </div>
        <Link
          href="/conheca-a-mimoshow"
          className="inline-flex items-center gap-1 text-[10px] font-black text-orange-900 hover:text-primary underline whitespace-nowrap"
        >
          <span>Conhecer a Fábrica & Distribuidores</span>
          <span>&rarr;</span>
        </Link>
      </div>
    </section>
  );
}
