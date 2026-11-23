'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Cookie } from 'lucide-react';
import { pushToDataLayer } from '@/lib/analytics/dataLayer';

export default function CookieConsentBanner() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('mimoshow_cookie_consent');
      if (!consent) {
        // Exibir após 800ms para não bloquear a renderização inicial
        const timer = setTimeout(() => setVisivel(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  function handleConsent(aceitou: boolean) {
    try {
      const status = aceitou ? 'granted' : 'denied';
      localStorage.setItem('mimoshow_cookie_consent', status);

      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          ad_storage: status,
          analytics_storage: status,
          ad_user_data: status,
          ad_personalization: status,
        });
      }

      pushToDataLayer({
        event: 'consent_update',
        consent_status: status,
      });

      setVisivel(false);
    } catch {
      setVisivel(false);
    }
  }

  if (!visivel) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-50 bg-[#0B2545] text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-blue-800/80 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-400 text-blue-950 rounded-xl flex-shrink-0 mt-0.5">
          <Cookie size={20} />
        </div>
        <div className="flex-1 text-xs">
          <h4 className="font-bold text-sm text-amber-400 mb-1 flex items-center gap-1.5">
            <span>Privacidade & Cookies (LGPD)</span>
          </h4>
          <p className="text-blue-100 leading-relaxed mb-3">
            Utilizamos cookies para personalizar sua experiência, analisar a navegação e melhorar nossos serviços, respeitando sua privacidade e a LGPD.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleConsent(true)}
              className="flex-1 bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold py-2 px-3 rounded-xl transition text-center shadow-xs cursor-pointer"
            >
              Aceitar Todos
            </button>
            <button
              type="button"
              onClick={() => handleConsent(false)}
              className="px-3 py-2 text-blue-200 hover:text-white hover:bg-blue-900/60 rounded-xl transition text-center font-medium cursor-pointer"
            >
              Apenas Essenciais
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
