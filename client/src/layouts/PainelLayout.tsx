import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { RenewalBanner } from "@/components/subscription/RenewalBanner";
import {
  Home,
  Heart,
  Download,
  User,
  LogOut,
  Menu,
  X,
  Crown,
  ChevronRight,
  ChevronDown,
  Infinity,
  Users,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/use-media-query";

interface PainelLayoutProps {
  children: ReactNode;
}

export default function PainelLayout({ children }: PainelLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    // Fecha o sidebar no mobile quando mudar de rota
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      window.location.href = "/auth";
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Determina as iniciais do nome do usuário para o Avatar
  const getInitials = () => {
    if (!user?.name) return "U";
    const nameParts = user.name.split(" ");
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (
      nameParts[0].charAt(0).toUpperCase() +
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };

  // Utilizar o hook de assinatura para obter status do usuário
  const subscription = useSubscription(user);
  const { isPremium, isExpired, daysLeft, planType, isLifetime, subscriptionOrigin, expirationDate } = subscription;
  
  // Buscar estatísticas do usuário
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

  const menuItems = [
    {
      label: "Painel",
      path: "/painel/inicio",
      icon: <Home className="h-5 w-5" />,
      access: "all",
    },
    {
      label: "Meu Perfil",
      path: "/painel/perfil",
      icon: <User className="h-5 w-5" />,
      access: "all",
    },
    {
      label: "Favoritas",
      path: "/painel/favoritas",
      icon: <Heart className="h-5 w-5" />,
      access: "all",
    },
    {
      label: "Seguindo",
      path: "/painel/seguindo",
      icon: <Users className="h-5 w-5" />,
      access: "all",
    },
    {
      label: "Downloads",
      path: "/painel/downloads",
      icon: <Download className="h-5 w-5" />,
      access: "all",
    },
    {
      label: "Assinatura",
      path: "/painel/assinatura",
      icon: <CreditCard className="h-5 w-5" />,
      access: "all",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="md:hidden"
            >
              {sidebarOpen ? <X /> : <Menu />}
            </Button>
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl">Design Auto</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {isPremium ? (
              <div className="hidden sm:flex items-center">
                <Badge variant="premium" className="flex items-center gap-1">
                  <Crown className="h-3.5 w-3.5" />
                  <span>{isLifetime ? "Vitalício" : planType?.charAt(0).toUpperCase() + planType?.slice(1) || "Premium"}</span>
                </Badge>
              </div>
            ) : (
              <div className="hidden sm:block text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded-md bg-gray-100">Gratuito</span>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-1 cursor-pointer">
                  <Avatar>
                    <AvatarImage
                      src={user?.profileimageurl || ""}
                      alt={user?.name || "Usuário"}
                    />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium leading-none">{user?.name || user?.username}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <Link href="/painel/perfil">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    <span>Meu Perfil</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/painel/assinatura">
                  <DropdownMenuItem className="cursor-pointer">
                    <CreditCard className="h-4 w-4 mr-2" />
                    <span>Assinatura</span>
                    {!isPremium && (
                      <span className="ml-auto text-xs bg-green-500 text-white px-2 py-0.5 rounded font-medium">
                        UPGRADE
                      </span>
                    )}
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Banner de renovação para assinaturas expiradas */}
      <RenewalBanner 
        showBanner={isExpired || (daysLeft !== null && daysLeft <= 7)} 
        daysLeft={daysLeft}
        customMessage={isExpired ? 
          `Sua assinatura Premium expirou. Renove agora para restaurar seu acesso.` : 
          undefined
        }
      />
      
      <div className="flex flex-1">
        {/* Sidebar para Desktop */}
        <aside
          className={`hidden md:flex md:w-64 flex-col border-r p-4 bg-white dark:bg-gray-950 h-[calc(100vh-4rem)] sticky top-16`}
        >
          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex items-center space-x-3 px-3 py-3 rounded-md transition-colors hover:bg-muted ${
                  location === item.path ? "bg-muted font-medium text-primary" : "text-gray-700"
                }`}
              >
                <div className="flex-shrink-0 w-5 flex justify-center">
                  {item.icon}
                </div>
                <span>{item.label}</span>
                {item.label === "Assinatura" && !isPremium && (
                  <span className="ml-auto text-xs bg-green-500 text-white px-2 py-0.5 rounded font-medium">
                    UPGRADE
                  </span>
                )}
                {location === item.path && (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
              </Link>
            ))}
          </nav>
          
          <div className="mt-auto pt-4 border-t space-y-3">
            {/* Card de Informações da Assinatura */}
            <Card className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex flex-col space-y-3">
                  {/* Status da Assinatura */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Crown className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    
                    {isPremium ? (
                      <div>
                        <Badge variant="premium" className="flex items-center gap-1">
                          {isLifetime ? "Vitalício" : planType || "Premium"}
                        </Badge>
                      </div>
                    ) : (
                      <Link href="/pricing">
                        <Badge 
                          variant="outline" 
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                        >
                          Upgrade
                        </Badge>
                      </Link>
                    )}
                  </div>
                  
                  {/* Data de Expiração - Só exibe se for premium não-vitalício */}
                  {isPremium && !isLifetime && expirationDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Expira em</span>
                      <span className="text-xs font-medium">
                        {new Date(expirationDate).toLocaleDateString('pt-BR')}
                        {daysLeft !== null && daysLeft >= 0 && (
                          <span className="text-xs ml-1">
                            ({daysLeft} {daysLeft === 1 ? 'dia' : 'dias'})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  
                  {/* Downloads */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Download className="h-4 w-4 mr-2" />
                      <span className="text-sm">Downloads</span>
                    </div>
                    <span className="text-xs">
                      {isPremium || user?.nivelacesso === 'admin' || user?.nivelacesso === 'designer_adm' || 
                       user?.nivelacesso === 'designer' || user?.nivelacesso === 'suporte' ? (
                        <span className="flex items-center text-blue-600 font-medium">
                          <span className="mr-1">{userStats?.totalDownloads || 0}</span> / <span className="text-lg mx-0.5">∞</span>
                        </span>
                      ) : (
                        <span>{userStats?.totalDownloads || 0} / 10</span>
                      )}
                    </span>
                  </div>
                  
                  {/* Favoritos */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Heart className="h-4 w-4 mr-2" />
                      <span className="text-sm">Favoritos</span>
                    </div>
                    <span className="text-xs">
                      {isPremium || user?.nivelacesso === 'admin' || user?.nivelacesso === 'designer_adm' || 
                       user?.nivelacesso === 'designer' || user?.nivelacesso === 'suporte' ? (
                        <span className="flex items-center text-blue-600 font-medium">
                          <span className="mr-1">{userStats?.totalFavorites || 0}</span> / <span className="text-lg mx-0.5">∞</span>
                        </span>
                      ) : (
                        <span>{userStats?.totalFavorites || 0} / 20</span>
                      )}
                    </span>
                  </div>
                  
                  {/* Botão de Upgrade para usuários free */}
                  {!isPremium && user?.nivelacesso !== 'admin' && user?.nivelacesso !== 'designer_adm' && 
                   user?.nivelacesso !== 'designer' && user?.nivelacesso !== 'suporte' && (
                    <Link href="/planos">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Crown className="h-3.5 w-3.5 mr-1.5" />
                        Assinar Premium
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Botão de Logout */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sair da conta</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </aside>

        {/* Sidebar para Mobile (sobreposta) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            ></div>
            <aside className="fixed top-16 left-0 bottom-0 w-3/4 max-w-xs bg-white dark:bg-gray-950 overflow-y-auto border-r p-4">
              <nav className="space-y-2 flex-1">
                {menuItems.map((item) => (
                  <Link 
                    key={item.path} 
                    href={item.path}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-md transition-colors hover:bg-muted ${
                      location === item.path ? "bg-muted font-medium text-primary" : "text-gray-700"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className="flex-shrink-0 w-5 flex justify-center">
                      {item.icon}
                    </div>
                    <span>{item.label}</span>
                    {item.label === "Assinatura" && !isPremium && (
                      <span className="ml-auto text-xs bg-green-500 text-white px-2 py-0.5 rounded font-medium">
                        UPGRADE
                      </span>
                    )}
                    {location === item.path && (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto pt-4 border-t space-y-3">
                {/* Card de Informações da Assinatura para Mobile */}
                <Card className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex flex-col space-y-3">
                      {/* Status da Assinatura */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Crown className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="text-sm font-medium">Status</span>
                        </div>
                        
                        {isPremium ? (
                          <div>
                            <Badge variant="premium" className="flex items-center gap-1">
                              {isLifetime ? "Vitalício" : planType || "Premium"}
                            </Badge>
                          </div>
                        ) : (
                          <Link href="/planos">
                            <Badge 
                              variant="outline" 
                              className="bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                            >
                              Upgrade
                            </Badge>
                          </Link>
                        )}
                      </div>
                      
                      {/* Data de Expiração - Só exibe se for premium não-vitalício */}
                      {isPremium && !isLifetime && expirationDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Expira em</span>
                          <span className="text-xs font-medium">
                            {new Date(expirationDate).toLocaleDateString('pt-BR')}
                            {daysLeft !== null && daysLeft >= 0 && (
                              <span className="text-xs ml-1">
                                ({daysLeft} {daysLeft === 1 ? 'dia' : 'dias'})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      
                      {/* Downloads */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Download className="h-4 w-4 mr-2" />
                          <span className="text-sm">Downloads</span>
                        </div>
                        <span className="text-xs">
                          {isPremium ? (
                            <span className="flex items-center text-blue-600 font-medium">
                              <span className="mr-1">{userStats?.totalDownloads || 0}</span> / <span className="text-lg mx-0.5">∞</span>
                            </span>
                          ) : (
                            <span>{userStats?.totalDownloads || 0} / 10</span>
                          )}
                        </span>
                      </div>
                      
                      {/* Favoritos */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-2" />
                          <span className="text-sm">Favoritos</span>
                        </div>
                        <span className="text-xs">
                          {isPremium ? (
                            <span className="flex items-center text-blue-600 font-medium">
                              <span className="mr-1">{userStats?.totalFavorites || 0}</span> / <span className="text-lg mx-0.5">∞</span>
                            </span>
                          ) : (
                            <span>{userStats?.totalFavorites || 0} / 20</span>
                          )}
                        </span>
                      </div>
                      
                      {/* Botão de Upgrade para usuários free */}
                      {!isPremium && (
                        <Link href="/planos" onClick={() => setSidebarOpen(false)}>
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                          >
                            <Crown className="h-3.5 w-3.5 mr-1.5" />
                            Assinar Premium
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Botão de Logout para Mobile */}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </aside>
          </div>
        )}

        {/* Conteúdo Principal */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}