import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';

interface AnalyticsConfig {
  metaPixelId: string;
  ga4MeasurementId: string;
  gtmContainerId: string;
  clarityProjectId: string;
  metaPixelEnabled: boolean;
  ga4Enabled: boolean;
  gtmEnabled: boolean;
  clarityEnabled: boolean;
}

const AnalyticsScripts = () => {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  const { data: config } = useQuery<AnalyticsConfig>({
    queryKey: ['/api/analytics/settings'],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  useEffect(() => {
    if (config && !scriptsLoaded) {
      console.log('🔄 Carregando scripts de analytics com configurações:', config);
      loadAnalyticsScripts(config);
      setScriptsLoaded(true);
    }
  }, [config, scriptsLoaded]);

  const loadAnalyticsScripts = (config: AnalyticsConfig) => {
    // Limpar scripts existentes primeiro
    const existingScripts = document.querySelectorAll('[data-analytics-script]');
    existingScripts.forEach(script => script.remove());

    // Google Analytics 4
    if (config.ga4Enabled && config.ga4MeasurementId) {
      // Script do Google Analytics
      const ga4Script = document.createElement('script');
      ga4Script.async = true;
      ga4Script.src = `https://www.googletagmanager.com/gtag/js?id=${config.ga4MeasurementId}`;
      ga4Script.setAttribute('data-analytics-script', 'ga4');
      document.head.appendChild(ga4Script);

      // Script de configuração
      const ga4ConfigScript = document.createElement('script');
      ga4ConfigScript.setAttribute('data-analytics-script', 'ga4-config');
      ga4ConfigScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${config.ga4MeasurementId}', {
          page_title: document.title,
          page_location: window.location.href,
          anonymize_ip: true,
          allow_google_signals: false,
          cookie_flags: 'SameSite=None;Secure'
        });

        // Criar objeto global para tracking
        window.DesignAutoGA4 = {
          trackPageView: function(pagePath) {
            gtag('config', '${config.ga4MeasurementId}', {
              page_path: pagePath || window.location.pathname,
              page_title: document.title,
              page_location: window.location.href
            });
          },
          trackEvent: function(eventName, parameters) {
            gtag('event', eventName, parameters);
          },
          trackArtView: function(artData) {
            gtag('event', 'view_item', {
              item_id: artData.id,
              item_name: artData.title,
              item_category: artData.category,
              value: artData.value || 0
            });
          },
          trackArtDownload: function(artData) {
            gtag('event', 'download', {
              item_id: artData.id,
              item_name: artData.title,
              item_category: artData.category,
              value: artData.value || 0
            });
          },
          trackFormSubmit: function(formData) {
            gtag('event', 'form_submit', {
              form_name: formData.form_name,
              value: formData.value || 0
            });
          },
          trackPurchase: function(purchaseData) {
            gtag('event', 'purchase', {
              transaction_id: purchaseData.transaction_id,
              value: purchaseData.value,
              currency: 'BRL',
              items: [{
                item_name: purchaseData.product_name,
                price: purchaseData.value,
                quantity: 1
              }]
            });
          },
          isActive: function() {
            return true;
          }
        };

        console.log('✅ Google Analytics 4 carregado:', '${config.ga4MeasurementId}');
      `;
      document.head.appendChild(ga4ConfigScript);
    }

    // Meta Pixel (Facebook)
    if (config.metaPixelEnabled && config.metaPixelId) {
      const metaPixelScript = document.createElement('script');
      metaPixelScript.setAttribute('data-analytics-script', 'meta-pixel');
      metaPixelScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        
        fbq('init', '${config.metaPixelId}');
        fbq('track', 'PageView');

        // Criar objeto global para tracking
        window.DesignAutoMetaPixel = {
          trackPageView: function() {
            fbq('track', 'PageView');
          },
          trackCustomEvent: function(eventName, parameters) {
            fbq('track', eventName, parameters);
          },
          trackViewContent: function(contentData) {
            fbq('track', 'ViewContent', {
              content_ids: [contentData.id],
              content_name: contentData.name,
              content_type: contentData.type || 'product'
            });
          },
          trackLead: function(leadData) {
            fbq('track', 'Lead', leadData);
          },
          trackPurchase: function(purchaseData) {
            fbq('track', 'Purchase', {
              value: purchaseData.value,
              currency: 'BRL'
            });
          },
          isActive: function() {
            return true;
          }
        };

        console.log('✅ Meta Pixel carregado:', '${config.metaPixelId}');
      `;
      document.head.appendChild(metaPixelScript);

      // Noscript do Meta Pixel
      const metaPixelNoscript = document.createElement('noscript');
      metaPixelNoscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${config.metaPixelId}&ev=PageView&noscript=1" />`;
      document.body.appendChild(metaPixelNoscript);
    }

    // Google Tag Manager
    if (config.gtmEnabled && config.gtmContainerId) {
      // GTM Head Script
      const gtmHeadScript = document.createElement('script');
      gtmHeadScript.setAttribute('data-analytics-script', 'gtm-head');
      gtmHeadScript.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${config.gtmContainerId}');

        console.log('✅ Google Tag Manager carregado:', '${config.gtmContainerId}');
      `;
      document.head.appendChild(gtmHeadScript);

      // GTM Body Script (noscript)
      const gtmBodyScript = document.createElement('noscript');
      gtmBodyScript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${config.gtmContainerId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      document.body.appendChild(gtmBodyScript);
    }

    // Microsoft Clarity
    if (config.clarityEnabled && config.clarityProjectId) {
      const clarityScript = document.createElement('script');
      clarityScript.setAttribute('data-analytics-script', 'clarity');
      clarityScript.innerHTML = `
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${config.clarityProjectId}");

        // Criar objeto global para tracking
        window.DesignAutoClarity = {
          trackEvent: function(eventName, parameters) {
            if (typeof clarity !== 'undefined') {
              clarity('event', eventName, parameters);
            }
          },
          setCustomTag: function(key, value) {
            if (typeof clarity !== 'undefined') {
              clarity('set', key, value);
            }
          },
          identify: function(userId, userInfo) {
            if (typeof clarity !== 'undefined') {
              clarity('identify', userId, userInfo);
            }
          },
          isActive: function() {
            return typeof clarity !== 'undefined';
          }
        };

        console.log('✅ Microsoft Clarity carregado:', '${config.clarityProjectId}');
      `;
      document.head.appendChild(clarityScript);
    }

    console.log('🚀 Scripts de analytics carregados:', {
      GA4: config.ga4Enabled ? config.ga4MeasurementId : 'Desabilitado',
      MetaPixel: config.metaPixelEnabled ? config.metaPixelId : 'Desabilitado',
      GTM: config.gtmEnabled ? config.gtmContainerId : 'Desabilitado',
      Clarity: config.clarityEnabled ? config.clarityProjectId : 'Desabilitado'
    });
  };

  return (
    <Helmet>
      <meta name="analytics-status" content={scriptsLoaded ? "loaded" : "loading"} />
    </Helmet>
  );
};

export default AnalyticsScripts;