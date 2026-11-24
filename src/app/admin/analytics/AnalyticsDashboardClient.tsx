'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  Eye,
  ExternalLink,
  Code,
  Copy,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AnalyticsConfig } from '@/lib/analytics/types';
import {
  trackPageView,
  trackViewItem,
  trackSearch,
  trackSelectPromotion,
  trackSelectCategory,
  trackAddToCart,
  trackRemoveFromCart,
  trackCartAbandonment,
  trackBeginCheckout,
  trackShippingCalculated,
  trackCouponApplied,
  trackPaymentInfo,
  trackPurchase,
  trackError,
} from '@/lib/analytics/events';

interface Props {
  config: AnalyticsConfig;
}

interface LoggedEvent {
  id: string;
  timestamp: string;
  event: string;
  payload: any;
}

export default function AnalyticsDashboardClient({ config }: Props) {
  const [logs, setLogs] = useState<LoggedEvent[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'validador' | 'guia'>('validador');

  const gtmOk = Boolean(config?.gtm_id);
  const ga4Ok = Boolean(config?.ga4_measurement_id);
  const clarityOk = Boolean(config?.clarity_project_id);

  useEffect(() => {
    function handleEvent(e: Event) {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (!detail) return;

      const newLog: LoggedEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        event: detail.event,
        payload: detail,
      };

      setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
    }

    window.addEventListener('mimoshow:analytics_event', handleEvent);
    return () => window.removeEventListener('mimoshow:analytics_event', handleEvent);
  }, []);

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function limparLogs() {
    setLogs([]);
  }

  const [runningAll, setRunningAll] = useState(false);

  async function dispararTodos() {
    if (runningAll) return;
    setRunningAll(true);
    for (let i = 0; i < simulacoes.length; i++) {
      simulacoes[i].exec();
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    setRunningAll(false);
  }

  // Funções de Disparo de Teste para Validação
  const simulacoes = [
    {
      nome: '1. Acesso à Página (page_view)',
      exec: () => trackPageView('/teste-analytics', 'Página de Teste Analytics'),
      cor: 'bg-blue-600',
    },
    {
      nome: '2. Visualização de Produto (view_item)',
      exec: () =>
        trackViewItem({
          id: 'prod-teste-1',
          nome: 'Gravatinha Pet Cetim Premium (Teste)',
          preco: 19.9,
          preco_promocional: 14.9,
          categoria: 'Gravatinhas',
          sku: 'MS-TEST-001',
        }),
      cor: 'bg-emerald-600',
    },
    {
      nome: '3. Pesquisa Interna (search)',
      exec: () => trackSearch('adesivo pet glitter', 12),
      cor: 'bg-purple-600',
    },
    {
      nome: '4. Clique em Banner (select_promotion)',
      exec: () => trackSelectPromotion('Banner Coleção Pet 2027', 0, '/categoria/pet'),
      cor: 'bg-amber-600',
    },
    {
      nome: '5. Clique em Categoria (select_item)',
      exec: () => trackSelectCategory('Adesivos e Piercings Pet', '/categoria/adesivos'),
      cor: 'bg-pink-600',
    },
    {
      nome: '6. Adicionar ao Carrinho (add_to_cart)',
      exec: () =>
        trackAddToCart(
          {
            id: 'prod-teste-1',
            nome: 'Gravatinha Pet Cetim Premium',
            preco: 14.9,
            sku: 'MS-TEST-001',
          },
          2
        ),
      cor: 'bg-teal-600',
    },
    {
      nome: '7. Remover do Carrinho (remove_from_cart)',
      exec: () =>
        trackRemoveFromCart(
          {
            id: 'prod-teste-1',
            nome: 'Gravatinha Pet Cetim Premium',
            preco: 14.9,
          },
          1
        ),
      cor: 'bg-rose-600',
    },
    {
      nome: '8. Abandono de Carrinho (cart_abandonment)',
      exec: () =>
        trackCartAbandonment(
          [
            { id: 'prod-teste-1', nome: 'Gravatinha Pet Cetim', preco: 14.9, quantidade: 2 },
            { id: 'prod-teste-2', nome: 'Adesivo Glitter', preco: 9.9, quantidade: 1 },
          ],
          39.7
        ),
      cor: 'bg-red-700',
    },
    {
      nome: '9. Início do Checkout (begin_checkout)',
      exec: () =>
        trackBeginCheckout(
          [{ id: 'prod-teste-1', nome: 'Gravatinha Pet Cetim', preco: 14.9, quantidade: 2 }],
          29.8,
          'PRIMEIRACOMPRA'
        ),
      cor: 'bg-indigo-600',
    },
    {
      nome: '10. Cálculo de Frete (add_shipping_info)',
      exec: () => trackShippingCalculated('Entrega Expressa Correios (Sedex)', 18.5, '01310-100'),
      cor: 'bg-sky-600',
    },
    {
      nome: '11. Aplicação de Cupom (apply_coupon)',
      exec: () => trackCouponApplied('PRIMEIRACOMPRA', 5.0, true),
      cor: 'bg-orange-600',
    },
    {
      nome: '12. Seleção de Pagamento (add_payment_info)',
      exec: () => trackPaymentInfo('Mercado Pago (Pix)', 43.3, 'PRIMEIRACOMPRA'),
      cor: 'bg-violet-600',
    },
    {
      nome: '13. Compra Concluída (purchase)',
      exec: () =>
        trackPurchase(
          `TEST-${Math.floor(10000 + Math.random() * 90000)}`,
          [{ id: 'prod-teste-1', nome: 'Gravatinha Pet Cetim', preco: 14.9, quantidade: 2 }],
          43.3,
          18.5,
          5.0,
          'PRIMEIRACOMPRA'
        ),
      cor: 'bg-green-700',
    },
    {
      nome: '14. Erro de Pagamento / Navegação (error_event)',
      exec: () => trackError('pagamento', 'Transação recusada pela operadora do cartão de crédito (Simulação)'),
      cor: 'bg-neutral-800',
    },
  ];

  return (
    <div className="max-w-6xl font-sans space-y-6">
      {/* Topo do Painel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-gray-800 flex items-center gap-3">
            <span className="p-2 bg-blue-100 text-blue-900 rounded-xl">📊</span>
            <span>Customer Journey Analytics</span>
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Monitoramento da Jornada do Cliente, Data Layer centralizado e validação em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/configuracoes"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition shadow-xs"
          >
            ⚙️ Editar Identificadores
          </Link>
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2 bg-amber-400 text-blue-950 text-xs font-black rounded-xl hover:bg-amber-300 transition shadow-xs flex items-center gap-1.5"
          >
            <span>Abrir Loja</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* Cards de Status das Integrações */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GTM */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500">Google Tag Manager</span>
            {gtmOk ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-green-100 text-green-700">ATIVO</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">PENDENTE</span>
            )}
          </div>
          <p className="text-sm font-mono font-bold text-gray-800">{config?.gtm_id || 'Não configurado'}</p>
          <span className="text-[10px] text-gray-400 mt-2">Container GTM</span>
        </div>

        {/* GA4 */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500">Google Analytics 4</span>
            {ga4Ok ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-green-100 text-green-700">ATIVO</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">PENDENTE</span>
            )}
          </div>
          <p className="text-sm font-mono font-bold text-gray-800">{config?.ga4_measurement_id || 'Não configurado'}</p>
          <span className="text-[10px] text-gray-400 mt-2">ID de Medição</span>
        </div>

        {/* Clarity */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500">Microsoft Clarity</span>
            {clarityOk ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-green-100 text-green-700">ATIVO</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">PENDENTE</span>
            )}
          </div>
          <p className="text-sm font-mono font-bold text-gray-800">{config?.clarity_project_id || 'Não configurado'}</p>
          <span className="text-[10px] text-gray-400 mt-2">Heatmaps & Gravações</span>
        </div>

        {/* LGPD */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500">Consent Mode v2 & LGPD</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700">CONFORME</span>
          </div>
          <p className="text-sm font-bold text-gray-800">Consentimento Blindado</p>
          <span className="text-[10px] text-gray-400 mt-2">Default: Denied + Mascaramento PII</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('validador')}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'validador'
              ? 'bg-[#0B2545] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Play size={14} />
          <span>Simulador & Validador de Eventos</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('guia')}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'guia'
              ? 'bg-[#0B2545] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Layers size={14} />
          <span>Arquitetura do Data Layer</span>
        </button>
      </div>

      {activeTab === 'validador' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Botões de Simulação */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="border-b border-gray-100 pb-2">
              <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <span>⚡ Disparador de Testes em Tempo Real</span>
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Clique nos botões para disparar os eventos para o Data Layer local e verificar o payload sanitizado no painel ao lado.
              </p>
            </div>

            {/* BOTÃO PARA DISPARAR TODOS OS TESTES EM SEQUÊNCIA */}
            <button
              type="button"
              onClick={dispararTodos}
              disabled={runningAll}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={16} className={runningAll ? 'animate-spin' : ''} />
              <span>{runningAll ? 'Disparando os 14 eventos em sequência...' : '⚡ Disparar Todos os 14 Testes de Uma Vez (Jornada Completa)'}</span>
            </button>

            <div className="grid grid-cols-1 gap-2 max-h-[580px] overflow-y-auto pr-1">
              {simulacoes.map((sim, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={sim.exec}
                  className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-white transition flex items-center justify-between text-xs font-bold text-gray-800 shadow-2xs group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${sim.cor}`}></span>
                    <span className="truncate">{sim.nome}</span>
                  </div>
                  <Play size={12} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Console de Eventos Capturados */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col h-[650px]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
              <div>
                <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                  <span>📡 Monitor do window.dataLayer</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-mono font-bold">
                    {logs.length} capturados
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500">
                  Eventos interceptados do site e das simulações nesta sessão.
                </p>
              </div>

              {logs.length > 0 && (
                <button
                  type="button"
                  onClick={limparLogs}
                  className="text-xs text-gray-500 hover:text-red-600 transition font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Limpar</span>
                </button>
              )}
            </div>

            {logs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400 border border-dashed border-gray-200 rounded-xl">
                <Code size={36} className="text-gray-300 mb-2" />
                <p className="font-bold text-xs text-gray-600">Nenhum evento capturado ainda</p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
                  Navegue pela loja em outra aba ou clique nos botões ao lado para simular e inspecionar os eventos.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {logs.map((log) => {
                  const payloadStr = JSON.stringify(log.payload, null, 2);
                  const isCopied = copiedId === log.id;

                  return (
                    <div
                      key={log.id}
                      className="border border-gray-200 rounded-xl p-3 bg-gray-50 hover:bg-white transition text-xs font-mono shadow-2xs"
                    >
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-blue-900 text-white font-bold text-[10px]">
                            {log.event}
                          </span>
                          <span className="text-gray-400 text-[10px]">{log.timestamp}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(log.id, payloadStr)}
                          className="text-[10px] text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded border border-gray-200"
                        >
                          {isCopied ? <CheckCircle2 size={12} className="text-green-600" /> : <Copy size={12} />}
                          <span>{isCopied ? 'Copiado!' : 'Copiar JSON'}</span>
                        </button>
                      </div>

                      <pre className="text-[11px] text-gray-700 overflow-x-auto max-h-48 p-2 bg-gray-900 text-gray-100 rounded-lg font-mono">
                        {payloadStr}
                      </pre>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Guia e Arquitetura */
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Estrutura Centralizada de Data Layer & E-commerce GA4
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Todos os eventos da loja são disparados através do módulo centralizado{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-blue-700 font-mono">
                src/lib/analytics/dataLayer.ts
              </code>
              , seguindo o padrão oficial recomendado pelo Google e as diretrizes de privacidade da LGPD.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <h4 className="font-bold text-xs text-gray-800 mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-green-600" />
                <span>Prevenção de Duplicidade (Deduplication)</span>
              </h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Utiliza cache de assinatura por hash em janela de 600ms e controle de IDs transacionais no localStorage para evitar que renders duplos do React 19 ou atualizações acidentais registrem duas vezes a mesma conversão ou compra.
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <h4 className="font-bold text-xs text-gray-800 mb-2 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-blue-600" />
                <span>Sanitização & Conformidade LGPD</span>
              </h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Filtro automático que descarta CPFs, CNPJs, senhas, dados de cartão de crédito e mascara e-mails/telefones antes de qualquer push para o Data Layer ou Microsoft Clarity.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h4 className="font-bold text-xs text-gray-800 mb-2">Lista de Eventos Implementados na Jornada</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                <strong>page_view:</strong> Acesso às páginas
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                <strong>view_item:</strong> Visualização de produto
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                <strong>search:</strong> Pesquisas internas
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                <strong>select_promotion:</strong> Cliques em banners
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                <strong>select_item:</strong> Cliques em categorias
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                <strong>add_to_cart:</strong> Adição ao carrinho
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                <strong>remove_from_cart:</strong> Remoção do carrinho
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                <strong>cart_abandonment:</strong> Abandono de carrinho
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                <strong>begin_checkout:</strong> Início do checkout
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                <strong>add_shipping_info:</strong> Cálculo de frete
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                <strong>apply_coupon:</strong> Aplicação de cupons
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                <strong>add_payment_info:</strong> Seleção de pagamento
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                <strong>purchase:</strong> Compras concluídas
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                <strong>error_event:</strong> Erros de sistema/pagamento
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
