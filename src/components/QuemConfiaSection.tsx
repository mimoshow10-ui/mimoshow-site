import Image from 'next/image';
import { ShieldCheck, MapPin, Building2, Quote, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface DistribuidorParceiro {
  id: string;
  nome: string;
  regiao: string;
  cidade_uf: string;
  logo_url?: string;
  depoimento?: string;
  tipo: 'distribuidor' | 'atacadista' | 'petshop_referencia';
  aprovado: boolean;
}

// Parceiros padrão: Komatsu Pet, Antunes Pet e Multi Pet 25 (Mult Patas)
const DISTRIBUIDORES_PADRAO: DistribuidorParceiro[] = [
  {
    id: 'dist-komatsu',
    nome: 'Komatsu Pet',
    regiao: 'Distribuidor Autorizado',
    cidade_uf: 'São Paulo - SP',
    logo_url: '/distribuidores/komatsu-pet.png',
    depoimento: 'Giro rápido, acabamento impecável e alta procura pelos profissionais de banho e tosa em toda a linha de laços e gravatas.',
    tipo: 'distribuidor',
    aprovado: true,
  },
  {
    id: 'dist-antunes',
    nome: 'Antunes Pet',
    regiao: 'Anderson Antunes Vendas Pet',
    cidade_uf: 'São Paulo - SP',
    logo_url: '/distribuidores/antunes-pet.png',
    depoimento: 'Parceria sólida com a fábrica Mimo Show. Produtos com qualidade de ponta e variedade incomparável para o setor pet.',
    tipo: 'distribuidor',
    aprovado: true,
  },
  {
    id: 'dist-mult-patas',
    nome: 'Multi Pet 25',
    regiao: 'Mult Patas • Atacado Pet',
    cidade_uf: 'São Paulo - SP',
    logo_url: '/distribuidores/mult-patas.png',
    depoimento: 'Seu negócio pet passa por aqui. Fornecimento contínuo direto da fábrica garantindo excelência e custo-benefício.',
    tipo: 'distribuidor',
    aprovado: true,
  },
];

export default async function QuemConfiaSection() {
  let distribuidores: DistribuidorParceiro[] = DISTRIBUIDORES_PADRAO;

  try {
    const { data } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'distribuidores_autorizados')
      .maybeSingle();

    if (Array.isArray(data?.valor) && data.valor.length > 0) {
      // Exibir exclusivamente distribuidores marcados como aprovados
      const aprovados = data.valor.filter((d: DistribuidorParceiro) => d.aprovado);
      if (aprovados.length > 0) {
        distribuidores = aprovados;
      }
    }
  } catch (e) {
    console.warn('[QUEM CONFIA] Usando parceiros padrão:', e);
  }

  return (
    <section className="w-full bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
      {/* Título e Subtítulo */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-wider mb-1">
            <Award size={14} /> Quem confia na Mimo Show
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-secondary">
            Distribuidores Autorizados
          </h2>
        </div>
        <p className="text-xs text-gray-500 max-w-md sm:text-right">
          Grandes atacadistas e distribuidores autorizados que abastecem pet shops e banho & tosa com a nossa fabricação própria.
        </p>
      </div>

      {/* Grid de Cards de Distribuidores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {distribuidores.map((item) => {
          const isDarkLogo = item.logo_url?.includes('antunes');
          return (
            <div
              key={item.id}
              className="bg-white hover:bg-gray-50/60 rounded-2xl border border-gray-200/90 p-5 space-y-4 transition duration-200 hover:shadow-md hover:border-primary/40 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Cabeçalho do Card: Logo Real e Badge Autorizado */}
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`h-14 w-36 relative rounded-xl border p-1.5 flex items-center justify-center overflow-hidden shadow-2xs ${
                      isDarkLogo ? 'bg-black border-neutral-800' : 'bg-white border-gray-100'
                    }`}
                  >
                    {item.logo_url ? (
                      <Image
                        src={item.logo_url}
                        alt={item.nome}
                        fill
                        className="object-contain p-1"
                        sizes="144px"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 text-secondary">
                        <Building2 size={18} />
                        <span className="font-bold text-xs">{item.nome}</span>
                      </div>
                    )}
                  </div>

                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1 flex-shrink-0 shadow-2xs">
                    <ShieldCheck size={12} className="text-emerald-600" /> Distribuidor Autorizado
                  </span>
                </div>

                <div>
                  <h3 className="font-heading font-black text-secondary text-base leading-tight">
                    {item.nome}
                  </h3>
                  <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={11} className="text-primary flex-shrink-0" />
                    {item.cidade_uf} • {item.regiao}
                  </span>
                </div>

                {item.depoimento && (
                  <div className="relative pt-1 text-xs text-gray-600 italic leading-relaxed bg-gray-50/90 p-3 rounded-xl border border-gray-100 shadow-2xs">
                    <Quote size={13} className="text-gray-300 absolute top-2 right-2" />
                    "{item.depoimento}"
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-semibold text-gray-400">
                <span>Linha Mimo Show</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Distribuição Ativa
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Banner Informativo para Novos Distribuidores */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-blue-950 font-medium">
          <ShieldCheck size={18} className="text-blue-700 flex-shrink-0" />
          <span>Quer se tornar um distribuidor autorizado da Mimo Show em sua região?</span>
        </div>
        <a
          href="https://wa.me/5511930813280?text=Ol%C3%A1%2C%20gostaria%20de%20informa%C3%A7%C3%B5es%20para%20ser%20distribuidor%20Mimo%20Show"
          target="_blank"
          rel="noreferrer"
          className="bg-secondary hover:bg-blue-900 text-white font-bold px-4 py-2 rounded-xl transition whitespace-nowrap shadow-2xs"
        >
          Falar com Comercial da Fábrica
        </a>
      </div>
    </section>
  );
}
