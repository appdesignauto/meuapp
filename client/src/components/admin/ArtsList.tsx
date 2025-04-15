import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, Eye, Filter, ArrowUpDown } from 'lucide-react';
import { Art } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';

const ArtsList = () => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<{
    isPremium?: boolean;
    categoryId?: number;
  }>({});
  const limit = 10;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch arts with pagination and filters
  const { data, isLoading } = useQuery<{
    arts: Art[];
    totalCount: number;
  }>({
    queryKey: ['/api/arts', { page, limit, ...filter }],
  });

  // Fetch categories for filter dropdown
  const { data: categories } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });

  // Delete art mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/admin/arts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/arts'] });
      toast({
        title: 'Arte excluída',
        description: 'A arte foi excluída com sucesso.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao excluir a arte.',
        variant: 'destructive',
      });
    },
  });

  // Toggle premium status mutation
  const togglePremiumMutation = useMutation({
    mutationFn: async ({ id, isPremium }: { id: number; isPremium: boolean }) => {
      await apiRequest('PUT', `/api/admin/arts/${id}`, { isPremium });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/arts'] });
      toast({
        title: 'Status atualizado',
        description: 'O status da arte foi atualizado com sucesso.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao atualizar o status.',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta arte?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleTogglePremium = (id: number, currentValue: boolean) => {
    togglePremiumMutation.mutate({ id, isPremium: !currentValue });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const arts = data?.arts || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Artes</CardTitle>
            <CardDescription>
              Gerencie todas as artes da plataforma.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Ordenar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-opacity-25 rounded-full border-t-primary"></div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[80px]">Imagem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="w-[100px]">Premium</TableHead>
                  <TableHead className="w-[100px]">Criado em</TableHead>
                  <TableHead className="text-right w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Nenhuma arte encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  arts.map((art) => (
                    <TableRow key={art.id}>
                      <TableCell className="font-medium">{art.id}</TableCell>
                      <TableCell>
                        <div className="w-10 h-10 overflow-hidden rounded-md">
                          <img 
                            src={art.imageUrl} 
                            alt={art.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell>{art.title}</TableCell>
                      <TableCell>
                        {categories?.find(c => c.id === art.categoryId)?.name || '-'}
                      </TableCell>
                      <TableCell>{art.format}</TableCell>
                      <TableCell>{art.fileType}</TableCell>
                      <TableCell>
                        <Switch 
                          checked={art.isPremium} 
                          onCheckedChange={() => handleTogglePremium(art.id, art.isPremium)}
                        />
                      </TableCell>
                      <TableCell>{formatDate(art.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleDelete(art.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            Mostrando {arts.length} de {totalCount} resultados
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(prev => prev + 1)}
            >
              Próxima
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default ArtsList;