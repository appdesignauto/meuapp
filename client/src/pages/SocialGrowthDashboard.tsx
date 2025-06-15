import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Instagram, Facebook, TrendingUp, Target, Calendar, Users, BarChart3, Settings, Edit, Trash2 } from "lucide-react";

interface SocialProfile {
  id: number;
  platform: string;
  username: string;
  profileUrl?: string;
  followersCount: number;
  isActive: boolean;
}

interface SocialGoal {
  id: number;
  platform: string;
  goalType: string;
  currentValue: number;
  targetValue: number;
  deadline: string;
  status: string;
  progress: number;
  remaining: number;
}

interface SocialGrowthData {
  metrics: {
    totalFollowers: number;
    followersGrowth: number;
    totalSales: number;
    salesGrowth: number;
    metasAtivas: number;
    redesConectadas: number;
  };
  platforms: {
    instagram: {
      followers: number;
      username: string;
      monthlyGrowth: number;
      weeklyGrowth: number;
      dailyAverage: number;
    };
    facebook: {
      followers: number;
      username: string;
      monthlyGrowth: number;
      weeklyGrowth: number;
      dailyAverage: number;
    };
  };
  goals: SocialGoal[];
  chartData: {
    followers: Array<{ month: string; Instagram: number; Facebook: number }>;
    sales: Array<{ month: string; Instagram: number; Facebook: number }>;
  };
  monthlyComparison: Array<{
    month: string;
    instagram: { followers: number; sales: number };
    facebook: { followers: number; sales: number };
    total: { followers: number; sales: number };
  }>;
}

