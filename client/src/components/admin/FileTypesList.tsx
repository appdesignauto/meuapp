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

interface FileType {
  id: number;
  name: string;
  slug: string;
}

const FileTypesList = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentFileType, setCurrentFileType] = useState<FileType | null>(null);
  const [newFileType, setNewFileType] = useState({ name: '', slug: '' });
  const [editFileType, setEditFileType] = useState({ id: 0, name: '', slug: '' });

  // Carregar tipos de arquivo
  const { data: fileTypes, isLoading } = useQuery<FileType[]>({
    queryKey: ['/api/fileTypes'],
  });

  // Criação de tipos de arquivo
  const createMutation = useMutation({
    mutationFn: async (fileType: { name: string; slug: string }) => {
      const res = await fetch('/api/fileTypes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fileType),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Falha ao criar tipo de arquivo');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fileTypes'] });
      setIsAddDialogOpen(false);
      setNewFileType({ name: '', slug: '' });
      toast({
        title: 'Tipo de arquivo criado',
        description: 'O tipo de arquivo foi criado com sucesso',
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

  // Atualização de tipos de arquivo
  const updateMutation = useMutation({
    mutationFn: async (fileType: { id: number; name: string; slug: string }) => {
      const res = await fetch(`/api/fileTypes/${fileType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: fileType.name, slug: fileType.slug }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Falha ao atualizar tipo de arquivo');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fileTypes'] });
      setIsEditDialogOpen(false);
      setEditFileType({ id: 0, name: '', slug: '' });
      toast({
        title: 'Tipo de arquivo atualizado',
        description: 'O tipo de arquivo foi atualizado com sucesso',
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

  // Remoção de tipos de arquivo
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/fileTypes/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Falha ao excluir tipo de arquivo');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fileTypes'] });
      setIsDeleteDialogOpen(false);
      setCurrentFileType(null);
      toast({
        title: 'Tipo de arquivo excluído',
        description: 'O tipo de arquivo foi excluído com sucesso',
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
  const handleEditClick = (fileType: FileType) => {
    setEditFileType({
      id: fileType.id,
      name: fileType.name,
      slug: fileType.slug,
    });
    setIsEditDialogOpen(true);
  };

  // Handler para abrir o diálogo de exclusão
  const handleDeleteClick = (fileType: FileType) => {
    setCurrentFileType(fileType);
    setIsDeleteDialogOpen(true);
  };

  // Handler para criar slug a partir do nome
  const handleNameChange = (value: string, type: 'add' | 'edit') => {
    const slug = value
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    
    if (type === 'add') {
      setNewFileType({ name: value, slug });
    } else {
      setEditFileType({ ...editFileType, name: value, slug });
    }
  };

  // Handler para submissão do formulário de adição
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newFileType);
  };

  // Handler para submissão do formulário de edição
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(editFileType);
  };

  // Handler para exclusão
  const handleDeleteConfirm = () => {
    if (currentFileType) {
      deleteMutation.mutate(currentFileType.id);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando tipos de arquivo...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tipos de Arquivo</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Novo Tipo de Arquivo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Tipo de Arquivo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Tipo de Arquivo</Label>
                <Input
                  id="name"
                  value={newFileType.name}
                  onChange={(e) => handleNameChange(e.target.value, 'add')}
                  placeholder="Ex: Canva"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={newFileType.slug}
                  onChange={(e) => setNewFileType({ ...newFileType, slug: e.target.value })}
                  placeholder="Ex: canva"
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
                  {createMutation.isPending ? 'Salvando...' : 'Salvar Tipo de Arquivo'}
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
            {fileTypes && fileTypes.length > 0 ? (
              fileTypes.map((fileType) => (
                <TableRow key={fileType.id}>
                  <TableCell>{fileType.id}</TableCell>
                  <TableCell className="font-medium">{fileType.name}</TableCell>
                  <TableCell>{fileType.slug}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(fileType)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(fileType)}
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
                  Nenhum tipo de arquivo encontrado
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
            <DialogTitle>Editar Tipo de Arquivo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do Tipo de Arquivo</Label>
              <Input
                id="edit-name"
                value={editFileType.name}
                onChange={(e) => handleNameChange(e.target.value, 'edit')}
                placeholder="Ex: Canva"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={editFileType.slug}
                onChange={(e) => setEditFileType({ ...editFileType, slug: e.target.value })}
                placeholder="Ex: canva"
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
            <AlertDialogTitle>Excluir Tipo de Arquivo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o tipo de arquivo "{currentFileType?.name}"? Esta ação não pode ser desfeita.
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

export default FileTypesList;