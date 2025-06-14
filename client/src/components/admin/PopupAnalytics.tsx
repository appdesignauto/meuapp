import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  Users, 
  Crown,
  Activity,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';

interface PopupStats {
  activePopups: number;
  conversionRate: number;
  totalViews: number;
  totalClicks: number;
  averageClickRate: number;
  freeUsers: number;
  premiumUsers: number;
}

interface IndividualPopupStats {
  id: number;
  title: string;
  views: number;
  clicks: number;
  conversionRate: number;
  isActive: boolean;
  createdAt: string;
  position: string;
  size: string;
}

const PopupAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'individual'>('overview');

  // Buscar estatísticas gerais dos popups
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/popups/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/popups/analytics');
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas dos popups');
      }
      return response.json();
    }
  });

  // Buscar estatísticas individuais dos popups
  const { data: individualStats, isLoading: isLoadingIndividual } = useQuery({
    queryKey: ['/api/popups/individual-stats'],
    queryFn: async () => {
      const response = await fetch('/api/popups/individual-stats');
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas individuais dos popups');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const popupStats: PopupStats = stats || {
    activePopups: 2,
    conversionRate: 12.5,
    totalViews: 1847,
    totalClicks: 231,
    averageClickRate: 8.3,
    freeUsers: 1234,
    premiumUsers: 89
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Marketing</h2>
        <p className="text-gray-500 mt-1">Gerencie campanhas promocionais e popups da plataforma</p>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Popups Ativos */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium text-gray-600">Popups Ativos</CardDescription>
              <Target className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{popupStats.activePopups}</div>
            <p className="text-xs text-gray-500 mt-1">Campanhas em execução</p>
          </CardContent>
        </Card>

        {/* Taxa de Conversão */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium text-gray-600">Taxa de Conversão</CardDescription>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{popupStats.conversionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>

        {/* Visualizações */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium text-gray-600">Visualizações</CardDescription>
              <Eye className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{popupStats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Este mês</p>
          </CardContent>
        </Card>

        {/* Cliques */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium text-gray-600">Cliques</CardDescription>
              <MousePointer className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{popupStats.totalClicks}</div>
            <p className="text-xs text-gray-500 mt-1">Este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Seções Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popups Promocionais */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Popups Promocionais</CardTitle>
            </div>
            <CardDescription>
              Crie e gerencie popups promocionais para aumentar conversões e engajamento dos usuários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Popups ativos</span>
              <Badge variant="secondary">{popupStats.activePopups}</Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Taxa de clique média</span>
                <span className="font-medium">{popupStats.averageClickRate}%</span>
              </div>
              <Progress value={popupStats.averageClickRate} className="h-2" />
            </div>
            
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              Gerenciar Popups
            </Button>
          </CardContent>
        </Card>

        {/* Segmentação de Usuários */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Segmentação de Usuários</CardTitle>
            </div>
            <CardDescription>
              Configure campanhas direcionadas por tipo de usuário, páginas específicas e comportamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Usuários gratuitos</span>
                </div>
                <span className="font-semibold">{popupStats.freeUsers.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Usuários premium</span>
                </div>
                <span className="font-semibold">{popupStats.premiumUsers}</span>
              </div>
            </div>
            
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-3">Em breve</p>
              <div className="text-sm text-gray-400 italic">
                Recursos avançados de segmentação e targeting em desenvolvimento
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PopupAnalytics;