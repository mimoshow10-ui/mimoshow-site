import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Ticket, CheckCircle, AlertCircle } from 'lucide-react';
import { Cupom } from '@/lib/types/coupon';
import CuponsClient from './CuponsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function salvarCupom(formData: FormData) {
  'use server';

  const id = (formData.get('id') as string) || `cupom-${Date.now()}`;
  const nome_interno = formData.get('nome_interno') as string;
  const codigoRaw = formData.get('codigo') as string;
  const codigo = codigoRaw.trim().toUpperCase().replace(/\s+/g, '');
  const tipo_desconto = formData.get('tipo_desconto') as Cupom['tipo_desconto'];
  const valor_desconto = parseFloat(formData.get('valor_desconto') as string || '0');
  const desconto_maximo_reais = formData.get('desconto_maximo_reais') ? parseFloat(formData.get('desconto_maximo_reais') as string) : null;
  const compra_minima_reais = formData.get('compra_minima_reais') ? parseFloat(formData.get('compra_minima_reais') as string) : null;
  const data_inicio = formData.get('data_inicio') as string || null;
  const data_fim = formData.get('data_fim') as string || null;
  const ativo = formData.get('ativo') === 'on';
  const limite_usos_total = formData.get('limite_usos_total') ? parseInt(formData.get('limite_usos_total') as string) : null;
  const permitir_produtos_promocionais = formData.get('permitir_produtos_promocionais') === 'on';
  const permitir_acumulo = formData.get('permitir_acumulo') === 'on';
  const exclusivo_email = formData.get('exclusivo_email') === 'on';
  const tipo_elegibilidade = (formData.get('tipo_elegibilidade') as Cupom['tipo_elegibilidade']) || 'todos';

  const { data: config } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'cupons_db')
    .single();

  let lista: Cupom[] = config?.valor || [];

  const index = lista.findIndex(c => c.id === id);
  const novoCupom: Cupom = {
    id,
    nome_interno,
    codigo,
    tipo_desconto,
    valor_desconto,
    desconto_maximo_reais,
    compra_minima_reais,
    data_inicio,
    data_fim,
    ativo,
    limite_usos_total,
    usos_realizados: index >= 0 ? (lista[index].usos_realizados || 0) : 0,
    permitir_produtos_promocionais,
    permitir_acumulo,
    exclusivo_email,
    tipo_elegibilidade,
    criado_em: index >= 0 ? lista[index].criado_em : new Date().toISOString(),
  };

  if (index >= 0) {
    lista[index] = novoCupom;
  } else {
    lista.push(novoCupom);
  }

  const { error: upsertError } = await supabase.from('configuracoes').upsert({
    chave: 'cupons_db',
    valor: lista
  }, { onConflict: 'chave' });

  if (upsertError) {
    console.error("Erro ao salvar cupons_db:", upsertError);
    redirect(`/admin/cupons?erro=Erro ao salvar cupom: ${encodeURIComponent(upsertError.message)}`);
  }

  // 🎯 Sincronização automática com a Tela de Vendas (Home)
  const exibir_na_home = formData.get('exibir_na_home') === 'on';
  const { data: configPos } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'cupons_config')
    .maybeSingle();

  let cupons_home_ids: string[] = configPos?.valor?.cupons_home_ids || [];
  const posicao_home = configPos?.valor?.posicao_home || 'topo';

  if (exibir_na_home && ativo) {
    if (!cupons_home_ids.includes(id)) {
      cupons_home_ids.push(id);
    }
  } else {
    cupons_home_ids = cupons_home_ids.filter(item => item !== id);
  }

  await supabase.from('configuracoes').upsert({
    chave: 'cupons_config',
    valor: {
      posicao_home,
      cupons_home_ids
    }
  }, { onConflict: 'chave' });

  revalidatePath('/admin/cupons');
  revalidatePath('/');
  redirect('/admin/cupons?msg=Cupom salvo com sucesso!');
}

