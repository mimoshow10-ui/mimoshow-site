'use client';

import { useState } from 'react';
import { atualizarStatusPedido, transmitirPedidoBling } from './actions';
import { CheckCircle2, Clock, Truck, PackageCheck, AlertCircle, RefreshCw, Send, Save, ExternalLink } from 'lucide-react';

interface Props {
  pedido: {
    id: string;
    numero_pedido: string;
    status: string;
    codigo_rastreio?: string;
    bling_status?: string;
    bling_id?: string;
    bling_erro?: string;
    cliente?: {
      nome_completo?: string;
      email?: string;
      telefone?: string;
    };
  };
}

export default function GerenciarPedidoControl({ pedido }: Props) {
  const [loading, setLoading] = useState(false);
  const [loadingBling, setLoadingBling] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  async function handleStatusSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set('pedido_id', pedido.id);
      const res = await atualizarStatusPedido(formData);
      if (res?.sucesso) {
        setMsg({ tipo: 'sucesso', texto: res.mensagem || 'Pedido atualizado com sucesso!' });
      } else {
        setMsg({ tipo: 'erro', texto: res?.erro || 'Erro ao atualizar pedido.' });
      }
    } catch (err: any) {
      setMsg({ tipo: 'erro', texto: err.message || 'Erro de comunicação.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleTransmitirBling() {
    setLoadingBling(true);
    setMsg(null);
    try {
      const formData = new FormData();
      formData.set('pedido_id', pedido.id);
      const res = await transmitirPedidoBling(formData);
      if (res?.sucesso) {
        setMsg({ tipo: 'sucesso', texto: res.mensagem || 'Pedido transmitido ao Bling com sucesso!' });
      } else {
        setMsg({ tipo: 'erro', texto: res?.erro || 'Erro ao transmitir ao Bling.' });
      }
    } catch (err: any) {
      setMsg({ tipo: 'erro', texto: err.message || 'Erro de comunicação com o Bling.' });
    } finally {
      setLoadingBling(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
          <Truck size={20} className="text-primary" />
          Painel de Controle e Gestão do Pedido #{pedido.numero_pedido}
        </h2>
        <span className="text-xs text-gray-400 font-mono">ID: {pedido.id}</span>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl font-bold text-xs flex items-center gap-2 ${
            msg.tipo === 'sucesso' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}
        >
          {msg.tipo === 'sucesso' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{msg.texto}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Formulário de Alteração de Status e Rastreamento */}
        <form onSubmit={handleStatusSubmit} className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
            <Save size={14} className="text-primary" /> Alterar Status do Pedido & Rastreio
          </h3>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Status Atual do Pedido *</label>
            <select
              name="status"
              defaultValue={pedido.status || 'AGUARDANDO_PAGAMENTO'}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white font-bold text-secondary cursor-pointer focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="AGUARDANDO_PAGAMENTO">⏳ Aguardando Pagamento</option>
              <option value="PAGAMENTO_APROVADO">✔️ Pagamento Aprovado (Disparar Bling)</option>
              <option value="EM_SEPARACAO">📦 Em Separação no Estoque</option>
              <option value="ENVIADO">🚚 Enviado ao Cliente (Em Trânsito)</option>
              <option value="ENTREGUE">🎁 Entregue ao Destinatário</option>
              <option value="CANCELADO">❌ Cancelado / Estornado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Código de Rastreamento (Correios / Transportadora)</label>
            <input
              type="text"
              name="codigo_rastreio"
              defaultValue={pedido.codigo_rastreio || ''}
              placeholder="Ex: NL123456789BR"
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white font-mono font-bold uppercase focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Salvar Alterações do Pedido</span>
          </button>
        </form>

        {/* Transmissão Bling & Links do Cliente */}
        <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700 flex items-center gap-1.5 mb-2">
              <PackageCheck size={14} className="text-blue-600" /> Sincronização com o Bling ERP
            </h3>
            
            <div className="text-xs text-gray-600 leading-relaxed mb-4">
              Status atual no Bling:{' '}
              {pedido.bling_status === 'OK' ? (
                <span className="font-bold text-blue-700">✔️ Transmitido (ID: #{pedido.bling_id || 'OK'})</span>
              ) : pedido.bling_status === 'ERRO' ? (
                <span className="font-bold text-red-700">⚠️ Erro na transmissão (tentar novamente)</span>
              ) : pedido.bling_status === 'FILA' ? (
                <span className="font-bold text-amber-700">⏳ Na fila de envio automático</span>
              ) : (
                <span className="font-bold text-gray-500">⏳ Aguardando confirmação do pagamento</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleTransmitirBling}
              disabled={loadingBling}
              className="w-full bg-secondary hover:bg-blue-900 text-white font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loadingBling ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              <span>
                {pedido.bling_status === 'OK'
                  ? 'Reenviar Pedido ao Bling'
                  : pedido.bling_status === 'ERRO'
                  ? 'Tentar Reenviar ao Bling Agora'
                  : 'Transmitir Pedido ao Bling Agora'}
              </span>
            </button>
          </div>

          {/* Link de Rastreio Público do Cliente */}
          <div className="pt-3 border-t border-gray-200">
            <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Página de Rastreio do Cliente:</span>
            <a
              href={`/rastreamento?pedido=${pedido.numero_pedido}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5"
            >
              <span>mimoshow.com.br/rastreamento?pedido={pedido.numero_pedido}</span>
              <ExternalLink size={12} />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
