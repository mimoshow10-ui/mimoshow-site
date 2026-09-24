const fs = require('fs');
const path = require('path');
const p = path.join('src', 'app', '(store)', 'produto', '[slug]', 'page.tsx');
let code = fs.readFileSync(p, 'utf-8');

code = code.replace(
  'const precoPromo = promoValida ? precoPromoVal : null;',
  `const precoPromo = promoValida ? precoPromoVal : null;
  const precoAtual = precoPromo ? precoPromo : preco;
  const parcelas = 3;
  const valorParcela = precoAtual / parcelas;`
);

const oldJSX = `            {precoPromo ? (
              <div className="flex items-end gap-3 mb-2">
                <span className="text-lg text-gray-400 line-through">R$ {preco.toFixed(2).replace('.', ',')}</span>
                <span className="text-4xl font-black text-primary">R$ {precoPromo.toFixed(2).replace('.', ',')}</span>
              </div>
            ) : (
              <span className="text-4xl font-black text-primary">R$ {preco.toFixed(2).replace('.', ',')}</span>
            )}`;

const newJSX = `            {precoPromo ? (
              <div className="flex items-end gap-3 mb-2">
                <span className="text-lg text-gray-400 line-through">R$ {preco.toFixed(2).replace('.', ',')}</span>
                <span className="text-4xl font-black text-primary">R$ {precoPromo.toFixed(2).replace('.', ',')}</span>
              </div>
            ) : (
              <span className="text-4xl font-black text-primary block">R$ {preco.toFixed(2).replace('.', ',')}</span>
            )}
            <div className="text-sm md:text-base font-semibold text-emerald-500 mt-1">
              em {parcelas}x R$ {valorParcela.toFixed(2).replace('.', ',')} sem juros
            </div>`;

code = code.replace(oldJSX, newJSX);

fs.writeFileSync(p, code);
