import { useLocation } from 'wouter';
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import DesktopFooter from './DesktopFooter';

interface RobustLayoutProps {
  children: React.ReactNode;
}

const RobustLayout = ({ children }: RobustLayoutProps) => {
  const [location] = useLocation();
  
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
      {/* Mobile Footer */}
      <div className="block md:hidden">
        <Footer />
      </div>
      
      {/* Desktop Footer - Completely isolated */}
      <div 
        className="hidden md:block"
        style={{
          backgroundColor: 'white',
          borderTop: '1px solid rgb(229, 231, 235)',
          width: '100%',
          minHeight: '250px',
          position: 'relative',
          zIndex: 9999
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '64px', marginBottom: '32px' }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: '#1d4ed8', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>DA</span>
                </div>
                <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#111827' }}>DesignAuto</span>
              </div>
              <p style={{ color: '#6b7280', fontSize: '12px', lineHeight: '1.5', marginBottom: '12px' }}>
                Criado com ❤️ por apaixonados por design.<br />
                Recursos gráficos incríveis para inspirar criatividade.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6b7280' }}>
                📧 suporte@designauto.com.br
              </div>
            </div>

            {/* Design Auto */}
            <div>
              <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '12px', fontSize: '12px' }}>DESIGN AUTO</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="/sobre" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Sobre nós</a>
                <a href="/planos" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Planos</a>
                <a href="/duvidas" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Dúvidas</a>
              </div>
            </div>

            {/* Informativo */}
            <div>
              <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '12px', fontSize: '12px' }}>INFORMATIVO</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="/termos" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Termos de Uso</a>
                <a href="/privacidade" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Política de Privacidade</a>
                <a href="/denunciar" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Denunciar arquivo</a>
              </div>
            </div>

            {/* Parceria */}
            <div>
              <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '12px', fontSize: '12px' }}>PARCERIA</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="/colaboradores" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Colaborador</a>
                <a href="/afiliacao" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Solicitar afiliação</a>
                <a href="/suporte" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Acionar o Suporte</a>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#6b7280', fontSize: '12px' }}>
              © DesignAuto 2025 - DESIGNAUTO.COM.BR LTDA - CNPJ 37.561.761/0001-0
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <a href="https://wa.me/5511999999999" style={{ color: '#6b7280', fontSize: '20px' }}>📱</a>
              <a href="https://instagram.com/designauto" style={{ color: '#6b7280', fontSize: '20px' }}>📷</a>
              <a href="https://tiktok.com/@designauto" style={{ color: '#6b7280', fontSize: '20px' }}>🎵</a>
              <a href="https://pinterest.com/designauto" style={{ color: '#6b7280', fontSize: '20px' }}>📌</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RobustLayout;