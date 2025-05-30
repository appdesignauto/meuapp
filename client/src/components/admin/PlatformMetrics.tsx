import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Download, 
  Image as ImageIcon, 
  Calendar,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PlatformMetrics {
  totalArts: number;
  artsAddedThisMonth: number;
  topDownloadedArts: Array<{
    id: number;
    title: string;
    downloads: number;
    category: string;
  }>;
  newCollectionsThisMonth: number;
  recentCollections: string[];
}

export default function PlatformMetrics() {
  const { data: metrics, isLoading, error } = useQuery<PlatformMetrics>({
    queryKey: ['/api/admin/platform-metrics'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/platform-metrics');
      if (!res.ok) {
        throw new Error('Erro ao carregar métricas da plataforma');
      }
      return await res.json();
    },
    refetchInterval: 60000, // Atualiza a cada minuto
    retry: 2,
  });

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Métricas da Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Métricas da Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar métricas</h3>
              <p className="text-muted-foreground">Tente recarregar a página</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Métricas da Plataforma
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total de artes disponíveis */}
        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ImageIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Total de artes disponíveis</h3>
              <p className="text-sm text-gray-600">
                +{metrics.artsAddedThisMonth} artes adicionadas este mês
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">
              {metrics.totalArts.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Top 3 artes mais baixadas do mês */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Download className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Top 3 artes mais baixadas do mês</h3>
          </div>
          
          <div className="space-y-3">
            {metrics.topDownloadedArts.slice(0, 3).map((art, index) => (
              <div key={art.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{art.title}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {art.category}
                  </Badge>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">
                    {art.downloads} downloads
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Novas coleções este mês */}
        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Novas coleções este mês</h3>
              <p className="text-sm text-gray-600">
                {metrics.recentCollections.join(', ')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-600">
              {metrics.newCollectionsThisMonth}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}