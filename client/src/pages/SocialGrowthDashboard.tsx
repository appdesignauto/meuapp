import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, TrendingUp, Users, DollarSign, BarChart3, Calendar, Trash2, Edit3, Instagram, Facebook, MessageCircle, Youtube, Linkedin, Twitter, History, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import SocialGoalsView from '@/components/social/SocialGoalsView';
import SocialHistoryView from '@/components/social/SocialHistoryView';

// Types
interface SocialNetwork {
  id: number;
  platform: string;
  username: string;
  profileUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SocialGrowthData {
  id: number;
  socialNetworkId: number;
  recordDate: string;
  followers: number;
  averageLikes: number;
  averageComments: number;
  salesFromPlatform: number;
  usedDesignAutoArts: boolean;
  notes?: string;
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

// Platform configurations
const platformConfig = {
  instagram: { name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  facebook: { name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  tiktok: { name: 'TikTok', icon: MessageCircle, color: 'bg-black' },
  whatsapp_business: { name: 'WhatsApp Business', icon: MessageCircle, color: 'bg-green-500' },
  youtube: { name: 'YouTube', icon: Youtube, color: 'bg-red-600' },
  linkedin: { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
  twitter: { name: 'Twitter', icon: Twitter, color: 'bg-blue-400' }
};

export default function SocialGrowthDashboard() {
  const [selectedNetwork, setSelectedNetwork] = useState<SocialNetwork | null>(null);
  const [isAddingNetwork, setIsAddingNetwork] = useState(false);
  const [showSocialData, setShowSocialData] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    networkId: '',
    goalType: 'followers' as 'followers' | 'engagement' | 'sales',
    targetValue: 0,
    deadline: '',
    description: ''
  });
  const [networkForm, setNetworkForm] = useState({ platform: '', username: '', profileUrl: '' });
  const [dataForm, setDataForm] = useState({
    socialNetworkId: 0,
    recordDate: '',
    followers: 0,
    averageLikes: 0,
    averageComments: 0,
    salesFromPlatform: 0,
    usedDesignAutoArts: false,
    notes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch social networks
  const { data: networks = [], isLoading: networksLoading } = useQuery({
    queryKey: ['/api/social-growth/networks'],
  });

  // Fetch analytics
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
      setNetworkForm({ platform: '', username: '', profileUrl: '' });
      toast({ title: 'Rede social adicionada com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao adicionar rede social', description: error.message, variant: 'destructive' });
    },
  });

  // Add data mutation
  const addDataMutation = useMutation({
    mutationFn: async (data: typeof dataForm) => {
      const response = await fetch('/api/social-growth/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao salvar dados');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/analytics'] });
      setIsAddingData(false);
      setDataForm({
        socialNetworkId: 0,
        recordDate: '',
        followers: 0,
        averageLikes: 0,
        averageComments: 0,
        salesFromPlatform: 0,
        usedDesignAutoArts: false,
        notes: ''
      });
      toast({ title: 'Dados salvos com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar dados', description: error.message, variant: 'destructive' });
    },
  });

  // Add goal mutation
  const addGoalMutation = useMutation({
    mutationFn: async (data: typeof goalForm) => {
      const response = await fetch('/api/social-growth/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          networkId: parseInt(data.networkId),
          goalType: data.goalType,
          targetValue: data.targetValue,
          deadline: data.deadline,
          description: data.description
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
        goalType: 'followers',
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

  // Delete network mutation
  const deleteNetworkMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/social-growth/networks/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao remover rede social');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/networks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/analytics'] });
      toast({ title: 'Rede social removida com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover rede social', description: error.message, variant: 'destructive' });
    },
  });

  const handleAddNetwork = () => {
    if (!networkForm.platform || !networkForm.username) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    addNetworkMutation.mutate(networkForm);
  };

  const handleAddData = () => {
    if (!dataForm.socialNetworkId || !dataForm.recordDate || dataForm.followers < 0) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    addDataMutation.mutate(dataForm);
  };

  const handleAddGoal = () => {
    if (!goalForm.networkId || !goalForm.targetValue || !goalForm.deadline) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    addGoalMutation.mutate(goalForm);
  };

