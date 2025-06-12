import { useEffect, useRef, useState } from 'react';
import ReportForm from '../reports/ReportForm';
import { Heart, Instagram, Mail, MessageCircle } from 'lucide-react';
import { SiTiktok, SiPinterest } from 'react-icons/si';
import { Link } from 'wouter';

const DesktopFooter = () => {
  const footerRef = useRef<HTMLElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const isDesktopSize = window.innerWidth >= 768;
      setIsDesktop(isDesktopSize);
      
      const footer = footerRef.current;
      if (footer) {
        if (isDesktopSize) {
          footer.style.display = 'block';
          footer.style.visibility = 'visible';
          footer.style.opacity = '1';
          footer.style.position = 'relative';
          footer.style.zIndex = '10';
          footer.style.transform = 'none';
        } else {
          footer.style.display = 'none';
        }
      }
    };

    // Verificar tamanho da tela imediatamente
    checkScreenSize();

    // Observador de mutação para forçar visibilidade em desktop
    const footer = footerRef.current;
    let observer: MutationObserver | null = null;
    
    if (footer) {
      observer = new MutationObserver(() => {
        if (window.innerWidth >= 768) {
          footer.style.display = 'block';
          footer.style.visibility = 'visible';
          footer.style.opacity = '1';
        }
      });

      observer.observe(footer, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    // Listeners para mudanças de tamanho
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('load', checkScreenSize);

    // Intervalo de backup para garantir visibilidade
    const interval = setInterval(() => {
      if (window.innerWidth >= 768 && footer) {
        footer.style.display = 'block';
        footer.style.visibility = 'visible';
        footer.style.opacity = '1';
      }
    }, 1000);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('load', checkScreenSize);
      clearInterval(interval);
    };
  }, []);

  return (
    <footer 
      ref={footerRef} 
      className="hidden md:block bg-white border-t border-gray-200 relative z-10"
      style={{ 
        display: window.innerWidth >= 768 ? 'block' : 'none',
        visibility: 'visible',
        opacity: '1'
      }}
    >
      <div className="w-full px-4 py-12">
        <div className="max-w-6xl mx-auto">
          
          {/* Desktop Layout Only */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Coluna 1: Logo e Descrição */}
            <div className="space-y-4">
              <div className="flex items-center">
                <img 
                  src="/images/logos/logo_1746071698944.png" 
                  alt="DesignAuto"
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Sua plataforma completa para criação de materiais de marketing automotivo profissionais e impactantes.
              </p>
              
              {/* Redes Sociais */}
              <div className="flex space-x-4">
                <a 
                  href="https://instagram.com/designauto.oficial" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-pink-500 transition-colors duration-200"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a 
                  href="https://www.tiktok.com/@designauto.oficial" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-black transition-colors duration-200"
                >
                  <SiTiktok className="h-5 w-5" />
                </a>
                <a 
                  href="https://br.pinterest.com/designautooficial/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                >
                  <SiPinterest className="h-5 w-5" />
                </a>
                <a 
                  href="https://wa.me/5581987654321" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-green-500 transition-colors duration-200"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Coluna 2: Links Rápidos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                Links Rápidos
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Início
                  </Link>
                </li>
                <li>
                  <Link href="/categorias" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Categorias
                  </Link>
                </li>
                <li>
                  <Link href="/ferramentas" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Ferramentas
                  </Link>
                </li>
                <li>
                  <Link href="/videoaulas" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Vídeo Aulas
                  </Link>
                </li>
              </ul>
            </div>

            {/* Coluna 3: Recursos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                Recursos
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/comunidade" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Comunidade
                  </Link>
                </li>
                <li>
                  <Link href="/planos" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Planos
                  </Link>
                </li>
                <li>
                  <Link href="/favorites" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Favoritos
                  </Link>
                </li>
                <li>
                  <Link href="/downloads" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Downloads
                  </Link>
                </li>
              </ul>
            </div>

            {/* Coluna 4: Contato e Suporte */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                Suporte
              </h3>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="mailto:contato@designauto.com.br" 
                    className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm flex items-center"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contato
                  </a>
                </li>
                <li>
                  <ReportForm />
                </li>
                <li>
                  <Link href="/ajuda" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Central de Ajuda
                  </Link>
                </li>
                <li>
                  <Link href="/termos" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Termos de Uso
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          {/* Linha de separação */}
          <div className="border-t border-gray-200 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm">
                © 2025 DesignAuto. Todos os direitos reservados.
              </p>
              <div className="flex items-center mt-4 md:mt-0">
                <span className="text-gray-500 text-sm mr-1">Feito com</span>
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-gray-500 text-sm ml-1">para o mercado automotivo</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default DesktopFooter;