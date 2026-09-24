import Link from 'next/link';
import { Heart, ShieldCheck, Truck } from 'lucide-react';

export default function QuemSomosSection() {
  return (
    <section className="w-full py-16 px-6 bg-gradient-to-br from-purple-50 via-white to-pink-50 border-t border-purple-100">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
        {/* Espaço para o Vídeo */}
        <div className="w-full md:w-1/2">
          <div className="relative w-full aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center bg-[url('https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1000')] bg-cover bg-center bg-blend-overlay bg-black/60">
              <Heart size={48} className="text-pink-500 mb-4 animate-pulse" />
              <h3 className="text-2xl font-black mb-2">Conheça a Mimo Show</h3>
              <p className="text-sm text-gray-200">
                (Substitua este quadro pelo seu vídeo oficial do YouTube futuramente)
              </p>
            </div>
          </div>
        </div>

        {/* Textos */}
        <div className="w-full md:w-1/2 space-y-6 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-heading font-black text-slate-800">
            Muito mais que uma loja,<br/> <span className="text-purple-600">um ato de amor!</span>
          </h2>
          <p className="text-slate-600 leading-relaxed text-lg">
            A <strong>Mimo Show</strong> nasceu do desejo de entregar os melhores produtos com a qualidade e o carinho que a sua família merece. Trabalhamos incansavelmente para trazer novidades e garantir que cada pedido chegue recheado de afeto.
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                <ShieldCheck size={20} />
              </div>
              <span className="font-bold text-slate-700 text-sm">Compra 100% Segura</span>
            </div>
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <Truck size={20} />
              </div>
              <span className="font-bold text-slate-700 text-sm">Envio Rápido para todo Brasil</span>
            </div>
          </div>

          <div className="pt-6">
            <Link 
              href="/quem-somos" 
              className="inline-block bg-slate-900 hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg hover:shadow-purple-500/30"
            >
              Ler nossa história completa
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
