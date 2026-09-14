import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import CategorySelector from '@/components/CategorySelector';
import ImageManager from '@/components/ImageManager';
import VariacaoManager from '@/components/VariacaoManager';
import { getFamilyConfig } from '@/lib/familyManager';
import { getOcultosVitrine, setProdutoOcultoVitrine } from '@/lib/vitrineManager';

async function atualizarProduto(formData: FormData) {
  'use server'
  const id = formData.get('id') as string;
  const nome = (formData.get('nome') as string || '').trim();
  
  const preco_raw = (formData.get('preco') as string || '0').replace(/[^0-9.,]/g, '').replace(',', '.');
  const preco = parseFloat(preco_raw) || 0;
  
  const preco_promocional_raw = (formData.get('preco_promocional') as string || '').replace(/[^0-9.,]/g, '').replace(',', '.');
  const preco_promocional = preco_promocional_raw ? parseFloat(preco_promocional_raw) || null : null;

  const estoque_raw = (formData.get('estoque') as string || '0').replace(/[^0-9]/g, '');
  const estoque = parseInt(estoque_raw, 10) || 0;

  const categoria_id = (formData.get('categoria_id') as string) || null;
  
  // Convert imagens textarea content to array
  const imagensTxt = formData.get('imagens') as string;
  const imagensArr = imagensTxt ? imagensTxt.split(/[\r\n,]+/).map(s => s.trim()).filter(s => s) : [];
  
  // Video URL
  const video_url = formData.get('video_url') as string;

  // Extract related products
  const relacionadosTxt = formData.get('relacionados') as string;
  const relacionadosArr = relacionadosTxt ? relacionadosTxt.split(',').map(s => s.trim()).filter(s => s) : [];

  const codigo_barras = formData.get('codigo_barras') as string;

  // Data de Início do Período de Promoção
  const promocao_inicio_em = formData.get('promocao_inicio_em') as string;
  let inicioIso = null;
  if (promocao_inicio_em) {
    const dateStr = promocao_inicio_em.length === 16 ? `${promocao_inicio_em}:00-03:00` : promocao_inicio_em;
    inicioIso = new Date(dateStr).toISOString();
  }

  // Data de Fim do Período de Promoção
  const promocao_expira_em = formData.get('promocao_expira_em') as string;
  let expiraIso = null;
  if (promocao_expira_em) {
    const dateStr = promocao_expira_em.length === 16 ? `${promocao_expira_em}:00-03:00` : promocao_expira_em;
    expiraIso = new Date(dateStr).toISOString();
  }

  const destaque_home = formData.get('destaque_home') as string;
  const isSuperPromo = destaque_home === 'super_promocao';

  const payload: any = { 
    nome, 
    codigo_barras,
    preco, 
    preco_promocional,
    estoque, 
    video_url: video_url || null,
    categoria_id: categoria_id || null, 
    imagens: imagensArr.length > 0 ? imagensArr : null,
    produtos_relacionados: relacionadosArr.length > 0 ? relacionadosArr : null,
    destaque_super_promocao: isSuperPromo,
    promocao_expira_em: expiraIso
  };

  if (inicioIso) {
    payload.promocao_inicio_em = inicioIso;
  }

  let { error } = await supabase.from('produtos').update(payload).eq('id', id);
  
  // Resiliência de esquema: caso o banco não tenha certas colunas opcionais, remove e retenta
  while (error && (error.code === 'PGRST204' || error.message?.includes('schema cache'))) {
    const match = error.message && error.message.match(/Could not find the '([^']+)' column/);
    if (match && match[1] && match[1] in payload) {
      delete payload[match[1]];
      const res = await supabase.from('produtos').update(payload).eq('id', id);
      error = res.error;
    } else {
      break;
    }
  }

  if (error) {
    redirect(`/admin/produtos/${id}?erro=Erro ao salvar: ${error.message}`);
  }

  // Salvar Visibilidade na Vitrine (Oculto da Vitrine / Apenas Variação)
  try {
    const ocultar_na_vitrine = formData.get('ocultar_na_vitrine') === 'true';
    await setProdutoOcultoVitrine(id, ocultar_na_vitrine);
  } catch (errVitrine) {
    console.error('Erro ao atualizar visibilidade na vitrine:', errVitrine);
  }

  // Salvar Categorias Adicionais em configuracoes
  try {
    const categorias_adicionais_str = formData.get('categorias_adicionais') as string;
    const adicionaisArr: string[] = categorias_adicionais_str ? JSON.parse(categorias_adicionais_str) : [];
    
    const { data: currentCatMap } = await supabase.from('configuracoes').select('valor').eq('chave', 'produtos_categorias_adicionais').single();
    let mapAtual = currentCatMap?.valor || {};
    mapAtual[id] = adicionaisArr;

    await supabase.from('configuracoes').upsert({
      chave: 'produtos_categorias_adicionais',
      valor: mapAtual
    }, { onConflict: 'chave' });
  } catch (err) {
    console.error("Erro ao salvar categorias adicionais:", err);
  }

  // Atualizar listas de destaques da Home em configuracoes
  try {
    const { data: configCurrent } = await supabase.from('configuracoes').select('valor').eq('chave', 'vitrine_destaques').single();
    let valorAtual = configCurrent?.valor || { mais_vendidos: [], novidades: [] };

    let mvList: string[] = (valorAtual.mais_vendidos || []).filter((prodId: string) => prodId !== id);
    let novList: string[] = (valorAtual.novidades || []).filter((prodId: string) => prodId !== id);

    if (destaque_home === 'mais_vendidos') {
      mvList.unshift(id);
    } else if (destaque_home === 'lancamento') {
      novList.unshift(id);
    }

    await supabase.from('configuracoes').upsert({
      chave: 'vitrine_destaques',
      valor: {
        mais_vendidos: Array.from(new Set(mvList)),
        novidades: Array.from(new Set(novList))
      }
    }, { onConflict: 'chave' });
  } catch {}

  revalidatePath('/admin/produtos');
  revalidatePath('/');
  
  const ret_params = (formData.get('ret_params') as string) || '';

  const { data: prodExistente } = await supabase.from('produtos').select('slug').eq('id', id).single();
  if (prodExistente) {
    revalidatePath(`/produto/${prodExistente.slug}`);
  }

  if (categoria_id) {
    const { data: cat } = await supabase.from('categorias').select('slug').eq('id', categoria_id).single();
    if (cat) revalidatePath(`/categoria/${cat.slug}`);
  }
  
  const p = new URLSearchParams(ret_params);
  p.set('msg', 'Produto atualizado com sucesso!');
  redirect(`/admin/produtos?${p.toString()}`);
}

