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
                    className="border-blue-100 hover:border-blue-200 hover:bg-blue-50 rounded-full p-0 flex items-center bg-[#0f1729] text-white pl-3 pr-2 h-10 overflow-hidden"
                  >
                    <span className="mr-2 whitespace-nowrap font-medium">Meu Perfil</span>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    {user.profileimageurl ? (
                      <img 
                        src={user.profileimageurl} 
                        alt={user.name || user.username} 
                        className="w-8 h-8 rounded-full object-cover border-2 border-white"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-300 text-[#0f1729] font-medium border-2 border-white">
                        {(user.name?.[0] || user.username[0]).toUpperCase()}
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 mr-2 mt-1 p-0 rounded-xl shadow-xl" align="end">
                  {/* Banner de status de membro no topo */}
                  <div className="w-full bg-green-100 py-2 px-4 text-center rounded-t-xl">
                    <p className="text-green-700 font-medium">
                      {user.nivelacesso === 'usuario' || !user.tipoplano ? 'MEMBRO GRÁTIS' : `MEMBRO ${user.tipoplano?.toUpperCase()}`}
                    </p>
                  </div>
                  
                  {/* Informações do usuário */}
                  <div className="flex items-center p-4 border-b">
                    <div className="w-14 h-14 mr-3 rounded-full overflow-hidden bg-gray-200">
                      {user.profileimageurl ? (
                        <img 
                          src={user.profileimageurl} 
                          alt={user.name || user.username} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-medium">
                          {(user.name?.[0] || user.username[0]).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-base">{user.name || user.username}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  
                  {/* Opção de tema escuro - Como na referência */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center">
                      <Moon className="w-5 h-5 mr-3 text-gray-600" />
                      <span>Modo escuro</span>
                    </div>
                    <div className="w-12 h-6 bg-gray-200 rounded-full relative">
                      {/* Botão apenas para visual, sem funcionalidade real ainda */}
                      <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                    </div>
                  </div>
                  
                  {/* Menu de opções */}
                  <div className="py-2">
                    <Link href="/painel/perfil">
                      <DropdownMenuItem className="cursor-pointer py-3 px-4">
                        <User className="w-5 h-5 mr-3 text-gray-600" />
                        <span>Minha conta</span>
                      </DropdownMenuItem>
                    </Link>
                    
                    {user.nivelacesso === 'usuario' || !user.tipoplano ? (
                      <Link href="/pricing">
                        <DropdownMenuItem className="cursor-pointer py-3 px-4">
                          <CreditCard className="w-5 h-5 mr-3 text-gray-600" />
                          <span className="flex-1">Cobrança</span>
                          <Badge variant="outline" className="bg-green-100 border-green-200 text-green-700 text-xs">UPGRADE</Badge>
                        </DropdownMenuItem>
                      </Link>
                    ) : (
                      <Link href="/painel/assinatura">
                        <DropdownMenuItem className="cursor-pointer py-3 px-4">
                          <CreditCard className="w-5 h-5 mr-3 text-gray-600" />
                          <span>Assinatura</span>
                        </DropdownMenuItem>
                      </Link>
                    )}
                    
                    <Link href="/painel/downloads">
                      <DropdownMenuItem className="cursor-pointer py-3 px-4">
                        <Download className="w-5 h-5 mr-3 text-gray-600" />
                        <span className="flex-1">Downloads</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {user.nivelacesso === 'premium' || user.tipoplano 
                            ? '∞' 
                            : `${userStats?.totalDownloads || 0}/10 DIA`}
                        </span>
                      </DropdownMenuItem>
                    </Link>
                    
                    <Link href="/painel/favoritas">
                      <DropdownMenuItem className="cursor-pointer py-3 px-4">
                        <Heart className="w-5 h-5 mr-3 text-gray-600" />
                        <span>Curtidas</span>
                      </DropdownMenuItem>
                    </Link>
                    
                    <Link href="/painel/salvos">
                      <DropdownMenuItem className="cursor-pointer py-3 px-4">
                        <Bookmark className="w-5 h-5 mr-3 text-gray-600" />
                        <span>Salvos</span>
                      </DropdownMenuItem>
                    </Link>
                    
                    <Link href="/painel/seguindo">
                      <DropdownMenuItem className="cursor-pointer py-3 px-4">
                        <Users className="w-5 h-5 mr-3 text-gray-600" />
                        <span>Seguindo</span>
                      </DropdownMenuItem>
                    </Link>
                    
                    {/* Link para o programa de afiliados */}
                    <Link href="/painel/afiliados">
                      <DropdownMenuItem className="cursor-pointer py-3 px-4">
                        <LinkIcon className="w-5 h-5 mr-3 text-gray-600" />
                        <span>Afiliado</span>
                      </DropdownMenuItem>
                    </Link>
                  </div>
                  
                  {/* Seção de Suporte */}
                  <div className="border-t">
                    <Link href="https://wa.me/5527999999999" target="_blank" rel="noopener noreferrer">
                      <DropdownMenuItem className="cursor-pointer py-3 px-4 flex items-center">
                        <div className="w-5 h-5 mr-3 text-green-500 flex-shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.6 6.32c-1.44-1.52-3.4-2.32-5.55-2.32-4.48 0-8.13 3.75-8.13 8.35 0 1.62.46 3.2 1.33 4.55L4.17 20.8l4.05-1.06c1.28.7 2.7 1.07 4.06 1.07 4.48 0 8.12-3.76 8.12-8.35s-2.14-6.14-2.8-6.14z" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span>Suporte por WhatsApp</span>
                          <span className="text-xs text-gray-500">Dúvidas e perguntas</span>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                  </div>
                  
                  {/* Logout */}
                  <div className="border-t">
                    <DropdownMenuItem 
                      className="cursor-pointer py-3 px-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => logoutMutation.mutate()}
                    >
                      <LogOut className="w-5 h-5 mr-3" />
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