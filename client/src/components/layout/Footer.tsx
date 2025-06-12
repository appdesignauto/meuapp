import { Link } from "wouter";
import { Heart, Instagram, MessageCircle } from "lucide-react";
import { SiTiktok, SiPinterest } from "react-icons/si";
import ReportForm from "../reports/ReportForm";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Mobile Layout (< 768px) */}
        <div className="block md:hidden py-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DA</span>
              </div>
              <span className="font-bold text-lg text-gray-900">DesignAuto</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-4 px-4">
              Criado com <Heart className="inline w-4 h-4 text-red-500 fill-current" /> por apaixonados por design.
              Recursos gráficos incríveis para inspirar criatividade.
            </p>
          </div>

          {/* Links móveis em grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">EMPRESA</h3>
              <div className="space-y-2">
                <Link href="/sobre" className="block text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Sobre
                </Link>
                <Link href="/planos" className="block text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Planos
                </Link>
                <Link href="/duvidas" className="block text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Dúvidas
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">LEGAL</h3>
              <div className="space-y-2">
                <Link href="/termos" className="block text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Termos
                </Link>
                <Link href="/privacidade" className="block text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Privacidade
                </Link>
                <ReportForm />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">PARCERIA</h3>
              <div className="space-y-2">
                <Link href="/colaboradores" className="block text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Colaborar
                </Link>
                <Link href="/afiliacao" className="block text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Afiliação
                </Link>
                <Link href="/suporte" className="block text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Suporte
                </Link>
              </div>
            </div>
          </div>

          {/* Redes sociais móveis */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <a 
              href="https://wa.me/5511999999999" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-green-500 transition-colors p-2"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            <a 
              href="https://instagram.com/designauto.oficial" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-pink-500 transition-colors p-2"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a 
              href="https://tiktok.com/@designauto.oficial" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-black transition-colors p-2"
              aria-label="TikTok"
            >
              <SiTiktok className="w-5 h-5" />
            </a>
            <a 
              href="https://pinterest.com/designauto" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-red-600 transition-colors p-2"
              aria-label="Pinterest"
            >
              <SiPinterest className="w-5 h-5" />
            </a>
          </div>

          {/* Copyright móvel */}
          <div className="text-center text-gray-500 text-xs border-t border-gray-200 pt-4">
            © DesignAuto 2025 - DESIGNAUTO.COM.BR LTDA
            <br />
            CNPJ 37.561.761/0001-0
          </div>
        </div>

        {/* Tablet Layout (768px - 1023px) */}
        <div className="hidden md:block lg:hidden py-6">
          <div className="flex flex-col space-y-6 mb-6">
            {/* Logo centralizado para tablet */}
            <div className="text-center">
              <div className="flex justify-center items-center mb-3">
                <img 
                  src="/images/logos/logo_1746071698944.png" 
                  alt="DesignAuto"
                  className="h-6 w-auto"
                />
              </div>
              <p className="text-gray-600 text-sm leading-relaxed max-w-lg mx-auto">
                Sua plataforma completa para criação de materiais de marketing automotivo profissionais e impactantes.
              </p>
            </div>

            {/* Grid 3 colunas para tablet */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm tracking-wide">EMPRESA</h3>
                <div className="space-y-2">
                  <Link href="/sobre" className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Sobre
                  </Link>
                  <Link href="/planos" className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Planos
                  </Link>
                  <Link href="/duvidas" className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Dúvidas
                  </Link>
                </div>
              </div>

              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm tracking-wide">LEGAL</h3>
                <div className="space-y-2">
                  <Link href="/termos" className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Termos
                  </Link>
                  <Link href="/privacidade" className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Privacidade
                  </Link>
                  <div className="block">
                    <ReportForm />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm tracking-wide">PARCERIA</h3>
                <div className="space-y-2">
                  <Link href="/colaboradores" className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Colaborar
                  </Link>
                  <Link href="/afiliacao" className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Afiliação
                  </Link>
                  <Link href="/suporte" className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Suporte
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright e redes sociais tablet */}
          <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
            <div className="text-gray-500 text-xs">
              © DesignAuto 2025 - DESIGNAUTO.COM.BR LTDA - CNPJ 37.561.761/0001-0
            </div>
            <div className="flex space-x-3">
              <a href="https://instagram.com/designauto.oficial" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors duration-200" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://www.tiktok.com/@designauto.oficial" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors duration-200" aria-label="TikTok">
                <SiTiktok className="h-4 w-4" />
              </a>
              <a href="https://pinterest.com/designauto" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition-colors duration-200" aria-label="Pinterest">
                <SiPinterest className="h-4 w-4" />
              </a>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 transition-colors duration-200" aria-label="WhatsApp">
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Desktop Layout (≥ 1024px) */}
        <div className="hidden lg:block py-6">
          {/* Container Principal Desktop */}
          <div className="flex justify-between items-start mb-6">
            
            {/* Logo e Descrição - Lado Esquerdo */}
            <div className="max-w-sm">
              <div className="flex items-center mb-3">
                <img 
                  src="/images/logos/logo_1746071698944.png" 
                  alt="DesignAuto"
                  className="h-6 w-auto"
                />
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Sua plataforma completa para criação de materiais de marketing automotivo profissionais e impactantes.
              </p>
            </div>

            {/* Colunas de Links - Lado Direito */}
            <div className="flex gap-16">
              
              {/* EMPRESA */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm tracking-wide">EMPRESA</h3>
                <div className="space-y-2">
                  <Link href="/sobre" className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Sobre
                  </Link>
                  <Link href="/planos" className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Planos
                  </Link>
                  <Link href="/duvidas" className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Dúvidas
                  </Link>
                </div>
              </div>

              {/* LEGAL */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm tracking-wide">LEGAL</h3>
                <div className="space-y-2">
                  <Link href="/termos" className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Termos
                  </Link>
                  <Link href="/privacidade" className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Privacidade
                  </Link>
                  <div className="block">
                    <ReportForm />
                  </div>
                </div>
              </div>

              {/* PARCERIA */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm tracking-wide">PARCERIA</h3>
                <div className="space-y-2">
                  <Link href="/colaboradores" className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Colaborar
                  </Link>
                  <Link href="/afiliacao" className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Afiliação
                  </Link>
                  <Link href="/suporte" className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Suporte
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright e Redes Sociais - Desktop */}
          <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
            <div className="text-gray-500 text-xs">
              © DesignAuto 2025 - DESIGNAUTO.COM.BR LTDA - CNPJ 37.561.761/0001-0
            </div>
            
            {/* Redes Sociais Desktop */}
            <div className="flex space-x-3">
              <a 
                href="https://instagram.com/designauto.oficial" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-500 transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="https://www.tiktok.com/@designauto.oficial" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-black transition-colors duration-200"
                aria-label="TikTok"
              >
                <SiTiktok className="h-4 w-4" />
              </a>
              <a 
                href="https://pinterest.com/designauto" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                aria-label="Pinterest"
              >
                <SiPinterest className="h-4 w-4" />
              </a>
              <a 
                href="https://wa.me/5511999999999" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-500 transition-colors duration-200"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;