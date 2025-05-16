import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Loader2, 
  Trash2, 
  Edit, 
  Database, 
  InformationCircle 
} from "lucide-react";

// Interface para o mapeamento de produtos
interface ProductMapping {
  id: number;
  productName: string;
  planType: string;
  durationDays: number;
  isLifetime: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export function HotmartProductMapping() {
  // Estados para gerenciamento dos mapeamentos
  const [productMappings, setProductMappings] = useState<ProductMapping[]>([]);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  const [showProductMappingDialog, setShowProductMappingDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<ProductMapping | null>(null);
  const [editingMapping, setEditingMapping] = useState<ProductMapping | null>(null);
  const [mappingFormData, setMappingFormData] = useState({
    productName: '',
    planType: 'premium',
    durationDays: 30,
    isLifetime: false
  });

  const { toast } = useToast();

  // Função para buscar os mapeamentos existentes
  const fetchProductMappings = useCallback(async () => {
    try {
      setIsLoadingMappings(true);
      
      const response = await fetch('/api/integrations/hotmart/product-mappings');
      
      if (!response.ok) {
        throw new Error('Falha ao buscar mapeamentos de produtos');
      }
      
      const data = await response.json();
      setProductMappings(data);
    } catch (error) {
      console.error('Erro ao carregar mapeamentos:', error);
      toast({
        title: "Erro ao carregar mapeamentos",
        description: "Não foi possível carregar os mapeamentos de produtos Hotmart.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMappings(false);
    }
  }, [toast]);

  // Carrega os mapeamentos ao inicializar o componente
  useEffect(() => {
    fetchProductMappings();
  }, [fetchProductMappings]);

  // Função para abrir o diálogo de adição de mapeamento
  const openAddMappingDialog = () => {
    setEditingMapping(null);
    setMappingFormData({
      productName: '',
      planType: 'premium',
      durationDays: 30,
      isLifetime: false
    });
    setShowProductMappingDialog(true);
  };

  // Função para editar um mapeamento existente
  const handleEditMapping = (mapping: ProductMapping) => {
    setEditingMapping(mapping);
    setMappingFormData({
      productName: mapping.productName,
      planType: mapping.planType,
      durationDays: mapping.durationDays,
      isLifetime: mapping.isLifetime
    });
    setShowProductMappingDialog(true);
  };

  // Função para confirmar a exclusão de um mapeamento
  const confirmDeleteMapping = (mapping: ProductMapping) => {
    setMappingToDelete(mapping);
    setShowDeleteDialog(true);
  };

  // Função para adicionar um novo mapeamento
  const handleAddMapping = async () => {
    try {
      const response = await fetch('/api/integrations/hotmart/product-mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappingFormData)
      });

      if (!response.ok) {
        throw new Error('Falha ao adicionar mapeamento');
      }

      // Recarregar a lista de mapeamentos
      await fetchProductMappings();
      
      // Fechar o diálogo e limpar o formulário
      setShowProductMappingDialog(false);
      setMappingFormData({
        productName: '',
        planType: 'premium',
        durationDays: 30,
        isLifetime: false
      });

      toast({
        title: "Mapeamento adicionado",
        description: `O mapeamento para "${mappingFormData.productName}" foi adicionado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao adicionar mapeamento:', error);
      toast({
        title: "Erro ao adicionar mapeamento",
        description: "Não foi possível adicionar o mapeamento de produto.",
        variant: "destructive",
      });
    }
  };

  // Função para atualizar um mapeamento existente
  const handleUpdateMapping = async () => {
    if (!editingMapping) return;

    try {
      const response = await fetch(`/api/integrations/hotmart/product-mappings/${editingMapping.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappingFormData)
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar mapeamento');
      }

      // Recarregar a lista de mapeamentos
      await fetchProductMappings();
      
      // Fechar o diálogo e limpar o estado de edição
      setShowProductMappingDialog(false);
      setEditingMapping(null);

      toast({
        title: "Mapeamento atualizado",
        description: `O mapeamento para "${mappingFormData.productName}" foi atualizado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar mapeamento:', error);
      toast({
        title: "Erro ao atualizar mapeamento",
        description: "Não foi possível atualizar o mapeamento de produto.",
        variant: "destructive",
      });
    }
  };

  // Função para excluir um mapeamento
  const handleDeleteMapping = async () => {
    if (!mappingToDelete) return;

    try {
      const response = await fetch(`/api/integrations/hotmart/product-mappings/${mappingToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir mapeamento');
      }

      // Fechar o diálogo de confirmação
      setShowDeleteDialog(false);
      setMappingToDelete(null);

      // Atualizar a lista de mapeamentos
      await fetchProductMappings();
      
      toast({
        title: "Mapeamento excluído",
        description: `O mapeamento para "${mappingToDelete.productName}" foi excluído com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao excluir mapeamento:', error);
      toast({
        title: "Erro ao excluir mapeamento",
        description: "Não foi possível excluir o mapeamento de produto.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-semibold">Mapeamento de Produtos Hotmart</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openAddMappingDialog}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
        
        {isLoadingMappings ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : productMappings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Nenhum mapeamento de produto configurado</p>
            <p className="text-xs mt-1">Adicione mapeamentos para conectar produtos Hotmart com planos DesignAuto</p>
          </div>
        ) : (
          <div className="space-y-2">
            {productMappings.map((mapping) => (
              <div key={mapping.id} className="border rounded-md p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{mapping.productName}</div>
                  <div className="text-sm text-muted-foreground">
                    Plano: {mapping.planType === 'premium' ? 'Premium' : mapping.planType} • 
                    {mapping.isLifetime ? (
                      <span className="text-green-600 ml-1">Vitalício</span>
                    ) : (
                      <span className="ml-1">Duração: {mapping.durationDays} dias</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditMapping(mapping)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => confirmDeleteMapping(mapping)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 text-xs text-muted-foreground">
          <InformationCircle className="h-4 w-4 inline-block mr-1" />
          Os mapeamentos definem qual plano do DesignAuto será atribuído quando um cliente comprar um produto específico na Hotmart.
        </div>
      </div>

      {/* Modal de Adição/Edição de Mapeamento */}
      <Dialog open={showProductMappingDialog} onOpenChange={setShowProductMappingDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingMapping ? 'Editar Mapeamento' : 'Adicionar Mapeamento'}</DialogTitle>
            <DialogDescription>
              Mapeie produtos da Hotmart para planos específicos no DesignAuto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="productName">Nome do Produto Hotmart</Label>
              <Input
                id="productName"
                value={mappingFormData.productName}
                onChange={(e) => setMappingFormData({...mappingFormData, productName: e.target.value})}
                placeholder="Ex: Curso Design Auto"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="planType">Tipo de Plano</Label>
              <Select 
                value={mappingFormData.planType} 
                onValueChange={(value) => setMappingFormData({...mappingFormData, planType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Assinatura Vitalícia</Label>
                <Switch 
                  checked={mappingFormData.isLifetime}
                  onCheckedChange={(checked) => setMappingFormData({...mappingFormData, isLifetime: checked})}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Se ativado, o acesso nunca expirará.
              </p>
            </div>
            
            {!mappingFormData.isLifetime && (
              <div className="space-y-2">
                <Label htmlFor="durationDays">Duração (em dias)</Label>
                <Input
                  id="durationDays"
                  type="number"
                  min="1"
                  value={mappingFormData.durationDays}
                  onChange={(e) => setMappingFormData({
                    ...mappingFormData, 
                    durationDays: parseInt(e.target.value) || 30
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Duração da assinatura após a compra do produto.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductMappingDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={editingMapping ? handleUpdateMapping : handleAddMapping}
              disabled={!mappingFormData.productName}
            >
              {editingMapping ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o mapeamento para "{mappingToDelete?.productName}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMapping} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}