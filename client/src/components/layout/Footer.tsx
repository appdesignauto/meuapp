import ReportForm from '../reports/ReportForm';
import { Heart, Instagram, Facebook, Youtube, Twitter } from 'lucide-react';
import { Link } from 'wouter';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand section */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DA</span>
              </div>
              <span className="font-bold text-lg text-gray-900">DesignAuto</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Criado com <Heart className="inline w-4 h-4 text-red-500 fill-current" /> por apaixonados por design, oferecendo 
              recursos gráficos incríveis para inspirar criatividade e 
              transformar ideias em projetos.
            </p>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">EMPRESA</h3>
            <ul className="space-y-3">
              <li><Link href="/sobre" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Sobre nós</Link></li>
              <li><Link href="/licencas" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Tipos de licença</Link></li>
              <li><Link href="/contato" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Entre em contato</Link></li>
              <li><Link href="/oportunidades" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Oportunidades</Link></li>
            </ul>
          </div>

          {/* Termos Legais */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">TERMOS LEGAIS</h3>
            <ul className="space-y-3">
              <li><Link href="/termos" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Termos de serviço</Link></li>
              <li><Link href="/privacidade" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Política de privacidade</Link></li>
              <li><ReportForm /></li>
            </ul>
          </div>

          {/* Descubra */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">DESCUBRA</h3>
            <ul className="space-y-3">
              <li><Link href="/planos" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Preços</Link></li>
              <li><Link href="/reembolso" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Solicitar reembolso</Link></li>
              <li><Link href="/colaboradores" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Torne-se um colaborador</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-200 gap-4">
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
    </footer>
  );
};

export default Footer;