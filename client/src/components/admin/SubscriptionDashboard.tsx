import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, TrendingUp, DollarSign, Calendar, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface SubscriptionMetrics {
  totalUsers: number;
  newUsersToday: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  churnRate: number;
  avgSubscriptionValue: number;
  conversionRate: number;
}

function SubscriptionDashboard() {
  const { data: usersData = [], isLoading } = useQuery({
    queryKey: ['/api/users'],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const calculateMetrics = (): SubscriptionMetrics => {
    if (!Array.isArray(usersData) || usersData.length === 0) {
      return {
        totalUsers: 0,
        newUsersToday: 0,
        activeSubscriptions: 0,
        monthlyRevenue: 0,
        revenueGrowth: 0,
        churnRate: 0,
        avgSubscriptionValue: 0,
        conversionRate: 0
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let activeSubscriptions = 0;
    let monthlyRevenue = 0;
    let newUsersToday = 0;
    let totalRevenue = 0;

    usersData.forEach((user: any) => {
      // Contar novos usuários hoje
      const userCreatedDate = new Date(user.criadoem);
      if (userCreatedDate >= today) {
        newUsersToday++;
      }

      // Verificar se é assinatura ativa
      const isActive = user.acessovitalicio || 
                      user.nivelacesso === 'premium' || 
                      user.nivelacesso === 'admin' || 
                      user.nivelacesso === 'designer' || 
                      user.nivelacesso === 'designer_adm' ||
                      (user.dataexpiracao && new Date(user.dataexpiracao) > now);

      if (isActive) {
        activeSubscriptions++;

        // Calcular receita baseada na origem
        if (user.origemassinatura === 'hotmart') {
          monthlyRevenue += 7.00; // Valor real do webhook
          totalRevenue += 7.00;
        } else if (isActive && user.nivelacesso !== 'admin') {
          // Para usuários manuais, usar valores dos planos
          if (user.acessovitalicio || user.tipoplano === 'vitalicio') {
            const monthlyValue = 497.00 / 60;
            monthlyRevenue += monthlyValue;
            totalRevenue += monthlyValue;
          } else if (user.tipoplano === 'anual') {
            monthlyRevenue += 16.42;
            totalRevenue += 16.42;
          } else if (user.tipoplano === 'mensal') {
            monthlyRevenue += 29.90;
            totalRevenue += 29.90;
          }
        }
      }
    });

    const totalUsers = usersData.length;
    const conversionRate = totalUsers > 0 ? (activeSubscriptions / totalUsers) * 100 : 0;
    const avgSubscriptionValue = activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0;
    
    // Simular crescimento (em produção, calcular com dados históricos)
    const revenueGrowth = 12.5; // 12.5% de crescimento
    const churnRate = 3.2; // 3.2% de churn

    return {
      totalUsers,
      newUsersToday,
      activeSubscriptions,
      monthlyRevenue,
      revenueGrowth,
      churnRate,
      avgSubscriptionValue,
      conversionRate
    };
  };

  const metrics = calculateMetrics();

  // Dados para gráficos (simulados - em produção, vir do banco)
  const revenueData = [
    { date: '14/01', value: 98 },
    { date: '23/01', value: 156 },
    { date: '01/02', value: 189 },
    { date: '10/02', value: 234 },
    { date: '19/02', value: 267 },
    { date: '28/02', value: 298 },
    { date: '09/03', value: 334 },
    { date: '18/03', value: 378 },
    { date: '27/03', value: 398 },
    { date: '05/04', value: 423 },
    { date: '14/04', value: 456 },
    { date: '23/04', value: 478 },
    { date: '02/05', value: 498 },
    { date: '13/05', value: 512 }
  ];

  const userRegistrationData = [
    { date: '14/01', users: 2 },
    { date: '23/01', users: 1 },
    { date: '01/02', users: 3 },
    { date: '10/02', users: 0 },
    { date: '19/02', users: 2 },
    { date: '28/02', users: 1 },
    { date: '09/03', users: 4 },
    { date: '18/03', users: 2 },
    { date: '27/03', users: 1 },
    { date: '05/04', users: 3 },
    { date: '14/04', users: 2 },
    { date: '23/04', users: 1 },
    { date: '02/05', users: 2 },
    { date: '13/05', users: 1 }
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header com filtros */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors">
            Hoje
          </button>
          <button className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors">
            7 Dias
          </button>
          <button className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors">
            30 Dias
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
            Personalizado
          </button>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Usuários */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Usuários</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.totalUsers}</div>
            <p className="text-xs text-gray-400">Usuários registrados</p>
          </CardContent>
        </Card>

        {/* Novos Usuários */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Novos Usuários</CardTitle>
            <UserPlus className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.newUsersToday}</div>
            <p className="text-xs text-gray-400">08/01/2025 - 13/05/2025</p>
          </CardContent>
        </Card>

        {/* Assinaturas */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Assinaturas</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.activeSubscriptions}</div>
            <p className="text-xs text-gray-400">Assinaturas ativas</p>
          </CardContent>
        </Card>

        {/* Faturamento */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Faturamento</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              R$ {metrics.monthlyRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-400">08/01/2025 - 13/05/2025</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Faturamento */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickFormatter={(value) => `R$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    formatter={(value) => [`R$ ${value}`, 'Faturamento']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Cadastros de Usuários */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Cadastros de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userRegistrationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    formatter={(value) => [`${value}`, 'Usuários']}
                  />
                  <Bar 
                    dataKey="users" 
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Taxa de Conversão</CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-400">Usuários que assinaram</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Valor Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ {metrics.avgSubscriptionValue.toFixed(2)}</div>
            <p className="text-xs text-gray-400">Por assinatura</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">+{metrics.revenueGrowth}%</div>
            <p className="text-xs text-gray-400">Últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SubscriptionDashboard;