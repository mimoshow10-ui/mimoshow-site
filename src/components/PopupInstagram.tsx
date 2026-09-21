import { useState, useEffect } from 'react';
import { X, Instagram } from 'lucide-react';

export default function PopupInstagram() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Mostra o popup depois de 3 segundos
    const timer = setTimeout(() => setIsOpen(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-[320px] md:max-w-[400px] max-h-[85vh] overflow-hidden shadow-2xl relative border-[6px] border-gray-900 flex flex-col">
        {/* Botão de Fechar */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 bg-white/50 backdrop-blur-md text-gray-800 rounded-full p-2 z-20 hover:bg-white transition"
        >
          <X size={20} />
        </button>

        {/* Cabeçalho Instagram */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-orange-50 to-pink-50">
          <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 rounded-full p-[2px]">
            <div className="bg-white w-full h-full rounded-full flex items-center justify-center p-1">
              <img src="/logo-mimoshow.jpg" alt="Logo" className="rounded-full object-cover w-full h-full" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base truncate">mimoshoweva</h3>
            <p className="text-xs text-gray-500">Instagram Oficial</p>
          </div>
          <a href="https://instagram.com/mimoshoweva" target="_blank" rel="noreferrer" className="bg-gradient-to-r from-purple-500 to-orange-500 text-white font-bold px-3 py-1.5 rounded-full text-xs hover:opacity-90 transition shadow-md whitespace-nowrap">
            Seguir
          </a>
        </div>

        {/* Conteúdo do Feed */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          <div className="flex items-center gap-2 mb-4">
            <Instagram className="text-pink-500" size={20} />
            <span className="font-black text-gray-800 text-sm tracking-wide">NOSSAS POSTAGENS</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Reel 1 */}
            <div className="aspect-[9/16] bg-gray-900 rounded-xl overflow-hidden shadow-inner relative group cursor-pointer">
               <img src="/reel1.png" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" alt="Reel 1" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="bg-black/50 rounded-full p-2">
                   <svg fill="white" viewBox="0 0 24 24" className="w-8 h-8"><path d="M8 5v14l11-7z"/></svg>
                 </div>
               </div>
               <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-bold drop-shadow-md">
                 <svg fill="white" viewBox="0 0 24 24" className="w-3 h-3"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                 1.2k
               </div>
            </div>
            {/* Reel 2 */}
            <div className="aspect-[9/16] bg-gray-900 rounded-xl overflow-hidden shadow-inner relative group cursor-pointer">
               <img src="/reel2.png" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" alt="Reel 2" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="bg-black/50 rounded-full p-2">
                   <svg fill="white" viewBox="0 0 24 24" className="w-8 h-8"><path d="M8 5v14l11-7z"/></svg>
                 </div>
               </div>
               <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-bold drop-shadow-md">
                 <svg fill="white" viewBox="0 0 24 24" className="w-3 h-3"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                 850
               </div>
            </div>
            {/* Reel 3 */}
            <div className="aspect-[9/16] bg-gray-900 rounded-xl overflow-hidden shadow-inner relative group cursor-pointer">
               <img src="/reel3.png" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" alt="Reel 3" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="bg-black/50 rounded-full p-2">
                   <svg fill="white" viewBox="0 0 24 24" className="w-8 h-8"><path d="M8 5v14l11-7z"/></svg>
                 </div>
               </div>
               <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-bold drop-shadow-md">
                 <svg fill="white" viewBox="0 0 24 24" className="w-3 h-3"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                 3.4k
               </div>
            </div>
            {/* Reel 4 */}
            <div className="aspect-[9/16] bg-gray-900 rounded-xl overflow-hidden shadow-inner relative group cursor-pointer">
               <img src="/logo-mimoshow.jpg" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" alt="Reel 4" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="bg-black/50 rounded-full p-2">
                   <svg fill="white" viewBox="0 0 24 24" className="w-8 h-8"><path d="M8 5v14l11-7z"/></svg>
                 </div>
               </div>
               <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-bold drop-shadow-md">
                 <svg fill="white" viewBox="0 0 24 24" className="w-3 h-3"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                 590
               </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="font-bold text-gray-600 mb-4">Veja os novos lançamentos & bastidores no Instagram! 📸✨</p>
            <a href="https://instagram.com/mimoshoweva" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-500 to-orange-500 text-white font-black py-4 rounded-2xl hover:scale-105 transition shadow-lg">
              <Instagram size={20} />
              SIGA @MIMOSHOWEVA
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
