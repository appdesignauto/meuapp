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

  if (isLoading || isLoadingIndividual) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Marketing</h2>
          <p className="text-gray-500 mt-1">Carregando estatísticas...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const popupStats: PopupStats = stats || {
    activePopups: 0,
    conversionRate: 0,
    totalViews: 0,
    totalClicks: 0,
    averageClickRate: 0,
    freeUsers: 0,
    premiumUsers: 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Marketing</h2>
        <p className="text-gray-500 mt-1">Gerencie campanhas promocionais e popups da plataforma</p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Popups Ativos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{popupStats.activePopups}</div>
            <p className="text-xs text-muted-foreground">
              campanhas em execução
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{popupStats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              +12% desde o mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{popupStats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              impressões totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{popupStats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              interações dos usuários
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes visualizações */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'individual')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="individual">Popups Individuais</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Performance Geral */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance das Campanhas</CardTitle>
                <CardDescription>Métricas de engajamento dos popups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de Clique Média</span>
                    <span className="text-sm font-medium">{popupStats.averageClickRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={popupStats.averageClickRate} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de Conversão</span>
                    <span className="text-sm font-medium">{popupStats.conversionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={popupStats.conversionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Segmentação de Usuários</CardTitle>
                <CardDescription>Distribuição por tipo de assinatura</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Usuários Gratuitos</span>
                  </div>
                  <Badge variant="secondary">{popupStats.freeUsers.toLocaleString()}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Crown className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Usuários Premium</span>
                  </div>
                  <Badge variant="default">{popupStats.premiumUsers.toLocaleString()}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Performance Individual dos Popups</span>
              </CardTitle>
              <CardDescription>
                Análise detalhada de cada popup com métricas específicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(individualStats || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum popup encontrado</p>
                  <p className="text-sm">Crie seu primeiro popup para começar a acompanhar as métricas</p>
                </div>
              ) : (
                <>
                  {/* Cabeçalho da tabela */}
                  <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-gray-600 border-b">
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
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <div>
                            <h4 className="font-medium text-gray-900 truncate">{popup.title}</h4>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{popup.position}</span>
                              <span>•</span>
                              <span>{popup.size}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Visualizações */}
                      <div className="col-span-2 text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {popup.views.toLocaleString()}
                        </div>
                        <div className="flex items-center justify-center mt-1">
                          <Eye className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">views</span>
                        </div>
                      </div>

                      {/* Cliques */}
                      <div className="col-span-2 text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {popup.clicks.toLocaleString()}
                        </div>
                        <div className="flex items-center justify-center mt-1">
                          <MousePointer className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">clicks</span>
                        </div>
                      </div>

                      {/* Taxa de Conversão */}
                      <div className="col-span-2 text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {popup.conversionRate.toFixed(1)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                          <div 
                            className="bg-green-500 h-1 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(popup.conversionRate, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 text-center">
                        <Badge 
                          variant={popup.isActive ? "default" : "secondary"}
                          className={popup.isActive ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          {popup.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(popup.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Rodapé com resumo */}
                  {(individualStats || []).length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Activity className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Resumo Geral</span>
                        </div>
                        <div className="flex items-center space-x-6 text-blue-700">
                          <span>{(individualStats || []).length} popup{(individualStats || []).length !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{(individualStats || []).filter((p: IndividualPopupStats) => p.isActive).length} ativo{(individualStats || []).filter((p: IndividualPopupStats) => p.isActive).length !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>
                            {(individualStats || []).reduce((acc: number, popup: IndividualPopupStats) => acc + popup.views, 0).toLocaleString()} visualizações totais
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PopupAnalytics;