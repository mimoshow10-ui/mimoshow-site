import { supabase } from '@/lib/supabase';
import TopBarForm from './TopBarForm';
import BannersForm from './BannersForm';
import EncontreRapidoForm from './EncontreRapidoForm';
import PopupForm from './PopupForm';
import EmailMarketingConfig from './EmailMarketingConfig';
import { salvarEmailMarketingConfig, dispararEmailTeste } from './actions';
import { Megaphone, Info, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminMarketing({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const params = await searchParams;

  const { data: configs } = await supabase.from('configuracoes').select('*');

  const topbarConfig = configs?.find(c => c.chave === 'marketing_topbar')?.valor;
  const topbar = topbarConfig || {
    texto: 'Frete Grátis acima de R$ 199,00! Aproveite!',
    visibilidade: 'todas',
    cor: 'bg-primary'
  };

  const bannersConfig = configs?.find(c => c.chave === 'marketing_banners')?.valor;
  let bannerItems: Array<{ url: string; link_url: string }> = [];
  if (bannersConfig?.items && Array.isArray(bannersConfig.items)) {
    bannerItems = bannersConfig.items;
  } else if (bannersConfig?.urls && Array.isArray(bannersConfig.urls)) {
    bannerItems = bannersConfig.urls.map((u: string) => ({ url: u, link_url: '' }));
  } else {
    bannerItems = [{ url: '/banner-pet.jpg', link_url: '' }];
  }

  const popup = configs?.find(c => c.chave === 'marketing_popup')?.valor || {
    ativo: false,
    imagem_url: '',
    link_destino: '',
    titulo: 'Ganhe 10% OFF na Primeira Compra!',
    subtitulo: 'Use o cupom BEMVINDO10 no seu carrinho.',
    gatilho: 'tempo',
    tempo_exibicao_segundos: 3,
    onde_exibir: 'home',
    frequencia: 'uma_vez_por_sessao'
  };

  const emailConfig = configs?.find(c => c.chave === 'email_pos_venda_config')?.valor || {
    ativo: true,
    desconto_valor: 10,
    desconto_tipo: 'percentual',
    validade_dias: 15,
    banner_url: '',
    assunto: 'Obrigado por sua compra na Mimo Show Pet! Ganhe 10% OFF na próxima compra 🐾',
    mensagem: 'Ficamos muito felizes em atender você e seu pet! Como forma de agradecimento, preparamos um presente exclusivo para seu próximo pedido.'
  };

  const emailLogs = configs?.find(c => c.chave === 'emails_enviados_log')?.valor || [];

  const encontreRapidoConfig = configs?.find(c => c.chave === 'encontre_rapido_segmentos')?.valor || [];
  const { data: categoriasData } = await supabase.from('categorias').select('nome, slug').order('nome');
  const categoriasDisponiveis = (categoriasData || []).map((c: any) => ({ nome: c.nome, slug: c.slug }));

  return (
    <div className="max-w-5xl space-y-8 font-sans">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary flex items-center gap-3">
            <Megaphone size={32} className="text-primary" />
            Marketing, Banners e Pop-ups
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie avisos de topo, carrossel de banners e pop-ups promocionais com guia de dimensões para designers.
          </p>
        </div>
      </div>

      {params.msg && (
        <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl font-bold text-sm flex items-center gap-2">
          <CheckCircle2 size={18} />
          {params.msg}
        </div>
      )}

      {params.erro && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-xl font-bold text-sm">
          ⚠️ {params.erro}
        </div>
      )}

      {/* ── GUIA DE TAMANHOS DE BANNERS PARA O DESIGNER ── */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex items-center gap-2 border-b border-purple-700/60 pb-3">
          <Info size={22} className="text-amber-300" />
          <h2 className="text-lg font-bold">Guia de Dimensões Recomendadas para o Designer</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-1">
            <span className="bg-amber-400 text-purple-950 font-black px-2 py-0.5 rounded text-[10px] uppercase block w-fit mb-1 flex items-center gap-1">
              💻 CARROSSEL DESKTOP (OFICIAL)
            </span>
            <p className="text-base font-mono font-bold text-amber-200">1920 x 600 px</p>
            <p className="text-purple-200">Proporção 16:5. Formatos: PNG, JPG ou WebP até 500 KB.</p>
          </div>

          <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-1">
            <span className="bg-amber-400 text-purple-950 font-black px-2 py-0.5 rounded text-[10px] uppercase block w-fit mb-1 flex items-center gap-1">
              📱 CARROSSEL MOBILE
            </span>
            <p className="text-base font-mono font-bold text-amber-200">1080 x 1350 px</p>
            <p className="text-purple-200">Proporção 4:5. Formatos: PNG, JPG ou WebP até 500 KB.</p>
          </div>

          <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-1">
            <span className="bg-amber-400 text-purple-950 font-black px-2 py-0.5 rounded text-[10px] uppercase block w-fit mb-1">
              🖼️ Pop-up Promocional (Oficial)
            </span>
            <p className="text-base font-mono font-bold text-amber-200">800 x 800 px</p>
            <p className="text-purple-200">Ou 600 x 800 px (Vertical 3:4) para janelas modais promocionais.</p>
          </div>

        </div>
      </div>

      <div className="space-y-8">
        
        {/* ── TOP BAR (BARRA DE AVISO DO TOPO) ── */}
        <TopBarForm topbar={topbar} />

        {/* ── BANNERS DO CARROSSEL ── */}
        <BannersForm bannersIniciais={bannerItems} />

        {/* ── ENCONTRE RÁPIDO (ATALHOS DE SEGMENTOS NA HOME) ── */}
        <EncontreRapidoForm 
          segmentosIniciais={encontreRapidoConfig} 
          categoriasDisponiveis={categoriasDisponiveis} 
        />

        {/* ── POP-UP PROMOCIONAL MODAL ── */}
        <PopupForm popup={popup} />

        {/* ── E-MAIL MARKETING DE PÓS-VENDA & HISTÓRICO DE E-MAILS ── */}
        <EmailMarketingConfig
          config={emailConfig}
          logs={emailLogs}
          salvarConfigAction={salvarEmailMarketingConfig}
          dispararTesteAction={dispararEmailTeste}
        />

      </div>
    </div>
  );
}

