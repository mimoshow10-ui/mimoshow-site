const fs = require('fs');
let code = fs.readFileSync('src/components/ProductCard.tsx', 'utf-8');

code = code.replace(
  /(<span className="text-xl md:text-2xl font-heading font-black text-primary block">\s*R\$ \{precoNormal\.toFixed\(2\)\.replace\('\.', ','\)\}\s*<\/span>\s*)}/g,
  `$1}
          <div className="text-xs md:text-sm font-semibold text-emerald-500 mt-0.5 tracking-tight">
            em {parcelas}x R$ {valorParcela.toFixed(2).replace('.', ',')} sem juros
          </div>`
);

fs.writeFileSync('src/components/ProductCard.tsx', code);
