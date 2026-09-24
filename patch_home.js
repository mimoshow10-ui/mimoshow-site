const fs = require('fs');
let code = fs.readFileSync('src/app/(store)/page.tsx', 'utf-8');
code = code.replace(
  'const produtosPromocao = (superPromocoes || []).filter((prod) => {',
  `const produtosPromocao = (superPromocoes || []).filter((prod) => {
      if (!hasValidPhoto(prod)) return false;`
);
fs.writeFileSync('src/app/(store)/page.tsx', code);
