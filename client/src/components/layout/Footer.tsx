import ReportForm from '../reports/ReportForm';
import { Heart, Instagram, Facebook, Youtube, Twitter } from 'lucide-react';
import { Link } from 'wouter';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-12">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row mb-8 max-w-5xl mx-auto">
          {/* Brand section with logo */}
          <div className="md:w-64 mb-6 md:mb-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DA</span>
              </div>
              <span className="font-bold text-lg text-gray-900">DesignAuto</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Criado com <Heart className="inline w-4 h-4 text-red-500 fill-current" /> por apaixonados por design, oferecendo 
              recursos gráficos incríveis para inspirar criatividade.
            </p>
          </div>

          {/* Sections 2, 3, 4 with custom spacing */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-12 md:ml-16">
            {/* Design Auto section */}
            <div className="pt-[0px] pb-[0px] pl-[0px] pr-[0px]">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">DESIGN AUTO</h3>
              <ul className="space-y-2">
                <li><Link href="/sobre" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Sobre nós</Link></li>
                <li><Link href="/planos" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Planos</Link></li>
                <li><Link href="/duvidas" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Dúvidas</Link></li>
              </ul>
            </div>

            {/* Informativo */}
            <div className="pl-[0px] pr-[0px] ml-[-53px] mr-[-53px]">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">INFORMATIVO</h3>
              <ul className="space-y-2">
                <li><Link href="/termos" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Política de Privacidade</Link></li>
                <li><ReportForm /></li>
              </ul>
            </div>

            {/* Parceria */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">PARCERIA</h3>
              <ul className="space-y-2">
                <li><Link href="/colaboradores" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Torne-se um colaborador</Link></li>
                <li><Link href="/afiliacao" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Solicitar afiliação</Link></li>
                <li><Link href="/suporte" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Acionar o Suporte</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-5xl mx-auto">
            <div className="text-gray-500 text-sm">
              © DesignAuto 2025 - DESIGNAUTO.COM.BR LTDA - CNPJ 37.561.761/0001-00 / DESIGNAUTO.COM.BR LTDA - CNPJ 34.612.751/0001-80
            </div>
            
            {/* Social media icons */}
            <div className="flex items-center gap-4">
              <a href="https://instagram.com/designauto" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://facebook.com/designauto" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://youtube.com/@designauto" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/designauto" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;