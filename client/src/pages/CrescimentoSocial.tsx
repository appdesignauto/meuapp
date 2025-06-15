import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Instagram, 
  Facebook, 
  Plus, 
  Target, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  ExternalLink,
  Calendar,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Edit
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SocialProfile {
  id: number;
  platform: 'instagram' | 'facebook';
  profileName: string;
  profileUrl: string;
  createdAt: string;
}

interface SocialGoal {
  id: number;
  platform: 'instagram' | 'facebook';
  goalType: 'followers' | 'sales';
  targetValue: number;
  deadline: string;
  createdAt: string;
}

interface SocialProgress {
  id: number;
  platform: 'instagram' | 'facebook';
  month: string;
  followers: number;
  sales: number;
  createdAt: string;
}

interface SocialDashboard {
  profiles: SocialProfile[];
  goals: SocialGoal[];
  progress: SocialProgress[];
}

export default function CrescimentoSocial() {
  const [activeTab, setActiveTab] = useState('minhas-redes');
  const [isAddProfileOpen, setIsAddProfileOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddProgressOpen, setIsAddProgressOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading } = useQuery<SocialDashboard>({
    queryKey: ['/api/social/dashboard'],
    queryFn: () => apiRequest('/api/social/dashboard')
  });

  const addProfileMutation = useMutation({
    mutationFn: (data: { platform: string; profileName: string; profileUrl: string }) =>
      apiRequest('/api/social/add-profile', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/dashboard'] });
      setIsAddProfileOpen(false);
      toast({
        title: "Perfil adicionado",
        description: "Perfil social adicionado com sucesso!"
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao adicionar perfil social",
        variant: "destructive"
      });
    }
  });

  const addGoalMutation = useMutation({
    mutationFn: (data: { platform: string; goalType: string; targetValue: number; deadline: string }) =>
      apiRequest('/api/social/add-goal', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/dashboard'] });
      setIsAddGoalOpen(false);
      toast({
        title: "Meta criada",
        description: "Meta social criada com sucesso!"
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar meta social",
        variant: "destructive"
      });
    }
  });

  const addProgressMutation = useMutation({
    mutationFn: (data: { platform: string; month: string; followers: number; sales: number }) =>
      apiRequest('/api/social/add-progress', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/dashboard'] });
      setIsAddProgressOpen(false);
      toast({
        title: "Progresso atualizado",
        description: "Progresso mensal adicionado com sucesso!"
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao adicionar progresso",
        variant: "destructive"
      });
    }
  });

  const deleteProfileMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/social/delete-profile/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/dashboard'] });
      toast({
        title: "Perfil removido",
        description: "Perfil social removido com sucesso!"
      });
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/social/delete-goal/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/dashboard'] });
      toast({
        title: "Meta removida",
        description: "Meta social removida com sucesso!"
      });
    }
  });

  const handleAddProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addProfileMutation.mutate({
      platform: formData.get('platform') as string,
      profileName: formData.get('profileName') as string,
      profileUrl: formData.get('profileUrl') as string
    });
  };

  const handleAddGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addGoalMutation.mutate({
      platform: formData.get('platform') as string,
      goalType: formData.get('goalType') as string,
      targetValue: parseInt(formData.get('targetValue') as string),
      deadline: formData.get('deadline') as string
    });
  };

  const handleAddProgress = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addProgressMutation.mutate({
      platform: formData.get('platform') as string,
      month: formData.get('month') as string,
      followers: parseInt(formData.get('followers') as string),
      sales: parseInt(formData.get('sales') as string)
    });
  };

  const getPlatformIcon = (platform: string) => {
    return platform === 'instagram' ? <Instagram className="h-5 w-5" /> : <Facebook className="h-5 w-5" />;
  };

  const getPlatformColor = (platform: string) => {
    return platform === 'instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-blue-600';
  };

  const calculateGoalProgress = (goal: SocialGoal) => {
    if (!dashboard?.progress) return 0;
    
    const relevantProgress = dashboard.progress.filter(p => 
      p.platform === goal.platform && 
      (goal.goalType === 'followers' ? p.followers : p.sales) > 0
    );
    
    if (relevantProgress.length === 0) return 0;
    
    const latestProgress = relevantProgress.sort((a, b) => 
      new Date(b.month).getTime() - new Date(a.month).getTime()
    )[0];
    
    const currentValue = goal.goalType === 'followers' ? latestProgress.followers : latestProgress.sales;
    return Math.min((currentValue / goal.targetValue) * 100, 100);
  };

  const getGoalStatus = (goal: SocialGoal) => {
    const progress = calculateGoalProgress(goal);
    const deadline = new Date(goal.deadline);
    const now = new Date();
    const isExpired = deadline < now;
    
    if (progress >= 100) {
      return { status: 'completed', color: 'text-green-600', icon: CheckCircle };
    } else if (isExpired) {
      return { status: 'expired', color: 'text-red-600', icon: AlertTriangle };
    } else {
      return { status: 'active', color: 'text-blue-600', icon: Target };
    }
  };

  const prepareChartData = () => {
    if (!dashboard?.progress) return [];
    
    const groupedData = dashboard.progress.reduce((acc, item) => {
      const key = item.month;
      if (!acc[key]) {
        acc[key] = { month: key, instagram_followers: 0, instagram_sales: 0, facebook_followers: 0, facebook_sales: 0 };
      }
      
      if (item.platform === 'instagram') {
        acc[key].instagram_followers = item.followers;
        acc[key].instagram_sales = item.sales;
      } else {
        acc[key].facebook_followers = item.followers;
        acc[key].facebook_sales = item.sales;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(groupedData).sort((a: any, b: any) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  };

  const generateAlert = (goal: SocialGoal) => {
    const progress = calculateGoalProgress(goal);
    const deadline = new Date(goal.deadline);
    const now = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (progress >= 100) {
      return `🎉 Parabéns! Você bateu sua meta de ${goal.goalType === 'followers' ? 'seguidores' : 'vendas'} no ${goal.platform}!`;
    } else if (daysLeft <= 0) {
      return `⚠️ Sua meta de ${goal.goalType === 'followers' ? 'seguidores' : 'vendas'} no ${goal.platform} expirou.`;
    } else if (daysLeft <= 7) {
      const needed = goal.targetValue - (goal.targetValue * progress / 100);
      return `⚠️ Você precisa ganhar ${Math.ceil(needed)} ${goal.goalType === 'followers' ? 'seguidores' : 'vendas'} até o fim do mês para manter o ritmo.`;
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <TrendingUp className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Crescimento Social</h1>
          <p className="text-muted-foreground">
            Acompanhe e visualize o crescimento de seguidores e vendas nas redes sociais
          </p>
        </div>
      </div>

      {/* Alerts */}
      {dashboard?.goals && dashboard.goals.length > 0 && (
        <div className="space-y-2">
          {dashboard.goals.map(goal => {
            const alert = generateAlert(goal);
            if (!alert) return null;
            
            return (
              <div key={goal.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">{alert}</p>
              </div>
            );
          })}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="minhas-redes">Minhas Redes</TabsTrigger>
          <TabsTrigger value="minhas-metas">Minhas Metas</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="minhas-redes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Redes Sociais Conectadas</h2>
            <Dialog open={isAddProfileOpen} onOpenChange={setIsAddProfileOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Rede
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Perfil Social</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="platform">Plataforma</Label>
                    <Select name="platform" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a plataforma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="profileName">Nome do Perfil</Label>
                    <Input
                      name="profileName"
                      placeholder="@seuperfil"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="profileUrl">URL do Perfil</Label>
                    <Input
                      name="profileUrl"
                      type="url"
                      placeholder="https://instagram.com/seuperfil"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={addProfileMutation.isPending}>
                    {addProfileMutation.isPending ? 'Adicionando...' : 'Adicionar Perfil'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboard?.profiles?.map((profile) => (
              <Card key={profile.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg text-white ${getPlatformColor(profile.platform)}`}>
                        {getPlatformIcon(profile.platform)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{profile.profileName}</CardTitle>
                        <CardDescription className="capitalize">{profile.platform}</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteProfileMutation.mutate(profile.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(profile.profileUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Perfil
                  </Button>
                </CardContent>
              </Card>
            ))}

            {(!dashboard?.profiles || dashboard.profiles.length === 0) && (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma rede conectada</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Adicione seus perfis do Instagram e Facebook para começar a acompanhar o crescimento
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="minhas-metas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Minhas Metas</h2>
            <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Target className="h-4 w-4 mr-2" />
                  Criar Meta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Meta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddGoal} className="space-y-4">
                  <div>
                    <Label htmlFor="platform">Plataforma</Label>
                    <Select name="platform" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a plataforma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="goalType">Tipo da Meta</Label>
                    <Select name="goalType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="followers">Seguidores</SelectItem>
                        <SelectItem value="sales">Vendas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="targetValue">Valor da Meta</Label>
                    <Input
                      name="targetValue"
                      type="number"
                      placeholder="10000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="deadline">Data Limite</Label>
                    <Input
                      name="deadline"
                      type="date"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={addGoalMutation.isPending}>
                    {addGoalMutation.isPending ? 'Criando...' : 'Criar Meta'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboard?.goals?.map((goal) => {
              const progress = calculateGoalProgress(goal);
              const { status, color, icon: StatusIcon } = getGoalStatus(goal);
              
              return (
                <Card key={goal.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg text-white ${getPlatformColor(goal.platform)}`}>
                          {getPlatformIcon(goal.platform)}
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            Meta de {goal.goalType === 'followers' ? 'Seguidores' : 'Vendas'}
                            <StatusIcon className={`h-4 w-4 ${color}`} />
                          </CardTitle>
                          <CardDescription className="capitalize">{goal.platform}</CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteGoalMutation.mutate(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Meta: {goal.targetValue.toLocaleString()}</span>
                      <span>Até: {new Date(goal.deadline).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {(!dashboard?.goals || dashboard.goals.length === 0) && (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma meta definida</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Crie suas primeiras metas de crescimento para seguidores e vendas
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Histórico Mensal</h2>
            <Dialog open={isAddProgressOpen} onOpenChange={setIsAddProgressOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Atualizar Dados
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Atualizar Progresso Mensal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddProgress} className="space-y-4">
                  <div>
                    <Label htmlFor="platform">Plataforma</Label>
                    <Select name="platform" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a plataforma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="month">Mês</Label>
                    <Input
                      name="month"
                      type="month"
                      defaultValue={new Date().toISOString().slice(0, 7)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="followers">Seguidores</Label>
                    <Input
                      name="followers"
                      type="number"
                      placeholder="5000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sales">Vendas</Label>
                    <Input
                      name="sales"
                      type="number"
                      placeholder="12"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={addProgressMutation.isPending}>
                    {addProgressMutation.isPending ? 'Salvando...' : 'Salvar Progresso'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {dashboard?.progress && dashboard.progress.length > 0 ? (
            <>
              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Evolução de Seguidores
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={prepareChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="instagram_followers" 
                          stroke="#E1306C" 
                          strokeWidth={2}
                          name="Instagram"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="facebook_followers" 
                          stroke="#1877F2" 
                          strokeWidth={2}
                          name="Facebook"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Evolução de Vendas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={prepareChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="instagram_sales" 
                          stroke="#E1306C" 
                          strokeWidth={2}
                          name="Instagram"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="facebook_sales" 
                          stroke="#1877F2" 
                          strokeWidth={2}
                          name="Facebook"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de dados */}
              <Card>
                <CardHeader>
                  <CardTitle>Dados Mensais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Mês</th>
                          <th className="text-left p-2">Plataforma</th>
                          <th className="text-left p-2">Seguidores</th>
                          <th className="text-left p-2">Vendas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.progress
                          .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
                          .map((item) => (
                            <tr key={item.id} className="border-b">
                              <td className="p-2">{new Date(item.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</td>
                              <td className="p-2">
                                <Badge className={`${getPlatformColor(item.platform)} text-white border-0`}>
                                  {item.platform === 'instagram' ? 'Instagram' : 'Facebook'}
                                </Badge>
                              </td>
                              <td className="p-2">{item.followers.toLocaleString()}</td>
                              <td className="p-2">{item.sales.toLocaleString()}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum dado registrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Comece registrando seus primeiros dados mensais de seguidores e vendas
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}