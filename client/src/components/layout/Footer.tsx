import { Heart, Instagram, Mail, MessageCircle } from 'lucide-react';
import { SiTiktok, SiPinterest } from 'react-icons/si';
import { Link } from 'wouter';

const Footer = () => {
  return (
    <footer 
      className="designauto-footer bg-white border-t border-gray-200 w-full"
      style={{
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        position: 'relative',
        zIndex: 9999,
        backgroundColor: 'white',
        borderTop: '1px solid rgb(229, 231, 235)',
        width: '100%',
        minHeight: '250px'
      }}
    >
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
              
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                <Mail className="w-4 h-4" />
                <a href="mailto:suporte@designauto.com.br" className="hover:text-blue-600 transition-colors">
                  suporte@designauto.com.br
                </a>
              </div>
              
              {/* Social Media Icons */}
              <div className="flex gap-3">
                <a 
                  href="https://www.instagram.com/designauto.oficial/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Instagram className="w-4 h-4 text-white" />
                </a>
                <a 
                  href="https://www.tiktok.com/@designauto.oficial" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-black rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <SiTiktok className="w-4 h-4 text-white" />
                </a>
                <a 
                  href="https://br.pinterest.com/designautooficial/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <SiPinterest className="w-4 h-4 text-white" />
                </a>
                <a 
                  href="https://wa.me/5511999999999" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
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

            {/* Mobile Social Media */}
            <div className="flex justify-center gap-3 mt-6">
              <a 
                href="https://www.instagram.com/designauto.oficial/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Instagram className="w-4 h-4 text-white" />
              </a>
              <a 
                href="https://www.tiktok.com/@designauto.oficial" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 bg-black rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
              >
                <SiTiktok className="w-4 h-4 text-white" />
              </a>
              <a 
                href="https://br.pinterest.com/designautooficial/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
              >
                <SiPinterest className="w-4 h-4 text-white" />
              </a>
              <a 
                href="https://wa.me/5511999999999" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
              >
                <MessageCircle className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>

          {/* Copyright section */}
          <div className="border-t border-gray-200 pt-6 text-center">
            <p className="text-gray-500 text-xs">
              © 2024 DesignAuto. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;