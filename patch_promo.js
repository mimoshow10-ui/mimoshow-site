const fs = require('fs');
let code = fs.readFileSync('src/components/DesktopSideBanners.tsx', 'utf-8');

code = code.replace(
  `  // Coleção de fotos para o grid do celular (Instagram)
  const promoImages = (produtosPromocao || [])
    .flatMap(p => p.imagens || [])
    .filter(img => img && typeof img === 'string' && img.length > 5);`,
  `  // Coleção de fotos para o grid do celular (Instagram)
  const promoImages = (produtosPromocao || [])
    .flatMap(p => {
      if (Array.isArray(p.imagens)) return p.imagens;
      if (typeof p.imagens === 'string') {
        try {
          const parsed = JSON.parse(p.imagens);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          if (p.imagens.startsWith('http') || p.imagens.startsWith('/')) return [p.imagens];
        }
      }
      return [];
    })
    .filter(img => img && typeof img === 'string' && img.length > 5);`
);

code = code.replace(
  "'/logo-mimoshow.jpg'",
  "'/banner-kids.jpg'"
);

fs.writeFileSync('src/components/DesktopSideBanners.tsx', code);
