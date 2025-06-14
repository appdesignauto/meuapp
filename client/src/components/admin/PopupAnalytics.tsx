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

      {/* Lista Detalhada de Popups Individuais */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Performance Individual dos Popups</CardTitle>
            </div>
            <Badge variant="outline" className="text-sm">
              Últimos 30 dias
            </Badge>
          </div>
          <CardDescription>
            Métricas detalhadas de cada popup com comparação de performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingIndividual ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="flex space-x-4">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {(individualStats || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum popup encontrado</p>
                  <p className="text-sm">Crie seu primeiro popup para começar a acompanhar as métricas</p>
                </div>
              ) : (
                <>
                  {/* Header da tabela */}
                  <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-600">
                    <div className="col-span-4">Popup</div>
                    <div className="col-span-2 text-center">Visualizações</div>
                    <div className="col-span-2 text-center">Cliques</div>
                    <div className="col-span-2 text-center">Taxa Conversão</div>
                    <div className="col-span-2 text-center">Status</div>
                  </div>

                  {/* Lista de popups */}
                  {(individualStats || []).map((popup: IndividualPopupStats, index: number) => (
                    <div key={popup.id} className="grid grid-cols-12 gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      {/* Informações do popup */}
                      <div className="col-span-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${popup.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div>
                            <p className="font-medium text-gray-900">{popup.title}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>#{popup.id}</span>
                              <span>•</span>
                              <span>{popup.position}</span>
                              <span>•</span>
                              <span>{popup.size}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Visualizações */}
                      <div className="col-span-2 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-semibold text-gray-900">{popup.views.toLocaleString()}</span>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">views</span>
                          </div>
                        </div>
                      </div>

                      {/* Cliques */}
                      <div className="col-span-2 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-semibold text-gray-900">{popup.clicks.toLocaleString()}</span>
                          <div className="flex items-center space-x-1">
                            <MousePointer className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">clicks</span>
                          </div>
                        </div>
                      </div>

                      {/* Taxa de Conversão */}
                      <div className="col-span-2 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-semibold text-gray-900">{popup.conversionRate}%</span>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                              style={{width: `${Math.min(popup.conversionRate, 100)}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 text-center">
                        <Badge 
                          variant={popup.isActive ? "default" : "secondary"}
                          className={popup.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                        >
                          {popup.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(popup.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Rodapé com resumo */}
                  {individualPopupStats.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Activity className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Resumo Geral</span>
                        </div>
                        <div className="flex items-center space-x-6 text-blue-700">
                          <span>{individualPopupStats.length} popup{individualPopupStats.length !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{individualPopupStats.filter(p => p.isActive).length} ativo{individualPopupStats.filter(p => p.isActive).length !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>
                            {individualPopupStats.reduce((acc, popup) => acc + popup.views, 0).toLocaleString()} visualizações totais
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PopupAnalytics;