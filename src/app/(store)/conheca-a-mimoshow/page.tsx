import Image from 'next/image';
import Link from 'next/link';
import {
  Factory,
  Sparkles,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Users,
  Award,
  ArrowRight,
  Heart,
  Store,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conheça a Mimo Show — Fabricante Oficial de Acessórios Pet',
  description:
    'A Mimo Show é fabricante própria de acessórios pet para estética animal, banho & tosa e pet shops. Venda direta da fábrica para todo o Brasil.',
};

export default function ConhecaMimoShowPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Topo / Hero */}
        <div className="bg-gradient-to-br from-secondary via-blue-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl space-y-4 relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-primary/20 text-orange-300 border border-primary/30 text-xs font-black uppercase px-3 py-1 rounded-full">
              <Factory size={14} /> Fabricação Própria Direto da Fábrica
            </span>
            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight leading-tight">
              MIMO SHOW — ACESSÓRIOS PET DIRETO DA FÁBRICA
            </h1>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Somos indústria especializada no desenvolvimento e fabricação própria de acessórios para estética animal. Produzimos laços, gravatas, bandanas, adesivos piercings em EVA glitter e kits econômicos para pet shops e profissionais de banho e tosa em todo o Brasil.
            </p>
          </div>
        </div>

        {/* Pilares da Indústria */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="w-12 h-12 bg-orange-100 text-primary rounded-xl flex items-center justify-center font-bold">
              <Factory size={26} />
            </div>
            <h3 className="font-heading font-black text-lg text-secondary">
              Atuação como Fabricante
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Não somos apenas revendedores ou intermediários. Nós desenhamos, cortamos e confeccionamos cada acessório com maquinário próprio e controle rigoroso de qualidade.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="w-12 h-12 bg-blue-100 text-secondary rounded-xl flex items-center justify-center font-bold">
              <Store size={26} />
            </div>
            <h3 className="font-heading font-black text-lg text-secondary">
              Condições para Revendedores
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Condições comerciais diferenciadas para distribuidores regionais, atacadistas e pet shops de alto volume, garantindo margens atrativas e fornecimento pontual.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
              <Sparkles size={26} />
            </div>
            <h3 className="font-heading font-black text-lg text-secondary">
              Matéria-Prima Selecionada
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Utilizamos fitas de cetim selecionadas, EVA de alta densidade e glitter antialérgico atóxico seguro para cães e gatos de todas as raças e portes.
            </p>
          </div>
        </div>

        {/* Esclarecimento Institucional: Fabricante vs Distribuidor */}
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 space-y-4">
          <div className="flex items-center gap-2 text-amber-900 font-black text-sm uppercase tracking-wider">
            <ShieldCheck size={18} className="text-amber-700" />
            Transparência Comercial & Identidade
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-secondary">
            A Mimo Show é a fabricante da marca
          </h2>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
            Para evitar qualquer dúvida comercial: a <strong>Mimo Show</strong> é a <strong>fábrica oficial</strong> que produz e distribui a linha completa de adereços pet. Nossos distribuidores regionais e parceiros autorizados comercializam produtos genuínos com nossa marca, mantendo a autenticidade e o padrão industrial garantido.
          </p>

          {/* Destaque para os 3 Distribuidores Oficiais */}
          <div className="pt-2">
            <p className="text-xs font-black uppercase text-amber-900 tracking-wider mb-3">
              Distribuidores Oficiais Autorizados:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Komatsu Pet */}
              <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs flex flex-col items-center text-center space-y-2">
                <div className="h-12 w-full relative flex items-center justify-center">
                  <Image src="/distribuidores/komatsu-pet.png" alt="Komatsu Pet" fill className="object-contain" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-secondary">Komatsu Pet</h4>
                  <span className="text-[10px] text-gray-500">Distribuidor Autorizado</span>
                </div>
              </div>

              {/* Antunes Pet */}
              <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs flex flex-col items-center text-center space-y-2">
                <div className="h-12 w-full relative bg-black rounded-lg flex items-center justify-center p-1">
                  <Image src="/distribuidores/antunes-pet.png" alt="Antunes Pet" fill className="object-contain p-1" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-secondary">Antunes Pet</h4>
                  <span className="text-[10px] text-gray-500">Anderson Antunes Vendas Pet</span>
                </div>
              </div>

              {/* Multi Pet 25 */}
              <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs flex flex-col items-center text-center space-y-2">
                <div className="h-12 w-full relative flex items-center justify-center">
                  <Image src="/distribuidores/mult-patas.png" alt="Multi Pet 25" fill className="object-contain" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-secondary">Multi Pet 25</h4>
                  <span className="text-[10px] text-gray-500">Mult Patas • Atacado Pet</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-secondary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-blue-900 transition shadow-xs"
            >
              <span>Ver Catálogo Completo Direto da Fábrica</span>
              <ArrowRight size={14} />
            </Link>
            <a
              href="https://wa.me/5511930813280?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20as%20condi%C3%A7%C3%B5es%20direto%20da%20f%C3%A1brica%20Mimo%20Show"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-xs"
            >
              <span>📱 Falar com a Fábrica no WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Diferenciais Comerciais Reais */}
        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-xs space-y-6">
          <h3 className="text-xl font-heading font-black text-secondary">
            Compromisso com o Profissional de Banho & Tosa
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-700">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Preço real de fábrica:</strong> Economia comprovada por unidade em kits com 20, 50, 100 e 200 peças.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Variedade incomparável:</strong> Mais de 3.000 modelos ativos para todas as estações do ano.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Despacho rápido:</strong> Envio imediato para transportadoras e Correios com código de rastreamento.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Pagamento transparente:</strong> Pagamento via Pix com desconto e parcelamento seguro em cartão.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
