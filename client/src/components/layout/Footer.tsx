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
          <div className="w-full md:w-64 mb-12 md:mb-0 text-center md:text-left px-4 md:px-0">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-base">DA</span>
              </div>
              <span className="font-bold text-lg text-gray-900">DesignAuto</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-xs mx-auto md:mx-0">
              Criado com <Heart className="inline w-4 h-4 text-red-500 fill-current" /> por apaixonados por design, oferecendo 
              recursos gráficos incríveis para inspirar criatividade.
            </p>
            
            {/* Email contact */}
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <a href="mailto:suporte@designauto.com.br" className="hover:text-blue-600 transition-colors">
                suporte@designauto.com.br
              </a>
            </div>
          </div>

          {/* Navigation sections - responsive layout */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12 md:gap-14 w-full md:ml-16 text-left px-4 md:px-0">
            {/* EMPRESA section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-5 text-sm tracking-wide">EMPRESA</h3>
              <ul className="space-y-4">
                <li><Link href="/sobre" className="text-gray-600 hover:text-blue-600 text-sm transition-colors block">Sobre nós</Link></li>
                <li><Link href="/planos" className="text-gray-600 hover:text-blue-600 text-sm transition-colors block">Tipos de licença</Link></li>
                <li><Link href="/contato" className="text-gray-600 hover:text-blue-600 text-sm transition-colors block">Entre em contato</Link></li>
                <li><Link href="/oportunidades" className="text-gray-600 hover:text-blue-600 text-sm transition-colors block">Oportunidades</Link></li>
              </ul>
            </div>

            {/* TERMOS LEGAIS section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-5 text-sm tracking-wide">TERMOS LEGAIS</h3>
              <ul className="space-y-4">
                <li><Link href="/termos" className="text-gray-600 hover:text-blue-600 text-sm transition-colors block">Termos de serviço</Link></li>
                <li><Link href="/privacidade" className="text-gray-600 hover:text-blue-600 text-sm transition-colors block">Política de privacidade</Link></li>
                <li><ReportForm /></li>
              </ul>
            </div>

            {/* LINKS ÚTEIS section */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="font-semibold text-gray-900 mb-5 text-sm tracking-wide">LINKS ÚTEIS</h3>
              <ul className="space-y-4">
                <li><Link href="/fotos" className="text-gray-600 hover:text-blue-600 text-sm transition-colors block">Encontrar Fotos</Link></li>
                <li><Link href="/png" className="text-gray-600 hover:text-blue-600 text-sm transition-colors block">Encontrar PNG</Link></li>
                <li><Link href="/psd" className="text-gray-600 hover:text-blue-600 text-sm transition-colors block">Encontrar PSD</Link></li>
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