'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ShoppingBag, Plus, Minus, ArrowLeft, Truck, Ticket, CheckCircle2, X } from 'lucide-react';
import { ItemCarrinho } from '@/lib/types/checkout';
import { Cupom } from '@/lib/types/coupon';

const DEFAULT_PRODUCT_IMAGE = 'https://http2.mlstatic.com/D_NQ_NP_2X_736630-MLB72661556093_112023-F.webp';

export default function CarrinhoPage() {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [cep, setCep] = useState('');
  const [valorFrete, setValorFrete] = useState<number | null>(null);
  const [calculandoFrete, setCalculandoFrete] = useState(false);

  // Cupons
  const [cupomInput, setCupomInput] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<{ codigo: string; desconto: number; nome: string } | null>(null);
  const [erroCupom, setErroCupom] = useState('');
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [cuponsDisponiveis, setCuponsDisponiveis] = useState<Cupom[]>([]);

  useEffect(() => {
    try {
      const cartRaw = localStorage.getItem('carrinho');
      if (cartRaw) {
        const parsed = JSON.parse(cartRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const comImagensValidas = parsed.map(item => ({
            ...item,
            imagem: extrairFoto(item.imagem) || DEFAULT_PRODUCT_IMAGE
          }));
          setItens(comImagensValidas);
        } else {
          setItens(getExemploInicial());
        }
      } else {
        const exemplo = getExemploInicial();
        setItens(exemplo);
        localStorage.setItem('carrinho', JSON.stringify(exemplo));
      }

      // Restaurar cupom aplicado salvo
      const cupomSalvo = localStorage.getItem('cupom_aplicado');
      if (cupomSalvo) {
        setCupomAplicado(JSON.parse(cupomSalvo));
      }
    } catch {
      setItens(getExemploInicial());
    }

    // Carregar cupons disponíveis do backend
    async function carregarCupons() {
      try {
        const res = await fetch('/api/cupons/disponiveis');
        if (res.ok) {
          const data = await res.json();
          setCuponsDisponiveis(data.cupons || []);
        }
      } catch {
        // Fallback
      }
      setLoading(false);
    }

    carregarCupons();
  }, []);

  function salvarCarrinho(novosItens: ItemCarrinho[]) {
    setItens(novosItens);
    try {
      localStorage.setItem('carrinho', JSON.stringify(novosItens));
    } catch {
      // localStorage indisponível
    }
  }

  function alterarQuantidade(id: string, delta: number) {
    const novos = itens.map(item => {
      if (item.id === id) {
        const novaQtd = Math.max(1, item.quantidade + delta);
        return { ...item, quantidade: novaQtd };
      }
      return item;
    });
    salvarCarrinho(novos);
    if (cupomAplicado) revalidarCupomExistente(cupomAplicado.codigo, novos);
  }

  function removerItem(id: string) {
    const novos = itens.filter(item => item.id !== id);
    salvarCarrinho(novos);
    if (cupomAplicado) revalidarCupomExistente(cupomAplicado.codigo, novos);
  }

  async function revalidarCupomExistente(codigo: string, itensAtuais: ItemCarrinho[]) {
    if (itensAtuais.length === 0) {
      removerCupom();
      return;
    }
    try {
      const res = await fetch('/api/cupons/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, itens: itensAtuais, valorFrete: valorFrete || 0 })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.valido) {
          const payload = { codigo: data.cupom.codigo, desconto: data.descontoAplicado, nome: data.cupom.nome_interno };
          setCupomAplicado(payload);
          localStorage.setItem('cupom_aplicado', JSON.stringify(payload));
        } else {
          removerCupom();
        }
      }
    } catch {
      //
    }
  }

  async function aplicarCupomCodigo(codigoParam?: string) {
    const targetCodigo = (codigoParam || cupomInput).trim();
    if (!targetCodigo) return;

    setValidandoCupom(true);
    setErroCupom('');

    try {
      const res = await fetch('/api/cupons/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: targetCodigo, itens, valorFrete: valorFrete || 0 })
      });

      const data = await res.json();

      if (data.valido) {
        const payload = { codigo: data.cupom.codigo, desconto: data.descontoAplicado, nome: data.cupom.nome_interno };
        setCupomAplicado(payload);
        setCupomInput('');
        try {
          localStorage.setItem('cupom_aplicado', JSON.stringify(payload));
        } catch {}
      } else {
        setErroCupom(data.erro || 'Cupom inválido.');
      }
    } catch {
      setErroCupom('Erro ao validar cupom.');
    }
    setValidandoCupom(false);
  }

  function removerCupom() {
    setCupomAplicado(null);
    setErroCupom('');
    try {
      localStorage.removeItem('cupom_aplicado');
    } catch {}
  }

  async function calcularFrete() {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      alert('Digite um CEP válido com 8 dígitos.');
      return;
    }

    setCalculandoFrete(true);
    try {
      const res = await fetch('/api/checkout/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens, cep })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.opcoes?.length > 0) {
          setValorFrete(data.opcoes[0].valor);
        } else {
          setValorFrete(15.00);
        }
      } else {
        setValorFrete(15.00);
      }
    } catch {
      setValorFrete(15.00);
    }
    setCalculandoFrete(false);
  }

  const subtotal = itens.reduce((sum, item) => sum + item.preco_unitario * item.quantidade, 0);
  const descontoCupom = cupomAplicado ? cupomAplicado.desconto : 0;
  const frete = valorFrete ?? 0;
  const total = Math.max(0, subtotal - descontoCupom + frete);
  const totalPix = total * 0.95; // 5% de desconto no PIX

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-400 font-bold animate-pulse">Carregando seu carrinho...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 font-sans">
      <h1 className="text-2xl md:text-3xl font-heading font-bold text-secondary mb-8 flex items-center gap-3">
        <ShoppingBag size={32} className="text-primary" />
        Meu Carrinho de Compras
      </h1>

      {itens.length > 0 ? (
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Coluna Esquerda - Lista de Produtos */}
          <div className="w-full lg:w-2/3 space-y-4">
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
              
              {/* Cabeçalho da Tabela (Desktop) */}
              <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-bold text-xs uppercase tracking-wider text-gray-600">
                <div className="col-span-6">Produto</div>
                <div className="col-span-2 text-center">Preço Unit.</div>
                <div className="col-span-2 text-center">Qtd</div>
                <div className="col-span-2 text-right">Subtotal</div>
              </div>

              {/* Itens do Carrinho */}
              <div className="divide-y divide-gray-100">
                {itens.map((item) => {
                  const fotoUrl = extrairFoto(item.imagem) || DEFAULT_PRODUCT_IMAGE;

                  return (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50/50 transition">
                      
                      {/* Imagem e Nome */}
                      <div className="col-span-1 md:col-span-6 flex gap-3 items-center">
                        <Link href={`/produto/${item.slug}`} className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden relative flex-shrink-0 border border-gray-200 shadow-2xs group flex items-center justify-center">
                          <img
                            src={fotoUrl}
                            alt={item.nome}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                            }}
                          />
                        </Link>
                        <div>
                          <Link href={`/produto/${item.slug}`} className="font-bold text-secondary text-xs md:text-sm line-clamp-2 hover:text-primary transition">
                            {item.nome}
                          </Link>
                          {item.sku && <p className="text-[11px] text-gray-400 font-mono mt-0.5">SKU: {item.sku}</p>}
                          <button
                            type="button"
                            onClick={() => removerItem(item.id)}
                            className="text-red-500 text-xs font-bold flex items-center gap-1 mt-1 hover:underline"
                          >
                            <Trash2 size={12} /> Remover
                          </button>
                        </div>
                      </div>

                      {/* Preço Unitário */}
                      <div className="col-span-1 md:col-span-2 text-left md:text-center text-xs md:text-sm">
                        <span className="md:hidden font-bold text-gray-500 mr-2">Preço:</span>
                        <span className="font-semibold text-gray-700">
                          R$ {item.preco_unitario.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {/* Controles de Quantidade Interativos (+ / -) */}
                      <div className="col-span-1 md:col-span-2 flex justify-start md:justify-center">
                        <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                          <button
                            type="button"
                            onClick={() => alterarQuantidade(item.id, -1)}
                            className="px-3 py-1.5 hover:bg-gray-100 transition text-secondary font-bold text-sm border-r border-gray-200"
                            title="Diminuir quantidade"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-3 py-1.5 font-bold text-sm min-w-[36px] text-center text-secondary">
                            {item.quantidade}
                          </span>
                          <button
                            type="button"
                            onClick={() => alterarQuantidade(item.id, 1)}
                            className="px-3 py-1.5 hover:bg-gray-100 transition text-secondary font-bold text-sm border-l border-gray-200"
                            title="Aumentar quantidade"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Subtotal do Item */}
                      <div className="col-span-1 md:col-span-2 text-left md:text-right">
                        <span className="md:hidden font-bold text-xs text-gray-500 mr-2">Subtotal:</span>
                        <span className="font-black text-sm md:text-base text-primary">
                          R$ {(item.preco_unitario * item.quantidade).toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            <Link href="/" className="inline-flex items-center gap-2 text-secondary font-bold hover:text-primary transition text-sm">
              <ArrowLeft size={16} />
              <span>Continuar Comprando</span>
            </Link>
          </div>

          {/* Coluna Direita - Resumo Financeiro */}
          <div className="w-full lg:w-1/3 space-y-4">
            
            {/* Bloco de Cupom de Desconto */}
            <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-secondary text-sm flex items-center gap-2">
                <Ticket size={16} className="text-primary" />
                Cupom de Desconto
              </h3>

              {cupomAplicado ? (
                <div className="bg-green-50 border border-green-200 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-green-900 block flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-green-600" />
                      Cupom {cupomAplicado.codigo}
                    </span>
                    <span className="text-[11px] text-green-700">Desconto: - R$ {cupomAplicado.desconto.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={removerCupom}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Remover Cupom"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cupomInput}
                      onChange={e => setCupomInput(e.target.value.toUpperCase())}
                      placeholder="Digite o código"
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary uppercase bg-white"
                      onKeyDown={e => e.key === 'Enter' && aplicarCupomCodigo()}
                    />
                    <button
                      type="button"
                      onClick={() => aplicarCupomCodigo()}
                      disabled={validandoCupom || !cupomInput.trim()}
                      className="bg-secondary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-900 transition disabled:opacity-50"
                    >
                      {validandoCupom ? '...' : 'Aplicar'}
                    </button>
                  </div>

                  {erroCupom && <p className="text-red-500 text-[11px] font-semibold">{erroCupom}</p>}

                  {/* Cupons Disponíveis para Coletar/Aplicar com 1 Clique */}
                  {cuponsDisponiveis.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1.5">Cupons Disponíveis:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {cuponsDisponiveis.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => aplicarCupomCodigo(c.codigo)}
                            className="text-[10px] font-bold bg-orange-50 text-primary border border-orange-200 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition"
                          >
                            🏷️ {c.codigo} ({c.tipo_desconto === 'percentual' ? `${c.valor_desconto}% OFF` : `R$ ${c.valor_desconto} OFF`})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resumo do Pedido */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs sticky top-24 space-y-4">
              <h2 className="font-heading font-bold text-xl text-secondary pb-3 border-b border-gray-100">
                Resumo do Pedido
              </h2>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal ({itens.reduce((acc, i) => acc + i.quantidade, 0)} itens)</span>
                  <span className="font-semibold text-secondary">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>

                {cupomAplicado && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Desconto Cupom ({cupomAplicado.codigo})</span>
                    <span>- R$ {cupomAplicado.desconto.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}

                {valorFrete !== null && (
                  <div className="flex justify-between text-gray-700">
                    <span>Frete</span>
                    <span className="font-semibold text-secondary">
                      {valorFrete === 0 ? 'GRÁTIS' : `+ R$ ${valorFrete.toFixed(2).replace('.', ',')}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Simulação de Frete por CEP */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Truck size={14} className="text-primary" />
                  Calcular Frete
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cep}
                    onChange={e => setCep(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  />
                  <button
                    type="button"
                    onClick={calcularFrete}
                    disabled={calculandoFrete}
                    className="bg-secondary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-900 transition disabled:opacity-50"
                  >
                    {calculandoFrete ? '...' : 'OK'}
                  </button>
                </div>

                {valorFrete !== null && (
                  <div className="flex justify-between items-center text-xs bg-green-50 text-green-800 p-2.5 rounded-xl border border-green-200 font-medium">
                    <span>Frete Estimado:</span>
                    <strong className="font-bold">
                      {valorFrete === 0 ? 'GRÁTIS' : `R$ ${valorFrete.toFixed(2).replace('.', ',')}`}
                    </strong>
                  </div>
                )}
              </div>

              {/* Totais */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-gray-600 text-sm">Total Cartão</span>
                  <span className="font-bold text-xl text-secondary">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>

                <div className="flex justify-between items-end bg-orange-50/70 p-3.5 rounded-xl border border-orange-200">
                  <div>
                    <span className="font-bold text-secondary text-sm block">Total no PIX</span>
                    <span className="text-[11px] text-green-600 font-bold">(5% de Desconto)</span>
                  </div>
                  <span className="font-heading font-black text-2xl text-primary">
                    R$ {totalPix.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full block text-center bg-primary hover:bg-orange-600 text-white font-bold text-base py-4 rounded-xl transition shadow-md"
              >
                Finalizar Compra
              </Link>

              <p className="text-[11px] text-center text-gray-400">
                🔒 Compra 100% segura com garantia de devolução
              </p>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300 max-w-md mx-auto space-y-4 shadow-2xs">
          <ShoppingBag size={48} className="mx-auto text-gray-300" />
          <h2 className="text-xl font-bold text-secondary">Seu carrinho está vazio</h2>
          <p className="text-xs text-gray-500">Navegue pelas nossas categorias e adicione produtos incríveis para o seu pet!</p>
          <Link
            href="/"
            className="inline-block bg-primary hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-sm"
          >
            Explorar Produtos
          </Link>
        </div>
      )}
    </div>
  );
}

function extrairFoto(img: any): string | null {
  if (!img) return null;
  if (typeof img === 'string') {
    const partes = img.split(/[\r\n,]+/);
    return partes[0]?.trim() || null;
  }
  if (Array.isArray(img) && img.length > 0) {
    return extrairFoto(img[0]);
  }
  return null;
}

function getExemploInicial(): ItemCarrinho[] {
  return [
    {
      id: 'prod-1',
      nome: '200 Adesivos Pet Piercings Eva Glitter Petshop Cães E Gatos',
      slug: '200-adesivos-pet-piercings-eva-glitter-petshop-caes-e-gatos',
      imagem: DEFAULT_PRODUCT_IMAGE,
      preco_unitario: 18.90,
      quantidade: 1,
      peso_kg: 0.2,
      largura_cm: 15,
      altura_cm: 5,
      comprimento_cm: 20,
    }
  ];
}
