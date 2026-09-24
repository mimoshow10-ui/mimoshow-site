const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dehtqlcevoheqajejjcv.supabase.co', 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx');

async function run() {
  const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;
  
  const resProd = await fetch('https://api.bling.com.br/Api/v3/produtos?codigo=1042', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.dir(await resProd.json(), { depth: null });
}
run();
