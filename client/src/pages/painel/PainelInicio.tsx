import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Download, Eye, Clock, Star, Activity, ImageIcon, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function PainelInicio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    favoriteCount: 0,
    downloadCount: 0,
    viewCount: 0,
    recentArts: [],
  });

  // Buscar estatísticas do usuário
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/users/stats"],
    enabled: !!user?.id,
  });

  // Buscar artes recentes
  const { data: recentArtsData, isLoading: artsLoading } = useQuery({
    queryKey: ["/api/arts/recent"],
    enabled: !!user?.id,
  });

  // Atualizar estatísticas quando os dados estiverem disponíveis
  useEffect(() => {
    if (userStats) {
      setStats(prev => ({
        ...prev,
        favoriteCount: userStats.totalFavorites || 0,
        downloadCount: userStats.totalDownloads || 0,
        viewCount: userStats.totalViews || 0,
      }));
    }
    
    if (recentArtsData) {
      setStats(prev => ({
        ...prev,
        recentArts: recentArtsData.arts || [],
      }));
    }
  }, [userStats, recentArtsData]);

  // Determinar o nível de acesso
  const isPremium = user && 
    (user.role === "premium" || 
     user.role === "designer" || 
     user.role === "designer_adm" || 
     user.role === "admin" ||
     (user.nivelacesso && 
      user.nivelacesso !== "free" && 
      user.nivelacesso !== "usuario"));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Bem-vindo{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
      
      {/* Cartões de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/painel/favoritas" className="cursor-pointer transition-transform hover:scale-105 duration-200">
          <StatCard 
            title="Artes Favoritas" 
            value={stats.favoriteCount} 
            icon={<Star className="h-4 w-4 text-yellow-500" />}
            loading={statsLoading}
          />
        </Link>
        <Link href="/painel/downloads" className="cursor-pointer transition-transform hover:scale-105 duration-200">
          <StatCard 
            title="Downloads" 
            value={stats.downloadCount} 
            icon={<Download className="h-4 w-4 text-green-500" />}
            loading={statsLoading}
          />
        </Link>
        <Link href="/painel/artes" className="cursor-pointer transition-transform hover:scale-105 duration-200">
          <StatCard 
            title="Visualizações" 
            value={stats.viewCount} 
            icon={<Eye className="h-4 w-4 text-blue-500" />}
            loading={statsLoading}
          />
        </Link>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acesso</CardTitle>
            {isPremium ? 
              <Star className="h-4 w-4 text-amber-500" /> : 
              <Clock className="h-4 w-4 text-gray-500" />
            }
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-7 w-1/2" />
            ) : (
              <div className="space-y-1">
                <div className="text-xl font-bold">
                  {isPremium ? "Premium" : "Básico"}
                </div>
                {isPremium && user?.tipoplano && (
                  <div className="text-xs text-muted-foreground flex items-center">
                    <span className="capitalize">{user.tipoplano}</span>
                    {user.acessovitalicio ? (
                      <Badge variant="outline" className="ml-2 text-[10px]">Vitalício</Badge>
                    ) : user.dataexpiracao ? (
                      <span className="ml-2">
                        Expira: {new Date(user.dataexpiracao).toLocaleDateString()}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações específicas com base no tipo de acesso */}
      {!isPremium && (
        <Card>
          <CardHeader>
            <CardTitle>Atualize para Premium</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tenha acesso ilimitado a todas as artes e recursos exclusivos. 
              Aproveite nossas ofertas e impulsione seu negócio com designs profissionais.
            </p>
            <div className="mt-4">
              <Link href="/planos">
                <a className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
                  Ver Planos
                </a>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Bloco alternativo para usuários premium */}
      {isPremium && (
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle>Atividades Recentes do Sistema</CardTitle>
            <Activity className="h-5 w-5 text-blue-500 ml-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {/* Lista de eventos do sistema */}
              <div className="flex items-center space-x-2 p-2 rounded-md bg-muted/50">
                <div className="bg-green-100 p-2 rounded-full">
                  <Download className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Novas artes adicionadas</p>
                  <p className="text-xs text-muted-foreground">10 novas artes foram adicionadas na categoria Vendas</p>
                </div>
                <div className="text-xs text-muted-foreground">Hoje</div>
              </div>
              
              <div className="flex items-center space-x-2 p-2 rounded-md bg-muted/50">
                <div className="bg-blue-100 p-2 rounded-full">
                  <ImageIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Coleção atualizada</p>
                  <p className="text-xs text-muted-foreground">Nova coleção "Mecânica" foi atualizada com 5 artes</p>
                </div>
                <div className="text-xs text-muted-foreground">Ontem</div>
              </div>
              
              <div className="flex items-center space-x-2 p-2 rounded-md bg-muted/50">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Crown className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Status Premium</p>
                  <p className="text-xs text-muted-foreground">Você tem acesso a conteúdo exclusivo e novos lançamentos</p>
                </div>
                <div className="text-xs text-muted-foreground">Esta semana</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo das atividades recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {artsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : stats.recentArts.length > 0 ? (
            <div className="space-y-2">
              {stats.recentArts.map((art: any) => (
                <div key={art.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <div className="flex items-center space-x-2">
                    <div className="h-10 w-10 overflow-hidden rounded">
                      <img src={art.imageUrl} alt={art.title} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium">{art.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(art.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Eye className="mr-1 h-3 w-3" />
                      {art.viewcount || 0}
                    </span>
                    <span className="flex items-center">
                      <Download className="mr-1 h-3 w-3" />
                      {art.downloadCount || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de Cartão de Estatísticas
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  loading?: boolean;
  isText?: boolean;
}

function StatCard({ title, value, icon, loading = false, isText = false }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-1/2" />
        ) : (
          <div className={`${isText ? "text-xl" : "text-2xl"} font-bold`}>
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}