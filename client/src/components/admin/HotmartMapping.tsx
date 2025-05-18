import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash, Edit, RefreshCw, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Definição do tipo para mapeamento de produto
interface ProductMapping {
  id: number;
  hotmartProductId: string;
  hotmartProductName: string;
  planoAcesso: string;
  duracaoEmDias: number;
  observacoes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Definição do tipo para produtos da Hotmart
interface HotmartProduct {
  id: string;
  name: string;
  description?: string;
  approvalPage?: string;
  status?: string;
}

// Esquema de validação para o formulário de mapeamento
const mappingFormSchema = z.object({
  hotmartProductId: z.string().min(1, "Selecione um produto da Hotmart"),
  hotmartProductName: z.string().min(1, "Nome do produto é obrigatório"),
  planoAcesso: z.string().min(1, "Selecione um plano de acesso"),
  duracaoEmDias: z.number().int().min(1, "Duração mínima de 1 dia"),
  observacoes: z.string().optional(),
});

type MappingFormValues = z.infer<typeof mappingFormSchema>;

const HotmartMapping: React.FC = () => {
  // Estados
  const [mappings, setMappings] = useState<ProductMapping[]>([]);
  const [products, setProducts] = useState<HotmartProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentMapping, setCurrentMapping] = useState<ProductMapping | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  // Formulário para adicionar/editar mapeamento
  const form = useForm<MappingFormValues>({
    resolver: zodResolver(mappingFormSchema),
    defaultValues: {
      hotmartProductId: "",
      hotmartProductName: "",
      planoAcesso: "premium",
      duracaoEmDias: 30,
      observacoes: "",
    },
  });

  // Buscar mapeamentos ao carregar o componente
  useEffect(() => {
    fetchMappings();
  }, []);

