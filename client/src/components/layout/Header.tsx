import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { 
  Car,
  Menu,
  User,
  LogOut
} from 'lucide-react';
import MobileMenu from './MobileMenu';
import { useQuery } from '@tanstack/react-query';

// Componente para exibir o logo do site com base nas configurações
type LogoImageProps = { 
  siteSettings: any 
};

const LogoImage = ({ siteSettings }: LogoImageProps) => {
  // Usar o logo das configurações do site ou o padrão se não existir
  const logoUrl = siteSettings?.logoUrl || '/images/logo.png';
  
  return (
    <img 
      src={logoUrl} 
      alt="DesignAuto Logo" 
      className="h-full object-contain"
    />
  );
};

// Links de navegação
const defaultNavLinks = [
  { label: 'Início', path: '/' },
  { label: 'Categorias', path: '/categorias' },
  { label: 'Como Funciona', path: '/como-funciona' },
  { label: 'Planos', path: '/planos' },
  { label: 'Suporte', path: '/suporte' }
];

// Links adicionais baseados no papel do usuário
const roleBasedLinks: Record<string, { label: string, path: string }[]> = {
  usuario: [
    { label: 'Painel', path: '/painel/inicio' },
  ],
  premium: [
    { label: 'Painel', path: '/painel/inicio' },
  ],
  designer: [
    { label: 'Painel', path: '/painel/inicio' },
    { label: 'Gerenciar Artes', path: '/painel/designer/artes' },
  ],
  designer_adm: [
    { label: 'Painel', path: '/painel/inicio' },
    { label: 'Gerenciar Artes', path: '/painel/designer/artes' },
    { label: 'Usuários', path: '/painel/designer/usuarios' },
  ],
  admin: [
    { label: 'Painel', path: '/painel/inicio' },
    { label: 'Administração', path: '/painel/admin/dashboard' },
  ]
};

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  // Buscar configurações do site
  const { data: siteSettings } = useQuery({
    queryKey: ['/api/site-settings'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/site-settings');
        if (!res.ok) return { logoUrl: '/images/logo.png' };
        return await res.json();
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
        return { logoUrl: '/images/logo.png' };
      }
    },
  });

  // Determinar os links de navegação baseados no papel do usuário
  let navLinks = [...defaultNavLinks];
  if (user?.role && roleBasedLinks[user.role]) {
    navLinks = [...defaultNavLinks, ...roleBasedLinks[user.role]];
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm backdrop-blur-sm bg-white/95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 sm:h-[4.5rem] md:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="h-11 sm:h-12 md:h-14 w-[200px] sm:w-[220px] flex items-center">
                <LogoImage siteSettings={siteSettings} />
              </div>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-neutral-600 hover:text-blue-600 font-medium text-[13px] px-3 py-2 rounded-md transition-all duration-200 hover:bg-blue-50 ${
                  location === link.path ? 'text-blue-600 bg-blue-50' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side - User Controls */}
          <div className="flex items-center">
            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              className="md:hidden mr-2 h-8 w-8 p-0 rounded-md"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-[18px] w-[18px]" />
            </Button>

            {user ? (
              <div className="flex items-center space-x-2">
                <Link href="/painel/perfil">
                  <Button 
                    variant="ghost" 
                    className="p-0 h-9 flex items-center rounded-full pl-1.5 pr-2 space-x-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                  >
                    {user.profileimageurl ? (
                      <img 
                        src={user.profileimageurl} 
                        alt={user.name || user.username} 
                        className="w-7 h-7 rounded-full object-cover border border-blue-100"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 font-medium">
                        {(user.name?.[0] || user.username?.[0] || '?').toUpperCase()}
                      </div>
                    )}
                    <div className="hidden sm:flex flex-col items-start leading-none">
                      <span className="text-xs font-medium text-gray-800">{user.name || user.username}</span>
                      <span className="text-[10px] text-gray-500 mt-0.5">
                        {user.nivelacesso === 'usuario' || !user.tipoplano 
                          ? 'Conta Free' 
                          : `Conta ${user.tipoplano}`}
                      </span>
                    </div>
                  </Button>
                </Link>
                
                <Button 
                  variant="ghost"
                  className="ml-2 px-2 h-9 text-gray-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (logoutMutation) {
                      logoutMutation.mutate();
                    }
                  }}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 h-9 rounded-full shadow-sm"
                  >
                    Entrar
                  </Button>
                </Link>
                <Link href="/auth?tab=register" className="hidden sm:block">
                  <Button 
                    variant="ghost" 
                    className="text-xs px-3 h-9 rounded-full text-neutral-700 hover:text-blue-600 hover:bg-blue-50"
                  >
                    Cadastre-se
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        navLinks={navLinks} 
        userRole={user?.role}
      />
    </header>
  );
};

export default Header;