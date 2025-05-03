import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Clock, Filter, Search, ArrowLeft, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from 'framer-motion';

// Interface para os designs recentes com base na API de downloads
interface RecentDesign {
  id: number;
  createdAt: string;
  art: {
    id: number;
    title: string;
    imageUrl: string;
    editUrl: string;
    format: string;
    categoryId: number;
    isPremium: boolean;
    isVisible: boolean;
  };
}

export default function UserDownloads() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');

  // Paginação
  const [page, setPage] = useState(1);
  const itemsPerPage = 24; // Ajuste conforme necessário

  // Redireciona para login se não estiver autenticado
  useEffect(() => {
    if (user === null) {
      setLocation('/auth');
    }
  }, [user, setLocation]);

  // Fetch downloads
  const { data: downloadsData, isLoading } = useQuery<{ downloads: RecentDesign[]; totalCount: number }>({
    queryKey: ['/api/downloads'],
    enabled: !!user?.id,
  });

  // Cálculo de tempo relativo (Editado há X dias/horas)
  const getRelativeTimeString = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `Editado há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    } else if (diffHours > 0) {
      return `Editado há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    } else if (diffMinutes > 0) {
      return `Editado há ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
    } else {
      return 'Editado agora';
    }
  };

  // Formatação completa de data
  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Filtrar downloads por busca, categoria e formato
  const filteredDownloads = downloadsData?.downloads
    ? downloadsData.downloads.filter(download => {
        const matchesSearch = download.art.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || download.art.categoryId.toString() === selectedCategory;
        const matchesFormat = selectedFormat === 'all' || download.art.format.toLowerCase() === selectedFormat.toLowerCase();
        
        // Filtro de tempo
        if (timeFilter === 'all') return matchesSearch && matchesCategory && matchesFormat;
        
        const date = new Date(download.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (timeFilter === 'today' && diffDays < 1) {
          return matchesSearch && matchesCategory && matchesFormat;
        }
        if (timeFilter === 'week' && diffDays < 7) {
          return matchesSearch && matchesCategory && matchesFormat;
        }
        if (timeFilter === 'month' && diffDays < 30) {
          return matchesSearch && matchesCategory && matchesFormat;
        }
        
        return timeFilter === 'older' && diffDays >= 30 && matchesSearch && matchesCategory && matchesFormat;
      })
    : [];

  // Paginação
  const totalPages = Math.ceil((filteredDownloads?.length || 0) / itemsPerPage);
  const paginatedDownloads = filteredDownloads?.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Voltar para o painel
  const handleGoBack = () => {
    setLocation('/painel');
  };

  // Ir para a página de detalhe da arte
  const handleClickDesign = (id: number) => {
    setLocation(`/arts/${id}`);
  };

  // Ir para a URL de edição externa
  const handleEditClick = (e: React.MouseEvent, editUrl: string) => {
    e.stopPropagation();
    window.open(editUrl, '_blank');
  };

  // Extrair categorias e formatos únicos para os filtros
  const uniqueCategories = downloadsData?.downloads
    ? Array.from(new Set(downloadsData.downloads.map(d => d.art.categoryId)))
    : [];

  const uniqueFormats = downloadsData?.downloads
    ? Array.from(new Set(downloadsData.downloads.map(d => d.art.format.toLowerCase())))
    : [];

  // Renderiza o estado de carregamento
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Não renderiza nada enquanto redireciona
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho e Navegação */}
      <div className="mb-8">
        <button
          onClick={handleGoBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          Voltar para o painel
        </button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-6 w-6" />
              Meus designs editados
            </h1>
            <p className="text-gray-500 mt-1">
              Acesse todos os designs que você já editou
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4 mr-1" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-1" />
              Lista
            </Button>
          </div>
        </div>
      </div>
      
      {/* Filtros e Busca */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar designs..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {uniqueCategories.map(catId => (
              <SelectItem key={catId} value={catId.toString()}>
                Categoria {catId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedFormat} onValueChange={setSelectedFormat}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os formatos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os formatos</SelectItem>
            {uniqueFormats.map(format => (
              <SelectItem key={format} value={format}>
                {format.charAt(0).toUpperCase() + format.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os períodos</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mês</SelectItem>
            <SelectItem value="older">Mais antigos</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Contador de Resultados */}
      <div className="mb-4 flex items-center">
        <Badge variant="outline" className="bg-blue-50 text-blue-800">
          {filteredDownloads.length} designs encontrados
        </Badge>
      </div>
      
      {/* Grid de Designs */}
      {filteredDownloads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <Clock className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum design encontrado</h3>
          <p className="text-gray-500 max-w-md">
            Você ainda não editou nenhum design que corresponda aos filtros selecionados.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
          {paginatedDownloads.map((download) => (
            <motion.div
              key={download.id}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer relative group"
              onClick={() => handleClickDesign(download.art.id)}
            >
              <div className="relative aspect-square overflow-hidden">
                <img 
                  src={download.art.imageUrl} 
                  alt={download.art.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                {download.art.isPremium && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-5 h-5 text-amber-400 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.59 9.35L15.83 8.35L13.5 4.1C13.34 3.78 13.01 3.58 12.65 3.58C12.29 3.58 11.96 3.78 11.81 4.1L9.5 8.35L4.72 9.35C4.1 9.47 3.56 9.92 3.5 10.56C3.46 10.94 3.61 11.32 3.89 11.59L7.33 14.95L6.67 19.77C6.58 20.17 6.68 20.54 6.93 20.82C7.18 21.1 7.56 21.26 7.95 21.26C8.21 21.26 8.46 21.19 8.66 21.06L13 18.68L17.32 21.05C17.52 21.18 17.77 21.25 18.03 21.25H18.04C18.42 21.25 18.79 21.09 19.04 20.82C19.29 20.55 19.39 20.17 19.3 19.79L18.63 14.97L22.07 11.61C22.35 11.34 22.5 10.96 22.46 10.58C22.39 9.93 21.85 9.47 20.59 9.35Z" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 truncate">{download.art.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="outline" className="text-xs px-2 py-0 bg-blue-50 text-blue-700 border-blue-200">
                    {download.art.format}
                  </Badge>
                  <span className="text-xs text-gray-500">{getRelativeTimeString(download.createdAt)}</span>
                </div>
              </div>
              
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="shadow-md"
                  onClick={(e) => handleEditClick(e, download.art.editUrl)}
                >
                  Editar
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto mb-8">
          <table className="w-full bg-white rounded-lg shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imagem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Editado em</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedDownloads.map((download) => (
                <tr key={download.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 relative rounded overflow-hidden">
                        <img
                          src={download.art.imageUrl}
                          alt={download.art.title}
                          className="h-full w-full object-cover"
                        />
                        {download.art.isPremium && (
                          <div className="absolute top-0 right-0">
                            <svg className="w-4 h-4 text-amber-400 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.59 9.35L15.83 8.35L13.5 4.1C13.34 3.78 13.01 3.58 12.65 3.58C12.29 3.58 11.96 3.78 11.81 4.1L9.5 8.35L4.72 9.35C4.1 9.47 3.56 9.92 3.5 10.56C3.46 10.94 3.61 11.32 3.89 11.59L7.33 14.95L6.67 19.77C6.58 20.17 6.68 20.54 6.93 20.82C7.18 21.1 7.56 21.26 7.95 21.26C8.21 21.26 8.46 21.19 8.66 21.06L13 18.68L17.32 21.05C17.52 21.18 17.77 21.25 18.03 21.25H18.04C18.42 21.25 18.79 21.09 19.04 20.82C19.29 20.55 19.39 20.17 19.3 19.79L18.63 14.97L22.07 11.61C22.35 11.34 22.5 10.96 22.46 10.58C22.39 9.93 21.85 9.47 20.59 9.35Z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{download.art.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className="text-xs px-2 py-0 bg-blue-50 text-blue-700 border-blue-200">
                      {download.art.format}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatFullDate(download.createdAt)}</div>
                    <div className="text-xs text-gray-400">{getRelativeTimeString(download.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClickDesign(download.art.id)}
                      >
                        Ver
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => handleEditClick(e, download.art.editUrl)}
                      >
                        Editar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <Button
                key={pageNum}
                variant={pageNum === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}