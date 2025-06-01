import ReportForm from '../reports/ReportForm';
import { Heart, Instagram, Mail, MessageCircle } from 'lucide-react';
import { SiTiktok, SiPinterest } from 'react-icons/si';
import { Link } from 'wouter';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="w-full px-4 py-12">
        {/* Main footer content */}
        <div className="flex flex-col mb-8 max-w-5xl mx-auto">
          {/* Brand section with logo - mobile centered */}
          <div className="text-center md:text-left mb-8 md:mb-6 md:w-64">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DA</span>
              </div>
              <span className="font-bold text-base text-gray-900">DesignAuto</span>
            </div>
            <p className="text-gray-600 text-xs leading-relaxed mb-3 max-w-sm mx-auto md:mx-0">
              Criado com <Heart className="inline w-4 h-4 text-red-500 fill-current" /> por apaixonados por design, oferecendo 
              recursos gráficos incríveis para inspirar criatividade.
            </p>
            
            {/* Email contact */}
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-gray-600 mb-8 md:mb-0">
              <Mail className="w-4 h-4" />
              <a href="mailto:suporte@designauto.com.br" className="hover:text-blue-600 transition-colors">
                suporte@designauto.com.br
              </a>
            </div>
          </div>

          {/* Navigation sections - responsive grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-14 text-center md:text-left md:ml-16">
            {/* EMPRESA section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-xs">EMPRESA</h3>
              <ul className="space-y-3">
                <li><Link href="/sobre" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Sobre nós</Link></li>
                <li><Link href="/planos" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Tipos de licença</Link></li>
                <li><Link href="/contato" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Entre em contato</Link></li>
                <li><Link href="/oportunidades" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Oportunidades</Link></li>
              </ul>
            </div>

            {/* TERMOS LEGAIS section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-xs">TERMOS LEGAIS</h3>
              <ul className="space-y-3">
                <li><Link href="/termos" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Termos de serviço</Link></li>
                <li><Link href="/privacidade" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Política de privacidade</Link></li>
                <li><ReportForm /></li>
              </ul>
            </div>

            {/* LINKS ÚTEIS section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-xs">LINKS ÚTEIS</h3>
              <ul className="space-y-3">
                <li><Link href="/fotos" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Encontrar Fotos</Link></li>
                <li><Link href="/png" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Encontrar PNG</Link></li>
                <li><Link href="/psd" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Encontrar PSD</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-5xl mx-auto">
            <div className="text-gray-500 text-xs">© DesignAuto 2025 - DESIGNAUTO.COM.BR LTDA - CNPJ 37.561.761/0001-0</div>
            
            {/* Social media icons */}
            <div className="flex items-center gap-4" style={{ marginRight: '4rem' }}>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/designauto" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://tiktok.com/@designauto" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors">
                <SiTiktok className="w-5 h-5" />
              </a>
              <a href="https://pinterest.com/designauto" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition-colors">
                <SiPinterest className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;