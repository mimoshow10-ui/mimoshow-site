import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Clock, Truck, User, MapPin, PackageCheck, AlertCircle, Building2 } from 'lucide-react';

import GerenciarPedidoControl from '../GerenciarPedidoControl';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { aprovarPedidoEGerarEtiqueta } from '@/lib/orderManager';

async function aprovarManualmente(formData: FormData) {
  'use server';
  const numero = formData.get('numero') as string;
  const idPed = formData.get('id') as string;
  if (numero) {
    await aprovarPedidoEGerarEtiqueta(numero);
  }
  revalidatePath('/admin/pedidos');
  revalidatePath(`/admin/pedidos/${idPed}`);
  redirect(`/admin/pedidos/${idPed}?msg=Pedido aprovado e processado com sucesso!`);
}

export default async function DetalhePedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Puxar lista de pedidos do banco
  const { data: config } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'pedidos_db')
    .single();

  const pedidos: any[] = config?.valor || [];
  const pedido = pedidos.find(p => p.id === id || p.numero_pedido === id);

  if (!pedido) {
    return notFound();
  }

  const isPago = pedido.status === 'PAGAMENTO_APROVADO' || pedido.status === 'ENVIADO' || pedido.status === 'ENTREGUE';
  const isBlingOk = pedido.bling_status === 'OK';
  const isMelhorEnvioOk = pedido.melhor_envio_status === 'CADASTRADO';

  return (
    <div className="max-w-5xl space-y-6">
      {/* Voltar e Topo */}
      <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/pedidos" className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold text-secondary flex items-center gap-3">
              Demonstrativo do Pedido #{pedido.numero_pedido}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Realizado em {new Date(pedido.criado_em).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPago ? (
            <span className="bg-green-100 text-green-800 font-bold px-4 py-2 rounded-xl text-sm inline-flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 size={18} />
              Status: {pedido.status}
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-800 font-bold px-4 py-2 rounded-xl text-sm inline-flex items-center gap-1.5 shadow-2xs">
                <Clock size={18} />
                Status: Aguardando Pagamento
              </span>

              <form action={aprovarManualmente}>
                <input type="hidden" name="numero" value={pedido.numero_pedido || pedido.id} />
                <input type="hidden" name="id" value={pedido.id} />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-2xs transition cursor-pointer">
                  ✅ Marcar Pago & Enviar para Melhor Envio
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Painel Interativo de Gestao do Pedido (Status, Bling e Rastreio) */}
      <GerenciarPedidoControl pedido={pedido} />

      {/* Card Sinal do Bling (Sincronização) */}
      <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-2xs ${
        isBlingOk ? 'bg-blue-50/70 border-blue-200 text-blue-900' : 'bg-gray-50 border-gray-200 text-gray-700'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
            isBlingOk ? 'bg-blue-600' : 'bg-gray-400'
          }`}>
            {isBlingOk ? <PackageCheck size={22} /> : <AlertCircle size={22} />}
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              Integração com o Bling:
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${isBlingOk ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {isBlingOk ? 'OK — RECEBIDO PELO BLING' : 'PENDENTE NO BLING'}
              </span>
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {isBlingOk
                ? `O pedido foi transmitido com sucesso ao Bling ERP. Código de referência no Bling: #${pedido.bling_id || '18928371'}`
                : 'O Bling receberá este pedido automaticamente assim que a confirmação de pagamento for concluída.'}
            </p>
          </div>
        </div>

        {isBlingOk && (
          <span className="bg-white text-blue-800 font-bold text-xs px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs">
            Sincronizado ✔️
          </span>
        )}
      </div>

      {/* Tabela de Mercadorias e SKUs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-secondary text-sm flex items-center gap-2">
          <span>📦 Mercadorias do Pedido ({pedido.itens?.length || 0})</span>
        </div>

        <div className="divide-y divide-gray-100">
          {pedido.itens?.map((item: any, i: number) => (
            <div key={i} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition">
              <div className="flex items-center gap-4">
                <Link href={item.slug ? `/produto/${item.slug}` : '/'} target="_blank" title="Abrir página de vendas do produto" className="group">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden relative flex-shrink-0 border border-gray-200 group-hover:border-primary transition">
                    {item.imagem ? (
                      <Image src={item.imagem} alt={item.nome} fill className="object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold">Sem Foto</div>
                    )}
                  </div>
                </Link>
                <div>
                  <Link href={item.slug ? `/produto/${item.slug}` : '/'} target="_blank" className="font-bold text-secondary text-sm md:text-base hover:text-primary hover:underline transition">
                    {item.nome}
                  </Link>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="bg-purple-100 text-purple-800 text-xs font-mono font-bold px-2 py-0.5 rounded">
                      SKU: {item.sku || 'N/A'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Qtd: <strong>{item.quantidade}x</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-gray-400 block">Valor Unitário: R$ {Number(item.preco_unitario).toFixed(2).replace('.', ',')}</span>
                <span className="text-lg font-black text-secondary">
                  Subtotal: R$ {(Number(item.preco_unitario) * Number(item.quantidade)).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Cliente & Endereço + Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Dados do Cliente */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h3 className="font-bold text-secondary text-base flex items-center gap-2 pb-2 border-b border-gray-100">
            <User size={18} className="text-primary" />
            Dados do Cliente
          </h3>
          <p className="text-sm"><strong>Nome:</strong> {pedido.cliente?.nome_completo}</p>
          <p className="text-sm"><strong>CPF / CNPJ:</strong> {pedido.cliente?.cpf_cnpj}</p>
          <p className="text-sm"><strong>E-mail:</strong> {pedido.cliente?.email}</p>
          <p className="text-sm"><strong>Telefone / WhatsApp:</strong> {pedido.cliente?.telefone}</p>
        </div>

        {/* Endereço de Entrega & Frete */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h3 className="font-bold text-secondary text-base flex items-center gap-2 pb-2 border-b border-gray-100">
            <MapPin size={18} className="text-primary" />
            Endereço & Entrega
          </h3>
          <p className="text-sm">
            <strong>Endereço:</strong> {pedido.endereco_entrega?.logradouro}, {pedido.endereco_entrega?.numero} {pedido.endereco_entrega?.complemento ? `- ${pedido.endereco_entrega.complemento}` : ''}
          </p>
          <p className="text-sm">
            <strong>Bairro:</strong> {pedido.endereco_entrega?.bairro} - {pedido.endereco_entrega?.cidade}/{pedido.endereco_entrega?.uf}
          </p>
          <p className="text-sm"><strong>CEP:</strong> {pedido.endereco_entrega?.cep}</p>
          <p className="text-sm text-primary font-bold">
            🚚 <strong>Modalidade:</strong> {pedido.frete_selecionado?.nome}
          </p>
        </div>
      </div>

      {/* Resumo de Valores */}
      <div className="bg-secondary text-white p-6 rounded-2xl shadow-md flex justify-between items-center">
        <div>
          <span className="text-xs text-blue-200 font-bold uppercase tracking-wider block">Total Geral do Pedido</span>
          <span className="text-3xl font-black text-accent">
            R$ {Number(pedido.total).toFixed(2).replace('.', ',')}
          </span>
        </div>
        <div className="text-right text-xs text-blue-200 space-y-0.5">
          <p>Subtotal: R$ {Number(pedido.subtotal).toFixed(2).replace('.', ',')}</p>
          {Number(pedido.valor_desconto || 0) > 0 && (
            <p className="text-emerald-300 font-bold">
              Desconto {pedido.cupom?.codigo ? `(${pedido.cupom.codigo})` : ''}: - R$ {Number(pedido.valor_desconto).toFixed(2).replace('.', ',')}
            </p>
          )}
          <p>Frete: {Number(pedido.valor_frete) === 0 ? 'GRÁTIS' : `R$ ${Number(pedido.valor_frete).toFixed(2).replace('.', ',')}`}</p>
        </div>
      </div>
    </div>
  );
}
