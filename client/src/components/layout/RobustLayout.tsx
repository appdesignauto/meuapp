import { useLocation } from 'wouter';
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

interface RobustLayoutProps {
  children: React.ReactNode;
}

const RobustLayout = ({ children }: RobustLayoutProps) => {
  const [location] = useLocation();
  
  useEffect(() => {
    // Sistema anti-cache para forçar rodapé no desktop
    const forceDesktopFooter = () => {
      if (window.innerWidth >= 768) {
        const footers = document.querySelectorAll('.designauto-footer, footer');
        footers.forEach(footer => {
          const el = footer as HTMLElement;
          if (el.classList.contains('designauto-footer') || el.tagName === 'FOOTER') {
            el.style.cssText = `
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              position: relative !important;
              z-index: 9999 !important;
              background-color: white !important;
              border-top: 1px solid rgb(229, 231, 235) !important;
              width: 100% !important;
              min-height: 250px !important;
              margin: 0 !important;
              padding: 48px 16px !important;
              clear: both !important;
              transform: none !important;
              clip: auto !important;
              overflow: visible !important;
            `;
          }
        });
        
        // Verificar se o layout container está correto
        const rootLayout = document.getElementById('root-layout');
        if (rootLayout) {
          rootLayout.style.cssText = `
            min-height: 100vh !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: visible !important;
            width: 100% !important;
          `;
        }
      }
    };

    // Executar múltiplas vezes para garantir
    forceDesktopFooter();
    setTimeout(forceDesktopFooter, 100);
    setTimeout(forceDesktopFooter, 500);
    setTimeout(forceDesktopFooter, 1500);
    
    // Observar mudanças no DOM
    const observer = new MutationObserver(forceDesktopFooter);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    window.addEventListener('resize', forceDesktopFooter);
    window.addEventListener('load', forceDesktopFooter);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', forceDesktopFooter);
      window.removeEventListener('load', forceDesktopFooter);
    };
  }, [location]);
  
  // Não mostrar o layout padrão para páginas administrativas ou do painel
  if (location.startsWith('/admin') || location.startsWith('/painel')) {
    return <>{children}</>;
  }
  
  return (
    <div 
      id="root-layout"
      className="min-h-screen flex flex-col bg-white"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        width: '100%',
        overflow: 'visible'
      }}
    >
      <Header />
      <main 
        id="main-content"
        className="flex-1 bg-white"
        style={{
          flex: '1 1 auto',
          backgroundColor: 'white',
          width: '100%',
          overflow: 'visible'
        }}
      >
        {children}
      </main>
      <Footer />
      
      {/* Footer de emergência para desktop - só aparece se o principal falhar */}
      <div 
        className="desktop-footer-fallback hidden md:block"
        style={{
          display: 'none',
          backgroundColor: 'white',
          borderTop: '1px solid rgb(229, 231, 235)',
          padding: '48px 16px',
          textAlign: 'center',
          fontSize: '12px',
          color: 'rgb(107, 114, 128)'
        }}
      >
        © DesignAuto 2025 - DESIGNAUTO.COM.BR LTDA
      </div>
    </div>
  );
};

export default RobustLayout;