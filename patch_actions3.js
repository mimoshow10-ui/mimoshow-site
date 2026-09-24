const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pedidos/actions.ts', 'utf-8');

code = code.replace(
  '// Payload de Vendas Bling API V3',
  `const { data: prods } = await supabase.from('produtos').select('sku, bling_id');
    const prodsMap = new Map((prods || []).map(p => [p.sku, p.bling_id]));
    
    // Payload de Vendas Bling API V3`
);

code = code.replace(
  "codigo: item.sku || '',",
  "codigo: item.sku || '',\n        ...(prodsMap.get(item.sku) ? { produto: { id: parseInt(prodsMap.get(item.sku)) } } : {}),"
);

fs.writeFileSync('src/app/admin/pedidos/actions.ts', code);
