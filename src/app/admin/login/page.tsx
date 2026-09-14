'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff, KeyRound, ArrowRight, X } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('mimoshow10@gmail.com');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Estados da Modal de Recuperação de Senha
  const [modalEsqueci, setModalEsqueci] = useState(false);
  const [etapaEsqueci, setEtapaEsqueci] = useState<'solicitar' | 'validar_pin'>('solicitar');
  const [emailRecuperacao, setEmailRecuperacao] = useState('mimoshow10@gmail.com');
  const [pinInput, setPinInput] = useState('');
  const [novaSenhaInput, setNovaSenhaInput] = useState('');
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [carregandoEsqueci, setCarregandoEsqueci] = useState(false);
  const [msgEsqueci, setMsgEsqueci] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!senha.trim()) return;

    setCarregando(true);
    setMensagem(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'login', email: email.trim(), senha: senha.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Acesso autorizado! Entrando no painel...' });
        setTimeout(() => {
          router.push('/admin');
          router.refresh();
        }, 500);
      } else {
        setMensagem({ tipo: 'erro', texto: data.erro || 'E-mail ou senha secreta incorretos.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Falha de comunicação com o servidor.' });
    } finally {
      setCarregando(false);
    }
  }

  // Solicitar envio do Código de Segurança para mimosrtes10@hotmail.com e mimoshow10@hotmail.com
  async function handleSolicitarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setCarregandoEsqueci(true);
    setMsgEsqueci(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'esqueci_senha', email: emailRecuperacao.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.sucesso) {
        setMsgEsqueci({ tipo: 'sucesso', texto: data.mensagem || 'Código enviado para mimosrtes10@hotmail.com (cópia para mimoshow10@hotmail.com)!' });
        setEtapaEsqueci('validar_pin');
      } else {
        setMsgEsqueci({ tipo: 'erro', texto: data.erro || 'Erro ao gerar código de segurança.' });
      }
    } catch {
      setMsgEsqueci({ tipo: 'erro', texto: 'Falha de comunicação com o servidor.' });
    } finally {
      setCarregandoEsqueci(false);
    }
  }

  // Validar PIN de 6 dígitos e Redefinir Senha Secreta
  async function handleRedefinirSenha(e: React.FormEvent) {
    e.preventDefault();
    if (!pinInput.trim() || !novaSenhaInput.trim()) return;

    setCarregandoEsqueci(true);
    setMsgEsqueci(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'redefinir_senha',
          pin: pinInput.trim(),
          novaSenha: novaSenhaInput.trim()
        }),
      });
      const data = await res.json();
      if (res.ok && data.sucesso) {
        setMsgEsqueci({ tipo: 'sucesso', texto: 'Senha redefinida com sucesso! Redirecionando...' });
        setTimeout(() => {
          setModalEsqueci(false);
          router.push('/admin');
          router.refresh();
        }, 1000);
      } else {
        setMsgEsqueci({ tipo: 'erro', texto: data.erro || 'PIN inválido ou expirado.' });
      }
    } catch {
      setMsgEsqueci({ tipo: 'erro', texto: 'Falha ao redefinir a senha.' });
    } finally {
      setCarregandoEsqueci(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-[#0B2545] to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-800/20">
        
        {/* Topo do Modal de Login */}
        <div className="bg-[#0B2545] p-6 text-white text-center relative border-b border-blue-900">
          <div className="w-20 h-20 mx-auto relative mb-2">
            <Image
              src="/logo-luxo.jpg"
              alt="Site Mimoshow"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-black text-white font-heading">
            Painel Administrativo
          </h1>
          <p className="text-blue-200 text-xs mt-1">
            Autenticação Administrativa Site Mimoshow
          </p>
        </div>

        {/* Corpo do Form */}
        <div className="p-6 space-y-5">

          {/* Feedback Toast */}
          {mensagem && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between border ${
                mensagem.tipo === 'sucesso'
                  ? 'bg-green-50 text-green-800 border-green-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {mensagem.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{mensagem.texto}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                E-mail do Administrador Autorizado
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mimosrtes10@hotmail.com ou mimoshow10@hotmail.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">
                  Senha Secreta de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setModalEsqueci(true);
                    setEtapaEsqueci('solicitar');
                    setMsgEsqueci(null);
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>

              {/* Campo de Senha Secreto com Botão de Ocultar/Mostrar (Olho) */}
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha secreta de acesso"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-2xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                  title={mostrarSenha ? "Ocultar Senha" : "Mostrar Senha Secreta"}
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-[#0B2545] hover:bg-blue-900 text-white font-black py-3.5 rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {carregando ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Entrar no Painel Administrativo</span>
                </>
              )}
            </button>
          </form>

        </div>

        {/* Rodapé */}
        <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
          <p className="text-[11px] text-gray-400 font-medium">
            Site Mimoshow • Proteção Exclusiva de Acesso Administrativo
          </p>
        </div>

      </div>

      {/* ── MODAL DE RECUPERAÇÃO DE SENHA POR E-MAIL DE SEGURANÇA ── */}
      {modalEsqueci && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative border border-gray-100">
            
            <button
              type="button"
              onClick={() => setModalEsqueci(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 bg-gray-100 p-1.5 rounded-full cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Recuperação de Senha</h3>
                <p className="text-xs text-gray-500">Envio de e-mail de segurança de alta prioridade</p>
              </div>
            </div>

            {msgEsqueci && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  msgEsqueci.tipo === 'sucesso' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {msgEsqueci.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{msgEsqueci.texto}</span>
              </div>
            )}

            {etapaEsqueci === 'solicitar' ? (
              <form onSubmit={handleSolicitarCodigo} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    E-mail Principal para Envio do Código
                  </label>
                  <input
                    type="email"
                    value={emailRecuperacao}
                    onChange={(e) => setEmailRecuperacao(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-2xl text-xs font-bold bg-gray-50 focus:bg-white"
                  />
                  <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                    ℹ️ O código de segurança será enviado para <strong>mimosrtes10@hotmail.com</strong> com cópia para <strong>mimoshow10@hotmail.com</strong>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={carregandoEsqueci}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {carregandoEsqueci ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Gerando Código de Segurança...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Código de Segurança por E-mail</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRedefinirSenha} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Código PIN de Segurança (6 dígitos) *
                  </label>
                  <input
                    type="text"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Ex: 849201"
                    maxLength={6}
                    required
                    className="w-full p-3 border border-gray-300 rounded-2xl text-base font-mono font-black text-center text-blue-900 tracking-widest bg-blue-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nova Senha Secreta de Acesso *
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarNovaSenha ? 'text' : 'password'}
                      value={novaSenhaInput}
                      onChange={(e) => setNovaSenhaInput(e.target.value)}
                      placeholder="Digite sua nova senha secreta"
                      required
                      className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-2xl text-xs font-bold text-gray-800"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                      className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      {mostrarNovaSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEtapaEsqueci('solicitar')}
                    className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-xs cursor-pointer"
                  >
                    Voltar
                  </button>

                  <button
                    type="submit"
                    disabled={carregandoEsqueci}
                    className="w-2/3 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {carregandoEsqueci ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Validando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Salvar Nova Senha</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
