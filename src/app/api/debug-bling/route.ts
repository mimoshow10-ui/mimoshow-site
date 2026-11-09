import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { obterTokenBlingValido } from '@/lib/bling/blingService';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session')?.value;

    if (!adminSession) {
      return NextResponse.json({ erro: 'Acesso restrito ao administrador.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sku = searchParams.get('sku');

    if (!sku) {
      return NextResponse.json({ erro: 'Parâmetro SKU é obrigatório.' }, { status: 400 });
    }

    const token = await obterTokenBlingValido();
    if (!token) {
      return NextResponse.json({ erro: 'Token do Bling não configurado.' }, { status: 500 });
    }

    const response = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(sku)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return NextResponse.json({ erro: 'Produto não localizado no Bling.' }, { status: 404 });
    }

    const prodId = data.data[0].id;
    const detalhesReq = await fetch(`https://api.bling.com.br/Api/v3/produtos/${prodId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const detalhes = await detalhesReq.json();

    return NextResponse.json(detalhes);
  } catch (err: any) {
    return NextResponse.json({ erro: err.message }, { status: 500 });
  }
}
