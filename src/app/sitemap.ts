import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { hasValidPhoto } from '@/lib/productFilter';

const BASE_URL = 'https://www.mimoshow.com.br';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hora de cache no sitemap

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const agora = new Date().toISOString();

  // Rotas fixas importantes
  const rotasFixas: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: agora,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/conheca-a-mimoshow`,
      lastModified: agora,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/busca`,
      lastModified: agora,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/rastreamento`,
      lastModified: agora,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Buscar categorias ativas
  let rotasCategorias: MetadataRoute.Sitemap = [];
  try {
    const { data: categorias } = await supabase
      .from('categorias')
      .select('slug, criado_em')
      .order('criado_em', { ascending: false });

    if (categorias && categorias.length > 0) {
      rotasCategorias = categorias.map((cat) => ({
        url: `${BASE_URL}/categoria/${cat.slug}`,
        lastModified: cat.criado_em || agora,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }
  } catch (e) {
    console.warn('[SITEMAP] Erro ao carregar categorias:', e);
  }

  // Buscar produtos ativos com foto
  let rotasProdutos: MetadataRoute.Sitemap = [];
  try {
    const { data: produtos } = await supabase
      .from('produtos')
      .select('slug, imagens, criado_em')
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(1000);

    if (produtos && produtos.length > 0) {
      rotasProdutos = produtos
        .filter(hasValidPhoto)
        .map((p) => ({
          url: `${BASE_URL}/produto/${p.slug}`,
          lastModified: p.criado_em || agora,
          changeFrequency: 'weekly',
          priority: 0.7,
        }));
    }
  } catch (e) {
    console.warn('[SITEMAP] Erro ao carregar produtos:', e);
  }

  return [...rotasFixas, ...rotasCategorias, ...rotasProdutos];
}
