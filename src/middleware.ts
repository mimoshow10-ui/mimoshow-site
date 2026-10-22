import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── 1. BLOQUEIO DE CAMINHOS MALICIOSOS E SCANNERS AUTOMATIZADOS ──
const BLOCKED_PATH_PATTERNS = [
  /^\/(?:wp-admin|wp-login|wp-content|wp-includes|xmlrpc\.php)/i,
  /^\/(?:\.env|\.git|\.vscode|\.aws|\.ssh|config\.json|package\.json)/i,
  /^\/(?:phpmyadmin|pma|adminer|mysql|myadmin)/i,
  /^\/(?:cgi-bin|eval-stdin|setup\.php|install\.php|license\.txt|version\.php)/i,
  /\.(?:php|asp|aspx|jsp|cgi|sh|bash|env|sql|bak|yaml|yml)$/i,
];

// ── 2. BLOQUEIO DE USER-AGENTS MALICIOSOS CONHECIDOS ──
const MALICIOUS_UA_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /masscan/i,
  /acunetix/i,
  /nmap/i,
  /dirbuster/i,
  /gobuster/i,
  /wpscan/i,
  /openvas/i,
  /nessus/i,
  /zgrab/i,
  /censys/i,
  /semrushbot/i,
  /ahrefsbot/i,
  /dotbot/i,
  /petalbot/i
];

// ── 3. DETECÇÃO DE INJEÇÃO (SQLi, XSS, Path Traversal) NA URL/QUERY ──
const INJECTION_PATTERNS = [
  /<script/i,
  /union\s+select/i,
  /etc\/passwd/i,
  /\.\.\//,
  /\.\.\\/,
  /benchmark\s*\(/i,
  /sleep\s*\(/i,
  /load_file\s*\(/i,
];

// ── 4. SISTEMA DE RATE LIMITING POR IP (PROTEÇÃO DDOS & BRUTE FORCE) ──
interface RateRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateRecord>();
let requestCounter = 0;

function isRateLimited(ip: string, routeKey: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  if (++requestCounter % 150 === 0) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetAt) rateLimitMap.delete(k);
    }
  }

  const key = `${ip}:${routeKey}`;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count += 1;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'anon';

  // 1. Bloqueio de scanners e bots maliciosos por User-Agent
  const userAgent = req.headers.get('user-agent') || '';
  for (const pattern of MALICIOUS_UA_PATTERNS) {
    if (pattern.test(userAgent)) {
      return new NextResponse('Acesso bloqueado: scanner ou bot automatizado não permitido.', { status: 403 });
    }
  }

  // 2. Bloqueio de caminhos de varredura (.env, wp-login, etc.)
  for (const pattern of BLOCKED_PATH_PATTERNS) {
    if (pattern.test(pathname)) {
      return new NextResponse('Acesso negado: recurso não disponível.', { status: 403 });
    }
  }

  // 3. Detecção de tentativas de injeção na query string
  if (req.nextUrl.search) {
    try {
      const decodedQuery = decodeURIComponent(req.nextUrl.search);
      for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(decodedQuery)) {
          return new NextResponse('Requisição rejeitada por motivos de segurança.', { status: 400 });
        }
      }
    } catch {
      // Ignora erro de URI malformada
    }
  }

  // 4. Rate Limiting em rotas sensíveis (Anti-DDoS / Anti-Carding / Anti-Brute Force)
  if (pathname === '/api/checkout') {
    if (isRateLimited(ip, 'checkout', 8, 60 * 1000)) {
      return NextResponse.json(
        { erro: 'Muitas tentativas de pedido em sequência. Proteção contra ataques ativada. Aguarde 1 minuto.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  if (pathname === '/api/admin/auth') {
    if (isRateLimited(ip, 'admin-auth', 6, 5 * 60 * 1000)) {
      return NextResponse.json(
        { erro: 'Muitas tentativas de login. Proteção contra força bruta ativada. Aguarde 5 minutos.' },
        { status: 429, headers: { 'Retry-After': '300' } }
      );
    }
  }

  if (pathname === '/api/checkout/frete') {
    if (isRateLimited(ip, 'frete', 25, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Muitas consultas de frete simultâneas. Aguarde alguns instantes.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  if (pathname === '/api/cupons/validar') {
    if (isRateLimited(ip, 'cupons', 15, 60 * 1000)) {
      return NextResponse.json(
        { valido: false, erro: 'Muitas tentativas de cupom. Aguarde um instante.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  if (pathname.startsWith('/api/')) {
    if (isRateLimited(ip, 'api-global', 120, 60 * 1000)) {
      return NextResponse.json(
        { erro: 'Muitas requisições. Aguarde um momento antes de tentar novamente.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  // 5. Interceptar rotas do Painel Admin
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  if (isAdminPage || isAdminApi) {
    const isLoginPath = pathname === '/admin/login';
    const isAuthApiPath = pathname === '/api/admin/auth';

    if (!isLoginPath && !isAuthApiPath) {
      const sessionToken = req.cookies.get('admin_session')?.value;

      if (!sessionToken || !sessionToken.startsWith('admin_session_')) {
        if (isAdminApi) {
          return NextResponse.json(
            { erro: 'Acesso Administrativo Negado. Autentique-se com mimoshow01@gmail.com' },
            { status: 403 }
          );
        }

        const loginUrl = new URL('/admin/login', req.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // 6. Cabeçalhos HTTP de segurança
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
