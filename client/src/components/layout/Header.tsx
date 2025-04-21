import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Car,
  Crown,
  Menu,
  Search,
  LayoutDashboard,
  User,
  Heart,
  Download,
  LogOut,
  CreditCard,
  Settings,
  Infinity,
  ChevronDown,
  Bookmark,
  Moon,
  Users,
  HelpCircle,
  Link as LinkIcon,
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
  
  // Adicionar um pequeno timestamp ao final para evitar cache excessivo
  const finalLogoUrl = `${logoUrl}${logoUrl.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
  
  return (
    <img 
      src={finalLogoUrl}
      alt="DesignAuto App" 
      className="h-12 w-auto max-w-[200px] sm:max-w-[230px] object-contain mr-3 transition-transform duration-200 hover:scale-105 pr-1"
      loading="eager"
      onError={(e) => {
        // Em caso de erro, carregar o logo padrão
        console.error('Erro ao carregar logo, usando padrão');
        (e.target as HTMLImageElement).src = '/images/logo.png';
      }}
    />
  );
};

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  // Buscar estatísticas do usuário para exibir no dropdown
  const { data: userStats } = useQuery({
    queryKey: ['/api/users/stats'],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch('/api/users/stats');
      if (!res.ok) return { totalFavorites: 0, totalDownloads: 0, totalViews: 0 };
      return res.json();
    },
    enabled: !!user, // Só executa se o usuário estiver logado
  });
  
  // Contador para forçar recarregamento das configurações
  const [settingsRefreshCounter, setSettingsRefreshCounter] = useState(0);
  
  // Buscamos as configurações do site sem atualização automática frequente
  const { data: siteSettings, refetch: refetchSettings } = useQuery({
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
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 60000 // Cache por 1 minuto
  });
  
  // Apenas um único listener para todos os eventos de atualização do logo
  useEffect(() => {
    // Função para forçar recarregamento das configurações
    const refreshSettings = () => {
      console.log("Atualizando configurações do site...");
      refetchSettings();
    };
    
    // Adicionar listeners para eventos de logo
    window.addEventListener('logo-updated', refreshSettings);
    window.addEventListener('logo-removed', refreshSettings);
    
    // Listener para quando a aba voltar a estar visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSettings();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      // Remover todos os listeners quando o componente for desmontado
      window.removeEventListener('logo-updated', refreshSettings);
      window.removeEventListener('logo-removed', refreshSettings);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetchSettings]);

  const navLinks = [
    { name: 'Início', path: '/' },
    { name: 'Categorias', path: '/categories' },
    { name: 'Designers', path: '/designers' },
    { name: 'Formatos', path: '/formats' },
    { name: 'Tutoriais', path: '/tutorials' },
    { name: 'Suporte', path: '/support' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm backdrop-blur-sm bg-white/95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 sm:h-[4.5rem] md:h-20">
          {/* Logo restaurado conforme solicitado */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="h-11 sm:h-12 md:h-14 w-[200px] sm:w-[220px] flex items-center">
                {/* Exibir logo utilizando o componente dedicado */}
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
                  location === link.path ? 'text-blue-600 bg-blue-50/80' : ''
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {/* Icone de Busca - Visível apenas em telas médias e maiores */}
            <Button 
              variant="ghost" 
              className="hidden md:flex w-9 h-9 rounded-full items-center justify-center p-0 text-neutral-600 hover:text-blue-600 hover:bg-blue-50"
              onClick={() => window.location.href = '/search'}
            >
              <Search className="h-[18px] w-[18px]" />
            </Button>

            {user && user.role !== 'premium' && (
              <Link href="/planos">
                <Button 
                  variant="ghost" 
                  className="hidden md:flex h-9 items-center rounded-full px-3 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 hover:text-blue-700 hover:from-blue-100 hover:to-blue-200 border border-blue-200"
                >
                  <Crown className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs font-medium">Upgrade</span>
                </Button>
              </Link>
            )}
            
            {/* Link para painel administrativo - mostrado apenas para admin */}
            {user && (user.role === 'admin' || user.role === 'designer_adm') && (
              <Link href="/admin">
                <Button 
                  variant="ghost" 
                  className="hidden md:flex h-9 items-center rounded-full px-3 bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs font-medium">Admin</span>
                </Button>
              </Link>
            )}
            
            {/* Botão do menu mobile */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-9 w-9 rounded-full ml-1 text-neutral-600 hover:bg-blue-50 hover:text-blue-600"
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
                      window.location.href = '/auth'; // Redirecionar para a página de login
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