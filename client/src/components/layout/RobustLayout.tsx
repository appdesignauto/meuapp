import { useLocation } from 'wouter';
import Header from './Header';
import Footer from './Footer';

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