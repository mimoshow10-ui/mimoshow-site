const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pedidos/actions.ts', 'utf-8');

code = code.replace(
  "data: new Date(pedido.criado_em || Date.now()).toISOString().split('T')[0],",
  "data: new Date(pedido.criado_em || Date.now()).toISOString().split('T')[0],\n      dataSaida: new Date(pedido.criado_em || Date.now()).toISOString().split('T')[0],"
);

fs.writeFileSync('src/app/admin/pedidos/actions.ts', code);
