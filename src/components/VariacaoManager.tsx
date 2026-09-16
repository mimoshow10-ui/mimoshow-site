'use client';

import { useState, useEffect } from 'react';
import { X, Link2, Search, ArrowUp, ArrowDown, RefreshCw, Layers } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  codigo_barras?: string | null;
  imagens?: string[] | string | null;
  preco: number;
  parent_id?: string | null;
}

interface Props {
  parentId?: string;
  currentProdutoId?: string;
  produtoId?: string;
  variacoesIniciais?: Produto[];
  variacoes?: Produto[];
  todosProdutos?: Produto[];
}

export default function VariacaoManager({
  parentId,
  currentProdutoId,
  produtoId,
  variacoesIniciais,
  variacoes,
  todosProdutos = [],
}: Props) {
  const initialVars = Array.isArray(variacoesIniciais)
    ? variacoesIniciais
    : Array.isArray(variacoes)
    ? variacoes
    : [];

  const [grupo, setGrupo] = useState<Produto[]>(initialVars);
  const [busca, setBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<Produto[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const selfId = currentProdutoId || produtoId || parentId;

  // Busca em tempo real na API para varrer todos os 3900+ produtos do banco
  useEffect(() => {
    if (!busca.trim() || busca.trim().length < 2) {
      setResultadosBusca([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(`/api/variacoes?q=${encodeURIComponent(busca.trim())}`);
        if (res.ok) {
          const json = await res.json();
          setResultadosBusca(json.produtos || []);
        }
      } catch {} finally {
        setBuscando(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [busca]);

  const prods = resultadosBusca.length > 0 ? resultadosBusca : (Array.isArray(todosProdutos) ? todosProdutos : []);

  const disponiveis = prods.filter((p) => {
    if (!p || !p.id) return false;
    if (selfId && p.id === selfId) return false;
    if (Array.isArray(grupo) && grupo.some((g) => g && g.id === p.id)) return false;

    // Se veio do endpoint de busca em tempo real, o servidor já filtrou perfeitamente
    if (resultadosBusca.length > 0) return true;

    const queryNorm = busca.toLowerCase().replace(/[\s\-_]+/g, '');
    const nomeMatch = (p.nome || '').toLowerCase().includes(busca.toLowerCase());
    const skuMatch = (p.codigo_barras || '').toLowerCase().replace(/[\s\-_]+/g, '').includes(queryNorm);
    return nomeMatch || skuMatch;
  });

  async function reordenarServidor(novoGrupo: Produto[]) {
    if (!selfId) return;
    try {
      const ordemIds = novoGrupo.map((p) => p.id);
      await fetch('/api/variacoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reordenar', memberId: selfId, ordemIds }),
      });
    } catch {}
  }

  function mover(index: number, direcao: 'up' | 'down') {
    if (direcao === 'up' && index === 0) return;
    if (direcao === 'down' && index === grupo.length - 1) return;

    const targetIndex = direcao === 'up' ? index - 1 : index + 1;
    const novoGrupo = [...grupo];
    const temp = novoGrupo[index];
    novoGrupo[index] = novoGrupo[targetIndex];
    novoGrupo[targetIndex] = temp;

    setGrupo(novoGrupo);
    reordenarServidor(novoGrupo);
  }

  async function vincular(novoMembro: Produto) {
    if (!selfId || !novoMembro.id) return;

    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/variacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetProductId: selfId, newMemberId: novoMembro.id }),
      });
      if (res.ok) {
        const novoGrupo = [...(grupo || []), novoMembro];
        setGrupo(novoGrupo);
        setBusca('');
        setMsg('Produto adicionado à família!');
        reordenarServidor(novoGrupo);
      } else {
        const j = await res.json();
        setMsg('Erro: ' + (j.error || j.erro || 'Falha ao vincular'));
      }
    } catch {
      setMsg('Erro ao se comunicar com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function desvincular(membroId: string) {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/variacoes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: membroId }),
      });
      if (res.ok) {
        const novoGrupo = (grupo || []).filter((item) => item.id !== membroId);
        setGrupo(novoGrupo);
        setMsg('Variação removida da família!');
        reordenarServidor(novoGrupo);
      } else {
        const j = await res.json();
        setMsg('Erro: ' + (j.error || j.erro || 'Falha ao desvincular'));
      }
    } catch {
      setMsg('Erro ao se comunicar com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  function extrairFoto(img: any): string | null {
    if (!img) return null;
    if (typeof img === 'string') return img.split(/[\r\n,]+/)[0];
    if (Array.isArray(img) && img.length > 0) return extrairFoto(img[0]);
    return null;
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className="p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-blue-500 hover:text-blue-800 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Lista de Variações da Família */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={14} className="text-primary" />
            <span>Membros da Família ({grupo.length})</span>
          </h4>
          <span className="text-[10px] text-gray-400 font-medium">Use ⬆ e ⬇ para ordenar a exibição na loja</span>
        </div>

        {grupo.length === 0 ? (
          <p className="text-xs text-gray-400 font-medium italic bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">
            Nenhuma variação vinculada a esta família. Use a busca abaixo para adicionar outros produtos/tamanhos.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {grupo.map((item, index) => {
              const foto = extrairFoto(item.imagens);
              const isCurrent = item.id === selfId;

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 border rounded-xl text-xs font-bold text-gray-800 gap-2 shadow-2xs transition ${
                    isCurrent ? 'bg-orange-50/70 border-orange-300 ring-1 ring-orange-400/30' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Posição e Botões de Ordenação */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="w-5 text-center text-[10px] font-mono text-gray-400 font-bold">
                      #{index + 1}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => mover(index, 'up')}
                        disabled={index === 0 || loading}
                        className="p-1 rounded bg-white border border-gray-200 hover:bg-orange-100 hover:border-primary disabled:opacity-30 disabled:hover:bg-white text-gray-700 transition cursor-pointer"
                        title="Mover para Cima"
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => mover(index, 'down')}
                        disabled={index === grupo.length - 1 || loading}
                        className="p-1 rounded bg-white border border-gray-200 hover:bg-orange-100 hover:border-primary disabled:opacity-30 disabled:hover:bg-white text-gray-700 transition cursor-pointer"
                        title="Mover para Baixo"
                      >
                        <ArrowDown size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Informações do Produto */}
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    {foto ? (
                      <img
                        src={foto}
                        alt={item.nome}
                        className="w-10 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-[8px] font-bold text-gray-500 flex-shrink-0">
                        Foto
                      </div>
                    )}
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-gray-900 font-bold">{item.nome}</p>
                        {isCurrent && (
                          <span className="bg-orange-100 text-orange-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-orange-300">
                            Produto Atual
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono">
                        SKU: {item.codigo_barras || 'Sem SKU'} • R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>

                  {/* Desvincular da Família */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => desvincular(item.id)}
                      disabled={loading}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition cursor-pointer"
                      title="Remover da Família"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Buscar e Vincular Novos Produtos */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <label className="block text-xs font-bold text-gray-700">
          🔍 Adicionar Produto a esta Família de Variações
        </label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite o nome ou SKU do produto para adicionar à família..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {busca.trim() && (
          <div className="max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg divide-y divide-gray-100 mt-1">
            {buscando ? (
              <div className="p-3 text-xs text-blue-600 font-bold text-center flex items-center justify-center gap-2">
                <RefreshCw size={13} className="animate-spin text-blue-500" />
                <span>Buscando em todo o catálogo (3.900+ produtos)...</span>
              </div>
            ) : disponiveis.length === 0 ? (
              <div className="p-3 text-xs text-gray-400 text-center font-bold">
                Nenhum produto disponível encontrado para "{busca}".
              </div>
            ) : (
              disponiveis.map((prod) => {
                const foto = extrairFoto(prod.imagens);
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => vincular(prod)}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-2.5 text-left hover:bg-orange-50 transition cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {foto ? (
                        <img
                          src={foto}
                          alt={prod.nome}
                          className="w-7 h-7 object-cover rounded-md border border-gray-200"
                        />
                      ) : (
                        <div className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center text-[7px] font-bold text-gray-400">
                          Sem foto
                        </div>
                      )}
                      <div className="truncate">
                        <span className="font-bold text-gray-800">{prod.nome}</span>
                        <span className="text-[10px] text-gray-400 font-mono ml-2">
                          ({prod.codigo_barras || 'Sem SKU'})
                        </span>
                      </div>
                    </div>

                    <span className="bg-primary text-white font-bold text-[10px] px-2 py-1 rounded-md flex items-center gap-1 shadow-2xs">
                      <Link2 size={10} /> Adicionar à Família
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
