import ReportForm from '../reports/ReportForm';
import { Heart, Instagram, Mail, MessageCircle } from 'lucide-react';
import { SiTiktok, SiPinterest } from 'react-icons/si';
import { Link } from 'wouter';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="w-full px-4 py-12">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row mb-8 items-start max-w-5xl mx-auto">
          {/* Brand section with logo */}
          <div className="md:w-64 mb-6 md:mb-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DA</span>
              </div>
              <span className="font-bold text-base text-gray-900">DesignAuto</span>
            </div>
            <p className="text-gray-600 text-xs leading-relaxed mb-3">
              Criado com <Heart className="inline w-4 h-4 text-red-500 fill-current" /> por apaixonados por design, oferecendo 
              recursos gráficos incríveis para inspirar criatividade.
            </p>
            
            {/* Email contact */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Mail className="w-4 h-4" />
              <a href="mailto:suporte@designauto.com.br" className="hover:text-blue-600 transition-colors">
                suporte@designauto.com.br
              </a>
            </div>
          </div>

          {/* Sections 2, 3, 4 with custom spacing */}
          <div className="flex flex-col md:flex-row" style={{ marginLeft: '4rem' }}>
            {/* Design Auto section */}
            <div className="md:w-auto" style={{ marginRight: '3.5rem' }}>
              <h3 className="font-semibold text-gray-900 mb-3 text-xs">DESIGN AUTO</h3>
              <ul className="space-y-2">
                <li><Link href="/sobre" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Sobre nós</Link></li>
                <li><Link href="/planos" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Planos</Link></li>
                <li><Link href="/duvidas" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Dúvidas</Link></li>
              </ul>
            </div>

            {/* Informativo */}
            <div className="md:w-auto" style={{ marginRight: '3.5rem' }}>
              <h3 className="font-semibold text-gray-900 mb-3 text-xs">INFORMATIVO</h3>
              <ul className="space-y-2">
                <li><Link href="/termos" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Política de Privacidade</Link></li>
                <li><ReportForm /></li>
              </ul>
            </div>

            {/* Parceria */}
            <div className="md:w-auto">
              <h3 className="font-semibold text-gray-900 mb-3 text-xs">PARCERIA</h3>
              <ul className="space-y-2">
                <li><Link href="/colaboradores" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Torne-se um colaborador</Link></li>
                <li><Link href="/afiliacao" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Solicitar afiliação</Link></li>
                <li><Link href="/suporte" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Acionar o Suporte</Link></li>
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