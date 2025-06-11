import ReportForm from '../reports/ReportForm';
import { Heart, Instagram, Mail, MessageCircle } from 'lucide-react';
import { SiTiktok, SiPinterest } from 'react-icons/si';
import { Link } from 'wouter';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="w-full px-4 py-6 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Desktop: 4 columns layout */}
          <div className="hidden md:grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand section - Desktop */}
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DA</span>
                </div>
                <span className="font-bold text-lg text-gray-900">DesignAuto</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Criado com <Heart className="inline w-4 h-4 text-red-500 fill-current" /> por apaixonados por design.
                <br />
                Recursos gráficos incríveis para inspirar criatividade.
              </p>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:suporte@designauto.com.br" className="hover:text-blue-600 transition-colors break-all">
                  suporte@designauto.com.br
                </a>
              </div>
            </div>

            {/* Design Auto section - Desktop */}
            <div className="col-span-1">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">DESIGN AUTO</h3>
              <ul className="space-y-3">
                <li><Link href="/sobre" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Sobre nós</Link></li>
                <li><Link href="/planos" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Planos</Link></li>
                <li><Link href="/duvidas" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Dúvidas</Link></li>
              </ul>
            </div>

            {/* Informativo section - Desktop */}
            <div className="col-span-1">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">INFORMATIVO</h3>
              <ul className="space-y-3">
                <li><Link href="/termos" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Política de Privacidade</Link></li>
                <li><ReportForm /></li>
              </ul>
            </div>

            {/* Parceria section - Desktop */}
            <div className="col-span-1">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">PARCERIA</h3>
              <ul className="space-y-3">
                <li><Link href="/colaboradores" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Colaborador</Link></li>
                <li><Link href="/afiliacao" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Solicitar afiliação</Link></li>
                <li><Link href="/suporte" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Acionar o Suporte</Link></li>
              </ul>
            </div>
          </div>

          {/* Mobile: Minimal layout */}
          <div className="block md:hidden mb-6">
            {/* Brand and contact - Mobile */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DA</span>
                </div>
                <span className="font-bold text-lg text-gray-900">DesignAuto</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-3 px-4">
                Criado com <Heart className="inline w-4 h-4 text-red-500 fill-current" /> por apaixonados por design.
                Recursos gráficos incríveis para inspirar criatividade.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:suporte@designauto.com.br" className="hover:text-blue-600 transition-colors">
                  suporte@designauto.com.br
                </a>
              </div>
            </div>

            {/* Compact links grid - Mobile */}
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-xs uppercase tracking-wide">Empresa</h4>
                <div className="space-y-2">
                  <div><Link href="/sobre" className="text-gray-600 hover:text-blue-600 transition-colors">Sobre</Link></div>
                  <div><Link href="/planos" className="text-gray-600 hover:text-blue-600 transition-colors">Planos</Link></div>
                  <div><Link href="/duvidas" className="text-gray-600 hover:text-blue-600 transition-colors">Dúvidas</Link></div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-xs uppercase tracking-wide">Legal</h4>
                <div className="space-y-2">
                  <div><Link href="/termos" className="text-gray-600 hover:text-blue-600 transition-colors">Termos</Link></div>
                  <div><Link href="/privacidade" className="text-gray-600 hover:text-blue-600 transition-colors">Privacidade</Link></div>
                  <div><ReportForm /></div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-xs uppercase tracking-wide">Parceria</h4>
                <div className="space-y-2">
                  <div><Link href="/colaboradores" className="text-gray-600 hover:text-blue-600 transition-colors">Colaborar</Link></div>
                  <div><Link href="/afiliacao" className="text-gray-600 hover:text-blue-600 transition-colors">Afiliação</Link></div>
                  <div><Link href="/suporte" className="text-gray-600 hover:text-blue-600 transition-colors">Suporte</Link></div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-3">
              {/* Copyright */}
              <div className="text-gray-500 text-xs text-center md:text-left">
                © DesignAuto 2025 - DESIGNAUTO.COM.BR LTDA - CNPJ 37.561.761/0001-0
              </div>
              
              {/* Social media icons */}
              <div className="flex items-center gap-3">
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