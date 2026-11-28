import { supabase } from '@/lib/supabase';
import ConfiguracoesForms from './ConfiguracoesForms';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminConfiguracoes({ searchParams }: { searchParams: Promise<{ msg?: string; erro?: string }> }) {
  const params = await searchParams;

  let creds = null;
  let dbError = null;
  try {
    const { data, error } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_credentials').maybeSingle();
    if (error) dbError = error.message;

    const envClientId = process.env.BLING_CLIENT_ID?.trim();
    const envClientSecret = process.env.BLING_CLIENT_SECRET?.trim();
    const envLojaBanho = process.env.BLING_LOJA_ID_BANHO_TOSA?.trim();
    const envLojaMimo = process.env.BLING_LOJA_ID_MIMO_SHOW?.trim();

    const clientId = envClientId || data?.valor?.client_id || '';
    const secret = envClientSecret || data?.valor?.client_secret || '';

    if (clientId || secret || data?.valor) {
      creds = {
        client_id: clientId,
        has_secret: !!secret,
        secret_is_vercel: !!envClientSecret,
        is_from_env: !!(envClientId || envClientSecret),
        loja_id_banho_tosa: envLojaBanho || data?.valor?.loja_id_banho_tosa || '',
        loja_id_mimo_show: envLojaMimo || data?.valor?.loja_id_mimo_show || ''
      };
    }
  } catch (err) {
    dbError = String(err);
  }

  let blingTokensInfo = null;
  try {
    const { data: cfgTokens } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').maybeSingle();
    if (cfgTokens?.valor) {
      blingTokensInfo = {
        temAccessToken: !!cfgTokens.valor.access_token,
        temRefreshToken: !!cfgTokens.valor.refresh_token,
        expiresAt: cfgTokens.valor.expires_at || null,
        atualizadoEm: cfgTokens.valor.atualizado_em || null,
      };
    }
  } catch {}

  let mpCreds = null;
  try {
    const { data } = await supabase.from('configuracoes').select('*').eq('chave', 'mercadopago_config').maybeSingle();
    const envMpToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    const envMpKey = process.env.MERCADOPAGO_PUBLIC_KEY?.trim();
    mpCreds = {
      is_from_env: !!envMpToken,
      has_token: !!(envMpToken || data?.valor?.access_token),
      public_key: envMpKey || data?.valor?.public_key || '',
    };
  } catch {}

  let temSenhaConfigurada = false;
  try {
    const { data: cfgAdmin } = await supabase.from('configuracoes').select('*').eq('chave', 'admin_config').maybeSingle();
    if (cfgAdmin?.valor?.senha) temSenhaConfigurada = true;
  } catch {}

  let resendConfig = null;
  try {
    const { data: cfgResend } = await supabase.from('configuracoes').select('*').eq('chave', 'resend_config').maybeSingle();
    resendConfig = cfgResend?.valor || null;
  } catch {}

  let freteConfig = null;
  try {
    const { data: cfgFrete } = await supabase.from('configuracoes').select('*').eq('chave', 'frete_config').maybeSingle();
    freteConfig = cfgFrete?.valor;
  } catch {}

  let analyticsConfig = null;
  try {
    const { data: cfgAnalytics } = await supabase.from('configuracoes').select('*').eq('chave', 'analytics_config').maybeSingle();
    analyticsConfig = cfgAnalytics?.valor || null;
  } catch {}

  return (
    <div className="max-w-3xl font-sans space-y-6">
      <h1 className="text-3xl font-heading font-bold text-gray-800 border-b border-gray-200 pb-4">
        Configurações e Integrações
      </h1>

      {dbError && (
        <div className="bg-red-100 text-red-800 p-4 rounded-xl font-bold text-xs border border-red-300">
          ❌ FALHA DE CONEXÃO: {dbError}
        </div>
      )}

      {params.msg && (
        <div className="bg-green-100 text-green-800 p-4 rounded-xl font-bold text-xs border border-green-300">
          ✅ {params.msg}
        </div>
      )}

      {params.erro && (
        <div className="bg-red-100 text-red-800 p-4 rounded-xl font-bold text-xs border border-red-300">
          ❌ ERRO: {params.erro}
        </div>
      )}

      <ConfiguracoesForms
        temSenhaConfigurada={temSenhaConfigurada}
        resendConfig={resendConfig}
        creds={creds}
        blingTokensInfo={blingTokensInfo}
        mpCreds={mpCreds}
        freteConfig={freteConfig}
        analyticsConfig={analyticsConfig}
      />
    </div>
  );
}

