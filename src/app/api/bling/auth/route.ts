import { NextResponse } from 'next/server';
import { obterCredenciaisBling } from '@/lib/bling/blingService';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session')?.value;

    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/configuracoes?erro=Você precisa estar autenticado como administrador para autorizar o Bling.', request.url));
    }

    const creds = await obterCredenciaisBling();

    if (!creds?.client_id) {
      return NextResponse.redirect(new URL('/admin/configuracoes?erro=Client ID do Bling não configurado no painel nem nas variáveis da Vercel.', request.url));
    }

    const clientId = creds.client_id;

    // Gerar token aleatório criptograficamente seguro para proteção anti-CSRF
    const state = crypto.randomBytes(32).toString('hex');

    // Salvar o state em cookie seguro com expiração de 10 minutos
    cookieStore.set('bling_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutos
    });

    const blingAuthorizeUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&state=${encodeURIComponent(state)}`;

    return NextResponse.redirect(blingAuthorizeUrl);
  } catch (error: any) {
    console.error('[BLING AUTH] Erro ao iniciar fluxo OAuth:', error);
    return NextResponse.redirect(new URL('/admin/configuracoes?erro=Erro ao iniciar conexão com o Bling.', request.url));
  }
}
