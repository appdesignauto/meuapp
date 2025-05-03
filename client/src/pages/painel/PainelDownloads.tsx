import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Download, Calendar, Search, Grid, List, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function PainelDownloads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // Restaurar a preferência de visualização do localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem("downloadsViewMode");
    if (savedViewMode === "grid" || savedViewMode === "list") {
      setViewMode(savedViewMode);
    }
  }, []);
  
  // Salvar preferência de visualização no localStorage
  useEffect(() => {
    localStorage.setItem("downloadsViewMode", viewMode);
  }, [viewMode]);

  // Verificar se o usuário é premium
  const isPremium = user && 
    (user.role === "premium" || 
     user.role === "designer" || 
     user.role === "designer_adm" || 
     user.role === "admin" ||
     (user.nivelacesso && 
      user.nivelacesso !== "free" && 
      user.nivelacesso !== "usuario"));

  // Consultar histórico de downloads
  const { data: downloadsData, isLoading: downloadsLoading } = useQuery<{ downloads: any[]; totalCount: number }>({
    queryKey: ["/api/downloads"],
    enabled: !!user?.id,
  });

  // Filtrar downloads com base na pesquisa e data
  const filteredDownloads = downloadsData?.downloads
    ? downloadsData.downloads.filter((download: any) => {
        // Filtro de pesquisa
        if (
          searchTerm &&
          !download.art.title.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }

        // Filtro de data
        if (dateFilter !== "all") {
          const downloadDate = new Date(download.createdAt);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          const diffTime = Math.abs(now.getTime() - downloadDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          // Início do mês atual
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          
          switch(dateFilter) {
            case 'today':
              if (!(downloadDate >= today)) return false;
              break;
            case 'yesterday':
              if (!(downloadDate >= yesterday && downloadDate < today)) return false;
              break;
            case 'last3days':
              if (!(diffDays < 3)) return false;
              break;
            case 'last7days':
              if (!(diffDays < 7)) return false;
              break;
            case 'last14days':
              if (!(diffDays < 14)) return false;
              break;
            case 'lastMonth':
              if (!(diffDays < 30)) return false;
              break;
            case 'thisMonth':
              if (!(downloadDate >= startOfMonth)) return false;
              break;
          }
        }

        return true;
      })
    : [];

  // Formatação de data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Cálculo de tempo relativo (Editado há X dias/horas)
  const getRelativeTimeString = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Meus Downloads</h1>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Alternar visualização */}
          <div className="flex items-center border rounded-md p-1 mb-2 sm:mb-0 bg-background">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={viewMode === "list" ? "default" : "ghost"} 
                    size="icon" 
                    className="h-8 w-8 rounded-sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Visualização em lista</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={viewMode === "grid" ? "default" : "ghost"} 
                    size="icon" 
                    className="h-8 w-8 rounded-sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Visualização em grade</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Filtro de data */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os períodos</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="last3days">Últimos 3 dias</SelectItem>
              <SelectItem value="last7days">Últimos 7 dias</SelectItem>
              <SelectItem value="last14days">Últimos 14 dias</SelectItem>
              <SelectItem value="lastMonth">Último mês</SelectItem>
              <SelectItem value="thisMonth">Este mês</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Barra de pesquisa */}
          <div className="relative w-full sm:w-[200px]">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Mensagem para usuários sem downloads */}
      {!downloadsLoading && (!filteredDownloads || filteredDownloads.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Download className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold">Nenhum download realizado</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Você ainda não baixou nenhuma arte.
            {(searchTerm || dateFilter !== "all") && " Ou nenhum download corresponde aos filtros selecionados."}
          </p>
          <Button className="mt-4" asChild>
            <a href="/painel/artes">Explorar artes</a>
          </Button>
        </div>
      )}

      {/* Lista de downloads */}
      {downloadsLoading ? (
        viewMode === "list" ? (
          // Esqueleto para visualização em lista
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Esqueleto para visualização em grade
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <Card key={index} className="h-64 overflow-hidden">
                <CardContent className="p-0 h-full">
                  <Skeleton className="w-full h-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        viewMode === "list" ? (
          // Visualização em lista
          <div className="space-y-3">
            {filteredDownloads.map((download: any) => (
              <DownloadItem
                key={download.id}
                download={download}
                isPremium={!!isPremium}
                formatDate={formatDate}
                getRelativeTimeString={getRelativeTimeString}
              />
            ))}
          </div>
        ) : (
          // Visualização em grade
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredDownloads.map((download: any) => (
              <GridDownloadItem
                key={download.id}
                download={download}
                isPremium={!!isPremium}
                getRelativeTimeString={getRelativeTimeString}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

// Componente DownloadItem para exibir cada download
interface DownloadItemProps {
  download: any;
  isPremium: boolean;
  formatDate: (date: string) => string;
  getRelativeTimeString: (date: string) => string;
}

function DownloadItem({ download, isPremium, formatDate, getRelativeTimeString }: DownloadItemProps) {
  const { toast } = useToast();
  const art = download.art;
  
  // Função para lidar com o clique no botão de uso
  const handleUseArt = () => {
    if (!isPremium && art.isPremium) {
      toast({
        title: "Acesso restrito",
        description: "Faça upgrade para o plano Premium para usar esta arte.",
        variant: "destructive",
      });
      return;
    }
    
    // Aqui seria o código para download ou redirecionamento
    window.open(art.editUrl, '_blank');
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="relative w-full sm:w-32 aspect-square sm:aspect-auto">
            <img
              src={art.imageUrl}
              alt={art.title}
              className="w-full h-full object-cover"
            />
            {art.isPremium && (
              <Badge variant="premium" className="absolute top-2 right-2">
                Premium
              </Badge>
            )}
          </div>
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold">{art.title}</h3>
              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                <span>{art.format}</span>
                <span className="mx-1">•</span>
                <span>{art.fileType}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-2">
              <div className="flex flex-col text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span>Baixado em: {formatDate(download.createdAt)}</span>
                </div>
                <span className="text-xs mt-1 text-blue-600">
                  {getRelativeTimeString(download.createdAt)}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseArt}
              >
                Usar novamente
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para visualização em grade
interface GridDownloadItemProps {
  download: any;
  isPremium: boolean;
  getRelativeTimeString: (date: string) => string;
}

function GridDownloadItem({ download, isPremium, getRelativeTimeString }: GridDownloadItemProps) {
  const { toast } = useToast();
  const art = download.art;
  
  // Função para lidar com o clique no botão de uso
  const handleUseArt = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isPremium && art.isPremium) {
      toast({
        title: "Acesso restrito",
        description: "Faça upgrade para o plano Premium para usar esta arte.",
        variant: "destructive",
      });
      return;
    }
    
    // Aqui seria o código para download ou redirecionamento
    window.open(art.editUrl, '_blank');
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <Card className="overflow-hidden h-full">
        <CardContent className="p-0 flex flex-col h-full">
          <div className="relative aspect-square overflow-hidden">
            <img
              src={art.imageUrl}
              alt={art.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {art.isPremium && (
              <div className="absolute top-2 right-2">
                <svg className="w-5 h-5 text-amber-400 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.59 9.35L15.83 8.35L13.5 4.1C13.34 3.78 13.01 3.58 12.65 3.58C12.29 3.58 11.96 3.78 11.81 4.1L9.5 8.35L4.72 9.35C4.1 9.47 3.56 9.92 3.5 10.56C3.46 10.94 3.61 11.32 3.89 11.59L7.33 14.95L6.67 19.77C6.58 20.17 6.68 20.54 6.93 20.82C7.18 21.1 7.56 21.26 7.95 21.26C8.21 21.26 8.46 21.19 8.66 21.06L13 18.68L17.32 21.05C17.52 21.18 17.77 21.25 18.03 21.25H18.04C18.42 21.25 18.79 21.09 19.04 20.82C19.29 20.55 19.39 20.17 19.3 19.79L18.63 14.97L22.07 11.61C22.35 11.34 22.5 10.96 22.46 10.58C22.39 9.93 21.85 9.47 20.59 9.35Z" />
                </svg>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button 
                variant="secondary" 
                size="sm" 
                className="shadow-md"
                onClick={handleUseArt}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </div>
          </div>
          
          <div className="p-3 flex-1 flex flex-col">
            <h3 className="font-medium text-sm line-clamp-2">{art.title}</h3>
            
            <div className="mt-auto pt-2 flex items-center justify-between">
              <Badge variant="outline" className="text-xs px-2 py-0 bg-blue-50 text-blue-700 border-blue-200">
                {art.format}
              </Badge>
              
              <span className="text-xs text-gray-500">
                {getRelativeTimeString(download.createdAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}