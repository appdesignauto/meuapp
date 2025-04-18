import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useQuery } from "@tanstack/react-query";
import { Download, Eye, Clock, Star, Activity, ImageIcon, Crown, AlertCircle, CalendarClock, RefreshCw, Heart, CheckCircle2, FolderPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { RenewalBanner } from "@/components/subscription/RenewalBanner";

export default function PainelInicio() {
  const { user } = useAuth();
  const { toast } = useToast();
  interface Stats {
    favoriteCount: number;
    downloadCount: number;
    viewCount: number;
    recentArts: any[];
    recentFavorites: any[];
    recentDownloads: any[];
  }
  
  const [stats, setStats] = useState<Stats>({
    favoriteCount: 0,
    downloadCount: 0,
    viewCount: 0,
    recentArts: [],
    recentFavorites: [],
    recentDownloads: [],
  });

  // Buscar estatísticas do usuário
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/users/stats"],
    enabled: !!user?.id,
  });
  
  // Adicionar log fora da query para evitar erros LSP
  React.useEffect(() => {
    if (userStats) {
      console.log("Stats dados recebidos:", userStats);
    }
  }, [userStats]);

  // Buscar artes recentes
  const { data: recentArtsData, isLoading: artsLoading } = useQuery({
    queryKey: ["/api/arts/recent"],
    enabled: !!user?.id,
  });
  
  // Buscar favoritos recentes
  const { data: favoritesData, isLoading: favoritesLoading } = useQuery<FavoritesData>({
    queryKey: ["/api/favorites"],
    enabled: !!user?.id,
  });
  
  // Buscar downloads recentes
  const { data: downloadsData, isLoading: downloadsLoading } = useQuery<DownloadsData>({
    queryKey: ["/api/downloads"],
    enabled: !!user?.id,
  });

  // Interface para tipar os dados de estatísticas
  interface UserStatsData {
    totalFavorites?: number;
    totalDownloads?: number;
    totalViews?: number;
  }
  
  // Interface para tipar os dados de artes recentes
  interface RecentArtsData {
    arts?: any[];
  }
  
  // Interface para tipar os dados de favoritos
  interface FavoritesData {
    favorites?: any[];
    totalCount?: number;
  }
  
  // Interface para tipar os dados de downloads
  interface DownloadsData {
    downloads?: any[];
    totalCount?: number;
  }

  // Atualizar estatísticas quando os dados estiverem disponíveis
  useEffect(() => {
    if (userStats) {
      const typedStats = userStats as UserStatsData;
      setStats(prev => ({
        ...prev,
        favoriteCount: typedStats.totalFavorites ?? 0,
        downloadCount: typedStats.totalDownloads ?? 0,
        viewCount: typedStats.totalViews ?? 0,
      }));
    }
    
    if (recentArtsData) {
      const typedArtsData = recentArtsData as RecentArtsData;
      setStats(prev => ({
        ...prev,
        recentArts: Array.isArray(typedArtsData.arts) ? typedArtsData.arts : [],
      }));
    }
    
    // Processar favoritos
    if (favoritesData) {
      if (favoritesData.favorites && Array.isArray(favoritesData.favorites)) {
        setStats(prev => ({
          ...prev,
          recentFavorites: favoritesData.favorites.slice(0, 3) || [],
        }));
      }
    }
    
    // Processar downloads
    if (downloadsData) {
      if (downloadsData.downloads && Array.isArray(downloadsData.downloads)) {
        setStats(prev => ({
          ...prev,
          recentDownloads: downloadsData.downloads.slice(0, 3) || [],
        }));
      }
    }
  }, [userStats, recentArtsData, favoritesData, downloadsData]);

  // Obter informações de assinatura do usuário com o hook personalizado
  const { isPremium, isExpired, expirationDate, planType, isLifetime, daysLeft } = useSubscription(user);

  // Formatar data do último acesso se disponível
  const formatUltimoAcesso = () => {
    if (!user?.ultimologin) return null;
    
    try {
      const ultimoLogin = new Date(user.ultimologin);
      
      // Formatar como dd/mm/yyyy hh:mm conforme solicitado
      const dia = ultimoLogin.getDate().toString().padStart(2, '0');
      const mes = (ultimoLogin.getMonth() + 1).toString().padStart(2, '0');
      const ano = ultimoLogin.getFullYear();
      const horas = ultimoLogin.getHours().toString().padStart(2, '0');
      const minutos = ultimoLogin.getMinutes().toString().padStart(2, '0');
      
      return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
    } catch (e) {
      console.error("Erro ao formatar data de último acesso:", e);
      return null;
    }
  };

  const ultimoAcessoFormatado = formatUltimoAcesso();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bem-vindo{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
        {ultimoAcessoFormatado && (
          <p className="text-sm text-muted-foreground mt-1">
            Último acesso em {ultimoAcessoFormatado}
          </p>
        )}
      </div>
      
      {/* Banner de renovação localizado - será exibido mesmo se o site já tiver um banner principal */}
      {isPremium && !isLifetime && daysLeft !== null && daysLeft <= 15 && daysLeft > 0 && (
        <div className="mb-6">
          <RenewalBanner 
            showBanner={true} 
            daysLeft={daysLeft} 
            customMessage={daysLeft <= 3 ? 
              `Atenção! Sua assinatura ${planType} expira em apenas ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}. Renove agora para evitar a perda de acesso.` :
              undefined
            }
          />
        </div>
      )}
      
      {/* Cartões de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div onClick={() => window.location.href = "/painel/favoritas"} className="cursor-pointer transition-transform hover:scale-105 duration-200">
          <StatCard 
            title="Artes Favoritas" 
            value={stats.favoriteCount} 
            icon={<Star className="h-4 w-4 text-yellow-500" />}
            loading={statsLoading || favoritesLoading}
            tooltip={
              stats.recentFavorites && stats.recentFavorites.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold mb-2">Últimas favoritas</h3>
                  {stats.recentFavorites.map((fav: any) => (
                    <div key={fav.id} className="flex items-center space-x-2 py-1 border-b border-border last:border-0">
                      <div className="h-10 w-10 overflow-hidden rounded">
                        <img src={fav.art?.imageUrl} alt={fav.art?.title} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fav.art?.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(fav.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-2">
                    <p className="text-xs text-blue-600 hover:underline">Ver todas</p>
                  </div>
                </div>
              ) : undefined
            }
          />
        </div>
        <div onClick={() => window.location.href = "/painel/downloads"} className="cursor-pointer transition-transform hover:scale-105 duration-200">
          <StatCard 
            title="Downloads" 
            value={stats.downloadCount} 
            icon={<Download className="h-4 w-4 text-green-500" />}
            loading={statsLoading || downloadsLoading}
            tooltip={
              stats.recentDownloads && stats.recentDownloads.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold mb-2">Últimos downloads</h3>
                  {stats.recentDownloads.map((download: any) => (
                    <div key={download.id} className="flex items-center space-x-2 py-1 border-b border-border last:border-0">
                      <div className="h-10 w-10 overflow-hidden rounded">
                        <img src={download.art?.imageUrl} alt={download.art?.title} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{download.art?.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(download.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-2">
                    <p className="text-xs text-blue-600 hover:underline">Ver todos</p>
                  </div>
                </div>
              ) : undefined
            }
          />
        </div>
        <div onClick={() => window.location.href = "/painel/artes"} className="cursor-pointer transition-transform hover:scale-105 duration-200">
          <StatCard 
            title="Visualizações" 
            value={stats.viewCount} 
            icon={<Eye className="h-4 w-4 text-blue-500" />}
            loading={statsLoading}
          />
        </div>
        
        {/* Card de Acesso com lógica dinâmica baseada no tipo de assinatura */}
        <div onClick={() => window.location.href = "/painel/planos"} className="cursor-pointer">
          <Card className={`${
            isExpired ? "border-red-400" :
            isLifetime ? "border-amber-400" :
            isPremium ? "border-green-400" :
            "border-blue-200"
          } h-full transition-all hover:shadow-md`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assinatura</CardTitle>
              {isLifetime ? (
                <Crown className="h-4 w-4 text-amber-500" />
              ) : isPremium ? (
                <Star className="h-4 w-4 text-green-500" /> 
              ) : isExpired ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <Clock className="h-4 w-4 text-blue-500" />
              )}
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-7 w-1/2" />
              ) : (
                <div className="space-y-3">
                  <div className={`text-xl font-bold ${
                    isExpired ? "text-red-600" :
                    isLifetime ? "text-amber-600" :
                    isPremium ? "text-green-600" : 
                    "text-blue-600"
                  }`}>
                    {isLifetime ? "Premium Vitalício" :
                     isPremium ? `Premium ${planType ? planType.charAt(0).toUpperCase() + planType.slice(1) : ""}` :
                     isExpired ? "Expirado" : 
                     "Plano Básico"}
                  </div>
                  
                  {isPremium && !isLifetime && !isExpired && expirationDate && daysLeft !== null && (
                    <div className="text-xs text-muted-foreground flex items-center">
                      <CalendarClock className="h-3 w-3 mr-1" />
                      <span>{daysLeft} {daysLeft === 1 ? 'dia restante' : 'dias restantes'}</span>
                    </div>
                  )}
                  
                  {isLifetime && (
                    <div className="text-xs flex items-center">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100">Acesso vitalício</Badge>
                    </div>
                  )}
                  
                  {/* Origem da assinatura, se disponível */}
                  {user?.origemassinatura && (
                    <div className="text-xs text-muted-foreground">
                      Via {user.origemassinatura === 'hotmart' ? 'Hotmart' : 'Portal'}
                    </div>
                  )}
                  
                  {isExpired && (
                    <Button size="sm" variant="destructive" className="w-full mt-2 text-xs">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Renovar agora
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Informações específicas com base no tipo de acesso */}
      {!isPremium && (
        <Card className="relative overflow-hidden">
          {/* Badge de Desconto */}
          <div className="absolute -right-8 top-6 rotate-45 bg-red-600 text-white text-xs font-bold py-1 px-10 shadow-md z-10">
            30% OFF
          </div>
          <CardHeader>
            <CardTitle>Atualize para Premium</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Tenha acesso ilimitado a todas as artes e recursos exclusivos.
              Aproveite nossas ofertas e impulsione seu negócio com designs profissionais.
            </p>
            
            {/* Lista de benefícios */}
            <div className="space-y-2 my-4">
              <div className="flex items-start">
                <div className="bg-blue-100 p-1 rounded mr-2 mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Acesso a mais de 3.000 artes exclusivas</p>
                  <p className="text-xs text-muted-foreground">Baixe sem limites designs profissionais para seu negócio</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-green-100 p-1 rounded mr-2 mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Download em alta resolução</p>
                  <p className="text-xs text-muted-foreground">Artes em qualidade profissional para impressão e divulgação</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-purple-100 p-1 rounded mr-2 mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Novas artes toda semana</p>
                  <p className="text-xs text-muted-foreground">Acesso prioritário a novos lançamentos e temas sazonais</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <Link href="/planos">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Ver Planos Premium
                </Button>
              </Link>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Plano anual com 30% de desconto - oferta por tempo limitado
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Métricas para usuários premium */}
      {isPremium && (
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle>Métricas da Plataforma</CardTitle>
            <Activity className="h-5 w-5 text-blue-500 ml-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {/* Métrica: Total de artes disponíveis */}
              <div className="flex items-center space-x-3 p-3 rounded-md bg-muted/50">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <ImageIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline">
                    <p className="text-sm font-medium">Total de artes disponíveis</p>
                    <span className="text-lg font-bold text-indigo-600">3.247</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">+78 artes adicionadas este mês</p>
                </div>
              </div>
              
              {/* Métrica: Top downloads do mês */}
              <div className="space-y-2 p-3 rounded-md bg-muted/50">
                <div className="flex items-center space-x-2">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Download className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-sm font-medium">Top 3 artes mais baixadas do mês</p>
                </div>
                
                <div className="pl-10 space-y-2 mt-1">
                  <div className="flex items-center space-x-2 py-1 border-b border-border/40">
                    <div className="h-7 w-7 rounded overflow-hidden flex-shrink-0">
                      <img src="https://dcodfuzoxmddmpvowhap.supabase.co/storage/v1/object/public/designauto-images/arte_21.webp" alt="Arte popular" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">Banner Promoção de Fiat Strada</p>
                      <p className="text-[11px] text-muted-foreground">247 downloads</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 py-1 border-b border-border/40">
                    <div className="h-7 w-7 rounded overflow-hidden flex-shrink-0">
                      <img src="https://dcodfuzoxmddmpvowhap.supabase.co/storage/v1/object/public/designauto-images/arte_22.webp" alt="Arte popular" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">Stories Lavagem Completa</p>
                      <p className="text-[11px] text-muted-foreground">189 downloads</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 py-1">
                    <div className="h-7 w-7 rounded overflow-hidden flex-shrink-0">
                      <img src="https://dcodfuzoxmddmpvowhap.supabase.co/storage/v1/object/public/designauto-images/arte_23.webp" alt="Arte popular" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">Post Ofertas do Final de Semana</p>
                      <p className="text-[11px] text-muted-foreground">156 downloads</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Métrica: Novas coleções */}
              <div className="flex items-center space-x-3 p-3 rounded-md bg-muted/50">
                <div className="bg-amber-100 p-2 rounded-full">
                  <FolderPlus className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline">
                    <p className="text-sm font-medium">Novas coleções este mês</p>
                    <span className="text-lg font-bold text-amber-600">4</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Lavagem Premium, Oficina Motos, SUVs e Ofertas Relâmpago</p>
                </div>
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
          {(artsLoading || favoritesLoading || downloadsLoading) ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-2">
              {/* Mostrar favoritos recentes */}
              {stats.recentFavorites && stats.recentFavorites.length > 0 && (
                stats.recentFavorites.map((fav: any) => (
                  <div key={`fav-${fav.id}`} className="flex items-center p-2 rounded-md hover:bg-muted">
                    <div className="bg-amber-100 p-2 rounded-full mr-3">
                      <Heart className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        Você favoritou "{fav.art?.title || 'Arte'}"
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(fav.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              {/* Mostrar downloads recentes */}
              {stats.recentDownloads && stats.recentDownloads.length > 0 && (
                stats.recentDownloads.map((download: any) => (
                  <div key={`dl-${download.id}`} className="flex items-center p-2 rounded-md hover:bg-muted">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <Download className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        Você baixou "{download.art?.title || 'Arte'}"
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(download.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              {/* Mostrar visualizações recentes */}
              {stats.recentArts && stats.recentArts.length > 0 && (
                stats.recentArts.slice(0, 2).map((art: any) => (
                  <div key={`view-${art.id}`} className="flex items-center p-2 rounded-md hover:bg-muted">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        Você visualizou "{art.title || 'Arte'}"
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(art.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              {/* Sugestão para o primeiro uso */}
              {!stats.recentFavorites?.length && !stats.recentDownloads?.length && !stats.recentArts?.length && (
                <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-5 border border-blue-100">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-blue-100 p-3 rounded-full mb-3">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Começando sua jornada</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Você ainda não interagiu com nenhuma arte. Que tal começar por aqui?
                    </p>
                    <div className="flex gap-3 flex-wrap justify-center">
                      <Link href="/painel/artes">
                        <Button variant="outline" className="flex items-center gap-1">
                          <ImageIcon className="h-4 w-4 mr-1" />
                          Explorar Artes
                        </Button>
                      </Link>
                      <Link href="/painel/colecoes">
                        <Button variant="outline" className="flex items-center gap-1">
                          <FolderPlus className="h-4 w-4 mr-1" />
                          Ver Coleções
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Importar componentes para tooltip
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Componente de Cartão de Estatísticas
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  loading?: boolean;
  isText?: boolean;
  tooltip?: React.ReactNode;
}

function StatCard({ title, value, icon, loading = false, isText = false, tooltip }: StatCardProps) {
  if (!tooltip) {
    return (
      <Card className="h-full">
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
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="h-full">
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
        </TooltipTrigger>
        <TooltipContent className="p-0 overflow-hidden rounded-lg border" side="bottom">
          <div className="p-3 min-w-[250px] max-w-[350px]">
            {tooltip}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}