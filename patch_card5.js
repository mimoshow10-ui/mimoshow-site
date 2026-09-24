const fs = require('fs');
let code = fs.readFileSync('src/components/ProductCard.tsx', 'utf-8');

code = code.replace(
  '{/* Badge de Validade Promocional Leve */}',
  `<div className="text-xs md:text-sm font-semibold text-emerald-500 mt-0.5 tracking-tight">
            em {parcelas}x R$ {valorParcela.toFixed(2).replace('.', ',')} sem juros
          </div>

          {/* Badge de Validade Promocional Leve */}`
);

fs.writeFileSync('src/components/ProductCard.tsx', code);