export default function SocialGrowthDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'profiles' | 'goals' | 'progress'>('overview');
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SocialProfile | null>(null);
  const [editingGoal, setEditingGoal] = useState<SocialGoal | null>(null);

  const queryClient = useQueryClient();

  // Buscar dados da visão geral
  const { data: overviewData, isLoading: overviewLoading } = useQuery<SocialGrowthData>({
    queryKey: ['/api/social-growth/overview'],
    enabled: activeTab === 'overview'
  });

  // Buscar perfis
  const { data: profiles = [], isLoading: profilesLoading } = useQuery<SocialProfile[]>({
    queryKey: ['/api/social-growth/profiles'],
    enabled: activeTab === 'profiles'
  });

  // Buscar metas
  const { data: goals = [], isLoading: goalsLoading } = useQuery<SocialGoal[]>({
    queryKey: ['/api/social-growth/goals'],
    enabled: activeTab === 'goals'
  });

  const renderOverview = () => {
    if (overviewLoading) return <div className="text-center py-8">Carregando...</div>;
    if (!overviewData) return <div className="text-center py-8">Nenhum dado disponível</div>;

    return (
      <div className="space-y-6">
        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Seguidores</p>
                <p className="text-2xl font-bold text-gray-900">{overviewData.metrics.totalFollowers.toLocaleString()}</p>
                <p className={`text-sm ${overviewData.metrics.followersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {overviewData.metrics.followersGrowth >= 0 ? '+' : ''}{overviewData.metrics.followersGrowth}% este mês
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Vendas</p>
                <p className="text-2xl font-bold text-gray-900">{overviewData.metrics.totalSales}</p>
                <p className={`text-sm ${overviewData.metrics.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {overviewData.metrics.salesGrowth >= 0 ? '+' : ''}{overviewData.metrics.salesGrowth}% este mês
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Metas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{overviewData.metrics.metasAtivas}</p>
                <p className="text-sm text-gray-500">{overviewData.metrics.redesConectadas} redes conectadas</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Dados por Plataforma */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Instagram */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Instagram className="h-6 w-6 text-pink-500" />
                <h3 className="text-lg font-semibold">Instagram</h3>
              </div>
              <span className="text-sm text-gray-500">@{overviewData.platforms.instagram.username || 'Não conectado'}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Seguidores</p>
                <p className="text-xl font-bold">{overviewData.platforms.instagram.followers.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Crescimento Mensal</p>
                <p className={`text-xl font-bold ${overviewData.platforms.instagram.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {overviewData.platforms.instagram.monthlyGrowth >= 0 ? '+' : ''}{overviewData.platforms.instagram.monthlyGrowth}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Crescimento Semanal</p>
                <p className="text-lg font-semibold">{overviewData.platforms.instagram.weeklyGrowth}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Média Diária</p>
                <p className="text-lg font-semibold">+{overviewData.platforms.instagram.dailyAverage}</p>
              </div>
            </div>
          </div>

          {/* Facebook */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Facebook className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold">Facebook</h3>
              </div>
              <span className="text-sm text-gray-500">@{overviewData.platforms.facebook.username || 'Não conectado'}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Seguidores</p>
                <p className="text-xl font-bold">{overviewData.platforms.facebook.followers.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Crescimento Mensal</p>
                <p className={`text-xl font-bold ${overviewData.platforms.facebook.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {overviewData.platforms.facebook.monthlyGrowth >= 0 ? '+' : ''}{overviewData.platforms.facebook.monthlyGrowth}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Crescimento Semanal</p>
                <p className="text-lg font-semibold">{overviewData.platforms.facebook.weeklyGrowth}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Média Diária</p>
                <p className="text-lg font-semibold">+{overviewData.platforms.facebook.dailyAverage}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Metas em Progresso */}
        {overviewData.goals.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Metas em Progresso</h3>
            <div className="space-y-4">
              {overviewData.goals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {goal.platform === 'instagram' && <Instagram className="h-4 w-4 text-pink-500" />}
                      {goal.platform === 'facebook' && <Facebook className="h-4 w-4 text-blue-600" />}
                      <span className="font-medium">
                        {goal.goalType === 'followers' ? 'Seguidores' : 'Vendas'} - {goal.platform}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(goal.progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{goal.progress}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()} 
                      • Prazo: {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparação Mensal */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Comparação dos Últimos 3 Meses</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Mês</th>
                  <th className="text-center p-2">Instagram Seguidores</th>
                  <th className="text-center p-2">Instagram Vendas</th>
                  <th className="text-center p-2">Facebook Seguidores</th>
                  <th className="text-center p-2">Facebook Vendas</th>
                  <th className="text-center p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {overviewData.monthlyComparison.map((month, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{month.month}</td>
                    <td className="p-2 text-center">{month.instagram.followers.toLocaleString()}</td>
                    <td className="p-2 text-center">{month.instagram.sales}</td>
                    <td className="p-2 text-center">{month.facebook.followers.toLocaleString()}</td>
                    <td className="p-2 text-center">{month.facebook.sales}</td>
                    <td className="p-2 text-center font-semibold">
                      {month.total.followers.toLocaleString()} / {month.total.sales}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderProfiles = () => {
    if (profilesLoading) return <div className="text-center py-8">Carregando...</div>;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Redes Sociais Conectadas</h2>
          <button
            onClick={() => setShowAddProfile(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Rede</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div key={profile.id} className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {profile.platform === 'instagram' && <Instagram className="h-6 w-6 text-pink-500" />}
                  {profile.platform === 'facebook' && <Facebook className="h-6 w-6 text-blue-600" />}
                  <h3 className="font-semibold capitalize">{profile.platform}</h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingProfile(profile)}
                    className="text-gray-400 hover:text-blue-500"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-500">@{profile.username}</p>
                <p className="text-lg font-bold">{profile.followersCount.toLocaleString()} seguidores</p>
                {profile.profileUrl && (
                  <a 
                    href={profile.profileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Ver Perfil
                  </a>
                )}
                <div className={`inline-flex px-2 py-1 rounded-full text-xs ${
                  profile.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {profile.isActive ? 'Ativo' : 'Inativo'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {profiles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Nenhuma rede social conectada</p>
            <button
              onClick={() => setShowAddProfile(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
            >
              Conectar Primeira Rede
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderGoals = () => {
    if (goalsLoading) return <div className="text-center py-8">Carregando...</div>;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Metas de Crescimento</h2>
          <button
            onClick={() => setShowAddGoal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Meta</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {goal.platform === 'instagram' && <Instagram className="h-5 w-5 text-pink-500" />}
                  {goal.platform === 'facebook' && <Facebook className="h-5 w-5 text-blue-600" />}
                  {goal.platform === 'general' && <Target className="h-5 w-5 text-orange-500" />}
                  <h3 className="font-semibold">
                    {goal.goalType === 'followers' ? 'Seguidores' : 'Vendas'} - {goal.platform}
                  </h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingGoal(goal)}
                    className="text-gray-400 hover:text-blue-500"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Progresso</span>
                  <span className="text-sm font-medium">{goal.progress}%</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      goal.progress >= 100 ? 'bg-green-500' : 
                      goal.progress >= 75 ? 'bg-blue-500' :
                      goal.progress >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Atual</p>
                    <p className="font-semibold">{goal.currentValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Meta</p>
                    <p className="font-semibold">{goal.targetValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Restam</p>
                    <p className="font-semibold">{goal.remaining.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Prazo</p>
                    <p className="font-semibold">{new Date(goal.deadline).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className={`inline-flex px-2 py-1 rounded-full text-xs ${
                  goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                  goal.status === 'active' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {goal.status === 'completed' ? 'Concluída' :
                   goal.status === 'active' ? 'Ativa' : 'Pausada'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {goals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Nenhuma meta cadastrada</p>
            <button
              onClick={() => setShowAddGoal(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
            >
              Criar Primeira Meta
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Crescimento Social</h1>
          <p className="text-gray-600">Acompanhe o crescimento das suas redes sociais e metas de negócio</p>
        </div>

        {/* Navegação por Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Visão Geral</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('profiles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profiles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Redes Sociais</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'goals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Metas</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'profiles' && renderProfiles()}
        {activeTab === 'goals' && renderGoals()}
      </div>
    </div>
  );
}