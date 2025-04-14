import { Link } from 'wouter';
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  Linkedin, 
  Car, 
  Mail, 
  Phone, 
  Headphones 
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-neutral-100 border-t border-neutral-200">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="inline-block text-primary font-bold text-2xl mb-4">
              <div className="flex items-center">
                <Car className="mr-2" />
                <span>DesignAuto<span className="text-secondary-500">App</span></span>
              </div>
            </Link>
            <p className="text-neutral-600 mb-4">
              A maior plataforma de artes editáveis para vendedores de automóveis.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-500 hover:text-primary">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-neutral-500 hover:text-primary">
                <Instagram size={18} />
              </a>
              <a href="#" className="text-neutral-500 hover:text-primary">
                <Youtube size={18} />
              </a>
              <a href="#" className="text-neutral-500 hover:text-primary">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-neutral-800 mb-4">Navegação</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-neutral-600 hover:text-primary">Início</Link></li>
              <li><Link href="/collections" className="text-neutral-600 hover:text-primary">Coleções</Link></li>
              <li><Link href="/categories" className="text-neutral-600 hover:text-primary">Categorias</Link></li>
              <li><Link href="/formats" className="text-neutral-600 hover:text-primary">Formatos</Link></li>
              <li><Link href="/news" className="text-neutral-600 hover:text-primary">Novidades</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-neutral-800 mb-4">Informações</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-neutral-600 hover:text-primary">Sobre nós</Link></li>
              <li><Link href="/pricing" className="text-neutral-600 hover:text-primary">Preços</Link></li>
              <li><Link href="/faq" className="text-neutral-600 hover:text-primary">FAQ</Link></li>
              <li><Link href="/terms" className="text-neutral-600 hover:text-primary">Termos de Uso</Link></li>
              <li><Link href="/privacy" className="text-neutral-600 hover:text-primary">Política de Privacidade</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-neutral-800 mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Mail className="h-5 w-5 mt-0.5 mr-3 text-primary" />
                <span className="text-neutral-600">contato@designauto.app</span>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 mt-0.5 mr-3 text-primary" />
                <span className="text-neutral-600">(11) 4002-8922</span>
              </li>
              <li className="flex items-start">
                <Headphones className="h-5 w-5 mt-0.5 mr-3 text-primary" />
                <span className="text-neutral-600">Suporte: suporte@designauto.app</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-500 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} DesignAuto App. Todos os direitos reservados.
          </p>
          <div className="flex space-x-4">
            <Link href="/terms" className="text-neutral-500 hover:text-primary text-sm">Termos</Link>
            <Link href="/privacy" className="text-neutral-500 hover:text-primary text-sm">Privacidade</Link>
            <Link href="/cookies" className="text-neutral-500 hover:text-primary text-sm">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
