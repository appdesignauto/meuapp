import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

// Componentes para abas do painel antigo
import ArtsList from '@/components/admin/ArtsList';
import CategoriesList from '@/components/admin/CategoriesList';
import UserManagement from '@/components/admin/UserManagement';
import CommunityManagement from './community/CommunityManagement';
import SiteSettings from '@/components/admin/SiteSettings';
import CommentsManagement from '@/components/admin/CommentsManagement';
import FormatsList from '@/components/admin/FormatsList';
import CourseStatisticsPanel from '@/components/admin/CourseStatisticsPanel';
import FileTypesList from '@/components/admin/FileTypesList';
import PopupManagement from '@/components/admin/PopupManagement';
import GerenciarFerramentas from './ferramentas/GerenciarFerramentas';
import GerenciarCategorias from './ferramentas/GerenciarCategorias';
import AnalyticsSettings from '@/components/admin/AnalyticsSettings';
import ReportsManagement from '@/components/admin/ReportsManagement';

// Componentes para abas do painel de assinaturas
import WebhookList from '@/components/admin/WebhookList';
import SubscriptionManagement from '@/components/admin/SubscriptionManagement';
import SubscriptionSettings from '@/components/admin/SubscriptionSettings';
import SubscriptionTrends from '@/components/admin/SubscriptionTrends';

