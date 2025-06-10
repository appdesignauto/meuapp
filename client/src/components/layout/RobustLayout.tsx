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
      className="min-h-screen flex flex-col bg-white"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white'
      }}
    >
      <Header />
      <main 
        className="flex-1 bg-white"
        style={{
          flex: '1 1 auto',
          backgroundColor: 'white'
        }}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default RobustLayout;