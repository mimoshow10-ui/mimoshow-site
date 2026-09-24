const fs = require('fs');
let code = fs.readFileSync('src/components/ProductCard.tsx', 'utf-8');

code = code.replace(
  'const pctDesconto = temPromo && precoNormal > 0',
  `const precoAtual = temPromo && precoPromo !== null ? precoPromo : precoNormal;
  const parcelas = 3;
  const valorParcela = precoAtual / parcelas;
  const pctDesconto = temPromo && precoNormal > 0`
);

code = code.replace(
  '            ) : (',
  `              <div className="text-xs md:text-sm font-semibold text-emerald-500 mt-0.5 tracking-tight">em {parcelas}x R$ {valorParcela.toFixed(2).replace('.', ',')} sem juros</div>
            ) : (`
);

code = code.replace(
  `              <span className="text-xl md:text-2xl font-heading font-black text-primary block">
              R$ {precoNormal.toFixed(2).replace('.', ',')}
              </span>`,
  `              <div>
                <span className="text-xl md:text-2xl font-heading font-black text-primary block">
                  R$ {precoNormal.toFixed(2).replace('.', ',')}
                </span>
                <div className="text-xs md:text-sm font-semibold text-emerald-500 mt-0.5 tracking-tight">em {parcelas}x R$ {valorParcela.toFixed(2).replace('.', ',')} sem juros</div>
              </div>`
);

fs.writeFileSync('src/components/ProductCard.tsx', code);
