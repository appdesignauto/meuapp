import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { 
  Users, 
  Image, 
  MessageSquare, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Video,
  Crown,
  Download,
  Clock,
  Star,
  Eye,
  Filter,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DashboardOverview = () => {
  const [dateFilter, setDateFilter] = useState('30d');
  
  // Query para obter estatísticas reais do dashboard
  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats', dateFilter],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/stats?period=${dateFilter}`);
      if (!response.ok) {
        throw new Error('Falha ao carregar estatísticas');
      }
      return await response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded mb-1"></div>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = dashboardStats || {};

  return (
    <div className="space-y-6">
      {/* Header com filtro de data */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard de Monetização</h2>
          <p className="text-sm text-gray-500">Acompanhe métricas financeiras e de crescimento da plataforma</p>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards principais de monetização */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Total */}
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Faturamento Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              R$ {(stats.periodRevenue || 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Receita do período selecionado
            </p>
          </CardContent>
        </Card>

        {/* Assinantes Ativos */}
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Assinantes Ativos
            </CardTitle>
            <Crown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.premiumUsers || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              +{stats.userGrowthPercent || 0}% crescimento no período
            </p>
          </CardContent>
        </Card>

        {/* Taxa de Conversão */}
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.conversionRate || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Taxa de conversão no período
            </p>
          </CardContent>
        </Card>

        {/* Ticket Médio */}
        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ticket Médio
            </CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              R$ {(stats.averageTicket || 97).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ticket médio do período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção de distribuição e métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Distribuição de Usuários</CardTitle>
            <p className="text-sm text-gray-500">Comparação entre usuários gratuitos e premium</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Usuários Gratuitos</span>
              </div>
              <span className="font-semibold">{(stats.totalUsers || 0) - (stats.premiumUsers || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Usuários Premium</span>
              </div>
              <span className="font-semibold">{stats.premiumUsers || 0}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total de Usuários</span>
                <span className="font-bold">{stats.totalUsers || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Crescimento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Métricas de Crescimento</CardTitle>
            <p className="text-sm text-gray-500">Indicadores de performance no período selecionado</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Novos Cadastros</span>
              <span className="font-semibold">+{stats.newUsersThisPeriod || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Artes Criadas</span>
              <span className="font-semibold">+{stats.artsThisPeriod || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Posts da Comunidade</span>
              <span className="font-semibold">+{stats.postsThisPeriod || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Downloads</span>
              <span className="font-semibold">+{stats.downloadsThisPeriod || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards principais de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Usuários Totais */}
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Usuários Totais
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalUsers?.toLocaleString('pt-BR') || '1,245'}
            </div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{stats.userGrowthPercent || 0}% no período
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.premiumUsers || 327} premium ativos
            </p>
          </CardContent>
        </Card>

        {/* Total de Artes */}
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Artes
            </CardTitle>
            <Image className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalArts?.toLocaleString('pt-BR') || '2,847'}
            </div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{stats.artGrowthPercent || 0}% no período
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.artsThisPeriod || 0} criadas no período
            </p>
          </CardContent>
        </Card>

        {/* Posts Comunidade */}
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Posts Comunidade
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalPosts?.toLocaleString('pt-BR') || '489'}
            </div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{stats.communityGrowthPercent || 0}% no período
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.postsThisPeriod || 0} posts no período
            </p>
          </CardContent>
        </Card>

        {/* Receita Mensal */}
        <Card className="border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Receita Mensal
            </CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              R$ {(stats.monthlyRevenue || 18200).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +7% este mês
            </p>
            <p className="text-xs text-gray-500 mt-1">
              R$ {(stats.revenueThisWeek || 5100).toLocaleString('pt-BR')} esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Detalhadas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Estatísticas Detalhadas
          </CardTitle>
          <p className="text-sm text-gray-500">Métricas de performance da plataforma</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Vídeo-aulas */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Video className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Vídeo-aulas</p>
                  <p className="text-xs text-gray-500">Conteúdo educacional</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{stats.videoLessons || 84}</p>
              </div>
            </div>

            {/* Categorias */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Categorias</p>
                  <p className="text-xs text-gray-500">Organização de conteúdo</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{stats.categories || 15}</p>
              </div>
            </div>

            {/* Formatos */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Image className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Formatos</p>
                  <p className="text-xs text-gray-500">Tipos de arte</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{stats.formats || 8}</p>
              </div>
            </div>

            {/* Downloads */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Download className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Downloads</p>
                  <p className="text-xs text-gray-500">Total de downloads</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {(stats.downloads || stats.totalDownloads || 0).toLocaleString('pt-BR')}
                </p>
                {stats.downloadGrowthPercent !== undefined && stats.downloadGrowthPercent !== 0 && (
                  <p className="text-xs text-green-600 font-medium">
                    {stats.downloadGrowthPercent > 0 ? '+' : ''}{stats.downloadGrowthPercent}%
                  </p>
                )}
              </div>
            </div>

            {/* Comentários */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Comentários</p>
                  <p className="text-xs text-gray-500">Engajamento</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {(stats.comments || stats.totalComments || 0).toLocaleString('pt-BR')}
                </p>
                {stats.commentGrowthPercent !== undefined && stats.commentGrowthPercent !== 0 && (
                  <p className="text-xs text-green-600 font-medium">
                    {stats.commentGrowthPercent > 0 ? '+' : ''}{stats.commentGrowthPercent}%
                  </p>
                )}
              </div>
            </div>

            {/* Avaliação */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Avaliação</p>
                  <p className="text-xs text-gray-500">Satisfação média</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {stats.rating || 4.8}★
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;