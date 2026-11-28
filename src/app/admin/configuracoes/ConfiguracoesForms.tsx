'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { salvarSenhaAdmin, salvarResendConfig, salvarCredenciais, testarConexaoBling, salvarMercadoPago, salvarFreteConfig, salvarAnalyticsConfig } from './actions';
import { CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, KeyRound, Mail, ShieldCheck, BarChart3, Copy, Check, ExternalLink, ShieldAlert, Sparkles, Activity } from 'lucide-react';

interface Props {
  temSenhaConfigurada: boolean;
  resendConfig: { api_key?: string } | null;
  creds: {
    client_id?: string;
    has_secret?: boolean;
    secret_is_vercel?: boolean;
    is_from_env?: boolean;
    loja_id_banho_tosa?: string;
    loja_id_mimo_show?: string;
  } | null;
  blingTokensInfo?: {
    temAccessToken: boolean;
    temRefreshToken: boolean;
    expiresAt?: number | null;
    atualizadoEm?: string | null;
  } | null;
  mpCreds: { access_token?: string; public_key?: string; has_token?: boolean; is_from_env?: boolean } | null;
  freteConfig: {
    cep_origem?: string;
    token_frete?: string;
    usar_correios?: boolean;
    usar_transportadoras?: boolean;
    usar_retirada?: boolean;
  } | null;
  analyticsConfig: {
    gtm_id?: string;
    ga4_measurement_id?: string;
    clarity_project_id?: string;
    ativo?: boolean;
    debug_mode?: boolean;
  } | null;
}