// Ícones
import {
  LayoutGrid,
  LayoutDashboard,
  Image,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  Plus,
  Search,
  BookOpen,
  Award,
  CreditCard,
  Bell,
  Sliders,
  FileType,
  Upload,
  Wrench,
  Shield,
  FileText,
  Flag
} from 'lucide-react';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const UnifiedAdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estado para componentes específicos
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Obtém título da página baseado na aba ativa
  const getPageTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Visão Geral';
      case 'arts': return 'Artes e Designs';
      case 'categories': return 'Categorias';
      case 'formats': return 'Formatos';
      case 'fileTypes': return 'Tipos de Arquivo';
      case 'users': return 'Usuários';
      case 'community': return 'Comunidade';
      case 'courses': return 'Cursos';
      case 'settings': return 'Configurações';
      case 'subscriptions': return 'Assinaturas';
      case 'subscriptionTrends': return 'Métricas de Assinaturas';
      case 'webhooks': return 'Webhooks';
      case 'subscriptionSettings': return 'Configurações de Assinaturas';
      case 'analytics': return 'Analytics';
      case 'comments': return 'Comentários';
      case 'popups': return 'Popups';
      case 'reports': return 'Denúncias';
      case 'ferramentas': return 'Ferramentas';
      case 'uploads': return 'Uploads';
      default: return 'Painel Administrativo';
    }
  };

  // Função para renderizar o conteúdo de acordo com a aba ativa
  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6">
              <h3 className="font-semibold mb-2 text-lg">Artes e Usuários</h3>
              <p className="text-gray-500 mb-4">Crie e gerencie artes, categorias e usuários.</p>
              <Button 
                onClick={() => setActiveTab('arts')} 
                variant="outline" 
                className="w-full"
              >
                Gerenciar Conteúdo
              </Button>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2 text-lg">Assinaturas</h3>
              <p className="text-gray-500 mb-4">Monitore e gerencie assinaturas dos usuários.</p>
              <Button 
                onClick={() => setActiveTab('subscriptions')} 
                variant="outline" 
                className="w-full"
              >
                Ver Assinaturas
              </Button>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2 text-lg">Comunidade</h3>
              <p className="text-gray-500 mb-4">Gerencie conteúdo da comunidade e comentários.</p>
              <Button 
                onClick={() => setActiveTab('community')} 
                variant="outline" 
                className="w-full"
              >
                Acessar Comunidade
              </Button>
            </Card>
          </div>
        );
      
      // Componentes do painel original
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
      case 'community':
        return <CommunityManagement />;
      case 'settings':
        return <SiteSettings />;
      case 'analytics':
        return <AnalyticsSettings />;
      case 'comments':
        return <CommentsManagement />;
      case 'popups':
        return <PopupManagement />;
      case 'reports':
        return <ReportsManagement />;
      case 'ferramentas':
        return <GerenciarFerramentas />;
      
      // Componentes do painel de assinaturas
      case 'subscriptions':
        return <SubscriptionManagement />;
      case 'subscriptionTrends':
        return <SubscriptionTrends />;
      case 'webhooks':
        return <WebhookList />;
      case 'subscriptionSettings':
        return <SubscriptionSettings />;
      
      default:
        return (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <LayoutDashboard className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">Selecione uma opção no menu</h3>
              <p className="mt-1 text-gray-500">Utilize o menu lateral para acessar as funcionalidades do painel.</p>
            </div>
          </div>
        );
    }
  };

  // Botões de ação específicos para certas abas
  const renderActionButtons = () => {
    switch(activeTab) {
      case 'arts':
        return (
          <Button className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Nova Arte
          </Button>
        );
      case 'categories':
        return (
          <Button className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Nova Categoria
          </Button>
        );
      case 'users':
        return (
          <Button className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Novo Usuário
          </Button>
        );
      default:
        return null;
    }
  };

  // Itens de navegação para o menu lateral
  const navItems = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard className="h-5 w-5" />,
      onClick: () => setActiveTab('dashboard')
    },
    {
      title: 'Artes',
      href: '/admin/arts',
      icon: <Image className="h-5 w-5" />,
      onClick: () => setActiveTab('arts')
    },
    {
      title: 'Categorias',
      href: '/admin/categories',
      icon: <LayoutGrid className="h-5 w-5" />,
      onClick: () => setActiveTab('categories')
    },
    {
      title: 'Formatos',
      href: '/admin/formats',
      icon: <FileType className="h-5 w-5" />,
      onClick: () => setActiveTab('formats')
    },
    {
      title: 'Usuários',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />,
      onClick: () => setActiveTab('users')
    },
    {
      title: 'Cursos',
      href: '/admin/courses',
      icon: <BookOpen className="h-5 w-5" />,
      onClick: () => setActiveTab('courses')
    },
    {
      title: 'Comunidade',
      href: '/admin/community',
      icon: <MessageSquare className="h-5 w-5" />,
      onClick: () => setActiveTab('community')
    },
    {
      title: 'Ranking',
      href: '/admin/ranking',
      icon: <Award className="h-5 w-5" />,
      onClick: () => setActiveTab('ranking')
    },
    {
      title: 'Assinaturas',
      href: '/admin/subscriptions',
      icon: <CreditCard className="h-5 w-5" />,
      onClick: () => setActiveTab('subscriptions')
    },
    {
      title: 'Webhooks',
      href: '/admin/webhooks',
      icon: <Bell className="h-5 w-5" />,
      onClick: () => setActiveTab('webhooks')
    },
    {
      title: 'Ferramentas',
      href: '/admin/ferramentas',
      icon: <Wrench className="h-5 w-5" />,
      onClick: () => setActiveTab('ferramentas')
    },
    {
      title: 'Uploads',
      href: '/admin/uploads',
      icon: <Upload className="h-5 w-5" />,
      onClick: () => setActiveTab('uploads')
    },
    {
      title: 'Denúncias',
      href: '/admin/reports',
      icon: <Flag className="h-5 w-5" />,
      onClick: () => setActiveTab('reports')
    },
    {
      title: 'Analytics',
      href: '/admin/analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      onClick: () => setActiveTab('analytics')
    },
    {
      title: 'Configurações',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
      onClick: () => setActiveTab('settings')
    },
  ];

  return (
    <AdminLayout 
      title={getPageTitle()} 
      navItems={navItems}
      actionButtons={renderActionButtons()}
    >
      <div className="flex items-center mb-6">
        {activeTab !== 'dashboard' && (
          <div className="relative w-full sm:w-64 lg:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Buscar..." 
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>
      
      {renderContent()}
    </AdminLayout>
  );
};

export default UnifiedAdminDashboard;