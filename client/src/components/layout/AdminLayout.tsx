import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ChevronLeft,
  Gauge,
  Users,
  BookOpen,
  MessageSquare,
  Award,
  FileText,
  Settings,
  Image,
  Wrench,
  Upload,
  Menu,
  X,
  BarChart,
  CreditCard,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type AdminLayoutProps = {
  children: ReactNode;
  title: string;
  backLink?: string;
};

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
};

export const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  title,
  backLink
}) => {
  const { user } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Função para verificar se o usuário tem acesso a um item
  const hasAccess = (item: string): boolean => {
    if (user?.nivelacesso === 'admin') {
      return true; // Admin tem acesso total
    }
    
    if (user?.nivelacesso === 'designer_adm') {
      // Designer ADM tem acesso apenas a: Conteúdo (Artes), Cursos, Ferramentas e Comunidade
      // NÃO tem acesso a: Visão Geral, Financeiro, Assinaturas, Usuários, Analytics, Configurações, etc.
      const allowedItems = [
        'Artes', // Conteúdo
        'Cursos',
        'Ferramentas',
        'Comunidade'
      ];
      return allowedItems.includes(item);
    }
    
    if (user?.nivelacesso === 'suporte') {
      // Suporte tem acesso apenas a: Assinaturas, Usuários, Comunidade e Reports
      // NÃO tem acesso a: Visão Geral, Financeiro, Artes, Cursos, Ferramentas, Analytics, Configurações, etc.
      const allowedItems = [
        'Assinaturas',
        'Usuários',
        'Comunidade',
        'Reports'
      ];
      return allowedItems.includes(item);
    }
    
    return false;
  };

  const allNavItems: NavItem[] = [
    {
      title: 'Visão Geral',
      href: '/admin',
      icon: <Gauge className="h-5 w-5" />,
    },
    {
      title: 'Financeiro',
      href: '/admin/financeiro',
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      title: 'Assinaturas',
      href: '/admin/assinaturas',
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      title: 'Usuários',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: 'Artes',
      href: '/admin/arts',
      icon: <Image className="h-5 w-5" />,
    },
    {
      title: 'Cursos',
      href: '/admin/courses',
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      title: 'Comunidade',
      href: '/admin/community',
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: 'Ranking',
      href: '/admin/ranking',
      icon: <Award className="h-5 w-5" />,
    },
    {
      title: 'Ferramentas',
      href: '/admin/ferramentas',
      icon: <Wrench className="h-5 w-5" />,
    },
    {
      title: 'Uploads',
      href: '/admin/uploads',
      icon: <Upload className="h-5 w-5" />,
    },
    {
      title: 'Páginas',
      href: '/admin/pages',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: 'Analytics',
      href: '/admin/analytics',
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      title: 'Configurações',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  // Filtrar itens baseado nas permissões do usuário
  const navItems = allNavItems.filter(item => hasAccess(item.title));

  const NavLinks = () => (
    <TooltipProvider>
      <nav className="space-y-0.5 mt-3">
        {navItems.map((item) => (
          collapsed ? (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center justify-center p-2.5 my-1 rounded-md w-10 h-10 mx-auto',
                    location === item.href || location.startsWith(`${item.href}/`)
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-blue-700'
                  )}
                >
                  {item.icon}
                  {item.badge && (
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500"></span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                {item.title}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg mb-1 transition-all duration-200 group',
                location === item.href || location.startsWith(`${item.href}/`)
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-l-3 border-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-700 hover:shadow-sm'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-5 h-5 mr-3 transition-colors',
                location === item.href || location.startsWith(`${item.href}/`)
                  ? 'text-blue-600'
                  : 'text-gray-500 group-hover:text-blue-600'
              )}>
                {item.icon}
              </div>
              <span className="truncate font-medium">{item.title}</span>
              {item.badge && (
                <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        ))}
      </nav>
    </TooltipProvider>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile top navigation */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800">
        <div className="flex items-center">
          {backLink && (
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href={backLink}>
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Painel Admin</h2>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Fechar menu</span>
                </Button>
              </SheetTrigger>
            </div>
            <div className="p-4">
              <NavLinks />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside 
          className={cn(
            "hidden lg:flex flex-col border-r border-gray-100 bg-white h-screen sticky top-0 transition-all duration-300",
            collapsed ? "w-16" : "w-64"
          )}
        >
          <div className="py-6 px-4 border-b border-gray-100 flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-sm">DA</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">DesignAuto</h2>
                  <p className="text-xs text-gray-500">Painel Administrativo</p>
                </div>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!collapsed)}
              className={cn("ml-auto hover:bg-gray-100 hover:text-blue-600 transition-colors", collapsed && "mx-auto")}
            >
              <ChevronRight className={cn("h-5 w-5 text-gray-500 transition-transform", collapsed ? "rotate-180" : "")} />
            </Button>
          </div>
          <div className={cn("p-3", collapsed && "px-2")}>
            <NavLinks />
          </div>
          <div className={cn("p-4 mt-auto border-t border-gray-100", collapsed && "p-2")}>
            {collapsed ? (
              <div className="flex justify-center">
                <Avatar className="h-9 w-9">
                  {user?.profileimageurl ? (
                    <AvatarImage src={user.profileimageurl} alt={user?.name || ''} />
                  ) : (
                    <AvatarFallback>{user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}</AvatarFallback>
                  )}
                </Avatar>
              </div>
            ) : (
              <div className="flex items-center">
                <Avatar className="h-9 w-9">
                  {user?.profileimageurl ? (
                    <AvatarImage src={user.profileimageurl} alt={user?.name || ''} />
                  ) : (
                    <AvatarFallback>{user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}</AvatarFallback>
                  )}
                </Avatar>
                <div className="ml-3 truncate">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name || user?.username}</p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          {/* Desktop top header */}
          <div className="hidden lg:flex items-center justify-between py-4 px-6 border-b border-gray-100 bg-white shadow-sm">
            <div className="flex items-center">
              {backLink && (
                <Button variant="ghost" size="icon" asChild className="mr-3 hover:bg-gray-100 hover:text-blue-600 transition-colors">
                  <Link href={backLink}>
                    <ChevronLeft className="h-5 w-5 text-gray-500" />
                  </Link>
                </Button>
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500 mt-0.5">Gerencie sua plataforma DesignAuto</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" asChild className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors shadow-sm">
                <Link href="/">
                  <ExternalLink className="h-4 w-4" />
                  Ver site
                </Link>
              </Button>
            </div>
          </div>

          {/* Page content */}
          <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-[calc(100vh-80px)] overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;