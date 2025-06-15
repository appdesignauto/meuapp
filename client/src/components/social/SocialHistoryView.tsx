import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Edit3, Trash2, Plus, Calendar, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface SocialGrowthData {
  id: number;
  socialNetworkId: number;
  recordDate: string;
  followers: number;
  growthFromPrevious?: number;
  averageLikes: number;
  averageComments: number;
  salesFromPlatform: number;
  usedDesignAutoArts: boolean;
  notes?: string;
  networkPlatform?: string;
  networkUsername?: string;
}

interface SocialNetwork {
  id: number;
  platform: string;
  username: string;
}

export default function SocialHistoryView() {
  const { toast } = useToast();
  const [editingData, setEditingData] = useState<SocialGrowthData | null>(null);
  const [isAddingData, setIsAddingData] = useState(false);
  const [formData, setFormData] = useState({
    socialNetworkId: 0,
    recordDate: '',
    followers: 0,
    averageLikes: 0,
    averageComments: 0,
    salesFromPlatform: 0,
    usedDesignAutoArts: false,
    notes: ''
  });

  // Fetch all historical data for the user
  const { data: historicalData = [], isLoading } = useQuery<SocialGrowthData[]>({
    queryKey: ['/api/social-growth/history'],
  });

  // Fetch networks for the dropdown
  const { data: networks = [] } = useQuery<SocialNetwork[]>({
    queryKey: ['/api/social-growth/networks'],
  });

  // Update data mutation
  const updateDataMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/social-growth/data/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar dados');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/analytics'] });
      setEditingData(null);
      toast({
        title: 'Sucesso',
        description: 'Dados atualizados com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar dados',
        variant: 'destructive'
      });
    }
  });

  // Delete data mutation
  const deleteDataMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/social-growth/data/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir dados');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/analytics'] });
      toast({
        title: 'Sucesso',
        description: 'Dados excluídos com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir dados',
        variant: 'destructive'
      });
    }
  });

  // Add data mutation
  const addDataMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Enviando dados para o servidor:', data);
      const response = await fetch('/api/social-growth/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao adicionar dados');
      }
      
      const result = await response.json();
      console.log('Dados adicionados com sucesso:', result);
      return result;
    },
    onSuccess: (result) => {
      console.log('Invalidando cache após adicionar dados...');
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-growth/networks'] });
      
      // Force refetch
      queryClient.refetchQueries({ queryKey: ['/api/social-growth/history'] });
      
      setIsAddingData(false);
      setFormData({
        socialNetworkId: 0,
        recordDate: '',
        followers: 0,
        averageLikes: 0,
        averageComments: 0,
        salesFromPlatform: 0,
        usedDesignAutoArts: false,
        notes: ''
      });
      toast({
        title: 'Sucesso',
        description: 'Dados adicionados com sucesso!'
      });
    },
    onError: (error: any) => {
      console.error('Erro ao adicionar dados:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar dados',
        variant: 'destructive'
      });
    }
  });

  const handleEditData = (data: SocialGrowthData) => {
    setEditingData(data);
    const dateStr = data.recordDate instanceof Date ? data.recordDate.toISOString() : data.recordDate;
    setFormData({
      socialNetworkId: data.socialNetworkId,
      recordDate: dateStr.split('T')[0],
      followers: data.followers,
      averageLikes: data.averageLikes,
      averageComments: data.averageComments,
      salesFromPlatform: data.salesFromPlatform,
      usedDesignAutoArts: data.usedDesignAutoArts,
      notes: data.notes || ''
    });
  };

  const handleSaveEdit = () => {
    if (!editingData) return;
    
    updateDataMutation.mutate({
      id: editingData.id,
      data: formData
    });
  };

  // Função para verificar se um mês já está preenchido para a rede selecionada
  const isMonthAlreadyFilled = (yearMonth: string, networkId: number) => {
    if (!historicalData || networkId === 0) return false;
    
    return historicalData.some((record: any) => {
      const recordMonth = record.recordDate.substring(0, 7); // YYYY-MM
      return recordMonth === yearMonth && record.socialNetworkId === networkId;
    });
  };

  const handleAddData = () => {
    if (formData.socialNetworkId === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione uma rede social',
        variant: 'destructive'
      });
      return;
    }

    // Verificar se o mês já está preenchido
    const selectedMonth = formData.recordDate.substring(0, 7);
    if (isMonthAlreadyFilled(selectedMonth, formData.socialNetworkId)) {
      toast({
        title: 'Mês já preenchido',
        description: 'Este mês já possui dados. Para alterar, edite através do histórico.',
        variant: 'destructive'
      });
      return;
    }
    
    addDataMutation.mutate(formData);
  };

  const handleDeleteData = (id: number) => {
    if (confirm('Tem certeza que deseja excluir estes dados?')) {
      deleteDataMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  };

  const getPlatformDisplayName = (platform: string) => {
    const platformNames: { [key: string]: string } = {
      instagram: 'Instagram',
      facebook: 'Facebook',
      tiktok: 'TikTok',
      youtube: 'YouTube',
      whatsapp_business: 'WhatsApp Business'
    };
    return platformNames[platform] || platform;
  };

  // Group data by platform and month
  const groupedData = historicalData.reduce((acc, item) => {
    const month = formatDate(item.recordDate);
    if (!acc[month]) {
      acc[month] = {};
    }
    
    const platformName = getPlatformDisplayName(item.networkPlatform || '');
    acc[month][platformName] = item;
    
    return acc;
  }, {} as Record<string, Record<string, SocialGrowthData>>);

  const months = Object.keys(groupedData).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB.getTime() - dateA.getTime();
  });

  const platforms = Array.from(new Set(historicalData.map(item => 
    getPlatformDisplayName(item.networkPlatform || '')
  ))).sort();

  if (isLoading) {
    return <div className="text-center py-8">Carregando histórico...</div>;
  }

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-slate-900">Histórico de Crescimento</CardTitle>
        </div>
        <Button 
          onClick={() => setIsAddingData(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
          disabled={networks.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Dados
        </Button>
      </CardHeader>
      
      <CardContent>
        {historicalData.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum dado histórico</h3>
            <p className="text-slate-600 mb-4">Comece adicionando dados de crescimento das suas redes sociais</p>
            <Button 
              onClick={() => setIsAddingData(true)} 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={networks.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Registro
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-slate-700">DATA</th>
                  {platforms.map(platform => (
                    <React.Fragment key={platform}>
                      <th className="text-center py-3 px-2 font-medium text-slate-700 text-sm">
                        {platform.toUpperCase()}<br/>SEGUIDORES
                      </th>
                      <th className="text-center py-3 px-2 font-medium text-slate-700 text-sm">
                        {platform.toUpperCase()}<br/>CRESCIMENTO
                      </th>
                      <th className="text-center py-3 px-2 font-medium text-slate-700 text-sm">
                        {platform.toUpperCase()}<br/>VENDAS
                      </th>
                    </React.Fragment>
                  ))}
                  <th className="text-center py-3 px-4 font-medium text-slate-700">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {months.map(month => {
                  const monthData = groupedData[month];
                  return (
                    <tr key={month} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">{month}</td>
                      {platforms.map(platform => {
                        const data = monthData[platform];
                        const growth = data?.growthFromPrevious || 0;
                        const isPositive = growth > 0;
                        const isNegative = growth < 0;
                        
                        return (
                          <React.Fragment key={platform}>
                            <td className="text-center py-3 px-2 text-slate-700">
                              {data ? data.followers.toLocaleString() : '-'}
                            </td>
                            <td className="text-center py-3 px-2">
                              {data ? (
                                <span className={`font-medium ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-slate-500'}`}>
                                  {growth === 0 ? '-' : `${growth > 0 ? '+' : ''}${growth.toLocaleString()}`}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="text-center py-3 px-2 text-slate-700">
                              {data ? data.salesFromPlatform : '-'}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td className="text-center py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                            >
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            {Object.values(monthData).map((data, index) => (
                              <React.Fragment key={data.id}>
                                {index > 0 && <DropdownMenuSeparator />}
                                <DropdownMenuItem
                                  onClick={() => handleEditData(data)}
                                  className="flex items-center gap-2 text-slate-700 hover:text-blue-600 cursor-pointer text-sm"
                                >
                                  <Edit3 size={12} />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteData(data.id)}
                                  className="flex items-center gap-2 text-slate-700 hover:text-red-600 cursor-pointer text-sm"
                                >
                                  <Trash2 size={12} />
                                  Excluir
                                </DropdownMenuItem>
                              </React.Fragment>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Modal de Edição */}
      <Dialog open={!!editingData} onOpenChange={() => setEditingData(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Dados Mensais</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-followers">Seguidores</Label>
                <Input
                  id="edit-followers"
                  type="number"
                  value={formData.followers}
                  onChange={(e) => setFormData({...formData, followers: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="edit-sales">Vendas</Label>
                <Input
                  id="edit-sales"
                  type="number"
                  value={formData.salesFromPlatform}
                  onChange={(e) => setFormData({...formData, salesFromPlatform: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-likes">Média de Curtidas</Label>
                <Input
                  id="edit-likes"
                  type="number"
                  value={formData.averageLikes}
                  onChange={(e) => setFormData({...formData, averageLikes: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="edit-comments">Média de Comentários</Label>
                <Input
                  id="edit-comments"
                  type="number"
                  value={formData.averageComments}
                  onChange={(e) => setFormData({...formData, averageComments: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingData(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={updateDataMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {updateDataMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Adição */}
      <Dialog open={isAddingData} onOpenChange={setIsAddingData}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Dados de Crescimento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-network">Rede Social</Label>
                <Select onValueChange={(value) => setFormData({...formData, socialNetworkId: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a rede" />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map((network: SocialNetwork) => (
                      <SelectItem key={network.id} value={network.id.toString()}>
                        {getPlatformDisplayName(network.platform)} - {network.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="add-date">Data</Label>
                <Input
                  id="add-date"
                  type="month"
                  value={formData.recordDate ? formData.recordDate.substring(0, 7) : ''}
                  onChange={(e) => {
                    const selectedMonth = e.target.value;
                    
                    // Verificar se o mês já está preenchido para a rede selecionada
                    if (formData.socialNetworkId !== 0 && isMonthAlreadyFilled(selectedMonth, formData.socialNetworkId)) {
                      toast({
                        title: 'Mês já preenchido',
                        description: 'Este mês já possui dados. Para alterar, edite através do histórico.',
                        variant: 'destructive'
                      });
                      return;
                    }
                    
                    // Define automaticamente o último dia do mês selecionado
                    const [year, month] = selectedMonth.split('-');
                    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                    const fullDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
                    setFormData({...formData, recordDate: fullDate});
                  }}
                  className={
                    formData.socialNetworkId !== 0 && 
                    formData.recordDate && 
                    isMonthAlreadyFilled(formData.recordDate.substring(0, 7), formData.socialNetworkId) 
                      ? 'border-red-500 focus:border-red-500' 
                      : ''
                  }
                />
                {formData.socialNetworkId !== 0 && formData.recordDate && isMonthAlreadyFilled(formData.recordDate.substring(0, 7), formData.socialNetworkId) && (
                  <p className="text-sm text-red-600 mt-1">Este mês já possui dados registrados</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-followers">Seguidores</Label>
                <Input
                  id="add-followers"
                  type="number"
                  value={formData.followers}
                  onChange={(e) => setFormData({...formData, followers: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="add-sales">Vendas</Label>
                <Input
                  id="add-sales"
                  type="number"
                  value={formData.salesFromPlatform}
                  onChange={(e) => setFormData({...formData, salesFromPlatform: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-likes">Média de Curtidas</Label>
                <Input
                  id="add-likes"
                  type="number"
                  value={formData.averageLikes}
                  onChange={(e) => setFormData({...formData, averageLikes: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="add-comments">Média de Comentários</Label>
                <Input
                  id="add-comments"
                  type="number"
                  value={formData.averageComments}
                  onChange={(e) => setFormData({...formData, averageComments: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddingData(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddData}
              disabled={addDataMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {addDataMutation.isPending ? 'Salvando...' : 'Adicionar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}