import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import {
  LayoutGrid,
  Image,
  Users,
  ListChecks,
  MessageSquare,
  BarChart3,
  Settings,
  Plus,
  Search,
  Home,
  LogOut,
  Database,
  HardDrive,
  FileType,
  Flag,
  CreditCard,
  BookOpen,
  LayoutDashboard,
  ChevronDown,
  Video,
  Layers,
  PanelRight,
  PanelLeft,
  BellRing,
  FileImage,
  Menu,
  X,
  Bell,
  User,
  Zap
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ArtsList from '@/components/admin/ArtsList';
import CategoriesList from '@/components/admin/CategoriesList';
import UserManagement from '@/components/admin/UserManagement';
import CommunityManagement from './community/CommunityManagement';
import SiteSettings from '@/components/admin/SiteSettings';
import FormatsList from '@/components/admin/FormatsList';
import FileTypesList from '@/components/admin/FileTypesList';
import PopupManagement from '@/components/admin/PopupManagement';
import AnalyticsSettings from '@/components/admin/AnalyticsSettings';
import ReportsManagement from '@/components/admin/ReportsManagement';
import SubscriptionManagement from '@/components/admin/SubscriptionManagement';
import GerenciarFerramentas from './ferramentas/GerenciarFerramentas';

const ModernDashboard = () => {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState('arts');
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Função para verificar se o usuário tem acesso a uma aba específica
  const hasTabAccess = (tabName: string): boolean => {
    if (user?.nivelacesso === 'admin') {
      return true;
    }
    
    if (user?.nivelacesso === 'designer_adm') {
      const allowedTabs = ['arts', 'courses', 'ferramentas', 'community'];
      return allowedTabs.includes(tabName);
    }
    
    if (user?.nivelacesso === 'suporte') {
      const allowedTabs = ['subscriptions', 'users', 'community', 'reports'];
      return allowedTabs.includes(tabName);
    }
    
    return false;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation('/auth');
  };

  // Menu items configuration
  const menuSections = [
    {
      title: 'Visão Geral',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, access: ['admin', 'designer_adm'] },
      ]
    },
    {
      title: 'Conteúdo',
      items: [
        { id: 'arts', label: 'Artes e Designs', icon: Image, access: ['admin', 'designer_adm'] },
        { id: 'categories', label: 'Categorias', icon: ListChecks, access: ['admin', 'designer_adm'] },
        { id: 'formats', label: 'Formatos', icon: LayoutGrid, access: ['admin'] },
        { id: 'fileTypes', label: 'Tipos de Arquivo', icon: FileType, access: ['admin'] },
      ]
    },
    {
      title: 'Usuários',
      items: [
        { id: 'users', label: 'Usuários', icon: Users, access: ['admin', 'suporte'] },
        { id: 'subscriptions', label: 'Assinaturas', icon: CreditCard, access: ['admin', 'suporte'] },
      ]
    },
    {
      title: 'Cursos',
      items: [
        { id: 'courses', label: 'Cursos', icon: BookOpen, access: ['admin', 'designer_adm'] },
        { id: 'modules', label: 'Módulos', icon: Layers, access: ['admin', 'designer_adm'] },
        { id: 'lessons', label: 'Aulas', icon: Video, access: ['admin', 'designer_adm'] },
      ]
    },
    {
      title: 'Ferramentas',
      items: [
        { id: 'ferramentas', label: 'Ferramentas', icon: Zap, access: ['admin', 'designer_adm'] },
      ]
    },
    {
      title: 'Comunidade',
      items: [
        { id: 'community', label: 'Comunidade', icon: MessageSquare, access: ['admin', 'designer_adm', 'suporte'] },
        { id: 'reports', label: 'Denúncias', icon: Flag, access: ['admin', 'suporte'] },
      ]
    },
    {
      title: 'Marketing',
      items: [
        { id: 'popups', label: 'Popups', icon: BellRing, access: ['admin'] },
      ]
    },
    {
      title: 'Configurações',
      items: [
        { id: 'settings', label: 'Site', icon: Settings, access: ['admin'] },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, access: ['admin'] },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'arts':
        return <ArtsList />;
      case 'categories':
        return <CategoriesList />;
      case 'formats':
        return <FormatsList />;
      case 'fileTypes':
        return <FileTypesList />;
      case 'users':
        return <UserManagement />;
      case 'subscriptions':
        return <SubscriptionManagement />;
      case 'community':
        return <CommunityManagement />;
      case 'reports':
        return <ReportsManagement />;
      case 'popups':
        return <PopupManagement />;
      case 'settings':
        return <SiteSettings />;
      case 'analytics':
        return <AnalyticsSettings />;
      case 'ferramentas':
        return <GerenciarFerramentas />;
      default:
        return <ArtsList />;
    }
  };

  const getPageTitle = () => {
    const item = menuSections.flatMap(section => section.items).find(item => item.id === activeTab);
    return item?.label || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <MobileSidebar 
              menuSections={menuSections}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              hasTabAccess={hasTabAccess}
              user={user}
              setMobileMenuOpen={setMobileMenuOpen}
              handleLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
        sidebarOpen ? 'lg:w-64' : 'lg:w-16'
      }`}>
        <DesktopSidebar 
          menuSections={menuSections}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasTabAccess={hasTabAccess}
          user={user}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          handleLogout={handleLogout}
        />
      </div>

      {/* Main Content */}
      <div className={`lg:pl-64 transition-all duration-300 ${!sidebarOpen ? 'lg:pl-16' : ''}`}>
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden -ml-2 mr-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      placeholder="Buscar..."
                      className="pl-10 w-64 bg-gray-50 border-0 focus:bg-white"
                    />
                  </div>
                </div>
                
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 flex items-center justify-center bg-red-500">
                    2
                  </Badge>
                </Button>
                
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.nivelacesso}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

// Desktop Sidebar Component
const DesktopSidebar = ({ menuSections, activeTab, setActiveTab, hasTabAccess, user, sidebarOpen, setSidebarOpen, handleLogout }: any) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        {sidebarOpen ? (
          <>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                <LayoutDashboard className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">DesignAuto</h2>
                <p className="text-xs text-gray-500 font-medium">Admin Panel</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="h-8 w-8"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="h-8 w-8 mx-auto"
          >
            <PanelRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {menuSections.map((section: any) => {
          const visibleItems = section.items.filter((item: any) => hasTabAccess(item.id));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              {sidebarOpen && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {visibleItems.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } ${!sidebarOpen ? 'justify-center' : ''}`}
                    title={item.label}
                  >
                    <item.icon className={`h-4 w-4 ${!sidebarOpen ? '' : 'mr-3'}`} />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Link 
          href="/"
          className={`flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors ${
            !sidebarOpen ? 'justify-center' : ''
          }`}
        >
          <Home className={`h-4 w-4 ${!sidebarOpen ? '' : 'mr-3'}`} />
          {sidebarOpen && <span>Voltar ao site</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors ${
            !sidebarOpen ? 'justify-center' : ''
          }`}
        >
          <LogOut className={`h-4 w-4 ${!sidebarOpen ? '' : 'mr-3'}`} />
          {sidebarOpen && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
};

// Mobile Sidebar Component
const MobileSidebar = ({ menuSections, activeTab, setActiveTab, hasTabAccess, user, setMobileMenuOpen, handleLogout }: any) => {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">DesignAuto</h2>
            <p className="text-xs text-gray-500 font-medium">Admin Panel</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(false)}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {menuSections.map((section: any) => {
          const visibleItems = section.items.filter((item: any) => hasTabAccess(item.id));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {section.title}
              </p>
              <div className="space-y-1">
                {visibleItems.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Link 
          href="/"
          className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Home className="h-4 w-4 mr-3" />
          <span>Voltar ao site</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4 mr-3" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

export default ModernDashboard;