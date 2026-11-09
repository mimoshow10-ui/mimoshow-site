'use client';

import { useState } from 'react';
import { salvarTopBar } from './actions';
import { Layout, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  topbar: {
    texto?: string;
    texto1?: string;
    texto2?: string;
    visibilidade: string;
    cor: string;
  };
}

export default function TopBarForm({ topbar }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await salvarTopBar(formData);
      if (res?.sucesso) {
        setMsg({ tipo: 'sucesso', texto: res.mensagem || 'Barra do topo salva com sucesso!' });
      } else {
        setMsg({ tipo: 'erro', texto: res?.erro || 'Erro ao salvar Barra do topo.' });
      }
    } catch (err: any) {
      setMsg({ tipo: 'erro', texto: err.message || 'Erro de comunicação.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <Layout size={20} className="text-primary" />
        <h2 className="text-lg font-bold text-secondary">1. Barra de Aviso do Topo (Top Bar)</h2>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 ${
            msg.tipo === 'sucesso' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}
        >
          {msg.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{msg.texto}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Frase Principal do Letreiro Dinâmico *</label>
          <input
            type="text"
            name="texto1"
            defaultValue={topbar.texto1 || topbar.texto || '🚚 Frete grátis acima de R$ 99,00 para SP'}
            placeholder="Ex: 🚚 Frete grátis acima de R$ 99,00 para SP"
            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none font-bold"
            required
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Esta frase rola continuamente da direita para a esquerda em looping infinito.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Segunda Frase Alternada (Opcional)</label>
          <input
            type="text"
            name="texto2"
            defaultValue={topbar.texto2 || ''}
            placeholder="Ex: 💳 Parcele em até 6x sem juros no cartão"
            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none font-bold"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Se preenchida, alterna com a frase principal na mesma linha rolante. Deixe em branco se quiser apenas a primeira frase.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Onde Exibir?</label>
          <select name="visibilidade" defaultValue={topbar.visibilidade} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white font-bold cursor-pointer">
            <option value="todas">Em todas as páginas</option>
            <option value="home">Somente na Página Inicial (Home)</option>
            <option value="nenhuma">Desativar (Esconder barra)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Cor de Fundo da Barra</label>
          <select name="cor" defaultValue={topbar.cor} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white font-bold cursor-pointer">
            <option value="bg-primary">Laranja Padrão (Tema da Loja)</option>
            <option value="bg-secondary">Azul Marinho Escuro</option>
            <option value="bg-purple-700">Roxo Promocional</option>
            <option value="bg-green-600">Verde Oferta</option>
            <option value="bg-red-600">Vermelho Urgência</option>
            <option value="bg-black">Preto Minimalista</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-orange-600 text-white py-2.5 px-6 rounded-xl font-bold transition md:col-span-2 shadow-xs w-fit cursor-pointer disabled:opacity-50 text-xs"
        >
          {loading ? 'Salvando...' : 'Salvar Barra do Topo'}
        </button>
      </form>
    </div>
  );
}
