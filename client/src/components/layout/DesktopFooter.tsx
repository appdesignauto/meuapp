import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Instagram, MessageCircle, Mail, Heart } from 'lucide-react';
import { SiTiktok, SiPinterest } from 'react-icons/si';
import ReportForm from '@/components/reports/ReportForm';

const DesktopFooter = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      const isDesktopSize = window.innerWidth >= 768;
      setIsDesktop(isDesktopSize);
    };

    // Check initial screen size
    checkScreenSize();

    // Add resize listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Don't render if not desktop
  if (!isDesktop) {
    return null;
  }

  return (
    <footer 
      ref={footerRef} 
      className="hidden md:block bg-gradient-to-br from-slate-50 to-blue-50 border-t border-gray-200 relative z-10"
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

            {/* Coluna 2: EMPRESA */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                EMPRESA
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/sobre" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link href="/planos" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Planos
                  </Link>
                </li>
                <li>
                  <Link href="/duvidas" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Dúvidas
                  </Link>
                </li>
              </ul>
            </div>

            {/* Coluna 3: LEGAL */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                LEGAL
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/termos" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Termos
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Privacidade
                  </Link>
                </li>
                <li>
                  <ReportForm>
                    <button className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm text-left">
                      Denunciar arquivo
                    </button>
                  </ReportForm>
                </li>
              </ul>
            </div>

            {/* Coluna 4: PARCERIA */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                PARCERIA
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/colaborar" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Colaborar
                  </Link>
                </li>
                <li>
                  <Link href="/afiliacao" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Afiliação
                  </Link>
                </li>
                <li>
                  <Link href="/suporte" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Suporte
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-gray-500 text-xs">
                © DesignAuto 2025 - DESIGNAUTO.COM.BR LTDA - CNPJ 37.561.761/0001-0
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                Feito com <Heart className="h-3 w-3 text-red-500 fill-current" /> para o mercado automotivo
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DesktopFooter;