export default function ConfiguracoesForms({ temSenhaConfigurada, resendConfig, creds, blingTokensInfo, mpCreds, freteConfig, analyticsConfig }: Props) {
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [mostrarResendKey, setMostrarResendKey] = useState(false);
  const [copiadoCallback, setCopiadoCallback] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState('');

  const [msgSenha, setMsgSenha] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [msgResend, setMsgResend] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [msgCreds, setMsgCreds] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [msgTesteBling, setMsgTesteBling] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [msgMp, setMsgMp] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [msgFrete, setMsgFrete] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [msgAnalytics, setMsgAnalytics] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const [loadingSenha, setLoadingSenha] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [loadingTesteBling, setLoadingTesteBling] = useState(false);
  const [loadingMp, setLoadingMp] = useState(false);
  const [loadingFrete, setLoadingFrete] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCallbackUrl(`${window.location.origin}/api/bling/callback`);
    }
  }, []);

  async function handleTestarBling() {
    setLoadingTesteBling(true);
    setMsgTesteBling(null);
    try {
      const res = await testarConexaoBling();
      if (res?.sucesso) {
        setMsgTesteBling({ tipo: 'sucesso', texto: res.mensagem });
      } else {
        setMsgTesteBling({ tipo: 'erro', texto: res.mensagem || 'Falha ao testar conexão.' });
      }
    } catch (err: any) {
      setMsgTesteBling({ tipo: 'erro', texto: err.message || 'Erro inesperado ao testar conexão.' });
    } finally {
      setLoadingTesteBling(false);
    }
  }

  function handleCopiarCallback() {
    if (callbackUrl) {
      navigator.clipboard.writeText(callbackUrl);
      setCopiadoCallback(true);
      setTimeout(() => setCopiadoCallback(false), 2500);
    }
  }

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

  async function handleSalvarAnalytics(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingAnalytics(true);
    setMsgAnalytics(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await salvarAnalyticsConfig(formData);
      if (res?.sucesso) {
        setMsgAnalytics({ tipo: 'sucesso', texto: res.mensagem || 'Configurações de Analytics salvas!' });
      } else {
        setMsgAnalytics({ tipo: 'erro', texto: res?.erro || 'Erro ao salvar configurações de Analytics.' });
      }
    } catch (err: any) {
      setMsgAnalytics({ tipo: 'erro', texto: err.message || 'Erro de comunicação.' });
    } finally {
      setLoadingAnalytics(false);
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
        <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
          <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
            <span>📦 Integração & Canais de Venda do Bling ERP</span>
          </h2>
          <div>
            {msgTesteBling?.tipo === 'sucesso' ? (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-300 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-green-600" /> Conexão 100% Operacional
              </span>
            ) : blingTokensInfo?.temAccessToken ? (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-blue-600" /> Token Cadastrado
              </span>
            ) : creds?.client_id ? (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-600" /> Requer Conexão
              </span>
            ) : (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-300 flex items-center gap-1.5">
                ⚪ Não Configurado
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Configure a conexão da API e os <strong>IDs de Loja / Canal de Venda</strong> para que cada pedido seja gravado no Bling com o logotipo e nome exatos de onde veio a venda (Banho & Tosa Pet ou Mimo Show).
        </p>

        {/* FEEDBACK DE TESTE EM TEMPO REAL */}
        {msgTesteBling && (
          <div className={`p-4 rounded-xl font-bold text-xs flex items-start gap-2.5 mb-4 shadow-sm ${
            msgTesteBling.tipo === 'sucesso' 
              ? 'bg-green-50 text-green-900 border border-green-300' 
              : 'bg-red-50 text-red-900 border border-red-300'
          }`}>
            {msgTesteBling.tipo === 'sucesso' ? (
              <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-green-600" />
            ) : (
              <ShieldAlert size={18} className="shrink-0 mt-0.5 text-red-600" />
            )}
            <div className="flex-1">
              <p className="font-extrabold text-sm mb-0.5">
                {msgTesteBling.tipo === 'sucesso' ? 'Status: Conexão Validada' : 'Diagnóstico da Conexão Bling'}
              </p>
              <p className="font-normal leading-relaxed">{msgTesteBling.texto}</p>
            </div>
          </div>
        )}

        {/* INFORMAÇÕES DE CADASTRO NO APLICATIVO DO BLING */}
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 mb-6 text-xs text-blue-950 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold flex items-center gap-1.5 text-blue-900">
              <KeyRound size={15} className="text-blue-600" /> Configuração do Aplicativo no Bling (OAuth 2.0)
            </span>
            <a
              href="https://www.bling.com.br"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
            >
              <span>Acessar Painel do Bling</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="bg-white border border-blue-200 rounded-lg p-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 font-mono text-[11px] text-gray-700 truncate">
              <span className="font-bold text-gray-900 block text-[10px] uppercase tracking-wider text-blue-900">
                URL de Redirecionamento (Callback):
              </span>
              {callbackUrl || '/api/bling/callback'}
            </div>
            <button
              type="button"
              onClick={handleCopiarCallback}
              className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-[11px] rounded-md transition flex items-center gap-1 shrink-0 cursor-pointer"
              title="Copiar URL para o aplicativo do Bling"
            >
              {copiadoCallback ? <Check size={13} className="text-green-700" /> : <Copy size={13} />}
              <span>{copiadoCallback ? 'Copiado!' : 'Copiar URL'}</span>
            </button>
          </div>

          <div className="text-[11px] text-blue-900 leading-relaxed space-y-1">
            <p>1. No Bling, acesse <strong>Preferências (engrenagem) ➔ Sistema ➔ Usuários ➔ Aplicativos</strong>.</p>
            <p>2. Certifique-se de que a <strong>URL de Redirecionamento</strong> cadastrada no seu aplicativo seja exatamente a URL acima.</p>
            <p>3. Adicione o <strong>Client Secret (64 caracteres)</strong> nas <strong>Environment Variables da Vercel</strong> como <code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold text-blue-900">BLING_CLIENT_SECRET</code> (ele fica 100% blindado e oculto do navegador).</p>
          </div>
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
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-700">
                  Client ID * <span className="font-normal text-gray-500">(40 caracteres)</span>
                </label>
                {creds?.is_from_env && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300">
                    ⚡ Vercel (process.env)
                  </span>
                )}
              </div>
              <input
                name="client_id"
                type="text"
                required
                defaultValue={creds?.client_id || ''}
                placeholder="Ex: 329698d249f0ec4025d23315a0cbb0..."
                className="w-full border border-gray-300 rounded-lg p-2.5 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" /> Client Secret (Chave Secreta)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  🔒 Blindado na Vercel
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                A chave secreta não é armazenada no banco e não pode ser visualizada no navegador. Ela é lida diretamente da variável de ambiente <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono text-[10px] font-bold text-slate-800">BLING_CLIENT_SECRET</code> na Vercel.
              </p>
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
          
          <div className="flex gap-3 items-center mt-2 flex-wrap">
            <button
              type="submit"
              disabled={loadingCreds}
              className="bg-blue-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 text-xs cursor-pointer shadow-sm"
            >
              {loadingCreds ? <RefreshCw size={14} className="animate-spin" /> : null}
              <span>{loadingCreds ? 'Salvando...' : '💾 Salvar Configurações do Bling'}</span>
            </button>

            <button
              type="button"
              onClick={handleTestarBling}
              disabled={loadingTesteBling}
              className="bg-sky-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-sky-700 transition disabled:opacity-50 flex items-center gap-2 text-xs cursor-pointer shadow-sm"
            >
              {loadingTesteBling ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
              <span>{loadingTesteBling ? 'Testando Conexão...' : '🧪 Testar Conexão com Bling'}</span>
            </button>

            {creds?.client_id && (
              <a 
                href="/api/bling/auth"
                className="bg-green-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-green-700 transition inline-flex items-center gap-1.5 text-xs shadow-sm cursor-pointer"
                title="Conexão direta e segura com o Bling com proteção contra CSRF"
              >
                <ShieldCheck size={14} />
                <span>🔐 Reconectar / Autorizar Bling</span>
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
          {/* CARD DE SEGURANÇA DO ACCESS TOKEN */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-600" /> Access Token de Produção
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold">
                🔒 Blindado na Vercel
              </span>
            </div>
            <p className="text-xs text-sky-900 leading-relaxed">
              O Access Token foi removido da tela e do banco de dados por segurança. O servidor lê diretamente da variável de ambiente <code className="bg-white px-1.5 py-0.5 rounded border border-sky-300 font-mono text-[11px] font-bold text-sky-950">MERCADOPAGO_ACCESS_TOKEN</code> na Vercel.
            </p>
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
              <span>{loadingMp ? 'Salvando...' : '💾 Salvar Configurações'}</span>
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

      {/* 📊 JORNADA DO CLIENTE & ANALYTICS (GTM, GA4, CLARITY & LGPD) */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-300 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={24} />
            Monitoramento da Jornada (GTM, GA4 & Clarity)
          </h2>
          <Link
            href="/admin/analytics"
            className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 w-fit"
          >
            <span>Auditoria & Validador de Eventos →</span>
          </Link>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Gerencie a integração centralizada com <strong>Google Tag Manager</strong>, <strong>Google Analytics 4</strong> e <strong>Microsoft Clarity</strong>. O sistema opera em conformidade estrita com a <strong>LGPD</strong>, bloqueando rastreamento de anúncios até consentimento do usuário e mascarando dados sensíveis.
        </p>

        {msgAnalytics && (
          <div
            className={`p-3 rounded-xl mb-4 font-bold text-xs border flex items-center gap-2 ${
              msgAnalytics.tipo === 'sucesso'
                ? 'bg-green-100 text-green-800 border-green-300'
                : 'bg-red-100 text-red-800 border-red-300'
            }`}
          >
            {msgAnalytics.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{msgAnalytics.texto}</span>
          </div>
        )}

        <form onSubmit={handleSalvarAnalytics} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 border-b border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-secondary bg-gray-50 p-3 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                name="ativo"
                defaultChecked={analyticsConfig?.ativo !== false}
                className="accent-blue-600 w-4 h-4 rounded"
              />
              <div>
                <p className="font-bold text-gray-800">Monitoramento Ativo</p>
                <p className="text-[11px] text-gray-500 font-normal">Habilita a injeção do Data Layer, GTM, GA4 e Clarity na loja.</p>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-secondary bg-gray-50 p-3 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                name="debug_mode"
                defaultChecked={Boolean(analyticsConfig?.debug_mode)}
                className="accent-blue-600 w-4 h-4 rounded"
              />
              <div>
                <p className="font-bold text-gray-800">Modo Debug no Console</p>
                <p className="text-[11px] text-gray-500 font-normal">Exibe cada evento e payload sanitizado no console do navegador.</p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Google Tag Manager (GTM ID)
              </label>
              <input
                type="text"
                name="gtm_id"
                autoComplete="off"
                defaultValue={analyticsConfig?.gtm_id || ''}
                placeholder="Ex: GTM-XXXXXXX"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">Ex: GTM-ABC1234</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Google Analytics 4 (GA4 Measurement ID)
              </label>
              <input
                type="text"
                name="ga4_measurement_id"
                autoComplete="off"
                defaultValue={analyticsConfig?.ga4_measurement_id || ''}
                placeholder="Ex: G-XXXXXXXXXX"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">Ex: G-XXXXXXXXXX</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Microsoft Clarity (Project ID)
              </label>
              <input
                type="text"
                name="clarity_project_id"
                autoComplete="off"
                defaultValue={analyticsConfig?.clarity_project_id || ''}
                placeholder="Ex: abcdefgh12"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">Código do projeto Clarity</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingAnalytics}
            className="bg-[#0B2545] text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-900 transition w-fit mt-2 cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2 text-xs"
          >
            {loadingAnalytics ? <RefreshCw size={14} className="animate-spin" /> : null}
            <span>{loadingAnalytics ? 'Salvando...' : '💾 Salvar Configurações de Analytics'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
