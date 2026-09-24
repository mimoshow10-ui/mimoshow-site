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

code = code.replace(
  `                <span className="text-4xl font-black text-primary">R$ {precoPromo.toFixed(2).replace('.', ',')}</span>
              </div>
            ) : (
              <span className="text-4xl font-black text-primary">R$ {preco.toFixed(2).replace('.', ',')}</span>`,
  `                <span className="text-4xl font-black text-primary">R$ {precoPromo.toFixed(2).replace('.', ',')}</span>
              </div>
            ) : (
              <span className="text-4xl font-black text-primary">R$ {preco.toFixed(2).replace('.', ',')}</span>
            )}
            <div className="text-sm font-semibold text-emerald-500 tracking-tight mt-1">
              em {parcelas}x R$ {valorParcela.toFixed(2).replace('.', ',')} sem juros
            </div>
            {false ? (`
);

// We need to be careful with the replace.
// Let's just do a string replacement that is safe.
