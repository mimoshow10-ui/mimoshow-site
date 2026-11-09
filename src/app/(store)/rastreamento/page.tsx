'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  MapPin,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

function RastreamentoContent() {
  const searchParams = useSearchParams();
  const queryPedido = searchParams.get('pedido') || searchParams.get('codigo') || '';
  
  const [busca, setBusca] = useState(queryPedido);
  const [loading, setLoading] = useState(false);
  const [pedido, setPedido] = useState<any | null>(null);
  const [buscado, setBuscado] = useState(false);

  useEffect(() => {
    const statusParam = searchParams.get('status') || searchParams.get('collection_status');
    const paymentIdParam = searchParams.get('payment_id') || searchParams.get('collection_id');

    if (queryPedido && paymentIdParam && (statusParam === 'sucesso' || statusParam === 'approved' || statusParam === 'success')) {
      fetch('/api/pedidos/confirmar-pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeroPedido: queryPedido, paymentId: paymentIdParam })
      }).then(() => handleBuscar(queryPedido)).catch(() => handleBuscar(queryPedido));
    } else if (queryPedido) {
      handleBuscar(queryPedido);
    } else {
      try {
        const ult = localStorage.getItem('ultimo_pedido');
        if (ult) {
          const parsed = JSON.parse(ult);
          if (parsed.numero) {
            setBusca(parsed.numero);
            handleBuscar(parsed.numero);
          } else if (parsed.cpf) {
            setBusca(parsed.cpf);
            handleBuscar(parsed.cpf);
          }
        }
      } catch {}
    }
  }, [queryPedido]);

  async function handleBuscar(termoBusca?: string) {
    const termo = (termoBusca !== undefined ? termoBusca : busca).trim();
    if (!termo) return;

    setLoading(true);
    setBuscado(true);

    try {
      const { data: config } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'pedidos_db')
        .single();

      const pedidos: any[] = config?.valor || [];

      const termoLimpo = termo.replace('#', '').toLowerCase();
      const cpfLimpo = termo.replace(/\D/g, '');

      // Buscar por ID, Número do Pedido, ou CPF do Cliente
      const enc = pedidos.find((p) => {
        const numPed = (p.numero_pedido || p.id || '').toString().toLowerCase().replace('#', '');
        const idPed = (p.id || '').toString().toLowerCase();
        const cpfCli = (p.cliente?.cpf_cnpj || '').replace(/\D/g, '');

        if (numPed === termoLimpo || idPed === termoLimpo) return true;
        if (cpfLimpo.length >= 8 && cpfCli && cpfCli === cpfLimpo) return true;
        return false;
      });

      if (enc) {
        setPedido(enc);
      }
    } catch (err) {
      console.error('Erro ao consultar pedido:', err);
    } finally {
      setLoading(false);
    }
  }

  // Define as etapas do pedido para a timeline visual
  function getEtapas(p: any) {
    const s = (p.status || 'AGUARDANDO_PAGAMENTO').toString().toUpperCase().trim();
    const isBlingOk = p.bling_status === 'OK';
    const temRastreio = Boolean(p.codigo_rastreio);

    const isPago = ['PAGAMENTO_APROVADO', 'PAGO', 'APROVADO', 'EM_SEPARACAO', 'ENVIADO', 'ENTREGUE'].includes(s);
    const isEmSeparacao = isPago && (s === 'EM_SEPARACAO' || isBlingOk || s === 'ENVIADO' || s === 'ENTREGUE');
    const isEnviado = isPago && (s === 'ENVIADO' || s === 'ENTREGUE' || temRastreio);
    const isEntregue = isPago && s === 'ENTREGUE';

    const etapa1 = true; // Pedido Realizado
    const etapa2 = isPago; // Pagamento Aprovado
    const etapa3 = isEmSeparacao; // Em Separação / Bling
    const etapa4 = isEnviado; // Enviado
    const etapa5 = isEntregue; // Entregue

    return [
      { id: 1, titulo: 'Pedido Realizado', sub: new Date(p.criado_em || Date.now()).toLocaleDateString('pt-BR'), ok: etapa1 },
      { id: 2, titulo: 'Pagamento Aprovado', sub: etapa2 ? 'Confirmado ✔️' : 'Aguardando pagamento', ok: etapa2 },
      { id: 3, titulo: 'Em Separação', sub: etapa3 ? (isBlingOk ? 'Nota emitida (Bling)' : 'Em preparação') : 'Em breve', ok: etapa3 },
      { id: 4, titulo: 'Enviado', sub: etapa4 ? (p.codigo_rastreio ? `Rastreio: ${p.codigo_rastreio}` : 'Em trânsito') : 'Aguardando envio', ok: etapa4 },
      { id: 5, titulo: 'Entregue', sub: etapa5 ? 'Pedido concluído 🎉' : 'Previsão de entrega', ok: etapa5 },
    ];
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 font-sans space-y-8">
      {/* Topo / Cabeçalho */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-900 px-3.5 py-1.5 rounded-full text-xs font-bold">
          <Truck size={16} className="text-primary" />
          Rastreamento de Encomendas
        </div>
        <h1 className="text-3xl md:text-4xl font-heading font-black text-secondary">
          Acompanhe seu Pedido
        </h1>
        <p className="text-sm text-gray-600">
          Digite o <strong>Número do Pedido</strong> (ex: <code>#PED-10842</code>) ou o <strong>CPF/CNPJ</strong> cadastrado no momento da compra.
        </p>
      </div>

      {/* Formulário de Busca */}
      <div className="bg-white p-4 md:p-6 rounded-3xl border border-gray-200 shadow-md max-w-2xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleBuscar();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite o número do pedido ou CPF..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-300 font-bold text-sm text-secondary focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-2xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Consultando...</span>
            ) : (
              <>
                <span>Consultar</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Resultado: Carregando */}
      {loading && (
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-bold text-gray-500 text-sm">Buscando informações do seu pedido...</p>
        </div>
      )}

      {/* Resultado: Não encontrado */}
      {!loading && buscado && !pedido && (
        <div className="bg-amber-50 border border-amber-200 p-8 rounded-3xl text-center space-y-4 max-w-xl mx-auto">
          <AlertCircle size={40} className="mx-auto text-amber-600" />
          <div>
            <h3 className="font-bold text-lg text-amber-900">Pedido não localizado</h3>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Não encontramos nenhum pedido com o termo <strong>"{busca}"</strong>. Verifique se o número do pedido ou CPF foi digitado corretamente.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/5511930813280?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20para%20rastrear%20meu%20pedido."
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition inline-flex items-center justify-center gap-2"
            >
              💬 Falar com Atendimento no WhatsApp
            </a>
            <Link
              href="/minhaconta"
              className="bg-white border border-gray-300 text-secondary font-bold text-xs px-5 py-3 rounded-xl hover:bg-gray-50 transition inline-flex items-center justify-center gap-1"
            >
              Ir para Minha Conta
            </Link>
          </div>
        </div>
      )}

      {/* Resultado: Pedido Encontrado */}
      {!loading && pedido && (
        <div className="space-y-8 animate-fade-in">
          {/* Card Resumo do Pedido */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider block">Detalhes do Rastreio</span>
                <h2 className="text-2xl font-bold text-secondary flex items-center gap-2">
                  Pedido #{pedido.numero_pedido || pedido.id}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Realizado em {new Date(pedido.criado_em || Date.now()).toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 font-bold px-3.5 py-1.5 rounded-full text-xs inline-flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 size={16} />
                  Status: {pedido.status === 'ENVIADO' ? 'Enviado' : pedido.status === 'ENTREGUE' ? 'Entregue' : 'Pagamento Aprovado'}
                </span>
              </div>
            </div>

            {/* Linha do Tempo Visual (Timeline) */}
            <div className="py-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">Etapas de Envio</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                {getEtapas(pedido).map((etapa) => (
                  <div key={etapa.id} className="flex md:flex-col items-center md:items-start gap-3 md:gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all ${
                        etapa.ok
                          ? 'bg-emerald-600 text-white shadow-xs ring-4 ring-emerald-100'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {etapa.ok ? <CheckCircle2 size={18} /> : etapa.id}
                    </div>
                    <div>
                      <p className={`font-bold text-xs md:text-sm ${etapa.ok ? 'text-secondary' : 'text-gray-400'}`}>
                        {etapa.titulo}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{etapa.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Código de Rastreamento Direto (Se Houver) */}
            {pedido.codigo_rastreio && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                    <Truck size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider block">Código de Rastreamento</span>
                    <span className="font-mono font-black text-xl text-blue-950">{pedido.codigo_rastreio}</span>
                    <p className="text-xs text-blue-700 mt-0.5">Utilize este código no site dos Correios ou Transportadora.</p>
                  </div>
                </div>

                {pedido.url_rastreio ? (
                  <a
                    href={pedido.url_rastreio}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-xs inline-flex items-center gap-2"
                  >
                    <span>Rastrear na Transportadora</span>
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <a
                    href={`https://rastreamento.correios.com.br/app/index.php?codigo=${pedido.codigo_rastreio}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-xs inline-flex items-center gap-2"
                  >
                    <span>Rastrear nos Correios</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            )}

            {/* Grid de Informações: Destinatário & Itens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Endereço de Entrega */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-2 text-xs md:text-sm">
                <h4 className="font-bold text-secondary text-base flex items-center gap-2 pb-2 border-b border-gray-200">
                  <MapPin size={18} className="text-primary" />
                  Destino da Entrega
                </h4>
                <p><strong>Cliente:</strong> {pedido.cliente?.nome_completo}</p>
                <p><strong>Endereço:</strong> {pedido.endereco_entrega?.logradouro}, {pedido.endereco_entrega?.numero} {pedido.endereco_entrega?.complemento}</p>
                <p><strong>Bairro/Cidade:</strong> {pedido.endereco_entrega?.bairro} - {pedido.endereco_entrega?.cidade}/{pedido.endereco_entrega?.uf}</p>
                <p><strong>CEP:</strong> {pedido.endereco_entrega?.cep}</p>
                <p className="text-primary font-bold mt-1">🚚 Modalidade: {pedido.frete_selecionado?.nome || 'Envio Padrão'}</p>
              </div>

              {/* Lista de Produtos */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-3">
                <h4 className="font-bold text-secondary text-base flex items-center gap-2 pb-2 border-b border-gray-200">
                  <Package size={18} className="text-primary" />
                  Itens do Pedido ({pedido.itens?.length || 0})
                </h4>
                <div className="divide-y divide-gray-200 max-h-48 overflow-y-auto pr-1">
                  {pedido.itens?.map((item: any, idx: number) => (
                    <div key={idx} className="py-2.5 flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 relative overflow-hidden flex-shrink-0">
                        {item.imagem ? (
                          <Image src={item.imagem} alt={item.nome} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400">Sem Foto</div>
                        )}
                      </div>
                      <div className="flex-1 text-xs">
                        <p className="font-bold text-secondary line-clamp-1">{item.nome}</p>
                        <p className="text-gray-500">Qtd: {item.quantidade}x • R$ {Number(item.preco_unitario).toFixed(2).replace('.', ',')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="bg-secondary text-white p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-200 uppercase font-bold block">Valor Total do Pedido</span>
                <span className="text-2xl font-black text-accent">
                  R$ {Number(pedido.total || 0).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <a
                href="https://wa.me/5511930813280"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-white bg-white/10 hover:bg-white/20 font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
              >
                <HelpCircle size={16} />
                Dúvidas sobre o envio?
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Card Informativo Inferior */}
      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-3">
          <ShieldCheck size={28} className="text-emerald-600 flex-shrink-0" />
          <div>
            <strong className="text-secondary text-sm block">Entregas Garantidas Mimo Show Pet</strong>
            <p>Seus produtos são embalados com cuidado e enviados via transportadoras parceiras credenciadas.</p>
          </div>
        </div>
        <Link
          href="/"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 flex-shrink-0"
        >
          Voltar para a Loja <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default function RastreamentoPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-500 font-bold">Carregando página de rastreamento...</div>}>
      <RastreamentoContent />
    </Suspense>
  );
}
