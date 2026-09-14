import CategoryNavClient from './CategoryNavClient';
import { supabase } from '@/lib/supabase';

export default async function CategoryNav() {
  const { data: allCategories } = await supabase
    .from('categorias')
    .select('id, nome, slug, parent_id')
    .order('nome');

  const all = allCategories || [];
  const pais = all.filter(c => c.parent_id === null);

  if (pais.length === 0) return null;

  return <CategoryNavClient pais={pais} all={all} emojis={{}} />;
}

