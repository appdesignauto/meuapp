import { useState } from 'react';
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
    <header className="sticky top-0 z-50 bg-white border-b border-blue-100 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img 
                src="/assets/LOGO DESIGNAUTO.png" 
                alt="DesignAuto App" 
                className="h-12 mr-2" 
              />
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-neutral-700 hover:text-blue-600 font-medium text-sm uppercase tracking-wider transition-colors duration-200 ${
                  location === link.path ? 'text-blue-600 border-b-2 border-blue-500 pb-1' : ''
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user && user.role !== 'premium' && (
              <Link href="/pricing" className="text-neutral-700 hover:text-blue-600 hidden sm:inline-flex items-center transition-colors duration-200">
                <Crown className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm font-medium">Assinar Premium</span>
              </Link>
            )}
            
            {/* Link para painel administrativo - mostrado apenas para admin */}
            {user && (user.role === 'admin' || user.role === 'designer_adm') && (
              <Link href="/admin" className="text-neutral-700 hover:text-blue-600 hidden sm:inline-flex items-center transition-colors duration-200">
                <LayoutDashboard className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm font-medium">Painel Admin</span>
              </Link>
            )}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-none hover:bg-gray-100 rounded-full p-0 flex items-center pl-2 pr-2 h-12 space-x-2 overflow-hidden shadow-sm transition-all duration-200"
                  >
                    {user.profileimageurl ? (
                      <img 
                        src={user.profileimageurl} 
                        alt={user.name || user.username} 
                        className="w-9 h-9 rounded-full object-cover border-[3px] border-blue-100"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 font-medium">
                        {(user.name?.[0] || user.username[0]).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-sm font-medium text-gray-800">{user.name || user.username}</span>
                      <span className="text-xs text-gray-500 mt-0.5">
                        {user.nivelacesso === 'usuario' || !user.tipoplano 
                          ? 'Conta Free' 
                          : `Conta ${user.tipoplano}`}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mr-2 mt-1 p-0 rounded-lg shadow-md" align="end">
                  {/* Informações do usuário - Visual simplificado */}
                  <div className="p-4 border-b">
                    <div className="flex items-center">
                      {/* Avatar menor */}
                      <div className="w-12 h-12 mr-3 rounded-full overflow-hidden border border-gray-200 bg-white">
                        {user.profileimageurl ? (
                          <img 
                            src={user.profileimageurl} 
                            alt={user.name || user.username} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-medium text-xl">
                            {(user.name?.[0] || user.username[0]).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      {/* Dados do usuário alinhados à esquerda */}
                      <div>
                        <h3 className="font-medium text-base leading-tight">{user.name || user.username}</h3>
                        <p className="text-xs text-gray-500 mb-1">{user.email}</p>
                        
                        {/* Badge de tipo de conta */}
                        <div className={`inline-block px-2 py-0.5 rounded text-xs ${
                          user.nivelacesso === 'usuario' || !user.tipoplano 
                            ? 'bg-gray-100 text-gray-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {user.nivelacesso === 'usuario' || !user.tipoplano 
                            ? 'Conta Free' 
                            : `${user.tipoplano}`}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu de opções - Versão minimalista */}
                  <div className="py-1">
                    <Link href="/painel/perfil">
                      <DropdownMenuItem className="cursor-pointer py-2 px-3 hover:bg-gray-50">
                        <User className="w-4 h-4 text-gray-500 mr-3" />
                        <span>Minha conta</span>
                      </DropdownMenuItem>
                    </Link>
                    
                    {user.nivelacesso === 'usuario' || !user.tipoplano ? (
                      <Link href="/pricing">
                        <DropdownMenuItem className="cursor-pointer py-2 px-3 hover:bg-gray-50 flex items-center">
                          <CreditCard className="w-4 h-4 text-gray-500 mr-3" />
                          <span className="flex-1">Assinatura</span>
                          <Badge variant="outline" className="bg-green-100 border-green-200 text-green-700 text-xs">UPGRADE</Badge>
                        </DropdownMenuItem>
                      </Link>
                    ) : (
                      <Link href="/painel/assinatura">
                        <DropdownMenuItem className="cursor-pointer py-2 px-3 hover:bg-gray-50">
                          <CreditCard className="w-4 h-4 text-gray-500 mr-3" />
                          <span>Assinatura</span>
                        </DropdownMenuItem>
                      </Link>
                    )}
                    
                    <Link href="/painel/downloads">
                      <DropdownMenuItem className="cursor-pointer py-2 px-3 hover:bg-gray-50 flex items-center">
                        <Download className="w-4 h-4 text-gray-500 mr-3" />
                        <span className="flex-1">Downloads</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                          {user.nivelacesso === 'premium' || user.tipoplano 
                            ? '∞' 
                            : `${userStats?.totalDownloads || 0}/10`}
                        </span>
                      </DropdownMenuItem>
                    </Link>
                    
                    <Link href="/painel/favoritas">
                      <DropdownMenuItem className="cursor-pointer py-2 px-3 hover:bg-gray-50">
                        <Heart className="w-4 h-4 text-gray-500 mr-3" />
                        <span>Favoritos</span>
                      </DropdownMenuItem>
                    </Link>
                    
                    <Link href="/painel/salvos">
                      <DropdownMenuItem className="cursor-pointer py-2 px-3 hover:bg-gray-50">
                        <Bookmark className="w-4 h-4 text-gray-500 mr-3" />
                        <span>Salvos</span>
                      </DropdownMenuItem>
                    </Link>
                    
                    <Link href="/painel/seguindo">
                      <DropdownMenuItem className="cursor-pointer py-2 px-3 hover:bg-gray-50">
                        <Users className="w-4 h-4 text-gray-500 mr-3" />
                        <span>Seguindo</span>
                      </DropdownMenuItem>
                    </Link>
                  </div>
                  
                  {/* Separador */}
                  <div className="border-t my-1"></div>
                  
                  {/* Suporte e Logout - Versão minimalista */}
                  <div className="py-1">
                    <Link href="https://wa.me/5527999999999" target="_blank" rel="noopener noreferrer">
                      <DropdownMenuItem className="cursor-pointer py-2 px-3 hover:bg-gray-50">
                        <svg className="w-4 h-4 text-green-500 mr-3" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.6 6.32c-1.44-1.52-3.4-2.32-5.55-2.32-4.48 0-8.13 3.75-8.13 8.35 0 1.62.46 3.2 1.33 4.55L4.17 20.8l4.05-1.06c1.28.7 2.7 1.07 4.06 1.07 4.48 0 8.12-3.76 8.12-8.35s-2.14-6.14-2.8-6.14z" />
                        </svg>
                        <span>Suporte</span>
                      </DropdownMenuItem>
                    </Link>
                    
                    <DropdownMenuItem 
                      className="cursor-pointer py-2 px-3 text-red-600 hover:bg-red-50"
                      onClick={() => logoutMutation.mutate()}
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md">
                  Entrar
                </Button>
              </Link>
            )}
            
            <button
              type="button"
              className="md:hidden text-blue-600 hover:text-blue-500 transition-colors duration-200"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>
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