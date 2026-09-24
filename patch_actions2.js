const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pedidos/actions.ts', 'utf-8');

code = code.replace(
  "itens: (pedido.itens || []).map((item: any) => ({",
  "itens: (pedido.itens || []).map((item: any) => ({\n          ...(item.bling_id ? { produto: { id: parseInt(item.bling_id) } } : {}),"
);

code = code.replace(
  "transporte: {",
  "parcelas: [{ dataVencimento: new Date(pedido.criado_em || Date.now()).toISOString().split('T')[0], valor: pedido.total || pedido.subtotal || 0 }],\n      transporte: {"
);

fs.writeFileSync('src/app/admin/pedidos/actions.ts', code);
