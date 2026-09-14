import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Bot, Sparkles, Save, HelpCircle, Key, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function salvarTreinamento(formData: FormData) {
  'use server';

  const instrucoes = formData.get('instrucoes') as string;
  const faq = formData.get('faq') as string;
  const apiKey = formData.get('api_key') as string;
  const geminiKey = formData.get('gemini_key') as string;

  const payload = {
    instrucoes,
    faq,
    api_key: apiKey,
    gemini_key: geminiKey
  };

  const { data: existente } = await supabase
    .from('configuracoes')
    .select('id')
    .eq('chave', 'treinamento_ia')
    .maybeSingle();

  if (existente) {
    await supabase.from('configuracoes').update({ valor: payload }).eq('chave', 'treinamento_ia');
  } else {
    await supabase.from('configuracoes').insert({ chave: 'treinamento_ia', valor: payload });
  }

  revalidatePath('/admin/treinamento-ia');
  revalidatePath('/produto/[slug]');
  redirect('/admin/treinamento-ia?msg=Treinamento da IA salvo com sucesso!');
}

export default async function TreinamentoIAPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const params = await searchParams;

  const { data: config } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'treinamento_ia')
    .maybeSingle();

  const valor = config?.valor || {
    instrucoes: 'Somos a MIMO Show. Responda sempre de forma gentil, profissional, entusiasmada e focada nos nossos produtos.',
    faq: 'P: Os adesivos grudam bem?\nR: Sim! Nossos adesivos em EVA usam cola atóxica especial própria para fixação nos pelos limpos e secos sem machucar o animal.\n\nP: Qual o prazo de envio?\nR: Postamos os pedidos em até 24h úteis após a confirmação do pagamento.',
    api_key: '',
    gemini_key: ''
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary flex items-center gap-3">
            <Bot size={32} className="text-purple-600" />
            Treinamento da IA e Assistente Virtual
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure o conhecimento, tom de voz e chaves de IA gerativa para respostas 100% humanas.
          </p>
        </div>
      </div>

      {params.msg && (
        <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl font-bold text-sm">
          ✅ {params.msg}
        </div>
      )}

      {/* Dica de Ouro de Desempenho da IA */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md space-y-2">
        <div className="flex items-center gap-2 font-bold text-base text-yellow-300">
          <Zap size={20} />
          Como obter respostas 100% inteligentes e humanas sobre qualquer pergunta?
        </div>
        <p className="text-xs text-purple-100 leading-relaxed">
          Para que o assistente responda a <strong>qualquer pergunta complexa</strong> do cliente sobre qualquer produto de forma fluída e natural, você pode inserir uma <strong>Chave do Google Gemini (100% Gratuita)</strong> ou <strong>OpenAI (GPT-4o-mini)</strong> nos campos abaixo. Sem chave configurada, a loja utilizará o motor local básico de palavras-chave.
        </p>
      </div>

      <form action={salvarTreinamento} className="bg-white p-8 rounded-2xl shadow-sm border border-border space-y-6">
        
        {/* Instruções Gerais */}
        <div>
          <label className="block text-sm font-bold text-secondary mb-2 flex items-center gap-2">
            <Sparkles size={16} className="text-purple-600" />
            Instruções Principais (Tom de Voz e Regras da Loja)
          </label>
          <textarea
            name="instrucoes"
            rows={3}
            defaultValue={valor.instrucoes}
            placeholder="Ex: Responda de forma amigável, destacando que nossos produtos são fabricados em EVA atóxico..."
            className="w-full border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Como a IA deve se comportar e apresentar a empresa para os clientes na página do produto.
          </p>
        </div>

        {/* Base de Conhecimento e Perguntas Frequentes */}
        <div>
          <label className="block text-sm font-bold text-secondary mb-2 flex items-center gap-2">
            <HelpCircle size={16} className="text-purple-600" />
            Perguntas & Respostas Frequentes (FAQ de Treinamento)
          </label>
          <textarea
            name="faq"
            rows={5}
            defaultValue={valor.faq}
            placeholder="P: Como aplicar os laços?\nR: Nossos laços já vêm com anilha elástica de silicone..."
            className="w-full border border-border rounded-xl p-3 text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Formato: <code>P: Pergunta? \n R: Resposta.</code> (Separe blocos por uma linha em branco).
          </p>
        </div>

        {/* Chave de API Google Gemini (Gratuita) */}
        <div className="bg-purple-50 p-5 rounded-xl border border-purple-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <Key size={14} className="text-purple-600" />
              Chave de API Google Gemini (Recomendado - 100% Gratuito)
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-purple-700 underline hover:text-purple-900"
            >
              Criar Chave Grátis no Google AI Studio ↗
            </a>
          </div>
          <input
            name="gemini_key"
            type="password"
            defaultValue={valor.gemini_key || ''}
            placeholder="AIzaSy..."
            className="w-full border border-purple-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          />
          <p className="text-[11px] text-purple-700">
            Recomendado! O modelo <strong>Gemini 1.5/2.0 Flash</strong> é 100% gratuito e gera respostas instantâneas e super detalhadas.
          </p>
        </div>

        {/* Chave de API OpenAI */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-2">
          <label className="block text-xs font-bold text-gray-800">
            Chave de API OpenAI (Opcional - GPT-4o-mini)
          </label>
          <input
            name="api_key"
            type="password"
            defaultValue={valor.api_key || ''}
            placeholder="sk-..."
            className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          />
          <p className="text-[11px] text-gray-500">
            Se preenchida, utilizará o modelo GPT-4o-mini da OpenAI.
          </p>
        </div>

        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3.5 rounded-xl transition flex items-center gap-2 text-sm shadow-md cursor-pointer"
        >
          <Save size={18} />
          Salvar Configurações da IA
        </button>
      </form>
    </div>
  );
}

