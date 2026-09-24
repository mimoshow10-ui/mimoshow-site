import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-secondary text-white pt-12 pb-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sobre com Logomarca MimoShow Transparente Oficial */}
          <div className="space-y-3">
            <h3 className="text-xl font-heading font-bold text-accent">Grupo MimoShow</h3>
            <Link href="/">
              <div className="relative w-56 h-20 cursor-pointer py-1">
                <Image
                  src="/logo-mimoshow.png"
                  alt="Logomarca Grupo MimoShow"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>
            <p className="text-sm text-gray-300 leading-relaxed">
              O maior fabricante de acessórios para banho e tosa do Brasil. Seu pet merece estilo e conforto todos os dias.
            </p>
          </div>

          {/* Col 2 - Categorias */}
          <div>
            <h4 className="font-bold mb-3 text-white">Categorias & Linhas</h4>
            
            <div className="space-y-3 text-xs md:text-sm text-gray-300">
              {/* Pet */}
              <div>
                <p className="text-[11px] font-black uppercase text-pink-400 tracking-wider mb-1">🐾 Linha Pet</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <Link href="/categoria/adesivos" className="hover:text-white transition">Adesivos</Link>
                  <Link href="/categoria/gravatinhas" className="hover:text-white transition">Gravatinhas</Link>
                  <Link href="/categoria/lacinhos" className="hover:text-white transition">Lacinhos</Link>
                  <Link href="/categoria/bandanas" className="hover:text-white transition">Bandanas</Link>
                  <Link href="/categoria/gargantilhas" className="hover:text-white transition">Gargantilhas</Link>
                  <Link href="/categoria/colarinhos" className="hover:text-white transition">Colarinhos</Link>
                </div>
              </div>

              {/* Infantil */}
              <div className="border-t border-blue-900/60 pt-2">
                <p className="text-[11px] font-black uppercase text-pink-400 tracking-wider mb-1">🎈 Linha Infantil</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <Link href="/categoria/mascaras" className="hover:text-white transition">Máscaras</Link>
                  <Link href="/categoria/tiaras" className="hover:text-white transition">Tiaras</Link>
                  <Link href="/categoria/jogos" className="hover:text-white transition">Jogos</Link>
                  <Link href="/categoria/quebra-cabeca" className="hover:text-white transition">Quebra-Cabeça</Link>
                  <Link href="/categoria/didatico" className="hover:text-white transition">Didático</Link>
                </div>
              </div>

              {/* Decoração */}
              <div className="border-t border-blue-900/60 pt-2">
                <p className="text-[11px] font-black uppercase text-sky-400 tracking-wider mb-1">✨ Linha Decoração</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <Link href="/categoria/quadros-mdf" className="hover:text-white transition">Quadros MDF</Link>
                  <Link href="/categoria/quadros-impressos" className="hover:text-white transition">Impressos</Link>
                  <Link href="/categoria/decor-ambientes" className="hover:text-white transition">Ambientes</Link>
                  <Link href="/categoria/faixas-decorativas" className="hover:text-white transition">Faixas</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-bold mb-4">Atendimento</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>📞 (11) 93081-3280</li>
              <li>📱 WhatsApp: (11) 93081-3280</li>
              <li>✉️ sac@mimoshow.com.br</li>
              <li><Link href="/rastreamento" className="hover:text-white transition mt-2 inline-block">Rastrear Pedido</Link></li>
            </ul>
            <h4 className="font-bold mb-2 mt-6">Horário de Atendimento</h4>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>Seg a Sex de 08h às 18h</li>
              <li>Sábado de 08h às 14h</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="font-bold mb-4">Redes Sociais</h4>
            <div className="flex space-x-4">
              <a href="https://instagram.com/mimoshoweva" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center hover:bg-accent transition text-white hover:text-primary" title="Instagram @mimoshoweva">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://facebook.com/mimoshoweva" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center hover:bg-accent transition text-white hover:text-primary" title="Facebook MimoShow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="https://tiktok.com/@mimoshow" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center hover:bg-accent transition text-white hover:text-primary" title="TikTok @mimoshow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.66a6.34 6.34 0 0 0 10.86 4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.53z" />
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* BARRA FINAL: SELOS OFICIAIS MERCADO PAGO, MERCADO LIVRE E SSL */}
        <div className="mt-10 pt-6 border-t border-blue-800 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-300">
          
          {/* Dados da Empresa & Direitos Autorais */}
          <div className="text-center md:text-left space-y-1">
            <p className="font-bold text-white flex items-center justify-center md:justify-start gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse"></span>
              <span>MIMOSHOW GRUPO - O Maior Fabricante de Acessórios de Pet do Brasil</span>
            </p>
            <p className="text-gray-400 text-[11px]">
              Empresa Verificada & Apoio SEBRAE | Integrado com Bling | Pagamento seguro via Mercado Pago & Mercado Livre
            </p>
            <p className="text-gray-400 text-[11px]">
              &copy; {new Date().getFullYear()} MimoShow Pet. Todos os direitos reservados.
            </p>
          </div>

          {/* Badges de Destaque: Mercado Pago, Mercado Livre e SSL */}
          <div className="flex items-center gap-3 flex-wrap justify-center flex-shrink-0">
            
            {/* Selo 1: Mercado Pago Oficial */}
            <div className="bg-[#009EE3] text-white rounded-xl px-3.5 py-1.5 flex items-center gap-2.5 shadow-md border border-[#00B1EA]/60 hover:brightness-110 transition cursor-default">
              <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Image
                  src="/logo-mercadopago-handshake.png"
                  alt="Mercado Pago Handshake"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-black uppercase tracking-wider leading-none text-white/90">PAGAMENTO SEGURO</span>
                <span className="block text-[11px] font-black text-white leading-tight">
                  Mercado Pago <span className="text-[9px] font-semibold bg-white/20 px-1 py-0.5 rounded ml-0.5">PIX & CARTÃO</span>
                </span>
              </div>
            </div>

            {/* Selo 2: Mercado Livre Oficial */}
            <div className="bg-[#FFF159] text-[#2D3277] rounded-xl px-3.5 py-1.5 flex items-center gap-2.5 shadow-md border border-amber-300 hover:brightness-105 transition cursor-default">
              <div className="w-7 h-7 rounded-lg bg-[#2D3277]/10 flex items-center justify-center flex-shrink-0 text-[#2D3277]">
                <svg className="w-4 h-4 fill-[#2D3277]" viewBox="0 0 24 24">
                  <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                </svg>
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-black uppercase tracking-wider leading-none text-[#2D3277]/80">COMPRA GARANTIDA</span>
                <span className="block text-[11px] font-black text-[#2D3277] leading-tight">
                  Mercado Livre <span className="text-[9px] font-semibold bg-[#2D3277]/10 px-1 py-0.5 rounded ml-0.5">PARCEIRO</span>
                </span>
              </div>
            </div>

            {/* Selo 3: Certificado SSL 256-Bit */}
            <div className="bg-emerald-950/90 border border-emerald-500/50 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                <svg className="w-4 h-4 fill-emerald-400" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-black text-emerald-300 uppercase tracking-tight leading-none">SITE PROTEGIDO</span>
                <span className="block text-[9px] font-bold text-emerald-400/90 leading-tight">Certificado SSL 256-Bit</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </footer>
  );
}
