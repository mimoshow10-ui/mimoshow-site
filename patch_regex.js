const fs = require('fs');
const path = require('path');
const p = path.join('src', 'app', '(store)', 'produto', '[slug]', 'page.tsx');
let code = fs.readFileSync(p, 'utf-8');

const regex = /<span className="text-4xl font-black text-primary">R\$ \{preco.toFixed\(2\).replace\('\.', ','\)\}<\/span>\s*\)}/g;

code = code.replace(regex, `<span className="text-4xl font-black text-primary block">R$ {preco.toFixed(2).replace('.', ',')}</span>
            )}
            <div className="text-sm md:text-base font-semibold text-emerald-500 mt-1">
              em {parcelas}x R$ {valorParcela.toFixed(2).replace('.', ',')} sem juros
            </div>`);

fs.writeFileSync(p, code);
console.log('Match?', code.includes('text-emerald-500'));
