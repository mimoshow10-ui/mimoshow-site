'use client';

import { useState } from 'react';
import { salvarSenhaAdmin, salvarResendConfig, salvarCredenciais, salvarMercadoPago, salvarFreteConfig } from './actions';
import { CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from 'lucide-react';

interface Props {
  temSenhaConfigurada: boolean;
  resendConfig: { api_key?: string } | null;
  creds: { client_id?: string; client_secret?: string; loja_id_banho_tosa?: string; loja_id_mimo_show?: string } | null;
  mpCreds: { access_token?: string; public_key?: string } | null;
  freteConfig: {
    cep_origem?: string;
    token_frete?: string;
    usar_correios?: boolean;
    usar_transportadoras?: boolean;
    usar_retirada?: boolean;
  } | null;
}

export default function ConfiguracoesForms({ temSenhaConfigurada, resendConfig, creds, mpCreds, freteConfig }: Props) {
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [mostrarResendKey, setMostrarResendKey] = useState(false);

  const [msgSenha, setMsgSenha] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [msgResend, setMsgResend] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [msgCreds, setMsgCreds] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [msgMp, setMsgMp] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [msgFrete, setMsgFrete] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const [loadingSenha, setLoadingSenha] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [loadingMp, setLoadingMp] = useState(false);
  const [loadingFrete, setLoadingFrete] = useState(false);

  async function handleSalvarSenha(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setLoadingSenha(true);
    setMsgSenha(null);
    try {
      const formData = new FormData(formEl);
      const res = await salvarSenhaAdmin(formData);
      if (res?.sucesso) {
        setMsgSenha({ tipo: 'sucesso', texto: res.mensagem || 'Senha salva!' });
        if (formEl) formEl.reset();
      } else {
        setMsgSenha({ tipo: 'erro', texto: res?.erro || 'Erro ao salvar senha.' });
      }
    } catch (err: any) {
      setMsgSenha({ tipo: 'erro', texto: err.message || 'Erro de comunicação.' });
    } finally {
      setLoadingSenha(false);
    }
  }

  async function handleSalvarResend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingResend(true);
    setMsgResend(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await salvarResendConfig(formData);
      if (res?.sucesso) {
        setMsgResend({ tipo: 'sucesso', texto: res.mensagem || 'Chave API do Resend salva!' });
      } else {
        setMsgResend({ tipo: 'erro', texto: res?.erro || 'Erro ao salvar chave.' });
      }
    } catch (err: any) {
      setMsgResend({ tipo: 'erro', texto: err.message || 'Erro de comunicação.' });
    } finally {
      setLoadingResend(false);
    }
  }

  async function handleSalvarCredenciais(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingCreds(true);
    setMsgCreds(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await salvarCredenciais(formData);
      if (res?.sucesso) {
        setMsgCreds({ tipo: 'sucesso', texto: res.mensagem || 'Credenciais salvas!' });
      } else {
        setMsgCreds({ tipo: 'erro', texto: res?.erro || 'Erro ao salvar credenciais.' });
      }
    } catch (err: any) {
      setMsgCreds({ tipo: 'erro', texto: err.message || 'Erro de comunicação.' });
    } finally {
      setLoadingCreds(false);
    }
  }

  async function handleSalvarMp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingMp(true);
    setMsgMp(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await salvarMercadoPago(formData);
      if (res?.sucesso) {
        setMsgMp({ tipo: 'sucesso', texto: res.mensagem || 'Mercado Pago salvo!' });
      } else {
        setMsgMp({ tipo: 'erro', texto: res?.erro || 'Erro ao salvar Mercado Pago.' });
      }
    } catch (err: any) {
      setMsgMp({ tipo: 'erro', texto: err.message || 'Erro de comunicação.' });
    } finally {
      setLoadingMp(false);
    }
  }

  async function handleSalvarFrete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingFrete(true);
    setMsgFrete(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await salvarFreteConfig(formData);
      if (res?.sucesso) {
        setMsgFrete({ tipo: 'sucesso', texto: res.mensagem || 'Configurações de frete salvas!' });
      } else {
        setMsgFrete({ tipo: 'erro', texto: res?.erro || 'Erro ao salvar frete.' });
      }
    } catch (err: any) {
      setMsgFrete({ tipo: 'erro', texto: err.message || 'Erro de comunicação.' });
    } finally {
      setLoadingFrete(false);
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* 🔒 SEGURANÇA DO SISTEMA E ALTERAÇÃO DE SENHA SECRETA */}
      <div className="bg-white rounded-xl shadow-sm border border-emerald-300 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600"></div>
        <h2 className="text-xl font-bold mb-2 text-secondary flex items-center gap-2">
          <ShieldCheck className="text-emerald-600" size={24} />
          Segurança do Sistema e Alteração de Senha Secreta
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Sua senha secreta de acesso ao Painel Administrativo fica protegida por criptografia de segurança. Por motivos de proteção contra vazamentos, <strong>a senha atual jamais é exibida em texto visível</strong> na tela.
        </p>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6 text-xs text-emerald-900 font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>
            {temSenhaConfigurada
              ? 'Status da Conta: Senha Secreta ativa e cadastrada no banco de dados com sucesso.'
              : 'Status da Conta: Senha Padrão Ativa (Recomendamos cadastrar uma nova senha abaixo).'}
          </span>
        </div>

        {msgSenha && (
          <div className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 mb-4 ${
            msgSenha.tipo === 'sucesso' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {msgSenha.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{msgSenha.texto}</span>
          </div>
        )}

        <form onSubmit={handleSalvarSenha} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nova Senha Secreta * (mínimo 6 caracteres)
              </label>
              <div className="relative">
                <input
                  name="nova_senha_admin"
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  required
                  placeholder="Digite sua nova senha secreta"
                  className="w-full border border-gray-300 rounded-lg p-3 pr-10 text-sm font-bold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-700 cursor-pointer"
                  title={mostrarNovaSenha ? "Ocultar Senha" : "Mostrar o que está digitando"}
                >
                  {mostrarNovaSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Confirmar Nova Senha Secreta *
              </label>
              <div className="relative">
                <input
                  name="confirmar_senha_admin"
                  type={mostrarConfirmarSenha ? 'text' : 'password'}
                  required
                  placeholder="Repita a nova senha secreta"
                  className="w-full border border-gray-300 rounded-lg p-3 pr-10 text-sm font-bold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-700 cursor-pointer"
                  title={mostrarConfirmarSenha ? "Ocultar Senha" : "Mostrar o que está digitando"}
                >
                  {mostrarConfirmarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loadingSenha}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold text-xs shadow-sm cursor-pointer whitespace-nowrap transition disabled:opacity-50 flex items-center gap-2"
            >
              {loadingSenha ? <RefreshCw size={14} className="animate-spin" /> : null}
              <span>{loadingSenha ? 'Salvando Nova Senha...' : '💾 Atualizar Senha Secreta'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ✉️ SERVIDOR DE E-MAILS & NOTIFICAÇÕES (RESEND API KEY) */}
      <div className="bg-white rounded-xl shadow-sm border border-purple-300 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-purple-600"></div>
        <h2 className="text-xl font-bold mb-2 text-secondary flex items-center gap-2">
          <Mail className="text-purple-600" size={24} />
          Servidor de E-mails e Notificações (Resend API Key)
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Insira sua chave API do <strong>Resend</strong> (começa com <code>re_...</code>) para que o sistema possa entregar os e-mails de <strong>recuperação de senha</strong>, <strong>confirmação de pedidos</strong> e <strong>cupons de pós-venda</strong>.
        </p>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 mb-6 text-xs text-purple-900 leading-relaxed space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-purple-950">
            <KeyRound size={15} /> Como obter sua chave gratuita do Resend:
          </p>
          <p>1. Crie uma conta gratuita em <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-purple-700">resend.com</a>.</p>
          <p>2. Vá na seção <strong>API Keys</strong> e crie uma chave (começará com <code>re_...</code>).</p>
          <p>3. 💡 <em>Nota sobre o envio:</em> No plano gratuito com remetente padrão (<code>onboarding@resend.dev</code>), os e-mails são entregues exclusivamente para a conta de e-mail cadastrada no Resend. Para disparar para qualquer e-mail de cliente, adicione seu domínio (ex: <code>banhoetosapet.com.br</code>) no menu <strong>Domains</strong> do Resend.</p>
        </div>

        {msgResend && (
          <div className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 mb-4 ${
            msgResend.tipo === 'sucesso' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {msgResend.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{msgResend.texto}</span>
          </div>
        )}

        <form onSubmit={handleSalvarResend} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Chave API do Resend (API Key) *
            </label>
            <div className="relative">
              <input
                name="resend_api_key"
                type={mostrarResendKey ? 'text' : 'password'}
                required
                defaultValue={resendConfig?.api_key || ''}
                placeholder="re_123456789_abcdefghijklmnopqrstuvwxyz"
                className="w-full border border-gray-300 rounded-lg p-3 pr-10 text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setMostrarResendKey(!mostrarResendKey)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-700 cursor-pointer"
                title={mostrarResendKey ? "Ocultar Chave" : "Mostrar Chave"}
              >
                {mostrarResendKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingResend}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold text-xs shadow-sm cursor-pointer whitespace-nowrap transition disabled:opacity-50 flex items-center gap-2"
          >
            {loadingResend ? <RefreshCw size={14} className="animate-spin" /> : null}
            <span>{loadingResend ? 'Salvando Chave...' : '💾 Salvar Chave do Resend'}</span>
          </button>
        </form>
      </div>

      {/* AUTENTICAÇÃO DO BLING */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
        <h2 className="text-xl font-bold mb-2 text-secondary flex items-center gap-2">
          <span>📦 Integração & Canais de Venda do Bling ERP</span>
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Configure a conexão da API e os <strong>IDs de Loja / Canal de Venda</strong> para que cada pedido seja gravado no Bling com o logotipo e nome exatos de onde veio a venda (Banho & Tosa Pet ou Mimo Show).
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-6 text-xs text-blue-900 leading-relaxed space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-blue-950">
            <KeyRound size={15} /> Como exibir o símbolo da loja no Bling:
          </p>
          <p>1. No Bling, acesse <strong>Configurações (ícone de engrenagem) ➔ Integrações ➔ Configurações de integrações / Lojas Virtuais</strong>.</p>
          <p>2. Crie ou abra a integração para a sua loja (ex: tipo <strong>API / Loja Virtual</strong> chamada <em>"Banho e Tosa"</em> ou <em>"Mimo Show"</em>).</p>
          <p>3. Copie o <strong>ID numérico</strong> da loja gerado pelo Bling (ex: <code>203551250</code>) e cole no campo correspondente abaixo.</p>
        </div>

        {msgCreds && (
          <div className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 mb-4 ${
            msgCreds.tipo === 'sucesso' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {msgCreds.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{msgCreds.texto}</span>
          </div>
        )}
        
        <form onSubmit={handleSalvarCredenciais} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Client ID *</label>
              <input name="client_id" type="text" required defaultValue={creds?.client_id || ''} className="w-full border border-gray-300 rounded-lg p-2.5 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Client Secret *</label>
              <input name="client_secret" type="password" required defaultValue={creds?.client_secret || ''} className="w-full border border-gray-300 rounded-lg p-2.5 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>

          <div className="border-t border-blue-100 pt-3 mt-1">
            <h3 className="text-xs font-bold uppercase text-gray-600 mb-3 tracking-wider">
              🏷️ Identificadores de Canal / Loja no Bling (Para exibir o ícone da loja no pedido)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200/80">
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  🐕 ID da Loja Bling — Banho & Tosa Pet
                </label>
                <input
                  name="loja_id_banho_tosa"
                  type="text"
                  placeholder="Ex: 203551254"
                  defaultValue={creds?.loja_id_banho_tosa || ''}
                  className="w-full border border-amber-300 rounded-lg p-2.5 font-mono text-xs bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-amber-800 mt-1">ID da integração cadastrada no Bling para o Banho e Tosa Pet.</p>
              </div>

              <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-200/80">
                <label className="block text-xs font-bold text-purple-900 mb-1">
                  🏬 ID da Loja Bling — Mimo Show
                </label>
                <input
                  name="loja_id_mimo_show"
                  type="text"
                  placeholder="Ex: 203572665"
                  defaultValue={creds?.loja_id_mimo_show || ''}
                  className="w-full border border-purple-300 rounded-lg p-2.5 font-mono text-xs bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <p className="text-[11px] text-purple-800 mt-1">ID da integração cadastrada no Bling para a Mimo Show.</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 items-center mt-2 flex-wrap">
            <button
              type="submit"
              disabled={loadingCreds}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 text-xs cursor-pointer shadow-sm"
            >
              {loadingCreds ? <RefreshCw size={14} className="animate-spin" /> : null}
              <span>{loadingCreds ? 'Salvando...' : '💾 Salvar Configurações do Bling'}</span>
            </button>

            {creds?.client_id && (
              <a 
                href={`https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${creds.client_id}&state=state123`}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition inline-block text-xs shadow-sm"
              >
                🔐 Reconectar / Autorizar Bling
              </a>
            )}
          </div>
        </form>
      </div>

      {/* INTEGRAÇÃO MERCADO PAGO */}
      <div className="bg-white rounded-xl shadow-sm border border-sky-300 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-sky-500"></div>
        <h2 className="text-xl font-bold mb-2 text-secondary flex items-center gap-2">
          💳 Gateway de Pagamento (Mercado Pago)
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Insira o seu <strong>Access Token de Produção</strong> do Mercado Pago para receber pagamentos via PIX, Cartão de Crédito e Boleto.
        </p>

        {msgMp && (
          <div className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 mb-4 ${
            msgMp.tipo === 'sucesso' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {msgMp.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{msgMp.texto}</span>
          </div>
        )}

        <form onSubmit={handleSalvarMp} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Access Token (Começa com APP_USR-...) *
            </label>
            <input
              name="mp_access_token"
              type="password"
              required
              defaultValue={mpCreds?.access_token || ''}
              placeholder="APP_USR-xxxx-xxxx-xxxx-xxxx"
              className="w-full border border-gray-300 rounded-lg p-3 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Public Key (Opcional - Começa com APP_USR-...)
            </label>
            <input
              name="mp_public_key"
              type="text"
              defaultValue={mpCreds?.public_key || ''}
              placeholder="APP_USR-xxxx-xxxx-xxxx-xxxx"
              className="w-full border border-gray-300 rounded-lg p-3 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loadingMp}
              className="bg-sky-600 text-white px-6 py-3 rounded-lg font-bold text-xs hover:bg-sky-700 transition shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loadingMp ? <RefreshCw size={14} className="animate-spin" /> : null}
              <span>{loadingMp ? 'Salvando...' : '💾 Salvar Credenciais do Mercado Pago'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* INTEGRAÇÃO LOGÍSTICA (Correios / Transportadoras) */}
      <div className="bg-white rounded-xl shadow-sm border border-yellow-300 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-yellow-500"></div>
        <h2 className="text-xl font-bold mb-2 text-secondary">Logística e Frete (Correios & Transportadoras)</h2>
        <p className="text-sm text-gray-600 mb-6">Ative e configure os meios de entrega disponíveis para os clientes no checkout.</p>

        {msgFrete && (
          <div className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 mb-4 ${
            msgFrete.tipo === 'sucesso' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {msgFrete.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{msgFrete.texto}</span>
          </div>
        )}
        
        <form onSubmit={handleSalvarFrete} autoComplete="off" className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 p-4 border border-border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                name="usar_correios"
                defaultChecked={freteConfig ? freteConfig.usar_correios : true}
                className="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer"
              />
              <div>
                <p className="font-bold text-gray-800">Correios (PAC e Sedex)</p>
                <p className="text-sm text-gray-500">Cálculo automático pelo CEP de origem.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                name="usar_transportadoras"
                defaultChecked={freteConfig ? freteConfig.usar_transportadoras : true}
                className="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer"
              />
              <div>
                <p className="font-bold text-gray-800">Transportadoras Privadas (ex: Jadlog, Total Express)</p>
                <p className="text-sm text-gray-500">Requer integração com Melhor Envio ou Kangu.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                name="usar_retirada"
                defaultChecked={freteConfig ? freteConfig.usar_retirada : true}
                className="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer"
              />
              <div>
                <p className="font-bold text-gray-800">Retirada no Local</p>
                <p className="text-sm text-gray-500">Cliente retira os produtos direto no pet shop.</p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">CEP de Origem (Remetente)</label>
              <input
                type="text"
                name="cep_origem"
                autoComplete="off"
                defaultValue={freteConfig?.cep_origem || ''}
                placeholder="Ex: 01000-000"
                className="w-full border border-border rounded-lg p-3 text-sm font-mono font-bold bg-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Token de API (Melhor Envio / Correios)</label>
              <input
                type="text"
                name="token_frete"
                autoComplete="off"
                defaultValue={freteConfig?.token_frete || ''}
                placeholder="Insira o Token de Frete (Opcional)"
                className="w-full border border-border rounded-lg p-3 text-sm font-mono font-bold bg-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingFrete}
            className="bg-primary text-secondary px-6 py-3 rounded-lg font-bold hover:bg-yellow-400 transition w-fit mt-2 cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2 text-xs"
          >
            {loadingFrete ? <RefreshCw size={14} className="animate-spin" /> : null}
            <span>{loadingFrete ? 'Salvando...' : '💾 Salvar Configurações de Frete'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
