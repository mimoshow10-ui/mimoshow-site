'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { AnalyticsConfig } from '@/lib/analytics/types';

interface Props {
  config?: AnalyticsConfig;
}

export default function AnalyticsScripts({ config }: Props) {
  const gtmId = config?.gtm_id?.trim() || '';
  const ga4Id = config?.ga4_measurement_id?.trim() || '';
  const clarityId = config?.clarity_project_id?.trim() || '';
  const ativo = config?.ativo !== false;
  const isDebug = Boolean(config?.debug_mode);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__MIMOSHOW_ANALYTICS_DEBUG__ = isDebug;
    }
  }, [isDebug]);

  if (!ativo) {
    return null;
  }

  return (
    <>
      {/* 1. Inicialização do Data Layer e Google Consent Mode v2 (LGPD) */}
      <Script
        id="mimoshow-consent-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            
            // Checar se já houve consentimento prévio armazenado
            var savedConsent = 'denied';
            try {
              if (localStorage.getItem('mimoshow_cookie_consent') === 'granted') {
                savedConsent = 'granted';
              }
            } catch(e) {}

            gtag('consent', 'default', {
              'ad_storage': savedConsent,
              'analytics_storage': savedConsent,
              'ad_user_data': savedConsent,
              'ad_personalization': savedConsent,
              'wait_for_update': 500
            });
            gtag('set', 'ads_data_redaction', true);
            gtag('set', 'url_passthrough', true);
          `,
        }}
      />

      {/* 2. Google Tag Manager (GTM) Container */}
      {gtmId && (
        <>
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}

      {/* 3. Google Analytics 4 (GA4) - Carregamento Direto */}
      {ga4Id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga4Id}', {
                  send_page_view: false, // Gerenciado pelo CustomerJourneyTracker do Next.js
                  anonymize_ip: true,
                  cookie_flags: 'SameSite=None;Secure'
                });
              `,
            }}
          />
        </>
      )}

      {/* 4. Microsoft Clarity (Heatmaps & Session Recording com Blindagem de PII) */}
      {clarityId && (
        <Script
          id="microsoft-clarity-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${clarityId}");
            `,
          }}
        />
      )}
    </>
  );
}