import FormSubmitButton from '@/components/FormSubmitButton';

export default async function EditarProduto(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ret?: string; erro?: string; msg?: string }>;
}) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const retParams = searchParams.ret || '';
  const erroMsg = searchParams.erro || '';
  const okMsg = searchParams.msg || '';

  const { data: produto } = await supabase.from('produtos').select('*').eq('id', id).single();
  const { data: categorias } = await supabase.from('categorias').select('*');
  const { data: configDestaques } = await supabase.from('configuracoes').select('valor').eq('chave', 'vitrine_destaques').single();
  const valorDestaques = configDestaques?.valor || { mais_vendidos: [], novidades: [] };

  const { data: configAdicionais } = await supabase.from('configuracoes').select('valor').eq('chave', 'produtos_categorias_adicionais').single();
  const adicionaisIniciais: string[] = configAdicionais?.valor?.[id] || [];

  const ocultosSet = await getOcultosVitrine();
  const isOcultoVitrine = ocultosSet.has(String(id));

  let destaqueInicial = 'nenhum';
  if (produto?.destaque_super_promocao) {
    destaqueInicial = 'super_promocao';
  } else if (Array.isArray(valorDestaques.mais_vendidos) && valorDestaques.mais_vendidos.includes(id)) {
    destaqueInicial = 'mais_vendidos';
  } else if (Array.isArray(valorDestaques.novidades) && valorDestaques.novidades.includes(id)) {
    destaqueInicial = 'lancamento';
  }

  // Buscar família permanente do produto via familyManager
  const familyConfig = await getFamilyConfig();
  const activeFamilyId = familyConfig.productToFamilyMap[id];
  const familyData = activeFamilyId ? familyConfig.familias[activeFamilyId] : null;

  let memberIds: string[] = [];
  if (familyData && Array.isArray(familyData.members) && familyData.members.length > 0) {
    memberIds = familyData.members;
  } else {
    memberIds = [id];
  }

  const { data: familyRaw } = await supabase
    .from('produtos')
    .select('id, nome, codigo_barras, imagens, preco, parent_id')
    .in('id', memberIds);

  const mapProds = new Map((familyRaw || []).map(p => [p.id, p]));
  const variacoes = memberIds.map(mId => mapProds.get(mId)).filter(Boolean) as any[];

  // Todos os produtos para busca (só id, nome, sku, imagem, preco)
  const { data: todosProdutosRaw } = await supabase
    .from('produtos')
    .select('id, nome, codigo_barras, imagens, preco')
    .order('nome');
  const todosProdutos = (todosProdutosRaw || []) as any[];

  if (!produto) {
    return <div className="p-8 font-bold text-red-600">Produto não encontrado!</div>;
  }

  if (produto && produto.imagens) {
    if (produto.imagens.length === 1 && typeof produto.imagens[0] === 'string' && produto.imagens[0].match(/[\r\n]/)) {
      produto.imagens = produto.imagens[0].split(/[\r\n,]+/).map((s: string) => s.trim()).filter((s: string) => s);
    }
  }

  return (
    <div className="max-w-4xl bg-white p-8 rounded-xl shadow-sm border border-border font-sans space-y-6">
      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-secondary">Editar Produto</h1>
        <Link
          href={`/admin/produtos${retParams ? `?${retParams}` : ''}`}
          className="text-xs font-bold text-gray-600 hover:text-primary transition bg-gray-100 px-4 py-2 rounded-xl border border-gray-200"
        >
          &larr; Voltar para os Produtos
        </Link>
      </div>

      {erroMsg && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-2xl font-bold text-xs">
          ❌ {erroMsg}
        </div>
      )}

      {okMsg && (
        <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-2xl font-bold text-xs">
          ✅ {okMsg}
        </div>
      )}
      
      <form action={atualizarProduto} className="flex flex-col gap-6">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="ret_params" value={retParams} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1">Nome do Produto</label>
            <input name="nome" type="text" required defaultValue={produto.nome} className="w-full border border-border rounded-lg p-2" />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">SKU</label>
            <input name="codigo_barras" type="text" defaultValue={produto.codigo_barras || ''} className="w-full border border-border rounded-lg p-2" />
          </div>
        </div>
        
        {/* CAMPOS DE PREÇO E PERÍODO PROMOCIONAL (INÍCIO E FIM) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 min-h-[36px] flex items-end">
              Preço Normal (R$)
            </label>
            <input
              name="preco"
              type="text"
              defaultValue={produto.preco}
              required
              className="w-full border border-gray-300 rounded-xl p-2.5 h-11 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-primary focus:outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-green-700 mb-1 min-h-[36px] flex items-end">
              Preço Promoção (R$)
            </label>
            <input
              name="preco_promocional"
              type="text"
              defaultValue={produto.preco_promocional || ''}
              className="w-full border border-green-500 rounded-xl p-2.5 h-11 text-sm font-bold text-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none bg-green-50/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-green-700 mb-1 min-h-[36px] flex items-end">
              🟢 Início Promoção
            </label>
            <input
              name="promocao_inicio_em"
              type="datetime-local"
              defaultValue={produto.promocao_inicio_em ? new Date(new Date(produto.promocao_inicio_em).getTime() - 3 * 3600 * 1000).toISOString().slice(0,16) : ''}
              className="w-full border border-green-300 rounded-xl p-2.5 h-11 text-xs font-bold text-green-800 focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-red-600 mb-1 min-h-[36px] flex items-end">
              🔴 Fim Promoção
            </label>
            <input
              name="promocao_expira_em"
              type="datetime-local"
              defaultValue={produto.promocao_expira_em ? new Date(new Date(produto.promocao_expira_em).getTime() - 3 * 3600 * 1000).toISOString().slice(0,16) : ''}
              className="w-full border border-red-300 rounded-xl p-2.5 h-11 text-xs font-bold text-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1 min-h-[36px] flex items-end">
              Destaque na Home?
            </label>
            <select
              name="destaque_home"
              defaultValue={destaqueInicial}
              className="w-full border border-primary/50 bg-orange-50/40 rounded-xl p-2.5 h-11 text-xs md:text-sm font-bold text-secondary focus:ring-2 focus:ring-primary focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="nenhum">Nenhum (Vitrine Normal)</option>
              <option value="super_promocao">🔥 Super Promoção</option>
              <option value="mais_vendidos">⭐ Os Mais Vendidos</option>
              <option value="lancamento">🆕 Lançamento / Novidade</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Estoque Físico</label>
            <input name="estoque" type="number" defaultValue={produto.estoque} className="w-full border border-border rounded-lg p-2 bg-gray-50" readOnly />
          </div>
        </div>

        {/* CONTROLE DE EXIBIÇÃO NA VITRINE (ATIVO P/ VENDAS, MAS OCULTO NA VITRINE / SÓ COMO VARIAÇÃO) */}
        <div className="bg-amber-50/80 border border-amber-200 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">👁️‍🗨️</span>
              <h3 className="text-sm font-black text-amber-950">Exibição na Vitrine da Loja</h3>
            </div>
            <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
              Quando ativado, este produto continua <strong>100% ativo para vendas</strong> e pode ser escolhido normalmente pelo cliente dentro de sua <strong>Família / Variações</strong>, porém <strong>NÃO aparecerá como um produto avulso</strong> na vitrine principal, categorias e pesquisa.
            </p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer bg-white px-4 py-3 rounded-xl border border-amber-300 shadow-2xs hover:bg-amber-100/60 transition flex-shrink-0">
            <input
              type="checkbox"
              name="ocultar_na_vitrine"
              defaultChecked={isOcultoVitrine}
              value="true"
              className="w-5 h-5 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer accent-amber-600"
            />
            <span className="text-xs font-black text-amber-950">
              Ocultar na Vitrine (Vender apenas como Variação)
            </span>
          </label>
        </div>

        <div className="mt-6">
          <CategorySelector
            categorias={categorias || []}
            defaultCategoriaId={produto.categoria_id}
            defaultCategoriasAdicionais={adicionaisIniciais}
          />
        </div>

        <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-border">
          <h2 className="font-bold text-secondary mb-4">Dados Importados do Bling</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-gray-500 mb-1">Marca</label>
              <input type="text" readOnly value={produto.marca || ''} className="w-full border border-border rounded p-2 bg-gray-100 text-gray-600" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Peso Líquido</label>
              <input name="peso_liquido" type="text" readOnly defaultValue={produto.peso_liquido} className="w-full border border-border rounded p-2 text-sm bg-gray-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Peso Bruto</label>
              <input name="peso_bruto" type="text" readOnly defaultValue={produto.peso_bruto} className="w-full border border-border rounded p-2 text-sm bg-gray-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Dimensões (L x A x P)</label>
              <input type="text" readOnly defaultValue={`${produto.largura} x ${produto.altura} x ${produto.profundidade}`} className="w-full border border-border rounded p-2 text-sm bg-gray-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">NCM</label>
              <input name="ncm" type="text" readOnly defaultValue={produto.ncm} className="w-full border border-border rounded p-2 text-sm bg-gray-100" />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="text-lg font-bold mb-2 text-secondary">Variações da Família</h2>
          <p className="text-xs text-gray-500 mb-4">
            Gerencie os produtos da mesma família que aparecem como opções de variação.
          </p>

          <VariacaoManager
            currentProdutoId={id}
            variacoesIniciais={variacoes}
            todosProdutos={todosProdutos}
          />
        </div>

        <div className="border-t border-border pt-6">
          <label className="block text-sm font-medium mb-3">Imagens do Anúncio (Primeira é a Capa)</label>
          <ImageManager initialImages={produto.imagens || []} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Vídeo Explicativo do Produto (URL do YouTube)</label>
          <input 
            name="video_url" 
            type="url" 
            placeholder="https://www.youtube.com/watch?v=..." 
            defaultValue={produto.video_url || ''} 
            className="w-full border border-border rounded-lg p-2" 
          />
          <p className="text-xs text-gray-500 mt-1">Cole o link completo do vídeo do YouTube para ser exibido na página de vendas.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Produtos Relacionados (Mais Opções de Compra)</label>
          <input 
            name="relacionados" 
            type="text" 
            placeholder="IDs dos produtos separados por vírgula" 
            defaultValue={produto.produtos_relacionados ? produto.produtos_relacionados.join(', ') : ''} 
            className="w-full border border-border rounded-lg p-2" 
          />
          <p className="text-xs text-gray-500 mt-1">IDs dos produtos que aparecerão na seção "Compre Junto".</p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <FormSubmitButton label="Salvar Alterações" loadingLabel="Salvando Alterações no Banco..." />
        </div>
      </form>
    </div>
  );
}
