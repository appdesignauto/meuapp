import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import SubscriptionTrends from "@/components/admin/SubscriptionTrends";
import SubscriptionManagement from "@/components/admin/SubscriptionManagement";
import WebhookList from "@/components/admin/WebhookList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Home, 
  Layers, 
  Users, 
  Settings, 
  FileText, 
  BookOpen, 
  MessageSquare, 
  Bell, 
  Activity,
  Database,
  FileCheck,
  ImageIcon,
  Tag,
  LayoutGrid,
  ScrollText,
  Server,
  Webhook,
  CreditCard,
  UserCog,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  ShieldAlert,
  Sparkles,
  Cog,
  GalleryHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

// Importar componentes do painel existente
import SimpleFormMultiDialog from "@/components/admin/SimpleFormMultiDialog";
import ArtsList from '@/components/admin/ArtsList';
import CategoriesList from '@/components/admin/CategoriesList';
import UserManagement from '@/components/admin/UserManagement';
import CommentsManagement from '@/components/admin/CommentsManagement';
import FormatsList from '@/components/admin/FormatsList';
import CourseStatisticsPanel from '@/components/admin/CourseStatisticsPanel';
import FileTypesList from '@/components/admin/FileTypesList';
import PopupManagement from '@/components/admin/PopupManagement';
import SiteSettings from '@/components/admin/SiteSettings';
import AnalyticsSettings from '@/components/admin/AnalyticsSettings';
import ReportsManagement from '@/components/admin/ReportsManagement';

// Tipo para os itens do menu
type MenuItem = {
  label: string;
  value: string;
  icon: React.ReactNode;
  children?: MenuItem[];
  expanded?: boolean;
};

