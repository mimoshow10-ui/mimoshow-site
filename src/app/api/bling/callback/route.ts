import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (errorParam) {
    const msg = errorDescription || errorParam;
    console.error('[BLING OAUTH] Erro retornado pelo Bling:', msg);
    return NextResponse.redirect(new URL(`/admin/configuracoes?erro=Autorização recusada pelo Bling: ${encodeURIComponent(msg)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/admin/configuracoes?erro=Nenhum código de autorização retornado pelo Bling.', request.url));
  }

  // ── VALIDAÇÃO DE SEGURANÇA CSRF VIA STATE ──
  const cookieStore = await cookies();
  const savedState = cookieStore.get('bling_oauth_state')?.value;
  cookieStore.delete('bling_oauth_state');

  if (!savedState || savedState !== state) {
    console.error('[BLING OAUTH] Falha na validação CSRF (state inválido ou ausente):', { savedState, receivedState: state });
    return NextResponse.redirect(new URL('/admin/configuracoes?erro=Falha de segurança na autorização OAuth (CSRF inválido ou sessão expirada). Tente novamente.', request.url));
  }

  try {
    const { obterCredenciaisBling } = await import('@/lib/bling/blingService');
    const creds = await obterCredenciaisBling();
    
    if (!creds?.client_id || !creds?.client_secret) {
      return NextResponse.redirect(new URL('/admin/configuracoes?erro=Client ID e Secret não cadastrados no sistema nem na Vercel.', request.url));
    }

    const clientId = creds.client_id;
    const clientSecret = creds.client_secret;

    const authResponse = await fetch('https://api.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        'Accept': '1.0'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code
      })
    });

    const authData = await authResponse.json().catch(() => ({}));
    
    if (!authResponse.ok || authData.error || !authData.access_token) {
      const detalheErro = authData.error?.description || authData.error?.message || authData.error || 'Erro desconhecido ao obter token do Bling.';
      console.error('[BLING OAUTH] Bling rejeitou a troca do code por token:', authData);
      return NextResponse.redirect(new URL(`/admin/configuracoes?erro=Bling rejeitou a autorização: ${encodeURIComponent(detalheErro)}`, request.url));
    }

    const agora = Date.now();
    const expiresInSec = Number(authData.expires_in) || 21600;

    await supabase.from('configuracoes').upsert({
      chave: 'bling_tokens',
      valor: {
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        expires_in: expiresInSec,
        expires_at: agora + (expiresInSec * 1000),
        token_type: authData.token_type || 'Bearer',
        atualizado_em: new Date().toISOString()
      }
    }, { onConflict: 'chave' });

    console.log('[BLING OAUTH] Conexão concluída com sucesso! Tokens salvos no banco.');
    return NextResponse.redirect(new URL('/admin/configuracoes?msg=Bling conectado com sucesso! O novo token foi validado e salvo.', request.url));

  } catch (error: any) {
    console.error('[BLING OAUTH] Erro fatal no servidor ao processar o Bling:', error);
    return NextResponse.redirect(new URL('/admin/configuracoes?erro=Erro interno no servidor ao processar autorização do Bling.', request.url));
  }
}
