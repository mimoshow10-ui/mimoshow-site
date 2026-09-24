const fs = require('fs');
let code = fs.readFileSync('src/components/DesktopSideBanners.tsx', 'utf-8');
code = code.replace(
  'const [rightOpen, setRightOpen] = useState(true);',
  `const [rightOpen, setRightOpen] = useState(true);

  // Fecha os banners automaticamente após 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setLeftOpen(false);
      setRightOpen(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);`
);
fs.writeFileSync('src/components/DesktopSideBanners.tsx', code);
