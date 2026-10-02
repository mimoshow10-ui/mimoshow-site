import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, CheckCircle2, Clock, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { PedidoSnapshot } from '@/lib/types/checkout';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPedidosPage() {
  // Puxar pedidos salvos no banco de dados
  const { data: config } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'pedidos_db')
    .single();

  let pedidos: any[] = config?.valor || [];

  // Exemplo de demonstração se não houver pedidos ainda
  if (pedidos.length === 0) {
    pedidos = [
      {
        id: 'ped-10294',
        numero_pedido: '10294',
        cliente: {
          nome_completo: 'Maria Oliveira',
          cpf_cnpj: '123.456.789-00',
          email: 'maria@exemplo.com',
          telefone: '(11) 98888-7777',
        },
        endereco_entrega: {
          logradouro: 'Av. Paulista',
          numero: '1000',
          complemento: 'Apto 42',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01310-100',
        },
        frete_selecionado: {
          nome: 'Entrega Padrão (Correios PAC)',
          valor: 14.90,
          prazo_estimado_texto: '4 a 6 dias úteis',
        },
        itens: [
          {
            id: 'item-1',
            sku: 'MS5153-H7',
            nome: '200 Adesivos Pet Piercings Eva Glitter Petshop Cães E Gatos',
            quantidade: 2,
            preco_unitario: 18.90,
            imagem: 'https://http2.mlstatic.com/D_NQ_NP_2X_736630-MLB72661556093_112023-F.webp'
          },
          {
            id: 'item-2',
            sku: 'LAC-HAL-G',
            nome: '20 Lacinhos G HALLOWEEN aplique PetShop Cães E Gatos',
            quantidade: 1,
            preco_unitario: 22.00,
            imagem: ''
          }
        ],
        subtotal: 59.80,
        valor_frete: 14.90,
        total: 74.70,
        status: 'PAGAMENTO_APROVADO',
        bling_status: 'OK',
        bling_id: '18928371',
        criado_em: new Date().toISOString(),
      },
      {
        id: 'ped-10293',
        numero_pedido: '10293',
        cliente: {
          nome_completo: 'João Silva',
          cpf_cnpj: '987.654.321-11',
          email: 'joao@exemplo.com',
          telefone: '(11) 97777-6666',
        },
        endereco_entrega: {
          logradouro: 'Rua das Flores',
          numero: '500',
          bairro: 'Jardins',
          cidade: 'Campinas',
          uf: 'SP',
          cep: '13000-000',
        },
        frete_selecionado: {
          nome: 'Retirar na Loja Física',
          valor: 0,
          prazo_estimado_texto: 'Pronto para retirada',
        },
        itens: [
          {
            id: 'item-3',
            sku: 'GRAV-HALLOWEEN-P',
            nome: '30 Gravata G pet halloween estampada cetim cão gato',
            quantidade: 1,
            preco_unitario: 49.90,
            imagem: ''
          }
        ],
        subtotal: 49.90,
        valor_frete: 0,
        total: 49.90,
        status: 'AGUARDANDO_PAGAMENTO',
        bling_status: 'PENDENTE',
        criado_em: new Date(Date.now() - 86400000).toISOString(),
      }
    ];

    await supabase.from('configuracoes').upsert({ chave: 'pedidos_db', valor: pedidos });
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary flex items-center gap-3">
            <ShoppingCart size={32} className="text-primary" />
            Gestão de Pedidos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Clique em qualquer pedido para ver o demonstrativo completo de compra, SKUs e status do Bling.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center text-xs text-gray-500 font-bold">
          <span>TOTAL DE PEDIDOS: {pedidos.length}</span>
          <span className="text-gray-400 font-normal">💡 O Bling recebe pedidos automaticamente após confirmação do pagamento.</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider font-bold border-b border-gray-200">
              <tr>
                <th className="p-4">Nº Pedido</th>
                <th className="p-4">Loja / Origem</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Data</th>
                <th className="p-4">Itens / SKUs</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status do Pedido</th>
                <th className="p-4">Recebido pelo Bling</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {pedidos.map((ped) => {
                const isPago = ped.status === 'PAGAMENTO_APROVADO' || ped.status === 'ENVIADO' || ped.status === 'ENTREGUE';
                const isBlingOk = ped.bling_status === 'OK';
                const isMimo = ped.origem_loja === 'Mimo Show' || (ped.dados_pagamento?.notification_url && ped.dados_pagamento.notification_url.includes('mimo'));

                return (
                  <tr key={ped.id} className="hover:bg-blue-50/40 transition">
                    <td className="p-4 font-black text-secondary">
                      #{ped.numero_pedido}
                    </td>
                    <td className="p-4">
                      {isMimo ? (
                        <span className="bg-purple-100 text-purple-800 border border-purple-200 font-black px-2.5 py-1 rounded-lg text-xs inline-flex items-center gap-1 shadow-2xs">
                          🏬 Mimo Show
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-900 border border-amber-200 font-black px-2.5 py-1 rounded-lg text-xs inline-flex items-center gap-1 shadow-2xs">
                          🐕 Banho & Tosa
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-gray-800">
                      {ped.cliente?.nome_completo || 'Cliente'}
                      <span className="block text-xs font-normal text-gray-400">{ped.cliente?.telefone}</span>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {new Date(ped.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-xs">
                      <span className="font-bold text-secondary block">{ped.itens?.length || 1} item(ns)</span>
                      <span className="text-gray-400 font-mono">
                        SKUs: {ped.itens?.map((i: any) => i.sku || 'N/A').join(', ')}
                      </span>
                    </td>
                    <td className="p-4 font-black text-primary text-base">
                      R$ {Number(ped.total).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="p-4">
                      {isPago ? (
                        <span className="bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1">
                          <CheckCircle2 size={12} /> Pago / Aprovado
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1">
                          <Clock size={12} /> Aguardando
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {isBlingOk ? (<span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1">? OK ({ped.bling_id ? `#${ped.bling_id}` : 'Recebido'})</span>) : isPago ? (<span className="bg-red-100 text-red-800 font-bold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1" title={ped.bling_erro || 'Erro ao enviar para o Bling'}>?? Erro Bling</span>) : (<span className="bg-gray-100 text-gray-500 font-medium px-3 py-1 rounded-full text-xs inline-flex items-center gap-1">? Aguardando Pag.</span>)}
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        href={`/admin/pedidos/${ped.id}`}
                        className="inline-flex items-center gap-1 bg-secondary text-white hover:bg-blue-900 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs"
                      >
                        <Eye size={14} />
                        <span>Ver Detalhes</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

