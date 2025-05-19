
import React, { ReactNode } from 'react';
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
  LineChart,
  Home,
  PanelLeftClose,
  PanelLeftOpen
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

type AdminLayoutProps = {
  children: ReactNode;
  title: string;
  backLink?: string;
};

const AdminLayout = ({ children, title, backLink }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [location] = useLocation();
  const { user } = useAuth();

  const menuItems = [
    {
      icon: <Home className="w-5 h-5" />,
      label: 'Dashboard',
      href: '/admin',
    },
    {
      icon: <Image className="w-5 h-5" />, 
      label: 'Artes',
      href: '/admin/add-art-multi',
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      label: 'Cursos',
      href: '/admin/gerenciar-cursos',
    },
    {
      icon: <Wrench className="w-5 h-5" />,
      label: 'Ferramentas',
      href: '/admin/ferramentas',
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: 'Comunidade',
      href: '/admin/community',
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Usuários',
      href: '/admin/users',
    },
    {
      icon: <BarChart className="w-5 h-5" />,
      label: 'Analytics',
      href: '/admin/analytics',
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Config Sistema',
      href: '/admin/config-sistema',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-sm transition-transform duration-300 ease-in-out lg:relative lg:transform-none",
          !sidebarOpen && "transform -translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header do Sidebar */}
          <div className="h-16 flex items-center justify-between px-4 border-b">
            <Link href="/admin" className="flex items-center space-x-2">
              <span className="font-bold text-xl">Design Auto</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:flex hidden"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <a
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                        "hover:bg-gray-100",
                        location === item.href
                          ? "bg-gray-100 text-blue-600"
                          : "text-gray-700"
                      )}
                    >
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer do Sidebar */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.profileimageurl} />
                <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="h-16 lg:hidden flex items-center justify-between px-4 border-b bg-white">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          <span className="font-semibold">{title}</span>
          <div className="w-10" /> {/* Espaçador para centralizar o título */}
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 items-center justify-between px-6 border-b bg-white">
          <div className="flex items-center space-x-3">
            {backLink && (
              <Button variant="ghost" size="icon" asChild>
                <Link href={backLink}>
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export { AdminLayout };
export default AdminLayout;