// Componente principal do Dashboard Unificado
const UnifiedAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      label: "Dashboard",
      value: "overview",
      icon: <Home size={20} />,
    },
    {
      label: "Conteúdo",
      value: "content",
      icon: <Layers size={20} />,
      expanded: false,
      children: [
        { label: "Artes", value: "arts", icon: <ImageIcon size={20} /> },
        { label: "Categorias", value: "categories", icon: <Tag size={20} /> },
        { label: "Coleções", value: "collections", icon: <GalleryHorizontal size={20} /> },
        { label: "Formatos", value: "formats", icon: <LayoutGrid size={20} /> },
        { label: "Tipos de Arquivo", value: "fileTypes", icon: <FileText size={20} /> },
      ],
    },
    {
      label: "Comunidade",
      value: "community",
      icon: <MessageSquare size={20} />,
    },
    {
      label: "Cursos",
      value: "courses",
      icon: <BookOpen size={20} />,
    },
    {
      label: "Ferramentas",
      value: "tools",
      icon: <ScrollText size={20} />,
    },
    {
      label: "Usuários",
      value: "users",
      icon: <Users size={20} />,
    },
    {
      label: "Relatórios",
      value: "reports",
      icon: <Activity size={20} />,
      expanded: false,
      children: [
        { label: "Estatísticas", value: "stats", icon: <Activity size={20} /> },
        { label: "Logs", value: "logs", icon: <Database size={20} /> },
        { label: "Denúncias", value: "reports-management", icon: <ShieldAlert size={20} /> },
      ],
    },
    {
      label: "Marketing",
      value: "marketing",
      icon: <Bell size={20} />,
      expanded: false,
      children: [
        { label: "Popups", value: "popups", icon: <Bell size={20} /> },
        { label: "Depoimentos", value: "testimonials", icon: <CheckSquare size={20} /> },
        { label: "Planos", value: "plans", icon: <FileCheck size={20} /> },
      ],
    },
    {
      label: "Assinaturas",
      value: "subscriptions",
      icon: <CreditCard size={20} />,
      expanded: false,
      children: [
        { label: "Visão Geral", value: "subscription-overview", icon: <Sparkles size={20} /> },
        { label: "Gerenciar", value: "subscription-management", icon: <UserCog size={20} /> },
        { label: "Webhooks", value: "webhooks", icon: <Webhook size={20} /> },
        { label: "Configurações", value: "subscription-settings", icon: <Server size={20} /> },
      ],
    },
    {
      label: "Configurações",
      value: "settings",
      icon: <Settings size={20} />,
      expanded: false,
      children: [
        { label: "Site", value: "site-settings", icon: <Cog size={20} /> },
        { label: "Aplicativo", value: "app-config", icon: <Server size={20} /> },
      ],
    },
  ]);

  // Função para expandir/colapsar um item do menu
  const toggleMenuItemExpansion = (index: number) => {
    const newMenuItems = [...menuItems];
    newMenuItems[index].expanded = !newMenuItems[index].expanded;
    setMenuItems(newMenuItems);
  };

  // Renderizar o conteúdo baseado na aba selecionada
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <SubscriptionTrends />
            <div className="col-span-full md:col-span-2 space-y-6">
              <CourseStatisticsPanel />
            </div>
          </div>
        );
      case "arts":
        return <ArtsList />;
      case "categories":
        return <CategoriesList />;
      case "formats":
        return <FormatsList />;
      case "fileTypes":
        return <FileTypesList />;
      case "community":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Comunidade</h2>
            <p className="text-muted-foreground">Este componente será carregado do painel existente.</p>
          </div>
        );
      case "courses":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Cursos</h2>
            <p className="text-muted-foreground">Este componente será carregado do painel existente.</p>
          </div>
        );
      case "tools":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Ferramentas</h2>
            <p className="text-muted-foreground">Este componente será carregado do painel existente.</p>
          </div>
        );
      case "users":
        return <UserManagement />;
      case "comments":
        return <CommentsManagement />;
      case "reports-management":
        return <ReportsManagement />;
      case "popups":
        return <PopupManagement />;
      case "testimonials":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Depoimentos</h2>
            <p className="text-muted-foreground">Este componente será carregado do painel existente.</p>
          </div>
        );
      case "subscription-overview":
        return (
          <div className="grid grid-cols-1 gap-6">
            <SubscriptionTrends />
          </div>
        );
      case "subscription-management":
        return <SubscriptionManagement />;
      case "webhooks":
        return <WebhookList />;
      case "subscription-settings":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Configurações de Assinaturas</h2>
            <Tabs defaultValue="hotmart">
              <TabsList>
                <TabsTrigger value="hotmart">Hotmart</TabsTrigger>
                <TabsTrigger value="doppus">Doppus</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>
              <TabsContent value="hotmart" className="space-y-4 p-4 border rounded-md">
                <h3 className="text-lg font-medium">Configurações da Hotmart</h3>
                <p className="text-muted-foreground">
                  Configure as integrações com a plataforma Hotmart.
                </p>
                {/* Aqui seriam os campos para configuração da Hotmart */}
              </TabsContent>
              <TabsContent value="doppus" className="space-y-4 p-4 border rounded-md">
                <h3 className="text-lg font-medium">Configurações da Doppus</h3>
                <p className="text-muted-foreground">
                  Configure as integrações com a plataforma Doppus.
                </p>
                {/* Aqui seriam os campos para configuração da Doppus */}
              </TabsContent>
              <TabsContent value="manual" className="space-y-4 p-4 border rounded-md">
                <h3 className="text-lg font-medium">Configurações de Assinaturas Manuais</h3>
                <p className="text-muted-foreground">
                  Configure os tipos de planos disponíveis para assinaturas manuais.
                </p>
                {/* Aqui seriam os campos para configuração de assinaturas manuais */}
              </TabsContent>
            </Tabs>
          </div>
        );
      case "site-settings":
        return <SiteSettings />;
      case "analytics":
        return <AnalyticsSettings />;
      default:
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Selecione uma opção no menu lateral
          </div>
        );
    }
  };

  // Renderizar o menu lateral
  const renderSidebarMenu = () => {
    return (
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="space-y-1 px-2 py-2">
          {menuItems.map((item, index) => (
            <div key={item.value} className="mb-1">
              {/* Item principal */}
              {item.children ? (
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between",
                      item.children?.some(child => child.value === activeTab) && "bg-accent"
                    )}
                    onClick={() => toggleMenuItemExpansion(index)}
                  >
                    <div className="flex items-center">
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </div>
                    {item.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </Button>
                  
                  {/* Subitems */}
                  {item.expanded && (
                    <div className="ml-4 space-y-1">
                      {item.children.map((child) => (
                        <Button
                          key={child.value}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start",
                            activeTab === child.value && "bg-accent"
                          )}
                          onClick={() => setActiveTab(child.value)}
                        >
                          <div className="flex items-center">
                            {child.icon}
                            <span className="ml-2">{child.label}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    activeTab === item.value && "bg-accent"
                  )}
                  onClick={() => setActiveTab(item.value)}
                >
                  <div className="flex items-center">
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </div>
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  // Mapear as abas para os navItems
  const getNavItems = () => {
    const navItems = menuItems.flatMap(item => {
      if (item.children) {
        return item.children.map(child => ({
          title: child.label,
          href: `/admin/unified/${child.value}`,
          icon: child.icon,
          onClick: () => setActiveTab(child.value)
        }));
      } else {
        return [{
          title: item.label,
          href: `/admin/unified/${item.value}`,
          icon: item.icon,
          onClick: () => setActiveTab(item.value)
        }];
      }
    });
    
    // Adicione um link de volta para o painel clássico
    navItems.push({
      title: 'Painel Clássico',
      href: '/admin/classic',
      icon: <ChevronRight size={20} />,
      onClick: () => window.location.href = '/admin/classic'
    });
    
    return navItems;
  };

  return (
    <AdminLayout
      title={
        menuItems.find(item => item.value === activeTab)?.label || 
        menuItems.flatMap(item => item.children || []).find(child => child.value === activeTab)?.label ||
        "Painel Administrativo"
      }
      navItems={getNavItems()}
      actionButtons={
        <>
          {activeTab === "subscription-management" && (
            <Button variant="default" size="sm">
              <UserCog className="mr-1 h-4 w-4" />
              Nova Assinatura
            </Button>
          )}
          {activeTab === "webhooks" && (
            <Button variant="default" size="sm">
              <Webhook className="mr-1 h-4 w-4" />
              Testar Webhook
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        {renderTabContent()}
      </div>
    </AdminLayout>
  );
};

export default UnifiedAdminDashboard;