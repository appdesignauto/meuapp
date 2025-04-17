import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Download, Calendar, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function PainelDownloads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

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
  const { data: downloadsData, isLoading: downloadsLoading } = useQuery({
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
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - downloadDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (dateFilter === "week" && diffDays > 7) {
            return false;
          } else if (dateFilter === "month" && diffDays > 30) {
            return false;
          } else if (dateFilter === "year" && diffDays > 365) {
            return false;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Meus Downloads</h1>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Filtro de data */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os períodos</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="year">Último ano</SelectItem>
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
        <div className="space-y-3">
          {filteredDownloads.map((download: any) => (
            <DownloadItem
              key={download.id}
              download={download}
              isPremium={!!isPremium}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Componente DownloadItem para exibir cada download
interface DownloadItemProps {
  download: any;
  isPremium: boolean;
  formatDate: (date: string) => string;
}

function DownloadItem({ download, isPremium, formatDate }: DownloadItemProps) {
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
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-4 w-4" />
                <span>Baixado em: {formatDate(download.createdAt)}</span>
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