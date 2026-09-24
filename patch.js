const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pedidos/actions.ts', 'utf-8');
code = code.replace(
  'const errMsg = resData?.error?.message || resData?.description || JSON.stringify(resData);',
  'let errMsg = resData?.error?.message || resData?.description || JSON.stringify(resData);\n      if (resData?.error?.fields) {\n          const fieldErrs = resData.error.fields.map((f) => f.msg).join(\'; \');\n          errMsg += ` (Detalhes: ${fieldErrs})`;\n      }'
);
fs.writeFileSync('src/app/admin/pedidos/actions.ts', code);
