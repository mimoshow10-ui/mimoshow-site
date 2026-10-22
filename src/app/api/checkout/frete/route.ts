import { NextRequest, NextResponse } from 'next/server';
import { calcularFretesCarrinho } from '@/lib/shipping';
import { ItemCarrinho } from '@/lib/types/checkout';

export async function POST(req: NextRequest) {
  try {
    const { itens, cep } = await req.json();

    if (!cep || !Array.isArray(itens)) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const cepLimpo = String(cep).replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      return NextResponse.json({ error: 'CEP inválido. Deve conter 8 dígitos numéricos.' }, { status: 400 });
    }

    if (itens.length === 0) {
      return NextResponse.json({ opcoes: [] });
    }

    const opcoes = await calcularFretesCarrinho(itens as ItemCarrinho[], cepLimpo);
    return NextResponse.json({ opcoes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro ao calcular fretes' }, { status: 500 });
  }
}
