import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import ImportBlingForm from '@/components/ImportBlingForm';
import ImportadorLoteModal from '@/components/ImportadorLoteModal';
import TabelaProdutosComEdicaoEmMassa from '@/components/TabelaProdutosComEdicaoEmMassa';
import AdminFiltrosAvancados from '@/components/AdminFiltrosAvancados';
import { getFamilyConfig } from '@/lib/familyManager';
import { getOcultosVitrine } from '@/lib/vitrineManager';

import { hasValidPhoto } from '@/lib/productFilter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminProdutos(props: {
  searchParams: Promise<{
    msg?: string;
    erro?: string;
    q?: string;
    pagina?: string;
    limite?: string;
    grupo_id?: string;
    subgrupo_id?: string;
    com_foto?: string;
    promocao?: string;
    status?: string;
    classificacao?: string;
    qtd_fotos?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams.q || '';
  const grupo_id = searchParams.grupo_id || '';
  const subgrupo_id = searchParams.subgrupo_id || '';
  const com_foto = searchParams.com_foto || '';
  const promocao = searchParams.promocao || '';
  const status = searchParams.status || '';
  const classificacao = searchParams.classificacao || '';
  const qtd_fotos = searchParams.qtd_fotos || '';
  const pagina = Math.max(1, Number(searchParams.pagina) || 1);
  const limite = Math.max(1, Number(searchParams.limite) || 100);
  const offset = (pagina - 1) * limite;

  const { data: todasCategorias } = await supabase.from('categorias').select('id, nome, parent_id').order('nome');

  let countQuery = supabase.from('produtos').select('*', { count: 'exact', head: true });
  let query = supabase.from('produtos').select('*, categorias(id, nome, parent_id)').order('nome');

  // Smart Search by name, SKU or barcode
  if (q) {
    const qClean = q.replace(/[\s\-_]+/g, '');
    const numOnly = q.replace(/\D/g, '');
    const filters = [`nome.ilike.%${q}%`, `codigo_barras.ilike.%${q}%`];

    if (qClean && qClean !== q) {
      filters.push(`codigo_barras.ilike.%${qClean}%`);
      filters.push(`nome.ilike.%${qClean}%`);
    }
    if (numOnly.length >= 3 && numOnly !== q && numOnly !== qClean) {
      filters.push(`codigo_barras.ilike.%${numOnly}%`);
      filters.push(`bling_id.eq.${numOnly}`);
    }

    const orQuery = filters.join(',');
    countQuery = countQuery.or(orQuery);
    query = query.or(orQuery);
  }

  // Buscar ambos os mapas de categorias adicionais em configuracoes
  const { data: addCatDb1 } = await supabase.from('configuracoes').select('valor').eq('chave', 'produtos_categorias_adicionais').maybeSingle();
  const { data: addCatDb2 } = await supabase.from('configuracoes').select('valor').eq('chave', 'produto_categorias_map').maybeSingle();
  const map1: Record<string, string[]> = addCatDb1?.valor || {};
  const map2: Record<string, string[]> = addCatDb2?.valor || {};

  const adicionaisMap: Record<string, string[]> = {};
  for (const [pId, cats] of Object.entries(map1)) {
    adicionaisMap[pId] = Array.isArray(cats) ? [...cats] : [];
  }
  for (const [pId, cats] of Object.entries(map2)) {
    if (Array.isArray(cats)) {
      adicionaisMap[pId] = Array.from(new Set([...(adicionaisMap[pId] || []), ...cats]));
    }
  }

  // Filter by Subgrupo or Grupo (incluindo categorias principais e adicionais)
  if (subgrupo_id || grupo_id) {
    const targetCatIds = subgrupo_id
      ? [subgrupo_id]
      : [grupo_id, ...(todasCategorias || []).filter(c => c.parent_id === grupo_id).map(c => c.id)];

    const addProdIds: string[] = [];
    for (const [pId, catIdsArr] of Object.entries(adicionaisMap)) {
      if (Array.isArray(catIdsArr) && catIdsArr.some(cId => targetCatIds.includes(cId))) {
        addProdIds.push(pId);
      }
    }

    if (addProdIds.length > 0 && addProdIds.length <= 100) {
      countQuery = countQuery.or(`categoria_id.in.(${targetCatIds.join(',')}),id.in.(${addProdIds.join(',')})`);
      query = query.or(`categoria_id.in.(${targetCatIds.join(',')}),id.in.(${addProdIds.join(',')})`);
    } else {
      countQuery = countQuery.in('categoria_id', targetCatIds);
      query = query.in('categoria_id', targetCatIds);
    }
  }

  // Filter by Com Foto vs Sem Foto
  if (com_foto === 'sim') {
    countQuery = countQuery.not('imagens', 'is', null).neq('imagens', '{}');
    query = query.not('imagens', 'is', null).neq('imagens', '{}');
  } else if (com_foto === 'nao') {
    countQuery = countQuery.or('imagens.is.null,imagens.eq.{}');
    query = query.or('imagens.is.null,imagens.eq.{}');
  }

  // Filter by exact photo count (1 to 10+)
  if (qtd_fotos) {
    const n = parseInt(qtd_fotos, 10);
    if (!isNaN(n) && n >= 1 && n <= 9) {
      countQuery = countQuery.not(`imagens->${n - 1}`, 'is', null).is(`imagens->${n}`, null);
      query = query.not(`imagens->${n - 1}`, 'is', null).is(`imagens->${n}`, null);
    } else if (n >= 10) {
      countQuery = countQuery.not(`imagens->9`, 'is', null);
      query = query.not(`imagens->9`, 'is', null);
    }
  }

  // Filter by Promotion (Vitrine Promoção / Preço Promocional)
  if (promocao === 'sim') {
    countQuery = countQuery.or('destaque_super_promocao.is.true,preco_promocional.gt.0');
    query = query.or('destaque_super_promocao.is.true,preco_promocional.gt.0');
  }

  // Filter by Status (Ativo vs Inativo)
  if (status === 'ativo') {
    countQuery = countQuery.eq('ativo', true);
    query = query.eq('ativo', true);
  } else if (status === 'inativo') {
    countQuery = countQuery.eq('ativo', false);
    query = query.eq('ativo', false);
  }

  const { count: totalNoBanco } = await countQuery;
  const { data: produtos, error } = await query.range(offset, offset + limite - 1);
  const totalPaginas = Math.ceil((totalNoBanco || 0) / limite) || 1;

  const catMap = new Map<string, { id: string; nome: string; parent_id: string | null }>();
  (todasCategorias || []).forEach(c => catMap.set(c.id, c));

  const categoriasFormatadas = (todasCategorias || []).map(cat => {
    if (cat.parent_id && catMap.has(cat.parent_id)) {
      const pai = catMap.get(cat.parent_id);
      return {
        id: cat.id,
        nome: `${pai?.nome} > ${cat.nome}`,
        nomePuro: cat.nome,
        parentNome: pai?.nome,
        isSub: true,
        parent_id: cat.parent_id,
      };
    }
    return {
      id: cat.id,
      nome: cat.nome,
      nomePuro: cat.nome,
      parentNome: null,
      isSub: false,
      parent_id: null,
    };
  });

  let produtosFormatados = (produtos || []).map(p => {
    let catNome = 'Sem Categoria';
    let statusClassificacao: 'ok' | 'apenas_grupo' | 'sem_categoria' = 'sem_categoria';

    const mainCatId = p.categoria_id;
    const addCatIds: string[] = adicionaisMap[p.id] || [];
    const allCatIds = Array.from(new Set([mainCatId, ...addCatIds].filter(Boolean)));

    if (allCatIds.length > 0) {
      let temSub = false;
      let temGrupo = false;
      let nomeCompleto = '';

      for (const cid of allCatIds) {
        if (catMap.has(cid)) {
          const cat = catMap.get(cid)!;
          if (cat.parent_id && catMap.has(cat.parent_id)) {
            temSub = true;
            temGrupo = true;
            const pai = catMap.get(cat.parent_id)!;
            nomeCompleto = `${pai.nome} > ${cat.nome}`;
            break;
          } else {
            temGrupo = true;
            if (!nomeCompleto) nomeCompleto = cat.nome;
          }
        }
      }

      if (nomeCompleto) catNome = nomeCompleto;

      if (temSub) {
        statusClassificacao = 'ok';
      } else if (temGrupo) {
        statusClassificacao = 'apenas_grupo';
      }
    } else if (p.categorias?.nome) {
      catNome = p.categorias.nome;
      statusClassificacao = p.categorias.parent_id ? 'ok' : 'apenas_grupo';
    }

    return { 
      ...p, 
      categoria_nome_exibicao: catNome,
      status_classificacao: statusClassificacao 
    };
  });

  if (com_foto === 'sim') {
    produtosFormatados = produtosFormatados.filter(p => hasValidPhoto(p));
  } else if (com_foto === 'nao') {
    produtosFormatados = produtosFormatados.filter(p => !hasValidPhoto(p));
  }

  if (classificacao === 'ok') {
    produtosFormatados = produtosFormatados.filter(p => p.status_classificacao === 'ok');
  } else if (classificacao === 'apenas_grupo') {
    produtosFormatados = produtosFormatados.filter(p => p.status_classificacao === 'apenas_grupo');
  } else if (classificacao === 'sem_categoria') {
    produtosFormatados = produtosFormatados.filter(p => p.status_classificacao === 'sem_categoria');
  }

  const familyConfig = await getFamilyConfig();
  const paiIds = new Set(Object.keys(familyConfig.productToFamilyMap));

  function createPaginationUrl(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (grupo_id) params.set('grupo_id', grupo_id);
    if (subgrupo_id) params.set('subgrupo_id', subgrupo_id);
    if (com_foto) params.set('com_foto', com_foto);
    if (promocao) params.set('promocao', promocao);
    if (status) params.set('status', status);
    if (classificacao) params.set('classificacao', classificacao);
    if (searchParams.limite) params.set('limite', searchParams.limite);
    params.set('pagina', String(targetPage));
    return `/admin/produtos?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl relative font-bold text-xs">
          <strong>Erro do Supabase:</strong> {error.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-heading font-bold text-secondary">Produtos</h1>
            <span className="bg-orange-100 text-primary border border-orange-200 text-xs font-black px-3 py-1 rounded-full shadow-2xs">
              📦 Total Encontrado: {totalNoBanco || 0} produto(s)
            </span>
            <span className="bg-blue-50 text-secondary border border-blue-200 text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
              📄 Página {pagina} de {totalPaginas} ({limite} por página)
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Gerencie os anúncios, preços, estoques e edições em massa da loja.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ImportadorLoteModal />
          <Link 
            href="/admin/produtos/novo" 
            className="bg-primary text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-orange-600 transition text-xs font-bold shadow-xs"
          >
            <Plus size={18} />
            <span>Novo Produto</span>
          </Link>
        </div>
      </div>

      {searchParams.msg && (
        <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-2xl font-bold text-xs">
          ✅ {searchParams.msg}
        </div>
      )}

      {searchParams.erro && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-2xl font-bold text-xs">
          ❌ ERRO: {searchParams.erro}
        </div>
      )}

      {/* Importação do Bling Individual */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <h3 className="font-bold text-secondary text-sm mb-1">Importar SKU do Bling</h3>
            <p className="text-xs text-gray-500 mb-3">Digite o código SKU exato para buscar e cadastrar produto individual.</p>
            <ImportBlingForm />
          </div>
        </div>
      </div>

      {/* Componente de Filtros Avançados Ticáveis (Grupo, Subgrupo, Foto, Promoção, Status, SKU) */}
      <AdminFiltrosAvancados categorias={todasCategorias || []} />

      {/* Tabela Interativa de Produtos com Seleção e Edição em Massa */}
      <TabelaProdutosComEdicaoEmMassa
        produtos={produtosFormatados || []}
        categorias={categoriasFormatadas || []}
        paiIds={paiIds}
        ocultosVitrineIniciais={Array.from(await getOcultosVitrine())}
      />

      {/* Navegação de Paginação */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-xs text-xs font-bold text-gray-600 gap-3">
        <span>
          Exibindo anúncios <strong className="text-primary font-black">{(pagina - 1) * limite + 1} a {Math.min(pagina * limite, totalNoBanco || 0)}</strong> nesta página (<strong>{limite} anúncios por página</strong> • Total de <strong>{totalNoBanco || 0}</strong> produtos em {totalPaginas} páginas)
        </span>
        <div className="flex items-center gap-2">
          {pagina > 1 && (
            <Link 
              href={createPaginationUrl(pagina - 1)} 
              className="bg-gray-100 hover:bg-gray-200 text-secondary font-bold px-4 py-2 rounded-xl transition border border-gray-300"
            >
              &larr; Página Anterior
            </Link>
          )}
          {pagina < totalPaginas && (
            <Link 
              href={createPaginationUrl(pagina + 1)} 
              className="bg-primary hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl transition shadow-2xs"
            >
              Próxima Página &rarr;
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
