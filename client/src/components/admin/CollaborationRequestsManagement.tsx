import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Eye, MessageSquare, Trash2, Calendar, CheckCircle, XCircle, Clock, Mail, Phone, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface CollaborationRequest {
  id: number;
  name: string;
  email: string;
  phone: string;
  portfolio?: string;
  socialMedia: string;
  experience: string;
  designTools: string;
  categories: string;
  motivation: string;
  availableTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'contacted';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const statusLabels: Record<string, { label: string, color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
  contacted: { label: 'Contatado', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800 hover:bg-green-200' },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800 hover:bg-red-200' }
};

const ITEMS_PER_PAGE = 10;

const CollaborationRequestsManagement = () => {
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentRequest, setCurrentRequest] = useState<CollaborationRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar solicitações de colaboração
  const { 
    data: requestsData,
    isLoading: isLoadingRequests,
    isError: isRequestsError
  } = useQuery({
    queryKey: ['/api/admin/collaboration-requests', activeTab, searchTerm],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        ...(activeTab !== 'all' && { status: activeTab }),
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await apiRequest('GET', `/api/admin/collaboration-requests?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar solicitações');
      }
      
      return response.json();
    }
  });

  const requests = requestsData || [];

  // Mutation para atualizar status da solicitação
  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: number; status: string; adminNotes?: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/collaboration-requests/${id}`, {
        status,
        adminNotes
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar solicitação');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/collaboration-requests'] });
      toast({
        title: 'Solicitação atualizada',
        description: 'Status da solicitação foi atualizado com sucesso.',
      });
      setIsDetailsOpen(false);
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a solicitação.',
        variant: 'destructive',
      });
    }
  });

  // Mutation para deletar solicitação
  const deleteRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/collaboration-requests/${id}`);
      
      if (!response.ok) {
        throw new Error('Erro ao excluir solicitação');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/collaboration-requests'] });
      toast({
        title: 'Solicitação excluída',
        description: 'A solicitação foi removida com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a solicitação.',
        variant: 'destructive',
      });
    }
  });

  const handleUpdateStatus = async (status: string) => {
    if (!currentRequest) return;
    
    updateRequestMutation.mutate({
      id: currentRequest.id,
      status,
      adminNotes: notesInput || undefined
    });
  };

  const handleDeleteRequest = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta solicitação?')) {
      deleteRequestMutation.mutate(id);
    }
  };

  const openRequestDetails = (request: CollaborationRequest) => {
    setCurrentRequest(request);
    setNotesInput(request.adminNotes || '');
    setIsDetailsOpen(true);
  };

  // Calcular contadores por status
  const statusCounts = {
    pending: requests.filter(r => r.status === 'pending').length,
    contacted: requests.filter(r => r.status === 'contacted').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    todos: requests.length
  };

  // Filtrar solicitações com base na busca e aba ativa
  const filteredRequests = requests.filter((request: CollaborationRequest) => {
    const matchesSearch = !searchTerm || 
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.designTools.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === 'todos' || request.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  // Paginação
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Solicitações de Colaboração</h1>
          <p className="text-muted-foreground">
            Gerencie solicitações de colaboradores e designers
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nome, email ou ferramentas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Tabs de status */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({statusCounts.pending})</TabsTrigger>
          <TabsTrigger value="contacted">Contatados ({statusCounts.contacted})</TabsTrigger>
          <TabsTrigger value="approved">Aprovados ({statusCounts.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados ({statusCounts.rejected})</TabsTrigger>
          <TabsTrigger value="todos">Todos ({statusCounts.todos})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoadingRequests ? (
            <div className="text-center py-8">Carregando solicitações...</div>
          ) : paginatedRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação encontrada</h3>
                <p className="text-gray-600">
                  Não há solicitações para exibir com os filtros aplicados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {paginatedRequests.map((request: CollaborationRequest) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{request.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {request.email}
                          {request.phone && (
                            <>
                              <Phone className="h-4 w-4 ml-2" />
                              {request.phone}
                            </>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusLabels[request.status]?.color}>
                          {statusLabels[request.status]?.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>Experiência:</strong> {request.experience}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Ferramentas:</strong> {request.designTools}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Categorias:</strong> {request.categories}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Disponibilidade:</strong> {request.availableTime}
                      </p>
                      <p className="text-sm text-gray-500">
                        Enviado em: {new Date(request.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex gap-2">
                        {request.portfolio && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(request.portfolio, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Portfolio
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRequestDetails(request)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRequest(request.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de detalhes */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Detalhes da Solicitação
            </DialogTitle>
            <DialogDescription>
              Gerencie esta solicitação de colaboração
            </DialogDescription>
          </DialogHeader>
          
          {currentRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nome</Label>
                  <p className="text-sm mt-1">{currentRequest.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm mt-1">{currentRequest.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Telefone</Label>
                  <p className="text-sm mt-1">{currentRequest.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Experiência</Label>
                  <p className="text-sm mt-1">{currentRequest.experience}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Ferramentas de Design</Label>
                <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">{currentRequest.designTools}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Categorias de Especialidade</Label>
                <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">{currentRequest.categories}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Motivação</Label>
                <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">{currentRequest.motivation}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Redes Sociais</Label>
                  <p className="text-sm mt-1">{currentRequest.socialMedia}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Disponibilidade</Label>
                  <p className="text-sm mt-1">{currentRequest.availableTime}</p>
                </div>
              </div>

              {currentRequest.portfolio && (
                <div>
                  <Label className="text-sm font-medium">Portfolio</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(currentRequest.portfolio, '_blank')}
                    className="ml-2"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Visualizar Portfolio
                  </Button>
                </div>
              )}

              {currentRequest.adminNotes && (
                <div>
                  <Label className="text-sm font-medium">Notas Administrativas</Label>
                  <p className="text-sm mt-1 bg-blue-50 p-3 rounded-md">
                    {currentRequest.adminNotes}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
                  Adicionar Notas
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Digite suas observações sobre esta solicitação..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => handleUpdateStatus('contacted')}
                  disabled={updateRequestMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Marcar como Contatado
                </Button>
                
                <Button
                  onClick={() => handleUpdateStatus('approved')}
                  disabled={updateRequestMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Aprovar
                </Button>
                
                <Button
                  onClick={() => handleUpdateStatus('rejected')}
                  disabled={updateRequestMutation.isPending}
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollaborationRequestsManagement;