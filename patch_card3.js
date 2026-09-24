const fs = require('fs');
let code = fs.readFileSync('src/components/ProductCard.tsx', 'utf-8');

const targetJSX = `          {temPromo && precoPromo !== null ? (
            <div>
              <span className="text-xs text-gray-400 line-through font-medium block">
                R$ {precoNormal.toFixed(2).replace('.', ',')}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl md:text-2xl font-heading font-black text-primary">
                  R$ {precoPromo.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xl md:text-2xl font-heading font-black text-primary block">
              R$ {precoNormal.toFixed(2).replace('.', ',')}
            </span>
          )}`;

const replacementJSX = `          {temPromo && precoPromo !== null ? (
            <div>
              <span className="text-xs text-gray-400 line-through font-medium block">
                R$ {precoNormal.toFixed(2).replace('.', ',')}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl md:text-2xl font-heading font-black text-primary">
                  R$ {precoPromo.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xl md:text-2xl font-heading font-black text-primary block">
              R$ {precoNormal.toFixed(2).replace('.', ',')}
            </span>
          )}
          <div className="text-xs md:text-sm font-semibold text-emerald-500 mt-0.5 tracking-tight">
            em {parcelas}x R$ {valorParcela.toFixed(2).replace('.', ',')} sem juros
          </div>`;

code = code.replace(targetJSX, replacementJSX);
fs.writeFileSync('src/components/ProductCard.tsx', code);
