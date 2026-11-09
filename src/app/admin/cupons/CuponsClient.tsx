'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Pencil,
  Trash2,
  Plus,
  Edit3,
  X,
  ArrowUp,
  ArrowDown,
  Tag,
  CheckCircle2,
  Sparkles,
  LayoutGrid,
  Check,
  Zap,
  Eye,
  EyeOff,
  Sliders,
  Store
} from 'lucide-react';
import { Cupom } from '@/lib/types/coupon';

interface Props {
  cupons: Cupom[];
  posicaoHomeAtual: string;
  cuponsHomeIdsInicial: string[];
  salvarCupomAction: (formData: FormData) => Promise<void>;
  excluirCupomAction: (formData: FormData) => Promise<void>;
  salvarConfigHomeAction: (payload: { posicao_home: string; cupons_home_ids: string[] }) => Promise<void>;
  salvarListaAction: (cuponsNovos: Cupom[]) => Promise<void>;
  toggleCupomHomeAction?: (id: string) => Promise<void>;
}

export default function CuponsClient({
  cupons: initialCupons,
  posicaoHomeAtual: initialPosicaoHome,
  cuponsHomeIdsInicial,
  salvarCupomAction,
  excluirCupomAction,
  salvarConfigHomeAction,
  salvarListaAction,
  toggleCupomHomeAction,
}: Props) {
  const [cupons, setCupons] = useState<Cupom[]>(initialCupons);
  const [posicaoHome, setPosicaoHome] = useState<string>(initialPosicaoHome || 'topo');
  
  // IDs dos cupons selecionados para a tela de vendas na ordem escolhida pelo usuário
  const [cuponsHomeIds, setCuponsHomeIds] = useState<string[]>(
    cuponsHomeIdsInicial && cuponsHomeIdsInicial.length > 0
      ? cuponsHomeIdsInicial
      : initialCupons.filter(c => c.ativo).map(c => c.id)
  );

  const [cupomEditando, setCupomEditando] = useState<Cupom | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCupons(initialCupons);
  }, [initialCupons]);

  useEffect(() => {
    setPosicaoHome(initialPosicaoHome || 'topo');
  }, [initialPosicaoHome]);

  // Estados dos campos do formulário
  const [nomeInterno, setNomeInterno] = useState('');
  const [codigo, setCodigo] = useState('');
  const [tipoDesconto, setTipoDesconto] = useState<Cupom['tipo_desconto']>('percentual');
  const [valorDesconto, setValorDesconto] = useState('');
  const [descontoMaximo, setDescontoMaximo] = useState('');
  const [compraMinima, setCompraMinima] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [limiteUsos, setLimiteUsos] = useState('');
  const [tipoElegibilidade, setTipoElegibilidade] = useState<Cupom['tipo_elegibilidade']>('todos');
  const [permitirPromocionais, setPermitirPromocionais] = useState(true);
  const [permitirAcumulo, setPermitirAcumulo] = useState(false);
  const [exclusivoEmail, setExclusivoEmail] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const [exibirNaHome, setExibirNaHome] = useState(true);

  function iniciarEdicao(c: Cupom) {
    setCupomEditando(c);
    setNomeInterno(c.nome_interno || '');
    setCodigo(c.codigo || '');
    setTipoDesconto(c.tipo_desconto || 'percentual');
    setValorDesconto(c.valor_desconto ? c.valor_desconto.toString() : '');
    setDescontoMaximo(c.desconto_maximo_reais ? c.desconto_maximo_reais.toString() : '');
    setCompraMinima(c.compra_minima_reais ? c.compra_minima_reais.toString() : '');
    setDataInicio(c.data_inicio || '');
    setDataFim(c.data_fim || '');
    setLimiteUsos(c.limite_usos_total ? c.limite_usos_total.toString() : '');
    setTipoElegibilidade(c.tipo_elegibilidade || 'todos');
    setPermitirPromocionais(c.permitir_produtos_promocionais ?? true);
    setPermitirAcumulo(c.permitir_acumulo ?? false);
    setExclusivoEmail(c.exclusivo_email ?? false);
    setAtivo(c.ativo ?? true);
    setExibirNaHome(cuponsHomeIds.includes(c.id));

    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function cancelarEdicao() {
    setCupomEditando(null);
    setNomeInterno('');
    setCodigo('');
    setTipoDesconto('percentual');
    setValorDesconto('');
    setDescontoMaximo('');
    setCompraMinima('');
    setDataInicio('');
    setDataFim('');
    setLimiteUsos('');
    setTipoElegibilidade('todos');
    setPermitirPromocionais(true);
    setPermitirAcumulo(false);
    setExclusivoEmail(false);
    setAtivo(true);
    setExibirNaHome(true);
  }

  function notify(msg: string) {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 3000);
  }

  // Alterna se o cupom está selecionado para a Tela de Vendas (Home)
  function toggleSelecaoHome(id: string) {
    if (cuponsHomeIds.includes(id)) {
      setCuponsHomeIds(cuponsHomeIds.filter(item => item !== id));
    } else {
      setCuponsHomeIds([...cuponsHomeIds, id]);
    }
  }

  // Altera a ordem do cupom dentro da lista da Tela de Vendas
  function moverOrdemHome(index: number, direcao: 'up' | 'down') {
    const targetIdx = direcao === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= cuponsHomeIds.length) return;

    const novos = [...cuponsHomeIds];
    const [removido] = novos.splice(index, 1);
    novos.splice(targetIdx, 0, removido);

    setCuponsHomeIds(novos);
  }

  // Salva as configurações da Tela de Vendas (quais cupons + ordem + posição)
  async function handleSalvarTelaVendas() {
    setSalvandoConfig(true);
    try {
      await salvarConfigHomeAction({
        posicao_home: posicaoHome,
        cupons_home_ids: cuponsHomeIds
      });
      notify('Configurações dos cupons na Tela de Vendas salvas com sucesso!');
    } catch {
      notify('Erro ao salvar configurações.');
    } finally {
      setSalvandoConfig(false);
    }
  }

  // Mapeador de objetos de cupons por ID
  const cupomMap = new Map<string, Cupom>();
  cupons.forEach(c => cupomMap.set(c.id, c));

  // Cupons selecionados ordenados para a preview da Tela de Vendas
  const cuponsExibidosVendas = cuponsHomeIds
    .map(id => cupomMap.get(id))
    .filter((c): c is Cupom => !!c && c.ativo);

  return (
    <div className="space-y-8 font-sans">
      {/* Toast de Notificação */}
      {savedMessage && (
        <div className="fixed top-5 right-5 z-50 bg-secondary text-white px-5 py-3 rounded-2xl shadow-xl border border-orange-500 flex items-center gap-3 animate-bounce">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <span className="font-bold text-xs md:text-sm">{savedMessage}</span>
        </div>
      )}

      {/* 🎯 SELEÇÃO E ORDEM DOS CUPONS NA TELA DE VENDAS (HOME) */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-600 to-orange-700 text-white p-6 rounded-3xl shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/20 pb-4">
          <div>
            <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
              Vitrine de Vendas
            </span>
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2 mt-1">
              <Store size={26} />
              Cupons Exibidos na Tela de Vendas
            </h2>
            <p className="text-xs text-orange-100 mt-1">
              Marque quais cupons devem aparecer na Página Inicial da loja e use as setas ⬆️ ⬇️ para definir a ordem exata de exibição.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSalvarTelaVendas}
            disabled={salvandoConfig}
            className="bg-white text-orange-950 hover:bg-orange-100 font-black px-6 py-3 rounded-2xl text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 self-start md:self-auto"
          >
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{salvandoConfig ? 'Salvando...' : 'Salvar Seleção & Ordem'}</span>
          </button>
        </div>

        {/* Seleção de Posição da Faixa na Tela de Vendas */}
        <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-amber-200" />
            <div>
              <span className="text-xs font-bold block">Posição da Faixa de Cupons na Tela de Vendas:</span>
              <span className="text-[11px] text-orange-100">Escolha onde a barra de cupons deve ficar posicionada.</span>
            </div>
          </div>

          <select
            value={posicaoHome}
            onChange={(e) => setPosicaoHome(e.target.value)}
            className="bg-white text-gray-900 font-bold text-xs px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="topo">📌 No Topo da Página (Acima do Banner)</option>
            <option value="abaixo_banner">🖼️ Logo Abaixo do Banner Principal</option>
            <option value="abaixo_beneficios">🚚 Abaixo da Barra de Benefícios</option>
            <option value="acima_ofertas">🔥 Acima da Seção de Ofertas</option>
            <option value="oculto">👁️‍🗨️ Ocultar Faixa de Cupons na Home</option>
          </select>
        </div>

        {/* Lista de Cupons para Selecionar e Ordenar */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-orange-100">
            Selecione e Ordene os Cupons para Exibição:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cupons.map((c) => {
              const selectedIdx = cuponsHomeIds.indexOf(c.id);
              const isSelected = selectedIdx >= 0;

              const badgeTexto =
                c.tipo_desconto === 'percentual'
                  ? `${c.valor_desconto}% OFF`
                  : c.tipo_desconto === 'fixo'
                  ? `R$ ${c.valor_desconto} OFF`
                  : 'FRETE GRÁTIS';

              return (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-white text-gray-900 border-white shadow-md'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelecaoHome(c.id)}
                      className="w-5 h-5 accent-orange-600 rounded cursor-pointer flex-shrink-0"
                    />

                    <div className="space-y-0.5 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-black text-[11px] px-2 py-0.5 rounded uppercase ${
                          isSelected ? 'bg-red-600 text-white' : 'bg-white/20 text-white'
                        }`}>
                          {badgeTexto}
                        </span>
                        <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
                          isSelected ? 'bg-gray-100 text-gray-800 border-gray-300' : 'bg-white/10 text-white border-white/20'
                        }`}>
                          {c.codigo}
                        </span>
                      </div>
                      <p className={`text-xs font-bold line-clamp-1 ${isSelected ? 'text-gray-900' : 'text-orange-100'}`}>
                        {c.nome_interno}
                      </p>
                    </div>
                  </div>

                  {/* Controles de Ordenação (se selecionado) */}
                  {isSelected && (
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl flex-shrink-0">
                      <span className="text-[10px] font-black text-gray-600 px-1.5">
                        #{selectedIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => moverOrdemHome(selectedIdx, 'up')}
                        disabled={selectedIdx === 0}
                        className="p-1 text-gray-700 hover:text-orange-600 disabled:opacity-30 cursor-pointer rounded hover:bg-white"
                        title="Subir na Tela de Vendas"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moverOrdemHome(selectedIdx, 'down')}
                        disabled={selectedIdx === cuponsHomeIds.length - 1}
                        className="p-1 text-gray-700 hover:text-orange-600 disabled:opacity-30 cursor-pointer rounded hover:bg-white"
                        title="Descer na Tela de Vendas"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pré-visualização ao Vivo da Faixa de Vendas */}
        {cuponsExibidosVendas.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 flex items-center gap-1">
              <Sparkles size={12} /> Pré-visualização ao vivo na Tela de Vendas:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {cuponsExibidosVendas.map((c) => (
                <div key={c.id} className="bg-white text-gray-900 p-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs">
                  <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] uppercase font-black">
                    {c.tipo_desconto === 'percentual' ? `${c.valor_desconto}% OFF` : `R$ ${c.valor_desconto} OFF`}
                  </span>
                  <span className="font-mono">{c.codigo}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 📋 LISTA GERAL DE CUPONS E GERENCIAMENTO */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-gray-200 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
              <LayoutGrid size={22} className="text-primary" />
              Todos os Cupons Cadastrados
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Visualize, edite, ative ou remova os cupons do sistema.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-[11px] tracking-wider border-b border-gray-200 font-bold">
                <th className="p-3.5">Código</th>
                <th className="p-3.5">Nome Interno</th>
                <th className="p-3.5">Tipo & Desconto</th>
                <th className="p-3.5">Regras</th>
                <th className="p-3.5">Tela de Vendas</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {cupons.map((c) => {
                const isNaHome = cuponsHomeIds.includes(c.id);
                const badgeTexto =
                  c.tipo_desconto === 'percentual'
                    ? `${c.valor_desconto}% OFF`
                    : c.tipo_desconto === 'fixo'
                    ? `R$ ${c.valor_desconto} OFF`
                    : 'FRETE GRÁTIS';

                return (
                  <tr key={c.id} className="hover:bg-orange-50/30 transition">
                    <td className="p-3.5">
                      <span className="bg-orange-100 text-orange-900 font-mono font-bold px-2 py-1 rounded-lg border border-orange-200">
                        {c.codigo}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-gray-900">{c.nome_interno}</td>
                    <td className="p-3.5 font-bold text-primary">{badgeTexto}</td>
                    <td className="p-3.5 text-[11px] text-gray-500">
                      {c.compra_minima_reais && <div>Min: R$ {c.compra_minima_reais.toFixed(2)}</div>}
                      {c.desconto_maximo_reais && <div>Teto: R$ {c.desconto_maximo_reais.toFixed(2)}</div>}
                    </td>
                    <td className="p-3.5">
                      <button
                        type="button"
                        onClick={async () => {
                          toggleSelecaoHome(c.id);
                          if (toggleCupomHomeAction) {
                            try {
                              await toggleCupomHomeAction(c.id);
                              notify(isNaHome ? `Cupom ${c.codigo} removido da Home!` : `Cupom ${c.codigo} colocado na Home!`);
                            } catch {
                              notify('Erro ao atualizar exibição na home.');
                            }
                          }
                        }}
                        className={`text-xs font-black px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                          isNaHome
                            ? 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-orange-50 hover:text-orange-800 hover:border-orange-300'
                        }`}
                        title={isNaHome ? 'Clique para remover da Home' : 'Clique para exibir na Home'}
                      >
                        {isNaHome ? (
                          <>
                            <span className="text-amber-600">⭐</span>
                            <span>Na Home (#{cuponsHomeIds.indexOf(c.id) + 1})</span>
                          </>
                        ) : (
                          <>
                            <span>➕ Colocar na Home</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-3.5">
                      {c.ativo ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                          ATIVO
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-full">
                          INATIVO
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(c)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <form action={excluirCupomAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <button
                            type="submit"
                            onClick={(e) => {
                              if (!confirm(`Excluir cupom "${c.codigo}"?`)) e.preventDefault();
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📝 FORMULÁRIO DE CADASTRO / EDIÇÃO DE CUPOM */}
      <div ref={formRef} className="bg-white p-8 rounded-3xl shadow-xs border border-gray-200 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
            {cupomEditando ? (
              <>
                <Edit3 size={22} className="text-blue-600" />
                <span>
                  Editar Cupom: <strong className="text-primary font-mono">{cupomEditando.codigo}</strong>
                </span>
              </>
            ) : (
              <>
                <Plus size={22} className="text-primary" />
                <span>Cadastrar Novo Cupom de Desconto</span>
              </>
            )}
          </h2>

          {cupomEditando && (
            <button
              type="button"
              onClick={cancelarEdicao}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <X size={15} />
              <span>Cancelar Edição</span>
            </button>
          )}
        </div>

        <form action={salvarCupomAction} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cupomEditando && <input type="hidden" name="id" value={cupomEditando.id} />}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nome Interno do Cupom *</label>
            <input
              name="nome_interno"
              required
              value={nomeInterno}
              onChange={(e) => setNomeInterno(e.target.value)}
              placeholder="Ex: Promoção de Boas-Vindas"
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Código do Cupom (Sem Espaços) *</label>
            <input
              name="codigo"
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ex: BEMVINDO10"
              className="w-full border border-gray-300 rounded-xl p-3 text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Desconto *</label>
            <select
              name="tipo_desconto"
              value={tipoDesconto}
              onChange={(e) => setTipoDesconto(e.target.value as any)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-white font-bold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value="percentual">Desconto Percentual (%)</option>
              <option value="fixo">Desconto em Valor Fixo (R$)</option>
              <option value="frete_gratis">Frete Grátis</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Valor do Desconto {tipoDesconto === 'percentual' ? '(%)' : tipoDesconto === 'fixo' ? '(R$)' : '(Frete Grátis = R$ 0)'} *
            </label>
            <input
              name="valor_desconto"
              type="number"
              step="0.01"
              required
              value={tipoDesconto === 'frete_gratis' ? '0' : valorDesconto}
              onChange={(e) => setValorDesconto(e.target.value)}
              disabled={tipoDesconto === 'frete_gratis'}
              placeholder={tipoDesconto === 'frete_gratis' ? '0.00 (Frete Grátis)' : 'Ex: 10 ou 20.00'}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
            />
            {tipoDesconto === 'frete_gratis' && (
              <p className="text-[11px] text-emerald-700 font-bold mt-1">
                ✓ Frete Grátis concede 100% de desconto no frete. Defina abaixo o "Valor Mínimo da Compra" (ex: 99.00).
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Desconto Máximo / Teto (R$) (Opcional)</label>
            <input
              name="desconto_maximo_reais"
              type="number"
              step="0.01"
              value={descontoMaximo}
              onChange={(e) => setDescontoMaximo(e.target.value)}
              placeholder="Ex: 50.00"
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Valor Mínimo da Compra (R$) (Opcional)</label>
            <input
              name="compra_minima_reais"
              type="number"
              step="0.01"
              value={compraMinima}
              onChange={(e) => setCompraMinima(e.target.value)}
              placeholder="Ex: 100.00 (ou 99.00 para frete grátis)"
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* 🌟 CHECKBOX DESTAQUE: EXIBIR NA PÁGINA INICIAL */}
          <div className="flex items-start gap-3 md:col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border-2 border-orange-300 shadow-2xs">
            <input
              id="exibir_na_home"
              name="exibir_na_home"
              type="checkbox"
              checked={exibirNaHome}
              onChange={(e) => setExibirNaHome(e.target.checked)}
              className="w-5 h-5 accent-primary cursor-pointer mt-0.5 rounded"
            />
            <div className="flex flex-col">
              <label htmlFor="exibir_na_home" className="text-sm font-black text-orange-950 cursor-pointer flex items-center gap-1.5">
                ⭐ Exibir este cupom na Página Inicial (Faixa de Cupons da Home)
              </label>
              <span className="text-xs text-orange-800 mt-0.5">
                Marque para que o cupom apareça automaticamente na faixa do topo da loja para os clientes coletarem.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:col-span-2 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
            <input
              id="ativo"
              name="ativo"
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            <label htmlFor="ativo" className="text-xs font-bold text-gray-800 cursor-pointer">
              Cupom Ativo no Sistema (Pronto para Uso)
            </label>
          </div>

          <button
            type="submit"
            className="bg-primary hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl transition md:col-span-2 shadow-sm text-sm flex items-center justify-center gap-2 cursor-pointer w-fit"
          >
            <CheckCircle2 size={18} />
            <span>{cupomEditando ? 'Atualizar Cupom' : 'Salvar Novo Cupom'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
