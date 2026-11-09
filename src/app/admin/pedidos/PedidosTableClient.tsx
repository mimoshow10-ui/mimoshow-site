'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Eye,
  AlertCircle,
  RefreshCw,
  PackageCheck,
  Filter,
} from 'lucide-react';

interface Props {
  pedidosIniciais: any[];
}

export default function PedidosTableClient({ pedidosIniciais }: Props) {
  const [busca, setBusca] = useState('');
  const [filtroBling, setFiltroBling] = useState<'TODOS' | 'AGUARDANDO' | 'FILA' | 'OK' | 'ERRO'>('TODOS');

  // Contadores para os cards do painel interno
  const contadores = useMemo(() => {
    let total = pedidosIniciais.length;
    let aguardando = 0;
    let fila = 0;
    let confirmados = 0;
    let erros = 0;

    pedidosIniciais.forEach((p) => {
      const isPago = p.status === 'PAGAMENTO_APROVADO' || p.status === 'ENVIADO' || p.status === 'ENTREGUE';
      if (!isPago) {
        aguardando++;
      } else if (p.bling_status === 'OK') {
        confirmados++;
      } else if (p.bling_status === 'ERRO') {
        erros++;
      } else {
        fila++;
      }
    });

    return { total, aguardando, fila, confirmados, erros };
  }, [pedidosIniciais]);

  // Lista filtrada
  const pedidosFiltrados = useMemo(() => {
    return pedidosIniciais.filter((p) => {
      // Filtro de status Bling
      const isPago = p.status === 'PAGAMENTO_APROVADO' || p.status === 'ENVIADO' || p.status === 'ENTREGUE';

      if (filtroBling === 'AGUARDANDO') {
        if (isPago) return false;
      } else if (filtroBling === 'OK') {
        if (p.bling_status !== 'OK') return false;
      } else if (filtroBling === 'ERRO') {
        if (p.bling_status !== 'ERRO') return false;
      } else if (filtroBling === 'FILA') {
        if (p.bling_status !== 'FILA' && p.bling_status !== 'PROCESSANDO') return false;
      }

      // Filtro de texto
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const num = String(p.numero_pedido || p.id).toLowerCase();
        const nome = String(p.cliente?.nome_completo || '').toLowerCase();
        const doc = String(p.cliente?.cpf_cnpj || '').toLowerCase();
        const blingId = String(p.bling_id || '').toLowerCase();
        return num.includes(termo) || nome.includes(termo) || doc.includes(termo) || blingId.includes(termo);
      }

      return true;
    });
  }, [pedidosIniciais, busca, filtroBling]);

  return (
    <div className="space-y-6">
      {/* ── PAINEL INTERNO DE STATUS DO BLING (CARDS) ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setFiltroBling('TODOS')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            filtroBling === 'TODOS'
              ? 'bg-secondary text-white border-secondary shadow-sm'
              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="text-[11px] font-bold block uppercase tracking-wider opacity-80">Total Pedidos</span>
          <span className="text-2xl font-black mt-1 block">{contadores.total}</span>
        </button>

        <button
          type="button"
          onClick={() => setFiltroBling('AGUARDANDO')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            filtroBling === 'AGUARDANDO'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white border-amber-200 text-amber-900 hover:border-amber-300'
          }`}
        >
          <span className="text-[11px] font-bold block uppercase tracking-wider opacity-80 flex items-center gap-1">
            <Clock size={12} /> Aguardando Pag.
          </span>
          <span className="text-2xl font-black mt-1 block">{contadores.aguardando}</span>
        </button>

        <button
          type="button"
          onClick={() => setFiltroBling('FILA')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            filtroBling === 'FILA'
              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
              : 'bg-white border-sky-200 text-sky-900 hover:border-sky-300'
          }`}
        >
          <span className="text-[11px] font-bold block uppercase tracking-wider opacity-80 flex items-center gap-1">
            <RefreshCw size={12} /> Na Fila Bling
          </span>
          <span className="text-2xl font-black mt-1 block">{contadores.fila}</span>
        </button>

        <button
          type="button"
          onClick={() => setFiltroBling('OK')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            filtroBling === 'OK'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white border-blue-200 text-blue-900 hover:border-blue-300'
          }`}
        >
          <span className="text-[11px] font-bold block uppercase tracking-wider opacity-80 flex items-center gap-1">
            <PackageCheck size={12} /> Confirmados Bling
          </span>
          <span className="text-2xl font-black mt-1 block">{contadores.confirmados}</span>
        </button>

        <button
          type="button"
          onClick={() => setFiltroBling('ERRO')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            filtroBling === 'ERRO'
              ? 'bg-red-600 text-white border-red-600 shadow-sm'
              : 'bg-white border-red-200 text-red-900 hover:border-red-300'
          }`}
        >
          <span className="text-[11px] font-bold block uppercase tracking-wider opacity-80 flex items-center gap-1">
            <AlertCircle size={12} /> Erros Bling
          </span>
          <span className="text-2xl font-black mt-1 block">{contadores.erros}</span>
        </button>
      </div>

      {/* ── BARRA DE PESQUISA & INFORMAÇÃO ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nº pedido, cliente, CPF ou ID Bling..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Exibindo <strong>{pedidosFiltrados.length}</strong> de <strong>{pedidosIniciais.length}</strong> pedidos
          {filtroBling !== 'TODOS' && (
            <button
              type="button"
              onClick={() => setFiltroBling('TODOS')}
              className="ml-2 text-primary font-bold hover:underline cursor-pointer"
            >
              (Limpar filtro)
            </button>
          )}
        </div>
      </div>

      {/* ── TABELA DE PEDIDOS ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider font-bold border-b border-gray-200">
              <tr>
                <th className="p-4">Nº Pedido</th>
                <th className="p-4">Loja / Origem</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Data</th>
                <th className="p-4">Itens</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status Pagamento</th>
                <th className="p-4">Status Bling ERP</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400 text-xs">
                    Nenhum pedido encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((ped) => {
                  const isPago = ped.status === 'PAGAMENTO_APROVADO' || ped.status === 'ENVIADO' || ped.status === 'ENTREGUE';
                  const isBlingOk = ped.bling_status === 'OK';
                  const isBlingErro = ped.bling_status === 'ERRO';
                  const isBlingFila = ped.bling_status === 'FILA' || ped.bling_status === 'PROCESSANDO';
                  const isMimo = ped.origem_loja === 'Mimo Show' || (ped.dados_pagamento?.notification_url && ped.dados_pagamento.notification_url.includes('mimo'));

                  return (
                    <tr key={ped.id} className="hover:bg-blue-50/40 transition">
                      <td className="p-4 font-black text-secondary">
                        #{ped.numero_pedido}
                      </td>
                      <td className="p-4">
                        {isMimo ? (
                          <span className="bg-purple-100 text-purple-800 border border-purple-200 font-black px-2 py-0.5 rounded-lg text-xs inline-flex items-center gap-1 shadow-2xs">
                            🏬 Mimo Show
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-900 border border-amber-200 font-black px-2 py-0.5 rounded-lg text-xs inline-flex items-center gap-1 shadow-2xs">
                            🐕 Banho & Tosa
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-gray-800">
                        {ped.cliente?.nome_completo || 'Cliente'}
                        <span className="block text-xs font-normal text-gray-400">{ped.cliente?.telefone}</span>
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {new Date(ped.criado_em).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 text-xs">
                        <span className="font-bold text-secondary block">{ped.itens?.length || 1} item(ns)</span>
                        <span className="text-gray-400 font-mono text-[11px]">
                          {ped.itens?.map((i: any) => i.sku || 'N/A').slice(0, 2).join(', ')}
                          {ped.itens?.length > 2 ? '...' : ''}
                        </span>
                      </td>
                      <td className="p-4 font-black text-primary text-base">
                        R$ {Number(ped.total).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-4">
                        {isPago ? (
                          <span className="bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded-full text-xs inline-flex items-center gap-1">
                            <CheckCircle2 size={12} /> Pago
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-xs inline-flex items-center gap-1">
                            <Clock size={12} /> Aguardando
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {isBlingOk ? (
                          <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full text-xs inline-flex items-center gap-1">
                            <PackageCheck size={12} /> Confirmado (#{ped.bling_id || 'OK'})
                          </span>
                        ) : isBlingErro ? (
                          <span
                            className="bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-full text-xs inline-flex items-center gap-1 cursor-help"
                            title={ped.bling_erro || 'Falha ao sincronizar com o Bling'}
                          >
                            <AlertCircle size={12} /> Erro ({ped.bling_tentativas || 1}x)
                          </span>
                        ) : isBlingFila ? (
                          <span className="bg-sky-100 text-sky-800 font-bold px-2.5 py-1 rounded-full text-xs inline-flex items-center gap-1">
                            <RefreshCw size={12} className="animate-spin" /> Na Fila
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 font-medium px-2.5 py-1 rounded-full text-xs inline-flex items-center gap-1">
                            <Clock size={12} /> Aguardando Pag.
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <Link
                          href={`/admin/pedidos/${ped.id}`}
                          className="inline-flex items-center gap-1 bg-secondary text-white hover:bg-blue-900 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs"
                        >
                          <Eye size={14} />
                          <span>Ver</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