  // Set current month as default date
  useEffect(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    setDataForm(prev => ({ 
      ...prev, 
      recordDate: firstDayOfMonth.toISOString().split('T')[0] 
    }));
  }, []);

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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Rede Social</DialogTitle>
                  <DialogDescription>
                    Cadastre uma nova rede social para monitoramento
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
                        {Object.entries(platformConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className="w-4 h-4" />
                              {config.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="username">Usuário/Nome da Conta</Label>
                    <Input
                      id="username"
                      value={networkForm.username}
                      onChange={(e) => setNetworkForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="@seuperfil"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profileUrl">URL do Perfil (opcional)</Label>
                    <Input
                      id="profileUrl"
                      value={networkForm.profileUrl}
                      onChange={(e) => setNetworkForm(prev => ({ ...prev, profileUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingNetwork(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddNetwork} disabled={addNetworkMutation.isPending}>
                    {addNetworkMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showSocialData} onOpenChange={setShowSocialData}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={networks.length === 0} className="bg-green-600 hover:bg-green-700 text-white border-green-600">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dados Sociais
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Dados Sociais</DialogTitle>
                  <DialogDescription>
                    Gerencie seus dados de crescimento social - visualize histórico e adicione novos dados
                  </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                  <SocialHistoryView />
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="network">Rede Social</Label>
                      <Select onValueChange={(value) => setDataForm(prev => ({ ...prev, socialNetworkId: parseInt(value) }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a rede" />
                        </SelectTrigger>
                        <SelectContent>
                          {networks.map((network: SocialNetwork) => {
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
                      <Label htmlFor="recordDate">Data (Início do Mês)</Label>
                      <Input
                        id="recordDate"
                        type="date"
                        value={dataForm.recordDate}
                        onChange={(e) => setDataForm(prev => ({ ...prev, recordDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="followers">Seguidores</Label>
                      <Input
                        id="followers"
                        type="number"
                        value={dataForm.followers}
                        onChange={(e) => setDataForm(prev => ({ ...prev, followers: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="averageLikes">Média de Curtidas</Label>
                      <Input
                        id="averageLikes"
                        type="number"
                        value={dataForm.averageLikes}
                        onChange={(e) => setDataForm(prev => ({ ...prev, averageLikes: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="averageComments">Média de Comentários</Label>
                      <Input
                        id="averageComments"
                        type="number"
                        value={dataForm.averageComments}
                        onChange={(e) => setDataForm(prev => ({ ...prev, averageComments: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="salesFromPlatform">Vendas Desta Plataforma</Label>
                      <Input
                        id="salesFromPlatform"
                        type="number"
                        value={dataForm.salesFromPlatform}
                        onChange={(e) => setDataForm(prev => ({ ...prev, salesFromPlatform: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="usedDesignAutoArts"
                      checked={dataForm.usedDesignAutoArts}
                      onCheckedChange={(checked) => setDataForm(prev => ({ ...prev, usedDesignAutoArts: !!checked }))}
                    />
                    <Label htmlFor="usedDesignAutoArts">
                      Utilizei artes do DesignAuto neste período
                    </Label>
                  </div>

                  <div>
                    <Label htmlFor="notes">Observações (opcional)</Label>
                    <Textarea
                      id="notes"
                      value={dataForm.notes}
                      onChange={(e) => setDataForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Observações sobre o período..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingData(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddData} disabled={addDataMutation.isPending}>
                    {addDataMutation.isPending ? 'Salvando...' : 'Salvar Dados'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={networks.length === 0}>
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
                        {networks.map((network: SocialNetwork) => {
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

            <Dialog open={showHistory} onOpenChange={setShowHistory}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  <History className="w-4 h-4 mr-2" />
                  Ver Histórico
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Histórico de Dados Sociais</DialogTitle>
                  <DialogDescription>
                    Visualize e gerencie todo o histórico de dados das suas redes sociais
                  </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                  <SocialHistoryView />
                </div>
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
                  <div className="text-2xl font-bold text-slate-900">{analytics.totalNetworks}</div>
                  <p className="text-xs text-slate-500">Plataformas ativas</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Total de Seguidores</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{analytics.totalFollowers.toLocaleString()}</div>
                  <p className="text-xs text-slate-500">
                    {analytics.monthlyGrowth > 0 ? '+' : ''}{analytics.monthlyGrowth.toFixed(1)}% este mês
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Vendas Totais</CardTitle>
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{analytics.totalSales}</div>
                  <p className="text-xs text-slate-500">Vendas pelas redes sociais</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Crescimento</CardTitle>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {analytics.monthlyGrowth > 0 ? '+' : ''}{analytics.monthlyGrowth.toFixed(1)}%
                  </div>
                  <p className="text-xs text-slate-500">Taxa mensal</p>
                </CardContent>
              </Card>
            </div>

            {/* Platform Specific Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Seguidores Instagram</CardTitle>
                  <div className="w-4 h-4 rounded text-pink-500">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{analytics.platformSpecific?.instagram?.toLocaleString() || 0}</div>
                  <p className="text-xs text-green-600 font-medium">+5.2% este mês</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Seguidores Facebook</CardTitle>
                  <div className="w-4 h-4 rounded text-blue-600">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{analytics.platformSpecific?.facebook?.toLocaleString() || 0}</div>
                  <p className="text-xs text-green-600 font-medium">+3.8% este mês</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Metas Ativas</CardTitle>
                  <Target className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{analytics.activeGoals || 0}</div>
                  <p className="text-xs text-slate-500">Metas em andamento</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">TikTok + YouTube</CardTitle>
                  <div className="w-4 h-4 rounded text-red-500">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{((analytics.platformSpecific?.tiktok || 0) + (analytics.platformSpecific?.youtube || 0)).toLocaleString()}</div>
                  <p className="text-xs text-slate-500">Outras plataformas</p>
                </CardContent>
              </Card>
            </div>

            {/* Growth Chart */}
            {analytics.growthTrend.length > 0 && (
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">Evolução de Seguidores</CardTitle>
                  <CardDescription>Acompanhe o crescimento das suas redes sociais ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={analytics.growthTrend}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#64748b' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          domain={['dataMin - 100', 'dataMax + 100']}
                          padding={{ top: 20, bottom: 20 }}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'followers' ? `${value} seguidores` : `${value} vendas`,
                            name === 'followers' ? 'Seguidores' : 'Vendas'
                          ]}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="followers" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="sales" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: '#f59e0b', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Platforms Summary */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Resumo por Plataforma</CardTitle>
                <CardDescription>Performance individual de cada rede social</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.platforms.map((platform, index) => {
                    const config = platformConfig[platform.platform as keyof typeof platformConfig];
                    const Icon = config?.icon || Users;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${config?.color || 'bg-slate-500'} text-white`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-900">{config?.name}</h3>
                            <p className="text-sm text-slate-600">{platform.username}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{platform.followers.toLocaleString()} seguidores</p>
                          <p className="text-sm text-slate-600">{platform.sales} vendas</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Social Goals Section */}
        <SocialGoalsView />

        {/* Networks List */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Suas Redes Sociais</CardTitle>
            <CardDescription>Gerencie suas redes sociais cadastradas</CardDescription>
          </CardHeader>
          <CardContent>
            {networks.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma rede social cadastrada</h3>
                <p className="text-slate-600 mb-4">Comece adicionando suas redes sociais para monitorar o crescimento</p>
                <Button onClick={() => setIsAddingNetwork(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeira Rede
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {networks.map((network: SocialNetwork) => {
                  const config = platformConfig[network.platform as keyof typeof platformConfig];
                  const Icon = config?.icon || Users;
                  
                  return (
                    <div key={network.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${config?.color || 'bg-slate-500'} text-white`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-900">{config?.name}</h3>
                            <p className="text-sm text-slate-600">{network.username}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteNetworkMutation.mutate(network.id)}
                            disabled={deleteNetworkMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      {network.profileUrl && (
                        <a 
                          href={network.profileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Ver perfil
                        </a>
                      )}
                      <div className="mt-2">
                        <Badge variant={network.isActive ? "default" : "secondary"}>
                          {network.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}