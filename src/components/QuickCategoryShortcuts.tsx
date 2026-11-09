import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import {
  Sparkles,
  Tag,
  Package,
  Layers,
  Flame,
  Award,
  Scissors,
  Compass,
} from 'lucide-react';

export interface SegmentoItem {
  id: string;
  nome: string;
  subtitulo?: string;
  link_url: string;
  imagem_url?: string;
  tag?: string;
  ativo?: boolean;
}

const ATALHOS_FALLBACK: SegmentoItem[] = [
  {
    id: 'adesivos',
    nome: 'Adesivos Pet',
    subtitulo: 'Piercings e EVA Glitter',
    link_url: '/categoria/adesivos',
    imagem_url: 'https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/16597512806/produto_16597512806_10_1788997374469.jpg',
    ativo: true,
  },
  {
    id: 'gravatinhas',
    nome: 'Gravatinhas',
    subtitulo: 'P, M, G em Cetim',
    link_url: '/categoria/gravatinhas',
    imagem_url: 'https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/15982227440/produto_15982227440_0_1789139376067.jpg',
    ativo: true,
  },
  {
    id: 'lacinhos',
    nome: 'Lacinhos',
    subtitulo: 'Apliques e Borrachinhas',
    link_url: '/categoria/lacinhos',
    imagem_url: 'https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/15951711280/produto_15951711280_0_1789157429390.jpg',
    ativo: true,
  },
  {
    id: 'colarinhos',
    nome: 'Colarinhos',
    subtitulo: 'Elegância para Banho & Tosa',
    link_url: '/busca?q=colarinho',
    imagem_url: 'https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/produtos/ms4065/ms4065_1788895887748_1.jpg',
    ativo: true,
  },
  {
    id: 'bandanas',
    nome: 'Bandanas',
    subtitulo: 'Estampas e Acabamento',
    link_url: '/categoria/bandanas',
    imagem_url: 'https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/produtos/MS3375BD-20P/MS3375BD-20P_1788896120253_1.jpg',
    ativo: true,
  },
  {
    id: 'lancamentos',
    nome: 'Lançamentos',
    subtitulo: 'Novidades da Semana',
    link_url: '/busca?ordem=mais_recentes',
    imagem_url: 'https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/produtos/ms4599/ms4599_1788902180741_11.jpg',
    ativo: true,
  },
  {
    id: 'kits',
    nome: 'Kits Econômicos',
    subtitulo: 'Maior Lucro por Unidade',
    link_url: '/busca?q=kit',
    imagem_url: 'https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/15310663798/produto_15310663798_0_1789148623091.jpg',
    ativo: true,
  },
];

// Ícones de contingência caso não haja foto cadastrada
const ICONES_MAP: Record<string, any> = {
  adesivos: Sparkles,
  gravatinhas: Award,
  lacinhos: Scissors,
  colarinhos: Layers,
  bandanas: Tag,
  lancamentos: Flame,
  kits: Package,
};

export default async function QuickCategoryShortcuts() {
  let segmentos: SegmentoItem[] = ATALHOS_FALLBACK;

  try {
    const { data } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'encontre_rapido_segmentos')
      .maybeSingle();

    if (Array.isArray(data?.valor) && data.valor.length > 0) {
      const ativos = data.valor.filter((s: SegmentoItem) => s.ativo !== false);
      if (ativos.length > 0) {
        segmentos = ativos;
      }
    }
  } catch (err) {
    console.warn('[ENCONTRE RAPIDO] Usando atalhos padrão:', err);
  }

  return (
    <div className="w-full space-y-3">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-secondary flex items-center gap-2">
            <span>Encontre por Categoria</span>
          </h2>
        </div>
        <Link
          href="/busca"
          className="text-xs font-bold text-secondary hover:text-primary transition underline hidden sm:inline-block"
        >
          Ver todo o catálogo
        </Link>
      </div>

      {/* Grid no Desktop / Carrossel Horizontal Touch no Mobile */}
      <div className="flex sm:grid sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-7 gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-none snap-x snap-mandatory">
        {segmentos.map((item, index) => {
          const FallbackIcon = ICONES_MAP[item.id] || Compass;

          return (
            <Link
              key={item.id || index}
              href={item.link_url || '/busca'}
              className="flex-shrink-0 w-36 sm:w-auto snap-start p-3 rounded-2xl border border-gray-200/90 bg-white hover:bg-orange-50/40 hover:border-orange-300 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col items-center text-center justify-between group relative shadow-2xs"
            >
              {/* Foto do Segmento com tamanho ampliado */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gray-50 border border-gray-100 shadow-2xs flex items-center justify-center overflow-hidden relative mb-2.5 mt-1 group-hover:scale-105 transition-transform duration-200">
                {item.imagem_url ? (
                  <Image
                    src={item.imagem_url}
                    alt={item.nome}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 96px, 112px"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center text-secondary group-hover:text-primary transition-colors">
                    <FallbackIcon size={32} />
                  </div>
                )}
              </div>

              {/* Textos: Nome do Segmento e Subtítulo */}
              <div className="space-y-0.5 w-full">
                <h3 className="font-heading font-bold text-xs text-secondary group-hover:text-primary transition-colors leading-tight line-clamp-1">
                  {item.nome}
                </h3>
                {item.subtitulo && (
                  <p className="text-[10px] text-gray-500 font-medium leading-tight line-clamp-1">
                    {item.subtitulo}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
