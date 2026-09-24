import { supabase } from '@/lib/supabase';
import { Users, Building, User, MapPin } from 'lucide-react';
import { Cliente } from '@/lib/types/checkout';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminClientesPage() {
  const { data: config } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'pedidos_db')
    .maybeSingle();

  const pedidos = config?.valor || [];
  
  const clientesMap = new Map<string, any>();
  
  pedidos.forEach((p: any) => {
    if (p.cliente) {
      const doc = p.cliente.cpf_cnpj?.replace(/\D/g, '') || p.cliente.email;
      if (doc && !clientesMap.has(doc)) {
        clientesMap.set(doc, {
          id: doc,
          nome_completo: p.cliente.nome_completo,
          email: p.cliente.email,
          telefone: p.cliente.telefone,
          cpf_cnpj: p.cliente.cpf_cnpj,
          tipo: (p.cliente.cpf_cnpj || '').replace(/\D/g, '').length > 11 ? 'PJ' : 'PF',
          criado_em: p.criado_em || new Date().toISOString(),
          enderecos: p.endereco_entrega ? [p.endereco_entrega] : []
        });
      }
    }
  });

  const clientes = Array.from(clientesMap.values()).sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

  const mascararDocumento = (doc: string) => {
    if (!doc) return '---';
    const limpo = doc.replace(/\D/g, '');
    if (limpo.length === 11) {
      return `${limpo.slice(0, 3)}.***.***-${limpo.slice(9)}`;
    }
    if (limpo.length === 14) {
      return `${limpo.slice(0, 2)}.***.***/${limpo.slice(8, 12)}-**`;
    }
    return doc;
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary flex items-center gap-3">
            <Users size={32} className="text-primary" />
            Clientes Cadastrados
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualização protegida de clientes (Pessoa Física e Pessoa Jurídica).
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border bg-gray-50 flex justify-between items-center text-xs text-gray-500 font-bold">
          <span>TOTAL DE CLIENTES: {clientes.length}</span>
        </div>

        {clientes.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {clientes.map((c) => (
              <div key={c.id} className="p-5 hover:bg-gray-50/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${c.tipo === 'PJ' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                    {c.tipo === 'PJ' ? <Building size={20} /> : <User size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary text-base flex items-center gap-2">
                      {c.nome_completo}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.tipo === 'PJ' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {c.tipo === 'PJ' ? 'PESSOA JURÍDICA' : 'PESSOA FÍSICA'}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      📄 {mascararDocumento(c.cpf_cnpj)} | ✉️ {c.email} | 📞 {c.telefone || 'Sem fone'}
                    </p>
                    {c.nome_fantasia && (
                      <p className="text-xs text-gray-400 mt-0.5">Fantasia: {c.nome_fantasia}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-xl">
                    <MapPin size={14} className="text-primary" />
                    <span><strong>{c.enderecos?.length || 0}</strong> endereço(s)</span>
                  </div>
                  <span className="text-gray-400 text-[11px]">
                    Cadastrado em {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400">
            <Users size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-bold text-base">Nenhum cliente cadastrado ainda.</p>
            <p className="text-xs mt-1">Os clientes que realizarem pedidos no checkout aparecerão listados aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}