  // Função para buscar mapeamentos
  const fetchMappings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/mapping/hotmart');
      if (!response.ok) {
        throw new Error('Falha ao buscar mapeamentos');
      }
      const data = await response.json();
      setMappings(data.mappings || []);
    } catch (error) {
      console.error('Erro ao carregar mapeamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os mapeamentos de produtos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para buscar produtos da Hotmart
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await fetch('/api/mapping/hotmart-products');
      if (!response.ok) {
        throw new Error('Falha ao buscar produtos da Hotmart');
      }
      const data = await response.json();
      
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
        return data.products;
      } else {
        throw new Error('Formato de resposta inválido');
      }
    } catch (error) {
      console.error('Erro ao carregar produtos da Hotmart:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos da Hotmart.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Testar conexão com a API Hotmart
  const testConnection = async () => {
    setConnectionStatus({ status: 'loading' });
    try {
      const response = await fetch('/api/hotmart/check-connectivity');
      if (!response.ok) {
        throw new Error('Falha ao conectar com a API da Hotmart');
      }
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus({
          status: 'success',
          message: 'Conexão com a API Hotmart estabelecida com sucesso!'
        });
      } else {
        setConnectionStatus({
          status: 'error',
          message: data.message || 'Falha na conexão com a API Hotmart'
        });
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      setConnectionStatus({
        status: 'error',
        message: 'Erro ao testar conexão com a API Hotmart'
      });
    }
  };

  // Abrir formulário para adicionar
  const handleAdd = async () => {
    form.reset({
      hotmartProductId: "",
      hotmartProductName: "",
      planoAcesso: "premium",
      duracaoEmDias: 30,
      observacoes: "",
    });
    
    // Carregar produtos da Hotmart ao abrir o diálogo
    const products = await fetchProducts();
    
    if (products.length > 0) {
      setShowAddDialog(true);
    } else {
      toast({
        title: "Aviso",
        description: "Não foi possível carregar produtos da Hotmart. Verifique as credenciais de API.",
        variant: "default",
      });
    }
  };

  // Abrir formulário para editar
  const handleEdit = (mapping: ProductMapping) => {
    setCurrentMapping(mapping);
    form.reset({
      hotmartProductId: mapping.hotmartProductId,
      hotmartProductName: mapping.hotmartProductName,
      planoAcesso: mapping.planoAcesso,
      duracaoEmDias: mapping.duracaoEmDias,
      observacoes: mapping.observacoes || "",
    });
    setShowEditDialog(true);
  };

  // Abrir diálogo de confirmação para excluir
  const handleDelete = (mapping: ProductMapping) => {
    setCurrentMapping(mapping);
    setShowDeleteDialog(true);
  };

  // Enviar formulário de adição
  const handleSubmitAdd = async (values: MappingFormValues) => {
    try {
      const response = await fetch('/api/mapping/hotmart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Falha ao adicionar mapeamento');
      }

      const data = await response.json();
      
      toast({
        title: "Sucesso",
        description: "Mapeamento de produto adicionado com sucesso.",
      });
      
      setShowAddDialog(false);
      fetchMappings();
    } catch (error) {
      console.error('Erro ao adicionar mapeamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o mapeamento de produto.",
        variant: "destructive",
      });
    }
  };

  // Enviar formulário de edição
  const handleSubmitEdit = async (values: MappingFormValues) => {
    if (!currentMapping) return;
    
    try {
      const response = await fetch(`/api/mapping/hotmart/${currentMapping.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar mapeamento');
      }

      const data = await response.json();
      
      toast({
        title: "Sucesso",
        description: "Mapeamento de produto atualizado com sucesso.",
      });
      
      setShowEditDialog(false);
      setCurrentMapping(null);
      fetchMappings();
    } catch (error) {
      console.error('Erro ao atualizar mapeamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o mapeamento de produto.",
        variant: "destructive",
      });
    }
  };

  // Confirmar exclusão
  const confirmDelete = async () => {
    if (!currentMapping) return;
    
    try {
      const response = await fetch(`/api/mapping/hotmart/${currentMapping.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir mapeamento');
      }
      
      toast({
        title: "Sucesso",
        description: "Mapeamento de produto excluído com sucesso.",
      });
      
      setShowDeleteDialog(false);
      setCurrentMapping(null);
      fetchMappings();
    } catch (error) {
      console.error('Erro ao excluir mapeamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o mapeamento de produto.",
        variant: "destructive",
      });
    }
  };

  // Atualiza o campo nome do produto ao selecionar um produto da lista
  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue("hotmartProductName", product.name);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mapeamento de Produtos Hotmart</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={testConnection} disabled={connectionStatus.status === 'loading'}>
              {connectionStatus.status === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Testar Conexão
                </>
              )}
            </Button>
            
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Mapeamento
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Mapeie produtos da Hotmart para planos de acesso no sistema
        </CardDescription>
        
        {connectionStatus.status === 'success' && (
          <Alert className="mt-4 bg-green-50 text-green-700 border-green-200">
            <AlertTitle>Conexão estabelecida</AlertTitle>
            <AlertDescription>{connectionStatus.message}</AlertDescription>
          </Alert>
        )}
        
        {connectionStatus.status === 'error' && (
          <Alert className="mt-4 bg-destructive/20 text-destructive border-destructive/50">
            <AlertTitle>Erro de conexão</AlertTitle>
            <AlertDescription>{connectionStatus.message}</AlertDescription>
          </Alert>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableCaption>Lista de mapeamentos de produtos Hotmart</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID Produto</TableHead>
                <TableHead>Nome do Produto</TableHead>
                <TableHead>Plano de Acesso</TableHead>
                <TableHead>Duração (dias)</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum mapeamento encontrado. Clique em "Adicionar Mapeamento" para começar.
                  </TableCell>
                </TableRow>
              ) : (
                mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">{mapping.hotmartProductId}</TableCell>
                    <TableCell>{mapping.hotmartProductName}</TableCell>
                    <TableCell>
                      <Badge variant={mapping.planoAcesso === 'premium' ? 'default' : 'secondary'}>
                        {mapping.planoAcesso}
                      </Badge>
                    </TableCell>
                    <TableCell>{mapping.duracaoEmDias} dias</TableCell>
                    <TableCell className="max-w-xs truncate">{mapping.observacoes || "-"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(mapping)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(mapping)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Diálogo para adicionar mapeamento */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Adicionar Mapeamento de Produto</DialogTitle>
            <DialogDescription>
              Mapeie um produto da Hotmart para um plano de acesso no sistema
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitAdd)} className="space-y-6">
              <FormField
                control={form.control}
                name="hotmartProductId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto Hotmart</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleProductSelect(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingProducts ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                          ) : (
                            products.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Selecione o produto da Hotmart que será mapeado
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hotmartProductName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome do produto na plataforma" />
                    </FormControl>
                    <FormDescription>
                      Nome do produto como aparecerá no sistema
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="planoAcesso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano de Acesso</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um plano" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Gratuito</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="pro">Profissional</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Nível de acesso concedido
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duracaoEmDias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (dias)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          min="1"
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 30)}
                        />
                      </FormControl>
                      <FormDescription>
                        Período de acesso em dias
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Observações adicionais sobre o mapeamento"
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription>
                      Informações adicionais sobre o produto (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar Mapeamento</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar mapeamento */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Editar Mapeamento de Produto</DialogTitle>
            <DialogDescription>
              Atualize as informações do mapeamento de produto
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitEdit)} className="space-y-6">
              <FormField
                control={form.control}
                name="hotmartProductId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID do Produto Hotmart</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ID do produto Hotmart" />
                    </FormControl>
                    <FormDescription>
                      Identificador único do produto na Hotmart
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hotmartProductName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome do produto na plataforma" />
                    </FormControl>
                    <FormDescription>
                      Nome do produto como aparecerá no sistema
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="planoAcesso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano de Acesso</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um plano" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Gratuito</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="pro">Profissional</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Nível de acesso concedido
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duracaoEmDias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (dias)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          min="1"
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 30)}
                        />
                      </FormControl>
                      <FormDescription>
                        Período de acesso em dias
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Observações adicionais sobre o mapeamento"
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription>
                      Informações adicionais sobre o produto (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para excluir */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este mapeamento de produto?
            </DialogDescription>
          </DialogHeader>
          
          {currentMapping && (
            <div className="border p-4 rounded-lg bg-muted/30 my-4">
              <p><strong>Produto:</strong> {currentMapping.hotmartProductName}</p>
              <p><strong>ID Hotmart:</strong> {currentMapping.hotmartProductId}</p>
              <p><strong>Plano:</strong> {currentMapping.planoAcesso}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default HotmartMapping;