import ReportForm from '../reports/ReportForm';
import { Instagram, MessageCircle } from 'lucide-react';
import { SiTiktok, SiPinterest } from 'react-icons/si';
import { Link } from 'wouter';

const DesktopFooter = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-200 relative z-10">
      <div className="w-full px-6 py-12">
        <div className="max-w-7xl mx-auto">
          
          {/* Desktop Layout */}
          <div className="grid grid-cols-4 gap-8 mb-8">
            
            {/* Logo e Descrição */}
            <div className="col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <img 
                  src="/images/logos/logo_1749693001463.png" 
                  alt="DesignAuto" 
                  className="h-10 w-auto"
                />
                <span className="text-xl font-bold text-gray-900">DesignAuto</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Sua plataforma completa para criação de materiais de marketing automotivo profissionais e impactantes.
              </p>
              
              {/* Redes Sociais */}
              <div className="flex items-center gap-4">
                <a 
                  href="https://wa.me/5511999999999" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-green-500 transition-colors duration-200 p-2 rounded-full hover:bg-white"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
                <a 
                  href="https://instagram.com/designauto" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-pink-500 transition-colors duration-200 p-2 rounded-full hover:bg-white"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="https://tiktok.com/@designauto" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-black transition-colors duration-200 p-2 rounded-full hover:bg-white"
                  aria-label="TikTok"
                >
                  <SiTiktok className="w-5 h-5" />
                </a>
                <a 
                  href="https://pinterest.com/designauto" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-2 rounded-full hover:bg-white"
                  aria-label="Pinterest"
                >
                  <SiPinterest className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* EMPRESA */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-6 text-sm uppercase tracking-wider">EMPRESA</h3>
              <ul className="space-y-4">
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

            {/* LEGAL */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-6 text-sm uppercase tracking-wider">LEGAL</h3>
              <ul className="space-y-4">
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
                <li><ReportForm /></li>
              </ul>
            </div>

            {/* PARCERIA */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-6 text-sm uppercase tracking-wider">PARCERIA</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/colaboradores" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
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

          {/* Bottom section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-500 text-xs text-center md:text-left">
                © DesignAuto 2025 - DESIGNAUTO.COM.BR LTDA - CNPJ 37.561.761/0001-0
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DesktopFooter;