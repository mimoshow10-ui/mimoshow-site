import { NextResponse } from 'next/server';
import { processarFilaBlingPendentes } from '@/lib/bling/syncQueue';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Endpoint para processar a fila de retries do Bling ERP.
 * Pode ser acionado periodicamente (ex: a cada 5 ou 10 minutos via cron).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    const secretParam = searchParams.get('secret');

    // Se houver CRON_SECRET nas variáveis de ambiente, validar
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const isAuthorized =
        authHeader === `Bearer ${cronSecret}` ||
        secretParam === cronSecret;

      if (!isAuthorized) {
        return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
      }
    }

    console.log('[CRON BLING] Iniciando processamento da fila de retries...');
    const resultado = await processarFilaBlingPendentes();
    console.log('[CRON BLING] Fila processada:', resultado);

    return NextResponse.json({
      sucesso: true,
      timestamp: new Date().toISOString(),
      ...resultado,
    });
  } catch (err: any) {
    console.error('[CRON BLING ERRO]', err);
    return NextResponse.json({ erro: err.message || 'Erro ao processar fila' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
