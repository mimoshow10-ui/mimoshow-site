const fs = require('fs');
let code = fs.readFileSync('src/app/(store)/page.tsx', 'utf-8');

code = code.replace(
  'import DesktopSideBanners from "@/components/DesktopSideBanners";',
  'import DesktopSideBanners from "@/components/DesktopSideBanners";\nimport QuemSomosSection from "@/components/QuemSomosSection";'
);

code = code.replace(
  '{/* BANNER DE NOTICIAS OU RODAPE FUTURO */}',
  '{/* SESSÃO QUEM SOMOS E VÍDEO */}\n        <QuemSomosSection />\n\n        {/* BANNER DE NOTICIAS OU RODAPE FUTURO */}'
);

fs.writeFileSync('src/app/(store)/page.tsx', code);
