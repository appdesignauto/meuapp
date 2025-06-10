import { Heart, Instagram, Mail, MessageCircle } from 'lucide-react';
import { SiTiktok, SiPinterest } from 'react-icons/si';
import { Link } from 'wouter';

const Footer = () => {
  return (
    <footer className="designauto-footer bg-white border-t border-gray-200 w-full">
      <div className="w-full px-4 py-12 bg-white">
        {/* Main footer content - Desktop grid layout */}
        <div className="max-w-5xl mx-auto bg-white">
          {/* Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-4 md:gap-16 mb-8">
            {/* Brand section */}
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DA</span>
                </div>
                <span className="font-bold text-base text-gray-900">DesignAuto</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed mb-3">
                Criado com <Heart className="inline w-4 h-4 text-red-500 fill-current" /> por apaixonados por design.
                <br />
                Recursos gráficos incríveis para inspirar criatividade.
              </p>
              
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Mail className="w-4 h-4" />
                <a href="mailto:suporte@designauto.com.br" className="hover:text-blue-600 transition-colors">
                  suporte@designauto.com.br
                </a>
              </div>
            </div>

            {/* Design Auto section */}
            <div className="col-span-1">
              <h3 className="font-semibold text-gray-900 mb-3 text-xs">DESIGN AUTO</h3>
              <ul className="space-y-2">
                <li><Link href="/sobre" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Sobre nós</Link></li>
                <li><Link href="/planos" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Planos</Link></li>
                <li><Link href="/duvidas" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Dúvidas</Link></li>
              </ul>
            </div>

            {/* Informativo */}
            <div className="col-span-1">
              <h3 className="font-semibold text-gray-900 mb-3 text-xs">INFORMATIVO</h3>
              <ul className="space-y-2">
                <li><Link href="/termos" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Política de Privacidade</Link></li>
                <li><Link href="/denunciar" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Denunciar arquivo</Link></li>
              </ul>
            </div>

            {/* Parceria */}
            <div className="col-span-1">
              <h3 className="font-semibold text-gray-900 mb-3 text-xs">PARCERIA</h3>
              <ul className="space-y-2">
                <li><Link href="/colaboradores" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Colaborador</Link></li>
                <li><Link href="/afiliacao" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Solicitar afiliação</Link></li>
                <li><Link href="/suporte" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Acionar o Suporte</Link></li>
              </ul>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="flex md:hidden flex-col mb-8">
            {/* Brand section mobile */}
            <div className="text-center mb-6">
              <div className="flex items-center gap-2 mb-3 justify-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DA</span>
                </div>
                <span className="font-bold text-base text-gray-900">DesignAuto</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed mb-3">
                Criado com <Heart className="inline w-4 h-4 text-red-500 fill-current" /> por apaixonados por design.
                <br />
                Recursos gráficos incríveis para inspirar criatividade.
              </p>
              
              <div className="flex items-center gap-2 text-xs text-gray-600 justify-center">
                <Mail className="w-4 h-4" />
                <a href="mailto:suporte@designauto.com.br" className="hover:text-blue-600 transition-colors">
                  suporte@designauto.com.br
                </a>
              </div>
            </div>

            {/* Mobile: 3 blocks layout */}
            <div className="flex justify-center gap-8">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-3 text-xs">DESIGN AUTO</h3>
                <ul className="space-y-2">
                  <li><Link href="/sobre" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Sobre nós</Link></li>
                  <li><Link href="/planos" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Planos</Link></li>
                  <li><Link href="/duvidas" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Dúvidas</Link></li>
                </ul>
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-3 text-xs">INFORMATIVO</h3>
                <ul className="space-y-2">
                  <li><Link href="/termos" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Termos de Uso</Link></li>
                  <li><Link href="/privacidade" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Política de Privacidade</Link></li>
                  <li><Link href="/denunciar" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Denunciar arquivo</Link></li>
                </ul>
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-3 text-xs">PARCERIA</h3>
                <ul className="space-y-2">
                  <li><Link href="/colaboradores" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Colaborador</Link></li>
                  <li><Link href="/afiliacao" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Solicitar afiliação</Link></li>
                  <li><Link href="/suporte" className="text-gray-600 hover:text-blue-600 text-xs transition-colors">Acionar o Suporte</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section - Centralized on mobile */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-5xl mx-auto">
            <div className="text-gray-500 text-xs text-center md:text-left">© DesignAuto 2025 - DESIGNAUTO.COM.BR LTDA - CNPJ 37.561.761/0001-0</div>
            
            {/* Social media icons - Centralized on mobile */}
            <div className="flex items-center gap-4 justify-center md:justify-end">
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