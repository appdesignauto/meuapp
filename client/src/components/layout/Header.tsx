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
            
            {/* Link para painel do usuário */}
            {user && (
              <Link href="/painel/inicio" className="text-neutral-700 hover:text-blue-600 hidden sm:inline-flex items-center transition-colors duration-200">
                <User className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm font-medium">Meu Painel</span>
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
                    className="border-blue-100 hover:border-blue-200 hover:bg-blue-50 rounded-full p-0 w-10 h-10 overflow-hidden"
                  >
                    {user.profileimageurl ? (
                      <img 
                        src={user.profileimageurl} 
                        alt={user.name || user.username} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-medium">
                        {(user.name?.[0] || user.username[0]).toUpperCase()}
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mr-2 mt-1" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="font-medium text-sm">{user.name || user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuGroup>
                    <TooltipProvider>
                      {/* Assinatura - Diferente para free e premium */}
                      {user.nivelacesso === 'usuario' || !user.tipoplano ? (
                        <Link href="/pricing">
                          <DropdownMenuItem className="cursor-pointer">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center">
                                <Crown className="mr-2 h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-600">Assinatura (UPGRADE)</span>
                              </div>
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Free</Badge>
                            </div>
                          </DropdownMenuItem>
                        </Link>
                      ) : (
                        <Link href="/painel/assinatura">
                          <DropdownMenuItem className="cursor-pointer">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center">
                                <CreditCard className="mr-2 h-4 w-4" />
                                <span>Assinatura (Gerenciar)</span>
                              </div>
                              <Badge className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200">{user.tipoplano}</Badge>
                            </div>
                          </DropdownMenuItem>
                        </Link>
                      )}
                      
                      {/* Downloads com limite visual */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href="/painel/downloads">
                            <DropdownMenuItem className="cursor-pointer">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center">
                                  <Download className="mr-2 h-4 w-4" />
                                  <span>Downloads</span>
                                </div>
                                {user.nivelacesso === 'premium' || user.tipoplano ? (
                                  <div className="flex items-center text-blue-600">
                                    <Infinity className="h-4 w-4" />
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">{userStats?.totalDownloads || 0}/10</span>
                                )}
                              </div>
                            </DropdownMenuItem>
                          </Link>
                        </TooltipTrigger>
                        {user.nivelacesso === 'usuario' || !user.tipoplano ? (
                          <TooltipContent>
                            <p>Limite de downloads para contas Free: 10/mês</p>
                          </TooltipContent>
                        ) : null}
                      </Tooltip>
                      
                      {/* Favoritos */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href="/painel/favoritas">
                            <DropdownMenuItem className="cursor-pointer">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center">
                                  <Heart className="mr-2 h-4 w-4" />
                                  <span>Favoritos</span>
                                </div>
                                {user.nivelacesso === 'premium' || user.tipoplano ? (
                                  <div className="flex items-center text-blue-600">
                                    <Infinity className="h-4 w-4" />
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">{userStats?.totalFavorites || 0}/20</span>
                                )}
                              </div>
                            </DropdownMenuItem>
                          </Link>
                        </TooltipTrigger>
                        {user.nivelacesso === 'usuario' || !user.tipoplano ? (
                          <TooltipContent>
                            <p>Limite de favoritos para contas Free: 20</p>
                          </TooltipContent>
                        ) : null}
                      </Tooltip>
                      
                      {/* Configurações */}
                      <Link href="/painel/perfil">
                        <DropdownMenuItem className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Meu Perfil</span>
                        </DropdownMenuItem>
                      </Link>
                    </TooltipProvider>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Logout */}
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
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
