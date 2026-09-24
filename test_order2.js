const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

async function run() {
  const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;
  
  const payloadBling = {
    numeroLoja: '10298',
    data: '2026-09-24',
    dataSaida: '2026-09-24',
    contato: { id: 18411594182, nome: 'mimo show', numeroDocumento: '29930166874' },
    itens: [
      {
        codigo: '1042',
        descricao: 'Adesivo Arabesco Imperial 6 Unidades',
        quantidade: 1,
        valor: 6.5
      }
    ],
    desconto: { valor: 0.2 },
    transporte: { fretePorConta: 0, frete: 0 }
  };

  const resBling = await fetch('https://api.bling.com.br/Api/v3/pedidos/vendas', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payloadBling)
  });
  console.dir(await resBling.json(), { depth: null });
}
run();
