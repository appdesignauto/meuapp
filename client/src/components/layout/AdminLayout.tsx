import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Home, Users, Image, FileText, Book, 
  MessageSquare, Settings, LogOut, Menu, X, Tool
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const menuItems = [
    { label: 'Dashboard', href: '/admin', icon: <Home className="mr-2 h-4 w-4" /> },
    { label: 'Categorias', href: '/admin/categories', icon: <FileText className="mr-2 h-4 w-4" /> },
    { label: 'Artes', href: '/admin/arts', icon: <Image className="mr-2 h-4 w-4" /> },
    { label: 'Usuários', href: '/admin/users', icon: <Users className="mr-2 h-4 w-4" /> },
    { label: 'Cursos', href: '/admin/gerenciar-cursos', icon: <Book className="mr-2 h-4 w-4" /> },
    { label: 'Comunidade', href: '/admin/community', icon: <MessageSquare className="mr-2 h-4 w-4" /> },
    { label: 'Ferramentas', href: '/admin/ferramentas', icon: <Tool className="mr-2 h-4 w-4" /> },
    { label: 'Configurações', href: '/admin/settings', icon: <Settings className="mr-2 h-4 w-4" /> },
  ];

  const MenuItem = ({ item }: { item: typeof menuItems[0] }) => {
    const isActive = location === item.href || 
                      (item.href !== '/admin' && location.startsWith(item.href));
    
    return (
      <Link href={item.href}>
        <a
          className={`flex items-center py-2 px-4 rounded-lg text-sm transition-colors ${
            isActive 
              ? 'bg-primary text-primary-foreground font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        >
          {item.icon}
          {item.label}
        </a>
      </Link>
    );
  };

  const MobileMenu = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="font-bold text-lg">Painel Admin</div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <MenuItem key={item.href} item={item} />
              ))}
            </nav>
          </ScrollArea>
          <div className="p-4 border-t">
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col fixed inset-y-0 z-50">
        <div className="flex flex-col h-full bg-white border-r shadow-sm">
          <div className="p-4 border-b">
            <Link href="/">
              <a className="flex items-center justify-center">
                <img src="/images/logos/logo_174x80.png" alt="Design Auto" className="h-10" />
              </a>
            </Link>
          </div>
          
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <MenuItem key={item.href} item={item} />
              ))}
            </nav>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={user?.profileimageurl || ''} alt={user?.name || ''} />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="truncate">
                  <div className="text-sm font-medium">{user?.name || user?.username}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center">
            <MobileMenu />
            <h1 className="ml-2 text-xl font-semibold text-gray-800 md:hidden">
              Painel Admin
            </h1>
          </div>
          
          <div className="flex items-center md:hidden">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileimageurl || ''} alt={user?.name || ''} />
              <AvatarFallback>
                {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;