async function excluirCupom(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;

  const { data: config } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'cupons_db')
    .single();

  let lista: Cupom[] = config?.valor || [];
  lista = lista.filter(c => c.id !== id);

  await supabase.from('configuracoes').update({ valor: lista }).eq('chave', 'cupons_db');

  // Limpa também da lista de cupons exibidos na home
  const { data: configPos } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'cupons_config')
    .maybeSingle();

  if (configPos?.valor?.cupons_home_ids) {
    const novosHomeIds = (configPos.valor.cupons_home_ids as string[]).filter(item => item !== id);
    await supabase.from('configuracoes').upsert({
      chave: 'cupons_config',
      valor: {
        posicao_home: configPos.valor.posicao_home || 'topo',
        cupons_home_ids: novosHomeIds
      }
    }, { onConflict: 'chave' });
  }

  revalidatePath('/admin/cupons');
  revalidatePath('/');
  redirect('/admin/cupons?msg=Cupom removido!');
}

async function toggleCupomHome(id: string) {
  'use server';
  const { data: configPos } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'cupons_config')
    .maybeSingle();

  let cupons_home_ids: string[] = configPos?.valor?.cupons_home_ids || [];
  const posicao_home = configPos?.valor?.posicao_home || 'topo';

  if (cupons_home_ids.includes(id)) {
    cupons_home_ids = cupons_home_ids.filter(item => item !== id);
  } else {
    cupons_home_ids.push(id);
  }

  await supabase.from('configuracoes').upsert({
    chave: 'cupons_config',
    valor: {
      posicao_home,
      cupons_home_ids
    }
  }, { onConflict: 'chave' });

  revalidatePath('/admin/cupons');
  revalidatePath('/');
}

async function salvarListaCupons(cuponsNovos: Cupom[]) {
  'use server';
  await supabase.from('configuracoes').upsert({
    chave: 'cupons_db',
    valor: cuponsNovos
  }, { onConflict: 'chave' });

  revalidatePath('/admin/cupons');
  revalidatePath('/');
}

async function salvarConfigCuponsHome(payload: { posicao_home: string; cupons_home_ids: string[] }) {
  'use server';
  const posicao_home = payload.posicao_home || 'topo';
  const cupons_home_ids = payload.cupons_home_ids || [];

  await supabase.from('configuracoes').upsert({
    chave: 'cupons_config',
    valor: {
      posicao_home,
      cupons_home_ids
    }
  }, { onConflict: 'chave' });

  revalidatePath('/admin/cupons');
  revalidatePath('/');
}

export default async function AdminCuponsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const params = await searchParams;

  const { data: config } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'cupons_db')
    .single();

  const { data: configPosicao } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'cupons_config')
    .maybeSingle();

  let cupons: Cupom[] = config?.valor || [];
  const posicaoHomeAtual = configPosicao?.valor?.posicao_home || 'topo';
  const cuponsHomeIdsAtual: string[] = configPosicao?.valor?.cupons_home_ids || cupons.map(c => c.id);

  if (cupons.length === 0) {
    cupons = [
      {
        id: 'cupom-bemvindo',
        nome_interno: 'Cupom de Boas-Vindas 10%',
        codigo: 'BEMVINDO10',
        tipo_desconto: 'percentual',
        valor_desconto: 10,
        compra_minima_reais: 50,
        desconto_maximo_reais: 30,
        ativo: true,
        usos_realizados: 0,
        permitir_produtos_promocionais: true,
        tipo_elegibilidade: 'todos',
        criado_em: new Date().toISOString(),
      }
    ];

    await supabase.from('configuracoes').upsert({ chave: 'cupons_db', valor: cupons });
  }

  return (
    <div className="max-w-5xl space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary flex items-center gap-3">
            <Ticket size={32} className="text-primary" />
            Cupons de Desconto & Tela de Vendas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Selecione quais cupons e a ordem exata em que aparecerão na tela de vendas (Página Inicial).
          </p>
        </div>
      </div>

      {params.msg && (
        <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl font-bold text-sm flex items-center gap-2">
          <CheckCircle size={18} />
          {params.msg}
        </div>
      )}

      {params.erro && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-xl font-bold text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          {params.erro}
        </div>
      )}

      <CuponsClient
        cupons={cupons}
        posicaoHomeAtual={posicaoHomeAtual}
        cuponsHomeIdsInicial={cuponsHomeIdsAtual}
        salvarCupomAction={salvarCupom}
        excluirCupomAction={excluirCupom}
        salvarConfigHomeAction={salvarConfigCuponsHome}
        salvarListaAction={salvarListaCupons}
        toggleCupomHomeAction={toggleCupomHome}
      />
    </div>
  );
}
