import { supabase } from '@/lib/supabase';
import { ShoppingCart } from 'lucide-react';
import PedidosTableClient from './PedidosTableClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPedidosPage() {
  // Puxar pedidos salvos no banco de dados Supabase
  const { data: config } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'pedidos_db')
    .maybeSingle();

  const pedidos: any[] = Array.isArray(config?.valor) ? config.valor : [];

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary flex items-center gap-3">
            <ShoppingCart size={32} className="text-primary" />
            Gestão de Pedidos & Bling ERP
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitore a confirmação de pagamentos, status de sincronização automática com o Bling e rastreamento.
          </p>
        </div>
      </div>

      <PedidosTableClient pedidosIniciais={pedidos} />
    </div>
  );
}
