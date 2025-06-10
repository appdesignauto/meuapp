import { Heart, Instagram, Mail, MessageCircle } from 'lucide-react';
import { SiTiktok, SiPinterest } from 'react-icons/si';
import { Link } from 'wouter';
import { useEffect, useState } from 'react';

const DesktopFooter = () => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!isDesktop) return null;

  return (
    <footer 
      className="desktop-footer-component"
      style={{
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        position: 'relative',
        zIndex: 9999,
        backgroundColor: 'white',
        borderTop: '1px solid rgb(229, 231, 235)',
        width: '100%',
        minHeight: '250px',
        margin: 0,
        padding: '48px 16px',
        clear: 'both'
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', backgroundColor: 'white' }}>
        {/* Desktop Grid Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '64px', 
          marginBottom: '32px' 
        }}>
          {/* Brand section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#1d4ed8',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>DA</span>
              </div>
              <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#111827' }}>DesignAuto</span>
            </div>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '12px', 
              lineHeight: '1.5', 
              marginBottom: '12px' 
            }}>
              Criado com <Heart style={{ display: 'inline', width: '16px', height: '16px', color: '#ef4444' }} /> por apaixonados por design.
              <br />
              Recursos gráficos incríveis para inspirar criatividade.
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6b7280' }}>
              <Mail style={{ width: '16px', height: '16px' }} />
              <a 
                href="mailto:suporte@designauto.com.br" 
                style={{ color: '#6b7280', textDecoration: 'none' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
              >
                suporte@designauto.com.br
              </a>
            </div>
          </div>

          {/* Design Auto section */}
          <div>
            <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '12px', fontSize: '12px' }}>DESIGN AUTO</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><Link href="/sobre" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Sobre nós</Link></li>
              <li><Link href="/planos" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Planos</Link></li>
              <li><Link href="/duvidas" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Dúvidas</Link></li>
            </ul>
          </div>

          {/* Informativo */}
          <div>
            <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '12px', fontSize: '12px' }}>INFORMATIVO</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><Link href="/termos" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Termos de Uso</Link></li>
              <li><Link href="/privacidade" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Política de Privacidade</Link></li>
              <li><Link href="/denunciar" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Denunciar arquivo</Link></li>
            </ul>
          </div>

          {/* Parceria */}
          <div>
            <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '12px', fontSize: '12px' }}>PARCERIA</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><Link href="/colaboradores" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Colaborador</Link></li>
              <li><Link href="/afiliacao" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Solicitar afiliação</Link></li>
              <li><Link href="/suporte" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>Acionar o Suporte</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ color: '#6b7280', fontSize: '12px' }}>
              © DesignAuto 2025 - DESIGNAUTO.COM.BR LTDA - CNPJ 37.561.761/0001-0
            </div>
            
            {/* Social media icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <a 
                href="https://wa.me/5511999999999" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#9ca3af', textDecoration: 'none' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#22c55e'}
                onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                <MessageCircle style={{ width: '20px', height: '20px' }} />
              </a>
              <a 
                href="https://instagram.com/designauto" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#9ca3af', textDecoration: 'none' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#ec4899'}
                onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                <Instagram style={{ width: '20px', height: '20px' }} />
              </a>
              <a 
                href="https://tiktok.com/@designauto" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#9ca3af', textDecoration: 'none' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#000000'}
                onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                <SiTiktok style={{ width: '20px', height: '20px' }} />
              </a>
              <a 
                href="https://pinterest.com/designauto" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#9ca3af', textDecoration: 'none' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#dc2626'}
                onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                <SiPinterest style={{ width: '20px', height: '20px' }} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DesktopFooter;