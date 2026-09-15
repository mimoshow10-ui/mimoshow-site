import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import CategorySelector from '@/components/CategorySelector';
import ImageManager from '@/components/ImageManager';
import VariacaoManager from '@/components/VariacaoManager';
import FormSubmitButton from '@/components/FormSubmitButton';
import { extractImageUrls } from '@/components/ProductMediaGallery';
import { getFamilyConfig } from '@/lib/familyManager';
import { getOcultosVitrine } from '@/lib/vitrineManager';
import { atualizarProduto } from '../actions';

function formatDatetimeLocal(val: string | null | undefined): string {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return new Date(d.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

export default async function EditarProduto(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ret?: string; erro?: string; msg?: string }>;
}) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const retParams = searchParams?.ret || '';
  const erroMsg = searchParams?.erro || '';
  const okMsg = searchParams?.msg || '';

  try {
    const { data: produto } = await supabase.from('produtos').select('*').eq('id', id).single();
    const { data: categorias } = await supabase.from('categorias').select('*');
    const { data: configDestaques } = await supabase.from('configuracoes').select('valor').eq('chave', 'vitrine_destaques').single();
    const valorDestaques = configDestaques?.valor || { mais_vendidos: [], novidades: [] };

    const { data: configAdicionais } = await supabase.from('configuracoes').select('valor').eq('chave', 'produtos_categorias_adicionais').single();
    const adicionaisIniciais: string[] = Array.isArray(configAdicionais?.valor?.[id]) ? configAdicionais.valor[id] : [];

    const ocultosSet = await getOcultosVitrine();
    const isOcultoVitrine = ocultosSet.has(String(id));

    let destaqueInicial = 'nenhum';
    if (produto?.destaque_super_promocao) {
      destaqueInicial = 'super_promocao';
    } else if (Array.isArray(valorDestaques?.mais_vendidos) && valorDestaques.mais_vendidos.includes(id)) {
      destaqueInicial = 'mais_vendidos';
    } else if (Array.isArray(valorDestaques?.novidades) && valorDestaques.novidades.includes(id)) {
      destaqueInicial = 'lancamento';
    }

    // Buscar família permanente do produto via familyManager
    const familyConfig = await getFamilyConfig();
    const activeFamilyId = familyConfig?.productToFamilyMap ? familyConfig.productToFamilyMap[id] : null;
    const familyData = (activeFamilyId && familyConfig?.familias) ? familyConfig.familias[activeFamilyId] : null;

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

    if (!produto) {
      return (
        <div className="max-w-4xl bg-white p-8 rounded-xl shadow-sm border border-red-200 font-sans space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h1 className="text-xl font-bold text-red-600">Produto não encontrado</h1>
            <Link
              href={`/admin/produtos${retParams ? `?${retParams}` : ''}`}
              className="text-xs font-bold text-gray-600 hover:text-primary transition bg-gray-100 px-4 py-2 rounded-xl border border-gray-200"
            >
              &larr; Voltar para os Produtos
            </Link>
          </div>
          <p className="text-sm text-gray-600">
            O produto com ID <code className="bg-gray-100 px-2 py-1 rounded text-xs">{id}</code> não foi localizado no banco de dados.
          </p>
        </div>
      );
    }

    const fotosProduto = extractImageUrls(produto.imagens);
    const relacionadosStr = Array.isArray(produto.produtos_relacionados)
      ? produto.produtos_relacionados.join(', ')
      : (typeof produto.produtos_relacionados === 'string' ? produto.produtos_relacionados : '');

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
              defaultValue={formatDatetimeLocal(produto.promocao_inicio_em)}
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
              defaultValue={formatDatetimeLocal(produto.promocao_expira_em)}
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
        
        {/* BLOCO DE ESTOQUE E VISIBILIDADE NA TELA DE VENDAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <label className="block text-xs font-bold text-gray-700 mb-1">Estoque Físico</label>
            <input name="estoque" type="number" defaultValue={produto.estoque} className="w-full border border-gray-300 rounded-xl p-2.5 bg-white text-sm font-bold text-gray-800" readOnly />
          </div>

          <div className="md:col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">👁️‍🗨️</span>
                <span className="text-sm font-black text-amber-950">Esconder da Vitrine (Vender como Variação)</span>
              </div>
              <p className="text-xs text-amber-900 mt-1 leading-snug">
                Marque para <strong>NÃO exibir este produto como um produto avulso/pai na tela de vendas</strong>. Ele continuará <strong>100% ativo</strong> para o cliente escolher dentro da Família de Variações.
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer bg-white hover:bg-amber-100/70 border-2 border-amber-400 px-4 py-3 rounded-2xl transition shadow-sm flex-shrink-0">
              <input
                type="checkbox"
                name="ocultar_na_vitrine"
                defaultChecked={isOcultoVitrine}
                value="true"
                className="w-6 h-6 text-amber-600 rounded border-gray-400 focus:ring-amber-500 cursor-pointer accent-amber-600"
              />
              <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                Ocultar na Vitrine
              </span>
            </label>
          </div>
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
              <input type="text" readOnly defaultValue={`${produto.largura ?? ''} x ${produto.altura ?? ''} x ${produto.profundidade ?? ''}`} className="w-full border border-border rounded p-2 text-sm bg-gray-100" />
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
            todosProdutos={[]}
          />
        </div>

        <div className="border-t border-border pt-6">
          <label className="block text-sm font-medium mb-3">Imagens do Anúncio (Primeira é a Capa)</label>
          <ImageManager initialImages={fotosProduto} />
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
            defaultValue={relacionadosStr} 
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
  } catch (err: any) {
    console.error('Erro ao renderizar EditarProduto:', err);
    return (
      <div className="max-w-4xl bg-white p-8 rounded-xl shadow-sm border border-red-200 font-sans space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <h1 className="text-xl font-bold text-red-600">Erro ao carregar produto</h1>
          <Link
            href={`/admin/produtos${retParams ? `?${retParams}` : ''}`}
            className="text-xs font-bold text-gray-600 hover:text-primary transition bg-gray-100 px-4 py-2 rounded-xl border border-gray-200"
          >
            &larr; Voltar para os Produtos
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-800 text-xs font-bold">
          {err?.message || 'Falha inesperada ao consultar os dados deste produto.'}
        </div>
      </div>
    );
  }
}
