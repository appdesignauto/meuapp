import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Plus, 
  BarChart3,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Twitter
} from 'lucide-react';

import SocialHistoryView from '@/components/social/SocialHistoryView';
import SocialGoalsView from '@/components/social/SocialGoalsView';

interface SocialNetwork {
  id: number;
  platform: string;
  username: string;
  profileUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  totalNetworks: number;
  totalFollowers: number;
  totalSales: number;
  activeGoals: number;
  monthlyGrowth: number;
  platformSpecific: {
    instagram: number;
    facebook: number;
    tiktok: number;
    youtube: number;
    linkedin: number;
    twitter: number;
  };
  platforms: Array<{
    platform: string;
    username: string;
    followers: number;
    sales: number;
    lastUpdate: string | null;
  }>;
  growthTrend: Array<{
    month: string;
    followers: number;
    sales: number;
  }>;
}

const platformConfig = {
  instagram: { name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  facebook: { name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  youtube: { name: 'YouTube', icon: Youtube, color: 'text-red-600' },
  linkedin: { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
  twitter: { name: 'Twitter', icon: Twitter, color: 'text-blue-400' },
  tiktok: { name: 'TikTok', icon: Users, color: 'text-black' },
};

export default function SocialGrowthDashboard() {
  const { toast } = useToast();
  
  // State management
  const [isAddingNetwork, setIsAddingNetwork] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  
  const [networkForm, setNetworkForm] = useState({
    platform: '',
    username: '',
    profileUrl: '',
    initialFollowers: 0
  });
  
  const [goalForm, setGoalForm] = useState({
    networkId: '',
    goalType: '',
    targetValue: 0,
    deadline: '',
    description: ''
  });

  // Data fetching
  const { data: networks, isLoading: networksLoading } = useQuery({
    queryKey: ['/api/social-growth/networks'],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ['/api/social-growth/analytics'],
  });

  // Add network mutation
  const addNetworkMutation = useMutation({
    mutationFn: async (data: typeof networkForm) => {
      const response = await fetch('/api/social-growth/networks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao adicionar rede social');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/networks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/analytics'] });
      setIsAddingNetwork(false);
      setNetworkForm({ platform: '', username: '', profileUrl: '', initialFollowers: 0 });
      toast({ title: 'Rede social adicionada com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao adicionar rede social', description: error.message, variant: 'destructive' });
    },
  });

  // Add goal mutation
  const addGoalMutation = useMutation({
    mutationFn: async (data: typeof goalForm) => {
      const response = await fetch('/api/social-growth/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          networkId: parseInt(data.networkId),
        }),
      });
      if (!response.ok) throw new Error('Erro ao criar meta');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/goals'] });
      setIsAddingGoal(false);
      setGoalForm({
        networkId: '',
        goalType: '',
        targetValue: 0,
        deadline: '',
        description: ''
      });
      toast({ title: 'Meta criada com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar meta', description: error.message, variant: 'destructive' });
    },
  });

  const handleAddNetwork = () => {
    if (!networkForm.platform || !networkForm.username) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    addNetworkMutation.mutate(networkForm);
  };

  const handleAddGoal = () => {
    if (!goalForm.networkId || !goalForm.targetValue || !goalForm.deadline) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    addGoalMutation.mutate(goalForm);
  };

  if (networksLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard de Crescimento Social</h1>
            <p className="text-slate-600">Monitore e analise o crescimento das suas redes sociais</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isAddingNetwork} onOpenChange={setIsAddingNetwork}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Rede
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Rede Social</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova rede social para monitoramento
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="platform">Plataforma</Label>
                    <Select onValueChange={(value) => setNetworkForm(prev => ({ ...prev, platform: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a plataforma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="username">Nome de usuário</Label>
                    <Input
                      id="username"
                      value={networkForm.username}
                      onChange={(e) => setNetworkForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="@seuusuario"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="profileUrl">URL do perfil (opcional)</Label>
                    <Input
                      id="profileUrl"
                      value={networkForm.profileUrl}
                      onChange={(e) => setNetworkForm(prev => ({ ...prev, profileUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="initialFollowers">Seguidores atuais</Label>
                    <Input
                      id="initialFollowers"
                      type="number"
                      value={networkForm.initialFollowers}
                      onChange={(e) => setNetworkForm(prev => ({ ...prev, initialFollowers: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                      min="0"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Informe a quantidade atual de seguidores para calcular o crescimento automaticamente
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingNetwork(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddNetwork} disabled={addNetworkMutation.isPending}>
                    {addNetworkMutation.isPending ? 'Adicionando...' : 'Adicionar Rede'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isDataModalOpen} onOpenChange={setIsDataModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  disabled={!networks || networks.length === 0} 
                  className="bg-green-600 hover:bg-green-700"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dados Sociais
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl">
                <DialogHeader>
                  <DialogTitle>Dados Sociais</DialogTitle>
                  <DialogDescription>
                    Gerencie seus dados de crescimento social - visualize histórico e adicione novos dados
                  </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                  <SocialHistoryView />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={!networks || networks.length === 0}>
                  <Target className="w-4 h-4 mr-2" />
                  Adicionar Meta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Nova Meta</DialogTitle>
                  <DialogDescription>
                    Defina uma meta de crescimento para uma das suas redes sociais
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="goalNetwork">Rede Social</Label>
                    <Select onValueChange={(value) => setGoalForm(prev => ({ ...prev, networkId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a rede" />
                      </SelectTrigger>
                      <SelectContent>
                        {networks && Array.isArray(networks) && networks.map((network: SocialNetwork) => {
                          const config = platformConfig[network.platform as keyof typeof platformConfig];
                          const Icon = config?.icon || Users;
                          return (
                            <SelectItem key={network.id} value={network.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                {config?.name} - {network.username}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="goalType">Tipo de Meta</Label>
                    <Select onValueChange={(value) => setGoalForm(prev => ({ ...prev, goalType: value as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="followers">Seguidores</SelectItem>
                        <SelectItem value="engagement">Engajamento</SelectItem>
                        <SelectItem value="sales">Vendas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="targetValue">Valor Alvo</Label>
                    <Input
                      id="targetValue"
                      type="number"
                      value={goalForm.targetValue}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, targetValue: parseInt(e.target.value) || 0 }))}
                      placeholder="Ex: 1000"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="deadline">Prazo Final</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={goalForm.deadline}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      value={goalForm.description}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva sua meta..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingGoal(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddGoal} disabled={addGoalMutation.isPending}>
                    {addGoalMutation.isPending ? 'Criando...' : 'Criar Meta'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Redes Sociais</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{analytics?.totalNetworks ?? 0}</div>
                  <p className="text-xs text-slate-500">Plataformas ativas</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Total de Seguidores</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{(analytics?.totalFollowers ?? 0).toLocaleString()}</div>
                  <p className="text-xs text-green-600">+{analytics?.monthlyGrowth ?? 0}% este mês</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Vendas Totais</CardTitle>
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">R$ {(analytics?.totalSales ?? 0).toLocaleString()}</div>
                  <p className="text-xs text-slate-500">Das redes sociais</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Metas Ativas</CardTitle>
                  <Target className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{analytics?.activeGoals ?? 0}</div>
                  <p className="text-xs text-slate-500">Em andamento</p>
                </CardContent>
              </Card>
            </div>

            {/* Platform-specific Analytics */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Seguidores por Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="text-center p-4 bg-pink-50 rounded-lg">
                    <Instagram className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-slate-900">{(analytics?.platformSpecific?.instagram ?? 0).toLocaleString()}</div>
                    <p className="text-xs text-slate-500">Instagram</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Facebook className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-slate-900">{(analytics?.platformSpecific?.facebook ?? 0).toLocaleString()}</div>
                    <p className="text-xs text-slate-500">Facebook</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <Youtube className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-slate-900">{(analytics?.platformSpecific?.youtube ?? 0).toLocaleString()}</div>
                    <p className="text-xs text-slate-500">YouTube</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Linkedin className="w-8 h-8 text-blue-700 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-slate-900">{(analytics?.platformSpecific?.linkedin ?? 0).toLocaleString()}</div>
                    <p className="text-xs text-slate-500">LinkedIn</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Twitter className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-slate-900">{(analytics?.platformSpecific?.twitter ?? 0).toLocaleString()}</div>
                    <p className="text-xs text-slate-500">Twitter</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Users className="w-8 h-8 text-black mx-auto mb-2" />
                    <div className="text-2xl font-bold text-slate-900">{(analytics?.platformSpecific?.tiktok ?? 0).toLocaleString()}</div>
                    <p className="text-xs text-slate-500">TikTok</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Goals Section */}
        <SocialGoalsView />
      </div>
    </div>
  );
}