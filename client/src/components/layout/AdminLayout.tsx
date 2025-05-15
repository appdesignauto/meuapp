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

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: <Gauge className="h-5 w-5" />,
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

  const NavLinks = () => (
    <TooltipProvider>
      <nav className="space-y-1 mt-4">
        {navItems.map((item) => (
          collapsed ? (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center justify-center p-2.5 my-1 rounded-lg',
                    location === item.href || location.startsWith(`${item.href}/`)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
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
                'flex items-center px-4 py-2.5 text-sm font-medium rounded-lg',
                location === item.href || location.startsWith(`${item.href}/`)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              )}
            >
              {item.icon}
              <span className="ml-3 truncate">{item.title}</span>
              {item.badge && (
                <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary dark:bg-primary/30">
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
            "hidden lg:flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 h-screen sticky top-0 transition-all duration-300",
            collapsed ? "w-16" : "w-64"
          )}
        >
          <div className="p-4 border-b flex items-center justify-between">
            {!collapsed && <h2 className="text-xl font-bold text-gray-900 dark:text-white">Painel Admin</h2>}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!collapsed)}
              className={cn("ml-auto", collapsed && "mx-auto")}
            >
              <ChevronRight className={cn("h-5 w-5 transition-transform", collapsed ? "rotate-180" : "")} />
            </Button>
          </div>
          <div className={cn("p-4", collapsed && "px-2")}>
            <NavLinks />
          </div>
          <div className={cn("p-4 mt-auto border-t", collapsed && "p-2")}>
            {collapsed ? (
              <div className="flex justify-center">
                <Avatar className="h-8 w-8">
                  {user?.profileimageurl ? (
                    <AvatarImage src={user.profileimageurl} alt={user?.name || ''} />
                  ) : (
                    <AvatarFallback>{user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}</AvatarFallback>
                  )}
                </Avatar>
              </div>
            ) : (
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  {user?.profileimageurl ? (
                    <AvatarImage src={user.profileimageurl} alt={user?.name || ''} />
                  ) : (
                    <AvatarFallback>{user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}</AvatarFallback>
                  )}
                </Avatar>
                <div className="ml-3 truncate">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name || user?.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Administrador</p>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          {/* Desktop top header */}
          <div className="hidden lg:flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800">
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
            <div className="flex items-center">
              <Button variant="outline" size="sm" asChild className="flex items-center gap-1">
                <Link href="/">
                  Ver site <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Page content */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;