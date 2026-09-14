'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Truck, CheckCircle2, ChevronRight, ArrowLeft, ShoppingBag, ShieldCheck, Store, Ticket, X } from 'lucide-react';
import { OpcaoFrete, ItemCarrinho, Cliente, Endereco } from '@/lib/types/checkout';

export default function CheckoutPage() {
  const [etapa, setEtapa] = useState<'endereco' | 'entrega' | 'resumo'>('endereco');
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulário de Cliente & Endereço (Mercado Livre Style)
  const [tipoPessoa, setTipoPessoa] = useState<'PF' | 'PJ'>('PF');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erroCep, setErroCep] = useState('');

  // Fretes disponíveis e selecionado
  const [opcoesFrete, setOpcoesFrete] = useState<OpcaoFrete[]>([]);
  const [freteSelecionado, setFreteSelecionado] = useState<OpcaoFrete | null>(null);
  const [calculandoFrete, setCalculandoFrete] = useState(false);

  // Cupom de Desconto e Processamento
  const [cupomAplicado, setCupomAplicado] = useState<{ codigo: string; desconto: number; nome: string } | null>(null);
  const [cupomInput, setCupomInput] = useState('');
  const [erroCupom, setErroCupom] = useState('');
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [cuponsDisponiveis, setCuponsDisponiveis] = useState<any[]>([]);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);

  // Carregar itens do carrinho do localStorage (com fallback)
  useEffect(() => {
    try {
      const cartRaw = localStorage.getItem('carrinho');
      if (cartRaw) {
        const parsed = JSON.parse(cartRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItens(parsed);
        } else {
          setItens(getExemploCarrinho());
        }
      } else {
        setItens(getExemploCarrinho());
      }

      // Restaurar cupom de desconto aplicado no carrinho
      const cupomSalvo = localStorage.getItem('cupom_aplicado');
      if (cupomSalvo) {
        setCupomAplicado(JSON.parse(cupomSalvo));
      }
    } catch {
      setItens(getExemploCarrinho());
    }

    // Carregar cupons disponíveis no checkout
    async function carregarCupons() {
      try {
        const res = await fetch('/api/cupons/disponiveis');
        if (res.ok) {
          const data = await res.json();
          setCuponsDisponiveis(data.cupons || []);
        }
      } catch {}
    }
    carregarCupons();

    setLoading(false);
  }, []);

  async function aplicarCupomCodigo(codigoParam?: string) {
    const targetCodigo = (codigoParam || cupomInput).trim();
    if (!targetCodigo) return;

    setValidandoCupom(true);
    setErroCupom('');

    try {
      const res = await fetch('/api/cupons/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: targetCodigo, itens, valorFrete: freteSelecionado?.valor || 0 })
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

  // Busca Automática de CEP (ViaCEP)
  async function buscarCep(val: string) {
    const cepLimpo = val.replace(/\D/g, '');
    setCep(val);

    if (cepLimpo.length === 8) {
      setBuscandoCep(true);
      setErroCep('');

      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await res.json();

        if (data.erro) {
          setErroCep('CEP não encontrado. Digite o endereço manualmente.');
        } else {
          setLogradouro(data.logradouro || '');
          setBairro(data.bairro || '');
          setCidade(data.localidade || '');
          setUf(data.uf || '');
        }
      } catch {
        setErroCep('Erro ao consultar CEP.');
      }
      setBuscandoCep(false);
    }
  }

  // Avançar para Escolha de Entrega (Mercado Livre Step 2)
  async function irParaEntrega(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeCompleto || !cpfCnpj || !email || !cep || !logradouro || !numero || !cidade || !uf) {
      alert('Por favor, preencha todos os campos obrigatórios do endereço.');
      return;
    }

    setCalculandoFrete(true);
    setEtapa('entrega');

    try {
      const res = await fetch('/api/checkout/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens, cep })
      });

      if (res.ok) {
        const data = await res.json();
        setOpcoesFrete(data.opcoes || []);
        if (data.opcoes?.length > 0) {
          setFreteSelecionado(data.opcoes[0]);
        }
      }
    } catch {
      // Fallback local se a API estiver fora
      const fretesFallback: OpcaoFrete[] = [
        {
          id: 'frete-padrao',
          transportadora_id: '1',
          nome: 'Entrega Padrão Correios',
          nome_transportadora: 'Correios',
          valor: 14.90,
          prazo_dias: 5,
          prazo_estimado_texto: 'Chegará entre 4 e 6 dias úteis',
          descricao: 'Entrega garantida pelos Correios/Transportadora'
        },
        {
          id: 'frete-express',
          transportadora_id: '2',
          nome: 'Entrega Padrão Correios (Expressa)',
          nome_transportadora: 'Correios Express',
          valor: 24.90,
          prazo_dias: 2,
          prazo_estimado_texto: 'Chegará em 2 a 3 dias úteis',
          descricao: 'Opção mais rápida com rastreamento prioritário.'
        },
        {
          id: 'frete-jadlog',
          transportadora_id: '3',
          nome: 'Entrega via Transportadora Privada (Jadlog / Exclusiva)',
          nome_transportadora: 'Jadlog / Transportadora',
          valor: 18.90,
          prazo_dias: 4,
          prazo_estimado_texto: 'Chegará entre 3 e 5 dias úteis',
          descricao: 'Coleta e entrega expressa via transportadora privada.'
        },
        {
          id: 'frete-retirada',
          transportadora_id: '4',
          nome: 'Retirar na Loja Física',
          nome_transportadora: 'Loja Banho & Tosa',
          valor: 0,
          prazo_dias: 0,
          prazo_estimado_texto: 'Pronto para retirada após confirmação',
          descricao: 'Retire gratuitamente em nossa loja. Traga o documento de identificação e o número do pedido.',
          is_gratis: true,
        }
      ];
      setOpcoesFrete(fretesFallback);
      setFreteSelecionado(fretesFallback[0]);
    }

    setCalculandoFrete(false);
  }

  // Finalizar e redirecionar para o Mercado Pago
  async function handleFinalizarEPagar() {
    setProcessandoPagamento(true);
    try {
      const payload = {
        items: itens,
        cliente: {
          tipoPessoa,
          nomeCompleto,
          cpfCnpj,
          email,
          telefone,
          endereco: { cep, logradouro, numero, complemento, bairro, cidade, uf }
        },
        frete: freteSelecionado,
        total: Math.max(0, subtotal - (cupomAplicado ? cupomAplicado.desconto : 0) + (freteSelecionado ? freteSelecionado.valor : 0))
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        if (data.numeroPedido) {
          try {
            localStorage.setItem('ultimo_pedido', JSON.stringify({ numero: data.numeroPedido, cpf: cpfCnpj, data: new Date().toISOString() }));
          } catch {}
        }
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.erro || 'Falha ao conectar com o Mercado Pago. Verifique as credenciais.');
      }
    } catch {
      alert('Ocorreu um erro ao comunicar com a central de pagamentos.');
    } finally {
      setProcessandoPagamento(false);
    }
  }

  // Cálculos do Pedido
  const subtotal = itens.reduce((sum, item) => sum + item.preco_unitario * item.quantidade, 0);
  const valorFrete = freteSelecionado ? freteSelecionado.valor : 0;
  const total = subtotal + valorFrete;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center font-bold text-gray-500 animate-pulse">Carregando checkout...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-16">
      {/* Topo Estilo Mercado Livre */}
      <header className="bg-white border-b border-gray-200 py-4 shadow-2xs sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-heading font-black text-xl text-secondary">
            <span className="text-primary text-2xl">🐶</span>
            MIMO Show
          </Link>
          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
            <ShieldCheck size={16} className="text-green-600" />
            <span>Compra 100% Segura e Protegida</span>
          </div>
        </div>
      </header>

      {/* Progress Bar Estilo Mercado Livre */}
      <div className="bg-white border-b border-gray-200 py-3 shadow-2xs mb-8">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between text-xs md:text-sm font-bold">
          
          <button
            onClick={() => setEtapa('endereco')}
            className={`flex items-center gap-2 ${etapa === 'endereco' ? 'text-primary' : 'text-gray-400'}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${etapa === 'endereco' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
            <span>Endereço</span>
          </button>

          <ChevronRight size={16} className="text-gray-300" />

          <button
            onClick={() => etapa !== 'endereco' && setEtapa('entrega')}
            disabled={etapa === 'endereco'}
            className={`flex items-center gap-2 ${etapa === 'entrega' ? 'text-primary' : etapa === 'resumo' ? 'text-green-600' : 'text-gray-400'}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${etapa === 'entrega' ? 'bg-primary text-white' : etapa === 'resumo' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
            <span>Envio</span>
          </button>

          <ChevronRight size={16} className="text-gray-300" />

          <button
            disabled
            className={`flex items-center gap-2 ${etapa === 'resumo' ? 'text-primary' : 'text-gray-400'}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${etapa === 'resumo' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>3</div>
            <span>Resumo</span>
          </button>

        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA DA ESQUERDA (ETAPAS 1, 2 e 3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* ETAPA 1: ENDEREÇO E IDENTIFICAÇÃO */}
          {etapa === 'endereco' && (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-xl font-bold text-secondary mb-1 flex items-center gap-2">
                <MapPin className="text-primary" size={22} />
                Onde você quer receber sua compra?
              </h2>
              <p className="text-xs text-gray-500 mb-6">Preencha seus dados para entrega do pedido.</p>

              <form onSubmit={irParaEntrega} className="space-y-4">
                {/* Tipo de Pessoa */}
                <div className="flex gap-4 pb-2 border-b border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-secondary">
                    <input type="radio" name="tipo" checked={tipoPessoa === 'PF'} onChange={() => setTipoPessoa('PF')} className="accent-primary" />
                    Pessoa Física (CPF)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-secondary">
                    <input type="radio" name="tipo" checked={tipoPessoa === 'PJ'} onChange={() => setTipoPessoa('PJ')} className="accent-primary" />
                    Pessoa Jurídica (CNPJ)
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {tipoPessoa === 'PF' ? 'Nome Completo' : 'Razão Social'} *
                    </label>
                    <input
                      required
                      type="text"
                      value={nomeCompleto}
                      onChange={e => setNomeCompleto(e.target.value)}
                      placeholder={tipoPessoa === 'PF' ? 'Ex: Maria Oliveira' : 'Ex: Pet Shop Silva LTDA'}
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'} *
                    </label>
                    <input
                      required
                      type="text"
                      value={cpfCnpj}
                      onChange={e => setCpfCnpj(e.target.value)}
                      placeholder={tipoPessoa === 'PF' ? '000.000.000-00' : '00.000.000/0001-00'}
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">E-mail para confirmação *</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Telefone / WhatsApp *</label>
                    <input
                      required
                      type="tel"
                      value={telefone}
                      onChange={e => setTelefone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    />
                  </div>
                </div>

                {/* ENDEREÇO */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-secondary mb-3">Endereço de Entrega</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">CEP *</label>
                      <input
                        required
                        type="text"
                        value={cep}
                        onChange={e => buscarCep(e.target.value)}
                        placeholder="00000-000"
                        maxLength={9}
                        className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white font-bold"
                      />
                      {buscandoCep && <p className="text-[10px] text-primary mt-1 animate-pulse">Buscando CEP...</p>}
                      {erroCep && <p className="text-[10px] text-red-500 mt-1">{erroCep}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Rua / Logradouro *</label>
                      <input
                        required
                        type="text"
                        value={logradouro}
                        onChange={e => setLogradouro(e.target.value)}
                        placeholder="Av. Paulista"
                        className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Número *</label>
                      <input
                        required
                        type="text"
                        value={numero}
                        onChange={e => setNumero(e.target.value)}
                        placeholder="123"
                        className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Complemento (Apto, Bloco)</label>
                      <input
                        type="text"
                        value={complemento}
                        onChange={e => setComplemento(e.target.value)}
                        placeholder="Apto 42"
                        className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Bairro *</label>
                      <input
                        required
                        type="text"
                        value={bairro}
                        onChange={e => setBairro(e.target.value)}
                        placeholder="Bela Vista"
                        className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Cidade *</label>
                      <input
                        required
                        type="text"
                        value={cidade}
                        onChange={e => setCidade(e.target.value)}
                        placeholder="São Paulo"
                        className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">UF *</label>
                      <input
                        required
                        type="text"
                        value={uf}
                        onChange={e => setUf(e.target.value.toUpperCase())}
                        placeholder="SP"
                        maxLength={2}
                        className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white font-bold uppercase"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-xl text-base transition shadow-md mt-6 flex items-center justify-center gap-2"
                >
                  <span>Continuar para a Opção de Envio</span>
                  <ChevronRight size={20} />
                </button>
              </form>
            </div>
          )}

          {/* ETAPA 2: SELEÇÃO DE FRETE (ESTILO MERCADO LIVRE) */}
          {etapa === 'entrega' && (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
                    <Truck className="text-primary" size={22} />
                    Escolha a forma de entrega
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Enviando para: <strong>{logradouro}, {numero} - {cidade}/{uf}</strong></p>
                </div>
                <button
                  onClick={() => setEtapa('endereco')}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  Alterar endereço
                </button>
              </div>

              {calculandoFrete ? (
                <div className="py-12 text-center text-primary font-bold animate-pulse">
                  Consultando transportadoras disponíveis...
                </div>
              ) : opcoesFrete.length > 0 ? (
                <div className="space-y-3">
                  {opcoesFrete.map((opcao) => {
                    const isSelected = freteSelecionado?.id === opcao.id;
                    return (
                      <label
                        key={opcao.id}
                        onClick={() => setFreteSelecionado(opcao)}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected ? 'border-primary bg-orange-50/30 ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="opcao_frete"
                            checked={isSelected}
                            onChange={() => setFreteSelecionado(opcao)}
                            className="w-5 h-5 accent-primary"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-secondary text-sm md:text-base">{opcao.nome}</span>
                              {opcao.is_gratis && (
                                <span className="bg-green-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                  FRETE GRÁTIS
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{opcao.prazo_estimado_texto}</p>
                            {opcao.descricao && <p className="text-[11px] text-gray-400 mt-0.5">{opcao.descricao}</p>}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`font-black text-base md:text-lg ${opcao.valor === 0 ? 'text-green-600' : 'text-secondary'}`}>
                            {opcao.valor === 0 ? 'Grátis' : `R$ ${opcao.valor.toFixed(2).replace('.', ',')}`}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center text-red-800 text-sm">
                  Não encontramos transportadoras para este CEP. Verifique o endereço ou entre em contato com nosso suporte.
                </div>
              )}

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setEtapa('endereco')}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl text-sm hover:bg-gray-200 transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} />
                  <span>Voltar</span>
                </button>
                <button
                  onClick={() => setEtapa('resumo')}
                  disabled={!freteSelecionado}
                  className="flex-[2] bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-xl text-base transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>Revisar e Finalizar</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 3: RESUMO COMPLETO DO PEDIDO */}
          {etapa === 'resumo' && (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-6">
              <h2 className="text-2xl font-bold text-secondary flex items-center gap-2">
                <CheckCircle2 className="text-green-600" size={26} />
                Resumo da Compra
              </h2>

              {/* Card de Dados do Cliente e Endereço */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-2 text-xs md:text-sm text-gray-700">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-secondary text-base flex items-center gap-1.5">
                    📍 Endereço de Entrega
                  </h3>
                  <button onClick={() => setEtapa('endereco')} className="text-xs text-blue-600 font-bold hover:underline">
                    Editar
                  </button>
                </div>
                <p><strong>{nomeCompleto}</strong> ({cpfCnpj})</p>
                <p>{logradouro}, {numero} {complemento ? `- ${complemento}` : ''}</p>
                <p>{bairro} - {cidade}/{uf} | CEP: {cep}</p>
                <p>✉️ {email} | 📞 {telefone}</p>
              </div>

              {/* Card de Forma de Envio Selecionada */}
              <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-200 space-y-1 text-xs md:text-sm text-secondary">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-secondary text-base flex items-center gap-1.5">
                    🚚 Opção de Envio Selecionada
                  </h3>
                  <button onClick={() => setEtapa('entrega')} className="text-xs text-blue-600 font-bold hover:underline">
                    Editar
                  </button>
                </div>
                <p className="font-bold text-base text-primary">{freteSelecionado?.nome}</p>
                <p className="text-gray-600">{freteSelecionado?.prazo_estimado_texto}</p>
                <p className="font-bold mt-1 text-secondary">
                  Valor do Frete: {freteSelecionado?.valor === 0 ? 'GRÁTIS' : `R$ ${freteSelecionado?.valor.toFixed(2).replace('.', ',')}`}
                </p>
              </div>

              {/* Itens do Pedido */}
              <div>
                <h3 className="font-bold text-secondary text-sm mb-3">Itens do Pedido ({itens.length})</h3>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
                  {itens.map((item) => (
                    <div key={item.id} className="p-4 flex items-center gap-4 bg-white">
                      <div className="w-16 h-16 relative bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        {item.imagem ? (
                          <Image src={item.imagem} alt={item.nome} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold">Sem Foto</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-secondary text-xs md:text-sm">{item.nome}</h4>
                        {item.sku && <p className="text-[11px] text-gray-400">SKU: {item.sku}</p>}
                        <p className="text-xs text-gray-500 mt-1">Qtd: {item.quantidade} x R$ {item.preco_unitario.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <span className="font-bold text-sm md:text-base text-secondary">
                        R$ {(item.preco_unitario * item.quantidade).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aviso e Botão de Redirecionamento Mercado Pago */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs md:text-sm text-emerald-900 font-medium flex items-center gap-3">
                <Store size={24} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <strong>Pagamento Seguro Mercado Pago:</strong> Você será redirecionado para o ambiente seguro do Mercado Pago para escolher PIX, Cartão de Crédito ou Boleto.
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinalizarEPagar}
                disabled={processandoPagamento}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl text-lg transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {processandoPagamento ? (
                  <span>Conectando ao Mercado Pago...</span>
                ) : (
                  <>
                    <span>Pagar Agora no Mercado Pago (PIX / Cartão / Boleto)</span>
                    <ChevronRight size={22} />
                  </>
                )}
              </button>
            </div>
          )}

        </div>

        {/* COLUNA DA DIREITA: RESUMO FINANCEIRO PERSISTENTE */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs sticky top-24 space-y-4">
            <h3 className="font-bold text-secondary text-base pb-3 border-b border-gray-100 flex items-center gap-2">
              <ShoppingBag size={18} className="text-primary" />
              Resumo da Compra
            </h3>

            <div className="space-y-2 text-xs md:text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Produtos ({itens.reduce((acc, i) => acc + i.quantidade, 0)})</span>
                <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>

              {cupomAplicado && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Desconto Cupom ({cupomAplicado.codigo})</span>
                  <span>- R$ {cupomAplicado.desconto.toFixed(2).replace('.', ',')}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Frete</span>
                {freteSelecionado ? (
                  <span className={`font-bold ${freteSelecionado.valor === 0 ? 'text-green-600' : 'text-secondary'}`}>
                    {freteSelecionado.valor === 0 ? 'Grátis' : `R$ ${freteSelecionado.valor.toFixed(2).replace('.', ',')}`}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">A calcular</span>
                )}
              </div>
            </div>

            {/* Bloco de Cupom de Desconto */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Ticket size={14} className="text-primary" />
                Cupom de Desconto
              </label>

              {cupomAplicado ? (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-bold text-emerald-800 uppercase block">{cupomAplicado.codigo}</span>
                    <span className="text-emerald-600 text-[11px]">Economia de R$ {cupomAplicado.desconto.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={removerCupom}
                    className="p-1 text-gray-400 hover:text-red-600 transition cursor-pointer"
                    title="Remover cupom"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Código do cupom"
                      value={cupomInput}
                      onChange={(e) => setCupomInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          aplicarCupomCodigo();
                        }
                      }}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => aplicarCupomCodigo()}
                      disabled={validandoCupom || !cupomInput.trim()}
                      className="bg-primary hover:bg-primary/90 text-white font-bold px-3 py-2 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {validandoCupom ? '...' : 'Aplicar'}
                    </button>
                  </div>

                  {erroCupom && (
                    <p className="text-[11px] font-medium text-red-500 mt-1">{erroCupom}</p>
                  )}

                  {cuponsDisponiveis && cuponsDisponiveis.length > 0 && (
                    <div className="pt-1">
                      <p className="text-[11px] text-gray-500 mb-1.5 font-medium">Cupons disponíveis:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cuponsDisponiveis.map((c: any) => (
                          <button
                            key={c.id || c.codigo}
                            type="button"
                            onClick={() => {
                              setCupomInput(c.codigo);
                              aplicarCupomCodigo(c.codigo);
                            }}
                            className="bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-[11px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <Ticket size={11} />
                            {c.codigo}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-200 flex justify-between items-end">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase block">Total</span>
                <span className="text-2xl font-black text-secondary">
                  R$ {Math.max(0, subtotal - (cupomAplicado ? cupomAplicado.desconto : 0) + (freteSelecionado ? freteSelecionado.valor : 0)).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl text-[11px] text-gray-500 space-y-1">
              <p>✓ Garantia de devolução grátis em até 7 dias</p>
              <p>✓ Suporte via WhatsApp após a compra</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function getExemploCarrinho(): ItemCarrinho[] {
  return [
    {
      id: 'prod-1',
      nome: '200 Adesivos Pet Piercings Eva Glitter Petshop Cães E Gatos',
      slug: '200-adesivos-pet-piercings-eva-glitter-petshop-caes-e-gatos',
      imagem: 'https://http2.mlstatic.com/D_NQ_NP_2X_736630-MLB72661556093_112023-F.webp',
      preco_unitario: 18.90,
      quantidade: 1,
      peso_kg: 0.2,
      largura_cm: 15,
      altura_cm: 5,
      comprimento_cm: 20,
    }
  ];
}
