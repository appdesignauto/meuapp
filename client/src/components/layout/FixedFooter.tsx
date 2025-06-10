import { Heart, Instagram, Mail, MessageCircle } from 'lucide-react';
import { SiTiktok, SiPinterest } from 'react-icons/si';
import { Link } from 'wouter';

const FixedFooter = () => {
  return (
    <>
      {/* Footer espaçador para evitar sobreposição de conteúdo */}
      <div style={{ height: '250px' }} />
      
      {/* Footer fixo */}
      <footer 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[9999]"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100vw',
          backgroundColor: 'white',
          borderTop: '1px solid rgb(229, 231, 235)',
          zIndex: 9999,
          display: 'block',
          visibility: 'visible',
          opacity: 1
        }}
      >
        <div className="w-full px-4 py-6 bg-white">
          {/* Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-4 md:gap-8 max-w-5xl mx-auto">
            {/* Brand section */}
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">DA</span>
                </div>
                <span className="font-bold text-sm text-gray-900">DesignAuto</span>
              </div>
              <p className="text-gray-600 text-xs mb-2">
                Criado com <Heart className="inline w-3 h-3 text-red-500 fill-current" /> por apaixonados por design.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                <Mail className="w-3 h-3" />
                <a href="mailto:suporte@designauto.com.br" className="hover:text-blue-600">
                  suporte@designauto.com.br
                </a>
              </div>
              <div className="flex gap-2">
                <a href="https://www.instagram.com/designauto.oficial/" target="_blank" rel="noopener noreferrer"
                   className="text-gray-400 hover:text-pink-500 transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer"
                   className="text-gray-400 hover:text-green-500 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Recursos */}
            <div className="col-span-1">
              <h3 className="font-semibold text-sm text-gray-900 mb-2">Recursos</h3>
              <ul className="space-y-1 text-xs">
                <li><Link href="/artes" className="text-gray-600 hover:text-blue-600">Galeria de Artes</Link></li>
                <li><Link href="/categorias" className="text-gray-600 hover:text-blue-600">Categorias</Link></li>
                <li><Link href="/ferramentas" className="text-gray-600 hover:text-blue-600">Ferramentas</Link></li>
                <li><Link href="/comunidade" className="text-gray-600 hover:text-blue-600">Comunidade</Link></li>
              </ul>
            </div>

            {/* Empresa */}
            <div className="col-span-1">
              <h3 className="font-semibold text-sm text-gray-900 mb-2">Empresa</h3>
              <ul className="space-y-1 text-xs">
                <li><Link href="/sobre" className="text-gray-600 hover:text-blue-600">Sobre Nós</Link></li>
                <li><Link href="/colaboradores" className="text-gray-600 hover:text-blue-600">Colaboradores</Link></li>
                <li><Link href="/afiliados" className="text-gray-600 hover:text-blue-600">Afiliados</Link></li>
                <li><Link href="/faq" className="text-gray-600 hover:text-blue-600">FAQ</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="col-span-1">
              <h3 className="font-semibold text-sm text-gray-900 mb-2">Legal</h3>
              <ul className="space-y-1 text-xs">
                <li><Link href="/termos" className="text-gray-600 hover:text-blue-600">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="text-gray-600 hover:text-blue-600">Privacidade</Link></li>
              </ul>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">DA</span>
                </div>
                <span className="font-bold text-sm text-gray-900">DesignAuto</span>
              </div>
              
              <div className="flex justify-center gap-4 mb-2">
                <Link href="/sobre" className="text-xs text-gray-600 hover:text-blue-600">Sobre</Link>
                <Link href="/colaboradores" className="text-xs text-gray-600 hover:text-blue-600">Colaboradores</Link>
                <Link href="/termos" className="text-xs text-gray-600 hover:text-blue-600">Termos</Link>
                <Link href="/faq" className="text-xs text-gray-600 hover:text-blue-600">FAQ</Link>
              </div>
              
              <div className="flex justify-center gap-3 mb-2">
                <a href="https://www.instagram.com/designauto.oficial/" target="_blank" rel="noopener noreferrer"
                   className="text-gray-400 hover:text-pink-500 transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer"
                   className="text-gray-400 hover:text-green-500 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-200 pt-2 mt-4 text-center">
            <p className="text-xs text-gray-500">
              © 2024 DesignAuto. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default FixedFooter;