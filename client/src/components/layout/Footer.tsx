import ReportForm from '../reports/ReportForm';
import { Heart, Instagram, MessageCircle } from 'lucide-react';
import { SiTiktok, SiPinterest } from 'react-icons/si';
import { Link } from 'wouter';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 relative z-10">
      <div className="w-full px-4 py-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Mobile Layout */}
          <div className="block mb-6">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <img 
                  src="/images/logos/logo_1749693001463.png" 
                  alt="DesignAuto" 
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-gray-600 text-sm">
                Sua plataforma completa para criação de materiais de marketing automotivo profissionais e impactantes.
              </p>
            </div>

            {/* Links organizados em colunas para mobile */}
            <div className="grid grid-cols-1 gap-6 mb-6">
              
              {/* EMPRESA */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 text-sm text-center">EMPRESA</h3>
                <div className="flex flex-col items-center space-y-3">
                  <Link href="/sobre" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Sobre</Link>
                  <Link href="/planos" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Planos</Link>
                  <Link href="/duvidas" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Dúvidas</Link>
                </div>
              </div>

              {/* LEGAL */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 text-sm text-center">LEGAL</h3>
                <div className="flex flex-col items-center space-y-3">
                  <Link href="/termos" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Termos</Link>
                  <Link href="/privacidade" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Privacidade</Link>
                  <ReportForm />
                </div>
              </div>

              {/* PARCERIA */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 text-sm text-center">PARCERIA</h3>
                <div className="flex flex-col items-center space-y-3">
                  <Link href="/colaboradores" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Colaborador</Link>
                  <Link href="/afiliacao" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Solicitar afiliação</Link>
                  <Link href="/suporte" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Suporte</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex flex-col-reverse gap-3">
              <div className="text-gray-500 text-xs text-center">
                © DesignAuto 2025 - DESIGNAUTO.COM.BR LTDA - CNPJ 37.561.761/0001-0
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <a 
                  href="https://wa.me/5511999999999" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-green-500 transition-colors p-1"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
                <a 
                  href="https://instagram.com/designauto" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-pink-500 transition-colors p-1"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="https://tiktok.com/@designauto" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-black transition-colors p-1"
                  aria-label="TikTok"
                >
                  <SiTiktok className="w-5 h-5" />
                </a>
                <a 
                  href="https://pinterest.com/designauto" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                  aria-label="Pinterest"
                >
                  <SiPinterest className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;