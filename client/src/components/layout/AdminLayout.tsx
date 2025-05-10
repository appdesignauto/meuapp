import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  ChevronLeft, 
  Menu, 
  X, 
  Home, 
  Settings, 
  Users, 
  BookOpen, 
  Image, 
  LayoutDashboard, 
  MessageSquare, 
  FileBarChart,
  Wrench,
  Star,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

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
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems: NavItem[] = [
    { 
      title: 'Dashboard', 
      href: '/admin', 
      icon: <LayoutDashboard className="h-5 w-5" /> 
    },
    { 
      title: 'Usuários', 
      href: '/admin/usuarios', 
      icon: <Users className="h-5 w-5" /> 
    },
    { 
      title: 'Artes', 
      href: '/admin/artes', 
      icon: <Image className="h-5 w-5" /> 
    },
    { 
      title: 'Cursos', 
      href: '/admin/cursos', 
      icon: <BookOpen className="h-5 w-5" /> 
    },
    { 
      title: 'Comunidade', 
      href: '/admin/community', 
      icon: <MessageSquare className="h-5 w-5" /> 
    },
    { 
      title: 'Ferramentas', 
      href: '/admin/ferramentas', 
      icon: <Wrench className="h-5 w-5" /> 
    },
    { 
      title: 'Depoimentos', 
      href: '/admin/depoimentos', 
      icon: <Star className="h-5 w-5" /> 
    },
    { 
      title: 'Notificações', 
      href: '/admin/notificacoes', 
      icon: <Bell className="h-5 w-5" /> 
    },
    { 
      title: 'Relatórios', 
      href: '/admin/relatorios', 
      icon: <FileBarChart className="h-5 w-5" /> 
    },
    { 
      title: 'Configurações', 
      href: '/admin/configuracoes', 
      icon: <Settings className="h-5 w-5" /> 
    },
  ];

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acesso Restrito</h2>
          <p className="mb-6">Você precisa estar logado como administrador para acessar esta página.</p>
          <Link href="/auth">
            <Button>Fazer Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (user.nivelacesso !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
          <p className="mb-6">Você não tem permissão para acessar o painel administrativo.</p>
          <Link href="/">
            <Button>Voltar para o Início</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar para desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-white dark:bg-gray-950 dark:border-gray-800 shadow-sm transition-transform lg:translate-x-0 lg:static",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center border-b px-4 dark:border-gray-800">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-primary">DesignAuto</span>
            <span className="text-xs bg-primary text-white px-1.5 py-0.5 rounded">Admin</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={toggleSidebar}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Fechar menu</span>
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="grid gap-1">
            {navItems.map((item, index) => (
              <li key={index}>
                <Link href={item.href}>
                  <a 
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                      location === item.href && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">
                        {item.badge}
                      </span>
                    )}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto border-t p-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.profileimageurl || undefined} alt={user.name || user.username} />
              <AvatarFallback>{(user.name || user.username || '?').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="grid">
              <span className="text-sm font-medium">{user.name || user.username}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Administrador</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-auto">
                  <ChevronLeft className="h-4 w-4 rotate-90" />
                  <span className="sr-only">Menu de usuário</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Link href="/perfil">Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center border-b bg-white dark:bg-gray-950 dark:border-gray-800 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 lg:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
          
          {backLink && (
            <Link href={backLink}>
              <a className="inline-flex items-center mr-3 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </a>
            </Link>
          )}
          
          <h1 className="text-lg font-semibold">{title}</h1>
          
          <div className="ml-auto flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <Home className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:inline-block">Início</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-100 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
};