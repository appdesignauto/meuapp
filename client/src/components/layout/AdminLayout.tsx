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
  Bell,
  PanelLeft,
  Globe,
  ChevronDown,
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
import { Badge } from '@/components/ui/badge';

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
  items?: NavItem[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

export const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  title,
  backLink
}) => {
  const { user } = useAuth();
  const [location] = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(['conteudo', 'usuarios']);
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };

  const navSections: NavSection[] = [
    {
      title: "Principal",
      items: [
        {
          title: 'Dashboard',
          href: '/admin',
          icon: <Gauge className="h-3.5 w-3.5" />,
        },
        {
          title: 'Analytics',
          href: '/admin/analytics',
          icon: <BarChart className="h-3.5 w-3.5" />,
        },
      ]
    },
    {
      title: "Conteúdo",
      items: [
        {
          title: 'Artes',
          href: '/admin/arts',
          icon: <Image className="h-3.5 w-3.5" />,
        },
        {
          title: 'Cursos',
          href: '/admin/courses',
          icon: <BookOpen className="h-3.5 w-3.5" />,
        },
        {
          title: 'Comunidade',
          href: '/admin/community',
          icon: <MessageSquare className="h-3.5 w-3.5" />,
        },
        {
          title: 'Ferramentas',
          href: '/admin/ferramentas',
          icon: <Wrench className="h-3.5 w-3.5" />,
        },
        {
          title: 'Páginas',
          href: '/admin/pages',
          icon: <FileText className="h-3.5 w-3.5" />,
        },
      ]
    },
    {
      title: "Usuários",
      items: [
        {
          title: 'Usuários',
          href: '/admin/users',
          icon: <Users className="h-3.5 w-3.5" />,
        },
        {
          title: 'Ranking',
          href: '/admin/ranking',
          icon: <Award className="h-3.5 w-3.5" />,
        },
        {
          title: 'Assinaturas',
          href: '/admin/subscriptions',
          icon: <CreditCard className="h-3.5 w-3.5" />,
        },
      ]
    },
    {
      title: "Sistema",
      items: [
        {
          title: 'Uploads',
          href: '/admin/uploads',
          icon: <Upload className="h-3.5 w-3.5" />,
        },
        {
          title: 'Notificações',
          href: '/admin/notifications',
          icon: <Bell className="h-3.5 w-3.5" />,
        },
        {
          title: 'Configurações',
          href: '/admin/settings',
          icon: <Settings className="h-3.5 w-3.5" />,
        },
      ]
    }
  ];

  const NavLinks = () => (
    <nav className="space-y-2 mt-4">
      {navSections.map((section) => (
        <div key={section.title} className="mb-1">
          <div 
            className="bg-gray-50 rounded-lg py-1 mb-1"
          >
            <button
              type="button"
              className="flex items-center justify-between w-full px-4 py-3 text-gray-700 font-medium"
              onClick={() => toggleSection(section.title.toLowerCase())}
              title={section.title}
            >
              {section.items[0]?.icon && (
                <span className="flex items-center">
                  {section.items[0].icon}
                  {sidebarOpen && <span className="ml-3 text-xs">{section.title}</span>}
                </span>
              )}
              
              {sidebarOpen && (
                <ChevronDown className="w-3 h-3 ml-auto transition-transform duration-200" 
                  style={{ transform: expandedSections.includes(section.title.toLowerCase()) ? 'rotate(180deg)' : 'rotate(0)' }} 
                />
              )}
            </button>
            
            {expandedSections.includes(section.title.toLowerCase()) && (
              <div className="space-y-1 pt-1 pb-2 pl-4">
                {section.items.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <a
                      className={cn(
                        'flex items-center w-full py-2.5 rounded-md',
                        location === item.href || location.startsWith(`${item.href}/`)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-100',
                        sidebarOpen ? 'px-4 justify-start' : 'px-0 justify-center'
                      )}
                      title={item.title}
                    >
                      <span className={sidebarOpen ? 'mr-2' : 'mx-auto'}>
                        {item.icon}
                      </span>
                      {sidebarOpen && <span className="text-xs">{item.title}</span>}
                      {item.badge && sidebarOpen && (
                        <Badge className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                          {item.badge}
                        </Badge>
                      )}
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </nav>
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
        <aside className="hidden lg:flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 h-screen sticky top-0">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Painel Admin</h2>
          </div>
          <div className="p-4">
            <NavLinks />
          </div>
          <div className="p-4 mt-auto border-t">
            <div className="flex items-center">
              <Avatar className="h-8 w-8">
                {user?.profileimageurl ? (
                  <AvatarImage src={user.profileimageurl} alt={user?.name || ''} />
                ) : (
                  <AvatarFallback>{user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}</AvatarFallback>
                )}
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || user?.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Administrador</p>
              </div>
            </div>
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
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  Ver site
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