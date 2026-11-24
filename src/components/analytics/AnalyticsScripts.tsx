'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { AnalyticsConfig } from '@/lib/analytics/types';

interface Props {
  config?: AnalyticsConfig;
}

export default function AnalyticsScripts({ config }: Props) {
  const gtmId = (config?.gtm_id?.match(/GTM-[A-Z0-9]+/i)?.[0] || config?.gtm_id || '').trim();
  const ga4Id = (config?.ga4_measurement_id?.match(/G-[A-Z0-9]+/i)?.[0] || config?.ga4_measurement_id || '').trim();
  const clarityId = (config?.clarity_project_id?.match(/clarity\.ms\/tag\/([a-z0-9]+)/i)?.[1] || config?.clarity_project_id || '').trim();
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

            // Bloquear carregamento e execução do JivoChat injetado via GTM
            window.jivo_destroy = function(){};
            window.jivo_init = function(){};
            (function() {
              if (typeof document === 'undefined') return;
              var origCreate = document.createElement;
              document.createElement = function(tag, opt) {
                var el = origCreate.call(document, tag, opt);
                if (typeof tag === 'string' && tag.toLowerCase() === 'script') {
                  var origSetAttr = el.setAttribute;
                  el.setAttribute = function(k, v) {
                    if (k === 'src' && typeof v === 'string' && v.indexOf('jivosite') !== -1) {
                      return;
                    }
                    return origSetAttr.apply(this, arguments);
                  };
                  try {
                    Object.defineProperty(el, 'src', {
                      set: function(v) {
                        if (typeof v === 'string' && v.indexOf('jivosite') !== -1) {
                          return;
                        }
                        origSetAttr.call(el, 'src', v);
                      },
                      get: function() {
                        return el.getAttribute('src') || '';
                      },
                      configurable: true
                    });
                  } catch(e) {}
                }
                return el;
              };
            })();

            if (typeof MutationObserver !== 'undefined') {
              var jivoObserver = new MutationObserver(function(mutations) {
                for (var i = 0; i < mutations.length; i++) {
                  var nodes = mutations[i].addedNodes;
                  for (var j = 0; j < nodes.length; j++) {
                    var node = nodes[j];
                    if (node && node.nodeType === 1) {
                      var id = node.id || '';
                      var tag = node.tagName || '';
                      var src = node.src || '';
                      if (
                        id === 'jivo-iframe-container' ||
                        id.indexOf('jivo') === 0 ||
                        tag === 'JDIV' ||
                        src.indexOf('jivosite') !== -1
                      ) {
                        node.remove();
                      }
                    }
                  }
                }
              });
              jivoObserver.observe(document.documentElement, { childList: true, subtree: true });
            }
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
