const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pedidos/actions.ts', 'utf-8');
code = code.replace(
  'tipoPessoa: isJ',
  "tipo: isJ,\n            situacao: 'A'"
);
fs.writeFileSync('src/app/admin/pedidos/actions.ts', code);
