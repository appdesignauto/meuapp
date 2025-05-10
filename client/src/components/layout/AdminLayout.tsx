import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { UserCircle, ChevronLeft, LayoutDashboard, Settings, BookOpen, Users, MessageSquare, Wrench } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

type AdminLayoutProps = {
  children: React.ReactNode;
  title: string;
};

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const [location] = useLocation();
  const { user } = useAuth();

  // Verificar se o usuário é administrador
  if (!user || (user.nivelacesso !== 'admin' && user.role !== 'admin')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
        <p className="mb-6">Você não tem permissão para acessar esta área.</p>
        <Link href="/">
          <a className="text-primary hover:underline flex items-center">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar para a página inicial
          </a>
        </Link>
      </div>
    );
  }

  const menuItems = [
    { 
      href: '/admin', 
      label: 'Dashboard', 
      icon: <LayoutDashboard className="h-5 w-5" /> 
    },
    { 
      href: '/admin/artes', 
      label: 'Artes', 
      icon: <BookOpen className="h-5 w-5" /> 
    },
    { 
      href: '/admin/ferramentas', 
      label: 'Ferramentas', 
      icon: <Wrench className="h-5 w-5" /> 
    },
    { 
      href: '/admin/users', 
      label: 'Usuários', 
      icon: <Users className="h-5 w-5" /> 
    },
    { 
      href: '/admin/community', 
      label: 'Comunidade', 
      icon: <MessageSquare className="h-5 w-5" /> 
    },
    { 
      href: '/admin/configuracoes', 
      label: 'Configurações', 
      icon: <Settings className="h-5 w-5" /> 
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <Link href="/">
              <a className="text-xl font-bold text-gray-800 dark:text-white">
                Design<span className="text-primary">Auto</span> <small className="text-xs font-normal text-gray-500">Admin</small>
              </a>
            </Link>
          </div>
          <div className="flex flex-col flex-grow">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {menuItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <a
                      className={cn(
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                        isActive
                          ? "bg-primary text-white"
                          : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      )}
                    >
                      {React.cloneElement(item.icon, {
                        className: cn(
                          "mr-3 flex-shrink-0 h-5 w-5",
                          isActive
                            ? "text-white"
                            : "text-gray-500 dark:text-gray-400"
                        ),
                      })}
                      {item.label}
                    </a>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCircle className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.name || user?.username}
                </p>
                <p className="text-xs font-medium text-gray-500 truncate">
                  Administrador
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Mobile header */}
        <div className="flex md:hidden items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <Link href="/">
            <a className="text-xl font-bold text-gray-800 dark:text-white">
              Design<span className="text-primary">Auto</span>
            </a>
          </Link>
          {/* Mobile menu button */}
          <button
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          >
            <span className="sr-only">Abrir menu</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Page heading */}
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
              <Link href="/">
                <a className="text-sm text-primary hover:underline flex items-center">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Voltar para o site
                </a>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;