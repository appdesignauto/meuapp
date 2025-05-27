import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SHOW_SEARCHBAR_EVENT, HIDE_SEARCHBAR_EVENT } from '@/components/home/Hero';
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
  PlayCircle,
  Home,
  Library,
  MessageSquare,
  PackageOpen,
  LifeBuoy,
  Wrench,
  MoreHorizontal
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
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  // Verificar se estamos na página de videoaulas ou outras páginas
  const isVideoaulasPage = location.startsWith('/videoaulas');
  // Verificar se estamos na página inicial (home)
  const isHomePage = location === '/';
  
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
  
  // Não usamos mais o setInterval para polling constante
  // Agora usando um tempo de staleTime adequado e atualizações apenas quando necessário
  
  // Forçar recarregamento imediato das configurações ao subir um novo logo
  useEffect(() => {
    // Função para lidar com o evento de atualização do logo
    const handleLogoUpdated = (event: Event) => {
      console.log("Logo atualizado, atualizando configurações sem recarregar...");
      
      // Extrair detalhes do evento customizado
      const customEvent = event as CustomEvent<{logoUrl: string, timestamp: number}>;
      
      // Forçar recarregar as configurações imediatamente
      setSettingsRefreshCounter(prev => prev + 1000); // Valor alto para garantir nova consulta
    };
    
    // Adicionar listener para o evento customizado 'logo-updated'
    window.addEventListener('logo-updated', handleLogoUpdated);
    
    return () => {
      // Remover listener quando componente for desmontado
      window.removeEventListener('logo-updated', handleLogoUpdated);
    };
  }, []);
  
  // Buscamos as configurações do site com um mecanismo para atualização do logo
  const { data: siteSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['/api/site-settings', settingsRefreshCounter],
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
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 10, // 10 minutos - só busca dados novos após este período
    cacheTime: 1000 * 60 * 20  // 20 minutos de cache
  });
  
  // Adicionar um listener global para a API de atualização de logo
  useEffect(() => {
    // Função para forçar recarregamento das configurações
    const forceRefreshSettings = () => {
      console.log("Detectada mudança no logo, recarregando configurações...");
      refetchSettings();
      setSettingsRefreshCounter(prev => prev + 1);
    };
    
    // Adicionar listener de evento global
    window.addEventListener('logo-updated', forceRefreshSettings);
    window.addEventListener('logo-removed', forceRefreshSettings);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        forceRefreshSettings();
      }
    });
    
    return () => {
      window.removeEventListener('logo-updated', forceRefreshSettings);
      window.removeEventListener('logo-removed', forceRefreshSettings);
      document.removeEventListener('visibilitychange', forceRefreshSettings);
    };
  }, [refetchSettings]);
  
  // Adicionar os eventos para mostrar/ocultar a barra de pesquisa no cabeçalho
  useEffect(() => {
    const handleShowSearch = () => {
      setShowHeaderSearch(true);
    };
    
    const handleHideSearch = () => {
      setShowHeaderSearch(false);
    };
    
    // Adicionar listeners para os eventos customizados
    document.addEventListener(SHOW_SEARCHBAR_EVENT, handleShowSearch);
    document.addEventListener(HIDE_SEARCHBAR_EVENT, handleHideSearch);
    
    return () => {
      document.removeEventListener(SHOW_SEARCHBAR_EVENT, handleShowSearch);
      document.removeEventListener(HIDE_SEARCHBAR_EVENT, handleHideSearch);
    };
  }, []);
  
  // Função para lidar com a submissão do formulário de pesquisa no cabeçalho
  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/artes?search=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  // Função para lidar com a submissão da pesquisa de videoaulas
  const handleVideoSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (videoSearchQuery.trim()) {
      // Define o termo de pesquisa como parâmetro de consulta e mantém na página de videoaulas
      window.dispatchEvent(new CustomEvent('video-search', { 
        detail: { searchTerm: videoSearchQuery }
      }));
    }
  };

  const navLinks = [
    { name: 'Início', path: '/', icon: <Home className="h-5 w-5" /> },
    { name: 'Categorias', path: '/categorias', icon: <Library className="h-5 w-5" /> },
    { name: 'Comunidade', path: '/comunidade', icon: <MessageSquare className="h-5 w-5" /> },
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

          {/* Barra de pesquisa flutuante - aparece apenas na página inicial quando rolar para baixo */}
          <div className={`absolute left-1/2 transform -translate-x-1/2 w-[500px] max-w-[calc(100%-220px)] z-10 transition-all duration-300 ease-in-out ${
            showHeaderSearch && isHomePage
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}>
            <form 
              onSubmit={handleHeaderSearch}
              className="hidden md:flex w-full"
              id="header-search-bar"
            >
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder="Busque por artes, modelos, campanhas..."
                  className="w-full pr-10 py-2 rounded-full border border-blue-200 shadow-md focus-visible:ring-blue-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                  id="header-search-input"
                />
                <button 
                  type="submit" 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-500 hover:text-blue-600"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
          
          {/* Navigation - Desktop */}
          <nav className={`hidden md:flex items-center space-x-1 transition-opacity duration-300 ${
            showHeaderSearch && isHomePage ? 'opacity-0' : 'opacity-100'
          }`}>
            {/* Links principais - ocultar Categorias quando na seção Video Aulas */}
            {navLinks.map((link) => {
                // Ocultar link de Categorias quando na página de videoaulas
                if (isVideoaulasPage && link.path === '/categorias') {
                  return null;
                }
                
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`text-neutral-600 hover:text-blue-600 font-medium text-[13px] px-3 py-2 rounded-md transition-all duration-200 hover:bg-blue-50 ${
                      location === link.path 
                        ? 'text-blue-600 bg-blue-50/80' 
                        : isVideoaulasPage && link.path === '/videoaulas'
                          ? 'text-blue-600 font-semibold' 
                          : ''
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              
            {/* Dropdown Recursos */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-neutral-600 hover:text-blue-600 font-medium text-[13px] px-3 py-2 rounded-md transition-all duration-200 hover:bg-blue-50 flex items-center">
                  Recursos
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-1 p-2">
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/videoaulas" className="flex items-center cursor-pointer">
                      <PlayCircle className="mr-2 h-4 w-4 text-blue-500" />
                      <span>Vídeo Aulas</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/ferramentas" className="flex items-center cursor-pointer">
                      <Wrench className="mr-2 h-4 w-4 text-blue-500" />
                      <span>Ferramentas</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/suporte" className="flex items-center cursor-pointer">
                      <LifeBuoy className="mr-2 h-4 w-4 text-blue-500" />
                      <span>Suporte</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {/* Barra de pesquisa para videoaulas - apenas aparece na página de videoaulas */}
            {isVideoaulasPage && (
              <form 
                onSubmit={handleVideoSearch}
                className="hidden md:flex w-80 mr-3"
              >
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-neutral-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Buscar Vídeo Aulas..."
                    className="w-full pl-10 pr-4 py-2 rounded-full border border-blue-200 text-sm"
                    value={videoSearchQuery}
                    onChange={(e) => setVideoSearchQuery(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </form>
            )}
            
            {/* Link para busca geral (só com ícone de lupa) - Visível apenas em telas médias e maiores, e não na página de videoaulas */}
            {!isVideoaulasPage && (
              <Button 
                variant="ghost" 
                size="icon"
                className="hidden md:flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:text-blue-600 hover:bg-blue-50"
                onClick={() => setLocation('/artes')}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}

            {user && user.nivelacesso !== 'premium' && (
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
            {user && (user.nivelacesso === 'admin' || user.nivelacesso === 'designer_adm') && (
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
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
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 mr-2 mt-1 p-0 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto" align="end">
                  {/* Informações do usuário com banner de status incorporado */}
                  <div className="relative">
                    {/* Banner colorido no fundo que depende do tipo de conta */}
                    <div className={`absolute top-0 left-0 right-0 h-20 rounded-t-xl ${
                      user.nivelacesso === 'usuario' || !user.tipoplano 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                        : 'bg-gradient-to-r from-green-500 to-green-600'
                    }`}></div>
                  
                    {/* Container do perfil com espaçamento para ficar sobre o banner */}
                    <div className="relative z-10 px-4 pt-4 pb-3">
                      {/* Avatar grande */}
                      <div className="w-20 h-20 mb-3 mx-auto rounded-full overflow-hidden border-4 border-white bg-white shadow-md">
                        {user.profileimageurl ? (
                          <img 
                            src={user.profileimageurl} 
                            alt={user.name || user.username} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-medium text-3xl">
                            {(user.name?.[0] || user.username?.[0] || '?').toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      {/* Dados do usuário centralizados */}
                      <div className="text-center">
                        <h3 className="font-medium text-lg">{user.name || user.username}</h3>
                        <p className="text-sm text-gray-500 mb-2">{user.email}</p>
                        
                        {/* Badge de tipo de conta */}
                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          user.nivelacesso === 'usuario' || !user.tipoplano 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {user.nivelacesso === 'usuario' || !user.tipoplano 
                            ? 'CONTA GRÁTIS' 
                            : `CONTA ${user.tipoplano?.toUpperCase()}`}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu de opções */}
                  <div className="py-2">
                    <Link href="/painel/perfil">
                      <DropdownMenuItem className="cursor-pointer py-3 px-4 hover:bg-gray-50">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-50 mr-3">
                          <User className="w-4.5 h-4.5 text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">Minha conta</span>
                          <span className="text-xs text-gray-500">Perfil, privacidade e dados</span>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                    
                    {user.nivelacesso === 'usuario' || !user.tipoplano ? (
                      <Link href="/planos">
                        <DropdownMenuItem className="cursor-pointer py-3 px-4 hover:bg-gray-50">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-green-50 mr-3">
                            <CreditCard className="w-4.5 h-4.5 text-green-600" />
                          </div>
                          <div className="flex flex-col flex-1">
                            <span className="font-medium">Assinatura</span>
                            <span className="text-xs text-gray-500">Fazer upgrade</span>
                          </div>
                          <Badge variant="outline" className="bg-green-100 border-green-200 text-green-700 text-xs">UPGRADE</Badge>
                        </DropdownMenuItem>
                      </Link>
                    ) : (
                      <Link href="/painel/assinatura">
                        <DropdownMenuItem className="cursor-pointer py-3 px-4 hover:bg-gray-50">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-50 mr-3">
                            <CreditCard className="w-4.5 h-4.5 text-blue-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">Assinatura</span>
                            <span className="text-xs text-gray-500">Gerenciar sua assinatura</span>
                          </div>
                        </DropdownMenuItem>
                      </Link>
                    )}
                    
                    <Link href="/painel/downloads">
                      <DropdownMenuItem className="cursor-pointer py-3 px-4 hover:bg-gray-50">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-purple-50 mr-3">
                          <Download className="w-4.5 h-4.5 text-purple-600" />
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="font-medium">Downloads</span>
                          <span className="text-xs text-gray-500">Histórico de downloads</span>
                        </div>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700 font-medium">
                          {user.nivelacesso === 'premium' || user.tipoplano 
                            ? '∞' 
                            : `${userStats?.totalDownloads || 0}/10`}
                        </span>
                      </DropdownMenuItem>
                    </Link>
                    
                    <Link href="/painel/favoritas">
                      <DropdownMenuItem className="cursor-pointer py-3 px-4 hover:bg-gray-50">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-red-50 mr-3">
                          <Heart className="w-4.5 h-4.5 text-red-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">Curtidas</span>
                          <span className="text-xs text-gray-500">Seus itens favoritos</span>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                    
                    <Link href="/painel/salvos">
                      <DropdownMenuItem className="cursor-pointer py-3 px-4 hover:bg-gray-50">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-yellow-50 mr-3">
                          <Bookmark className="w-4.5 h-4.5 text-yellow-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">Salvos</span>
                          <span className="text-xs text-gray-500">Artes para usar depois</span>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                    
                    <Link href="/painel/seguindo">
                      <DropdownMenuItem className="cursor-pointer py-3 px-4 hover:bg-gray-50">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-indigo-50 mr-3">
                          <Users className="w-4.5 h-4.5 text-indigo-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">Seguindo</span>
                          <span className="text-xs text-gray-500">Designers que você segue</span>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                  </div>
                  
                  {/* Seção de Suporte */}
                  <div className="border-t pt-2 pb-2">
                    <Link href="https://wa.me/5527999999999" target="_blank" rel="noopener noreferrer">
                      <DropdownMenuItem className="cursor-pointer py-3 px-4 hover:bg-gray-50">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-green-50 mr-3">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.6 6.32c-1.44-1.52-3.4-2.32-5.55-2.32-4.48 0-8.13 3.75-8.13 8.35 0 1.62.46 3.2 1.33 4.55L4.17 20.8l4.05-1.06c1.28.7 2.7 1.07 4.06 1.07 4.48 0 8.12-3.76 8.12-8.35s-2.14-6.14-2.8-6.14z" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">Suporte por WhatsApp</span>
                          <span className="text-xs text-gray-500">Dúvidas e perguntas</span>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                  </div>
                  
                  {/* Logout */}
                  <div className="border-t pt-2 pb-2">
                    <DropdownMenuItem 
                      className="cursor-pointer py-3 px-4 hover:bg-red-50"
                      onClick={() => logoutMutation.mutate()}
                    >
                      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-red-50 mr-3">
                        <LogOut className="w-4.5 h-4.5 text-red-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-red-600">Sair da conta</span>
                        <span className="text-xs text-gray-500">Encerrar sessão atual</span>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 h-9 rounded-full shadow-sm"
                  >
                    Entrar
                  </Button>
                </Link>
                <Link href="/register" className="hidden sm:block">
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