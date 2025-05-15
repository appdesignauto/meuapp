import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

// Tipagem para os dados de tendência
interface SubscriptionTrendData {
  date: string;
  total: number;
  active: number;
  expired: number;
  growth: number;
}

const SubscriptionTrends = () => {
  const [timeRange, setTimeRange] = useState('6');
  
  // Consulta para obter dados de tendências
  const { 
    data: trendData,
    isLoading: isLoadingTrends,
    isError: isErrorTrends,
    error: trendsError
  } = useQuery<SubscriptionTrendData[]>({
    queryKey: ['/api/subscription-trends', timeRange],
    queryFn: async () => {
      const response = await apiRequest(
        'GET', 
        `/api/subscription-trends?months=${timeRange}`
      );
      return response.json();
    }
  });
  
  // Formatação dos dados para melhor exibição
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };
  
  // Calcular crescimento total no período
  const calculateOverallGrowth = () => {
    if (!trendData || trendData.length < 2) return 0;
    
    const firstMonth = trendData[0];
    const lastMonth = trendData[trendData.length - 1];
    
    if (firstMonth.total === 0) return 100;
    
    return ((lastMonth.total - firstMonth.total) / firstMonth.total) * 100;
  };
  
  const overallGrowth = trendData ? calculateOverallGrowth() : 0;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Tendências de Assinaturas</h3>
          <p className="text-sm text-muted-foreground">
            Acompanhe a evolução das assinaturas ao longo do tempo
          </p>
        </div>
        <Select
          value={timeRange}
          onValueChange={(value) => setTimeRange(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Últimos 3 meses</SelectItem>
            <SelectItem value="6">Últimos 6 meses</SelectItem>
            <SelectItem value="12">Último ano</SelectItem>
            <SelectItem value="24">Últimos 2 anos</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {isLoadingTrends ? (
        <div className="w-full py-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Carregando dados de tendências...</p>
          </div>
        </div>
      ) : isErrorTrends ? (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Erro ao carregar dados de tendências</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {trendsError instanceof Error ? trendsError.message : 'Tente novamente mais tarde.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Crescimento no Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  {overallGrowth > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span className={`text-2xl font-bold ${
                    overallGrowth > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {overallGrowth.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Assinantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {trendData && trendData.length > 0 ? trendData[trendData.length - 1].total : 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Assinantes Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {trendData && trendData.length > 0 ? trendData[trendData.length - 1].active : 0}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Assinaturas</CardTitle>
              <CardDescription>
                Comparativo entre assinaturas ativas e expiradas ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="growth" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="growth">Crescimento</TabsTrigger>
                  <TabsTrigger value="total">Total e Ativos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="growth">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trendData?.map(item => ({
                          ...item,
                          date: formatDate(item.date)
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="date" />
                        <YAxis domain={['auto', 'auto']} unit="%" />
                        <Tooltip 
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Crescimento']}
                          labelFormatter={(label) => `Data: ${label}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="growth" 
                          name="Taxa de Crescimento" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                
                <TabsContent value="total">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={trendData?.map(item => ({
                          ...item,
                          date: formatDate(item.date)
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="total" 
                          name="Total de Assinantes" 
                          stackId="1"
                          stroke="#6366f1" 
                          fill="#6366f1"
                          fillOpacity={0.3}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="active" 
                          name="Assinantes Ativos" 
                          stackId="2"
                          stroke="#10b981" 
                          fill="#10b981"
                          fillOpacity={0.3}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="expired" 
                          name="Assinaturas Expiradas" 
                          stackId="3"
                          stroke="#f43f5e" 
                          fill="#f43f5e"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SubscriptionTrends;