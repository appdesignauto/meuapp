import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Format {
  id: number;
  name: string;
  slug: string;
}

const FormatsList = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<Format | null>(null);
  const [newFormat, setNewFormat] = useState({ name: '', slug: '' });
  const [editFormat, setEditFormat] = useState({ id: 0, name: '', slug: '' });

  // Carregar formatos
  const { data: formats, isLoading } = useQuery<Format[]>({
    queryKey: ['/api/formats'],
  });

  // Criação de formatos
  const createMutation = useMutation({
    mutationFn: async (format: { name: string; slug: string }) => {
      const res = await fetch('/api/formats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(format),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Falha ao criar formato');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/formats'] });
      setIsAddDialogOpen(false);
      setNewFormat({ name: '', slug: '' });
      toast({
        title: 'Formato criado',
        description: 'O formato foi criado com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Atualização de formatos
  const updateMutation = useMutation({
    mutationFn: async (format: { id: number; name: string; slug: string }) => {
      const res = await fetch(`/api/formats/${format.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: format.name, slug: format.slug }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Falha ao atualizar formato');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/formats'] });
      setIsEditDialogOpen(false);
      setEditFormat({ id: 0, name: '', slug: '' });
      toast({
        title: 'Formato atualizado',
        description: 'O formato foi atualizado com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remoção de formatos
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/formats/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Falha ao excluir formato');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/formats'] });
      setIsDeleteDialogOpen(false);
      setCurrentFormat(null);
      toast({
        title: 'Formato excluído',
        description: 'O formato foi excluído com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handler para abrir o diálogo de edição
  const handleEditClick = (format: Format) => {
    setEditFormat({
      id: format.id,
      name: format.name,
      slug: format.slug,
    });
    setIsEditDialogOpen(true);
  };

  // Handler para abrir o diálogo de exclusão
  const handleDeleteClick = (format: Format) => {
    setCurrentFormat(format);
    setIsDeleteDialogOpen(true);
  };

  // Handler para criar slug a partir do nome
  const handleNameChange = (value: string, type: 'add' | 'edit') => {
    const slug = value
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    
    if (type === 'add') {
      setNewFormat({ name: value, slug });
    } else {
      setEditFormat({ ...editFormat, name: value, slug });
    }
  };

  // Handler para submissão do formulário de adição
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newFormat);
  };

  // Handler para submissão do formulário de edição
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(editFormat);
  };

  // Handler para exclusão
  const handleDeleteConfirm = () => {
    if (currentFormat) {
      deleteMutation.mutate(currentFormat.id);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando formatos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Formatos</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Novo Formato
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Formato</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Formato</Label>
                <Input
                  id="name"
                  value={newFormat.name}
                  onChange={(e) => handleNameChange(e.target.value, 'add')}
                  placeholder="Ex: Web Banner"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={newFormat.slug}
                  onChange={(e) => setNewFormat({ ...newFormat, slug: e.target.value })}
                  placeholder="Ex: web-banner"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Identificador único para URLs. Gerado automaticamente a partir do nome.
                </p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Salvando...' : 'Salvar Formato'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formats && formats.length > 0 ? (
              formats.map((format) => (
                <TableRow key={format.id}>
                  <TableCell>{format.id}</TableCell>
                  <TableCell className="font-medium">{format.name}</TableCell>
                  <TableCell>{format.slug}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(format)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(format)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6">
                  Nenhum formato encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Formato</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do Formato</Label>
              <Input
                id="edit-name"
                value={editFormat.name}
                onChange={(e) => handleNameChange(e.target.value, 'edit')}
                placeholder="Ex: Web Banner"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={editFormat.slug}
                onChange={(e) => setEditFormat({ ...editFormat, slug: e.target.value })}
                placeholder="Ex: web-banner"
                required
              />
              <p className="text-sm text-muted-foreground">
                Identificador único para URLs. Gerado automaticamente a partir do nome.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Formato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o formato "{currentFormat?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormatsList;