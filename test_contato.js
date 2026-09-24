const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

async function run() {
  const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;
  
  const resBusca = await fetch(`https://api.bling.com.br/Api/v3/contatos?numeroDocumento=29930166874`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('BUSCA:', await resBusca.json());

  const resCria = await fetch('https://api.bling.com.br/Api/v3/contatos', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'mimo show',
        tipoPessoa: 'F',
        numeroDocumento: '29930166874',
        email: 'mimoshow10@gmail.com',
        telefone: '11940260765'
      })
  });
  const dataCria = await resCria.json();
  console.log('CRIA:', JSON.stringify(dataCria, null, 2));
}
run();
