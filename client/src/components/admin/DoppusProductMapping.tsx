import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2, FileEdit, Info, Check, X } from 'lucide-react';

interface ProductMapping {
  id: number;
  productId: string;
  planId: string;
  productName: string;
  planType: string;
  durationDays: number | null;
  isLifetime: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tipo para o formulário, que deve ter campos compatíveis
interface MappingFormData {
  productId: string;
  planId: string;
  productName: string;
  planType: string;
  durationDays: number | null;
  isLifetime: boolean;
}

interface DoppusProductMappingProps {
  standalone?: boolean;
}

export default function DoppusProductMapping({ standalone = false }: DoppusProductMappingProps) {
  const { toast } = useToast();
  const [productMappings, setProductMappings] = useState<ProductMapping[]>([]);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ProductMapping | null>(null);
  const [mappingFormData, setMappingFormData] = useState<MappingFormData>({
    productId: '',
    planId: '',
    productName: '',
    planType: 'premium_30',
    durationDays: 30,
    isLifetime: false
  });

  // Buscar mapeamentos de produtos ao carregar o componente
  const fetchProductMappings = useCallback(async () => {
    try {
      setIsLoadingMappings(true);
      const response = await fetch('/api/integrations/doppus/product-mappings');
      
      if (!response.ok) {
        throw new Error('Falha ao buscar mapeamentos de produtos');
      }
      
      const data = await response.json();
      setProductMappings(data);
    } catch (error) {
      console.error('Erro ao carregar mapeamentos:', error);
      toast({
        title: "Erro ao carregar mapeamentos",
        description: "Não foi possível carregar os mapeamentos de produtos Doppus.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMappings(false);
    }
  }, [toast]);

  // Função para abrir o diálogo de adição de mapeamento
  const openAddMappingDialog = () => {
    setMappingFormData({
      productId: '',
      planId: '',
      productName: '',
      planType: 'premium_30',
      durationDays: 30,
      isLifetime: false
    });
    setEditingMapping(null);
    setShowMappingDialog(true);
  };

  // Função para abrir o diálogo de edição de mapeamento
  const openEditMappingDialog = (mapping: ProductMapping) => {
    // Determinar o tipo de plano com base nos dados existentes
    let planType = mapping.planType;
    
    // Converter tipos de plano legados para os novos formatos
    if (mapping.isLifetime) {
      planType = 'premium_lifetime';
    } else if (mapping.planType === 'premium' && mapping.durationDays === 30) {
      planType = 'premium_30';
    } else if (mapping.planType === 'premium' && mapping.durationDays === 180) {
      planType = 'premium_180';
    } else if (mapping.planType === 'premium' && mapping.durationDays === 365) {
      planType = 'premium_365';
    }
    
    setMappingFormData({
      productId: mapping.productId,
      planId: mapping.planId || '',
      productName: mapping.productName,
      planType: planType,
      durationDays: mapping.durationDays || 30,
      isLifetime: mapping.isLifetime
    });
    setEditingMapping(mapping);
    setShowMappingDialog(true);
  };

  // Função para salvar um mapeamento (novo ou existente)
  const handleSaveMapping = async () => {
    try {
      // Validar campos obrigatórios
      if (!mappingFormData.productId || !mappingFormData.productName) {
        toast({
          title: "Campos obrigatórios",
          description: "ID do Produto e Nome do Produto são obrigatórios.",
          variant: "destructive",
        });
        return;
      }
      
      // Preparar payload com valores ajustados
      let payload = {
        ...mappingFormData
      };
      
      // Ajustar isLifetime e durationDays com base no tipo de plano
      if (payload.planType === 'premium_lifetime') {
        payload.isLifetime = true;
        payload.durationDays = null; // Usar null para vitalício 
      } else {
        payload.isLifetime = false;
        // Garantir que a duração corresponda ao tipo de plano
        if (payload.planType === 'premium_30') payload.durationDays = 30;
        if (payload.planType === 'premium_180') payload.durationDays = 180;
        if (payload.planType === 'premium_365') payload.durationDays = 365;
      }
      
      let response;
      
      if (editingMapping) {
        // Atualizar mapeamento existente
        response = await fetch(`/api/integrations/doppus/product-mappings/${editingMapping.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Criar novo mapeamento
        response = await fetch('/api/integrations/doppus/product-mappings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar mapeamento');
      }
      
      // Atualizar lista de mapeamentos
      await fetchProductMappings();
      
      // Fechar o diálogo
      setShowMappingDialog(false);
      
      // Exibir mensagem de sucesso
      toast({
        title: editingMapping ? "Mapeamento atualizado" : "Mapeamento criado",
        description: editingMapping
          ? "O mapeamento de produto foi atualizado com sucesso."
          : "Um novo mapeamento de produto foi criado com sucesso.",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Erro ao salvar mapeamento:', error);
      toast({
        title: "Erro ao salvar mapeamento",
        description: error.message || "Não foi possível salvar o mapeamento de produto.",
        variant: "destructive",
      });
    }
  };

  // Função para excluir um mapeamento
  const handleDeleteMapping = async (mapping: ProductMapping) => {
    if (!confirm(`Tem certeza que deseja excluir o mapeamento para "${mapping.productName}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/integrations/doppus/product-mappings/${mapping.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao excluir mapeamento');
      }
      
      // Atualizar lista de mapeamentos
      await fetchProductMappings();
      
      // Exibir mensagem de sucesso
      toast({
        title: "Mapeamento excluído",
        description: "O mapeamento de produto foi excluído com sucesso.",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Erro ao excluir mapeamento:', error);
      toast({
        title: "Erro ao excluir mapeamento",
        description: error.message || "Não foi possível excluir o mapeamento de produto.",
        variant: "destructive",
      });
    }
  };

  // Função para ativar/desativar um mapeamento
  const handleToggleMappingStatus = async (mapping: ProductMapping) => {
    try {
      const response = await fetch(`/api/integrations/doppus/product-mappings/${mapping.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...mapping,
          isActive: !mapping.isActive
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao alterar status do mapeamento');
      }
      
      // Atualizar lista de mapeamentos
      await fetchProductMappings();
      
      // Exibir mensagem de sucesso
      toast({
        title: "Status alterado",
        description: `O mapeamento agora está ${!mapping.isActive ? 'ativo' : 'inativo'}.`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('Erro ao alterar status do mapeamento:', error);
      toast({
        title: "Erro ao alterar status",
        description: error.message || "Não foi possível alterar o status do mapeamento.",
        variant: "destructive",
      });
    }
  };

  // Carregar mapeamentos ao montar o componente
  useEffect(() => {
    fetchProductMappings();
  }, [fetchProductMappings]);

  // Renderizar card ou conteúdo direto com base na prop standalone
  const renderContent = () => (
    <div className="space-y-4">
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground max-w-prose">
            Configure como os produtos do Doppus serão convertidos em assinaturas no DesignAuto.
            O sistema utilizará estes mapeamentos ao processar notificações de compra.
          </p>
        </div>
        <Button onClick={openAddMappingDialog} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar mapeamento
        </Button>
      </div>
      
      {isLoadingMappings ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : productMappings.length === 0 ? (
        <div className="bg-muted/50 border rounded-md p-6 text-center">
          <div className="text-muted-foreground mb-2">
            Nenhum mapeamento configurado
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione mapeamentos para que o sistema saiba como converter as compras do Doppus em assinaturas.
          </p>
          <Button onClick={openAddMappingDialog} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Configurar Mapeamento
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">ID do Produto</TableHead>
                <TableHead className="w-[180px]">ID do Plano</TableHead>
                <TableHead>Nome do Produto</TableHead>
                <TableHead>Plano no DesignAuto</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productMappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell className="font-mono text-xs">
                    {mapping.productId}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {mapping.planId}
                  </TableCell>
                  <TableCell className="font-medium">
                    {mapping.productName}
                  </TableCell>
                  <TableCell>
                    {mapping.planType === 'premium_30' ? 'Premium Mensal' : 
                     mapping.planType === 'premium_180' ? 'Premium Semestral' : 
                     mapping.planType === 'premium_365' ? 'Premium Anual' : 
                     mapping.planType === 'premium_lifetime' ? 'Premium Vitalício' :
                     mapping.planType === 'premium' ? 'Premium (Legado)' : 
                     mapping.planType === 'pro' ? 'Profissional (Legado)' : 
                     mapping.planType === 'basic' ? 'Básico (Legado)' : mapping.planType}
                  </TableCell>
                  <TableCell>
                    {mapping.isLifetime ? (
                      <span className="text-sm bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                        Vitalício
                      </span>
                    ) : (
                      <span>{mapping.durationDays} dias</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {mapping.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-700 dark:text-green-300">
                        <Check className="w-3 h-3 mr-1" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        <X className="w-3 h-3 mr-1" />
                        Inativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleMappingStatus(mapping)}
                        title={mapping.isActive ? "Desativar" : "Ativar"}
                      >
                        {mapping.isActive ? (
                          <X className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditMappingDialog(mapping)}
                        title="Editar"
                      >
                        <FileEdit className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteMapping(mapping)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Diálogo para adicionar/editar mapeamento */}
      <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMapping ? "Editar mapeamento" : "Adicionar mapeamento"}
            </DialogTitle>
            <DialogDescription>
              {editingMapping 
                ? "Atualize os detalhes do mapeamento de produto do Doppus."
                : "Configure como um produto do Doppus será mapeado no sistema."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productId">ID do Produto</Label>
                <Input
                  id="productId"
                  value={mappingFormData.productId}
                  onChange={(e) => setMappingFormData({
                    ...mappingFormData,
                    productId: e.target.value
                  })}
                  placeholder="ID do produto no Doppus"
                />
                <p className="text-xs text-muted-foreground">
                  O identificador único do produto no Doppus.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="planId">ID do Plano</Label>
                <Input
                  id="planId"
                  value={mappingFormData.planId}
                  onChange={(e) => setMappingFormData({
                    ...mappingFormData,
                    planId: e.target.value
                  })}
                  placeholder="ID do plano no Doppus"
                />
                <p className="text-xs text-muted-foreground">
                  O identificador do plano no Doppus.
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="productName">Nome do Produto</Label>
              <Input
                id="productName"
                value={mappingFormData.productName}
                onChange={(e) => setMappingFormData({
                  ...mappingFormData,
                  productName: e.target.value
                })}
                placeholder="Nome do produto para identificação"
              />
              <p className="text-xs text-muted-foreground">
                Um nome descritivo para identificar este produto no painel.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="planType">Tipo de Plano</Label>
              <Select
                value={mappingFormData.planType}
                onValueChange={(value) => setMappingFormData({
                  ...mappingFormData,
                  planType: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium_30">Premium Mensal (30 dias)</SelectItem>
                  <SelectItem value="premium_180">Premium Semestral (180 dias)</SelectItem>
                  <SelectItem value="premium_365">Premium Anual (365 dias)</SelectItem>
                  <SelectItem value="premium_lifetime">Premium Vitalício</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define qual tipo de plano será atribuído ao usuário no DesignAuto.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMappingDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveMapping}>
              {editingMapping ? "Salvar alterações" : "Adicionar mapeamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (standalone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapeamento de Produtos Doppus</CardTitle>
          <CardDescription>
            Configure como os produtos do Doppus serão mapeados para assinaturas no DesignAuto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    );
  }

  return renderContent();
}