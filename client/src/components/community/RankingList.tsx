import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Trophy, Medal, Award, Sparkles, User, Loader2, Crown, Gift, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

import UserAvatar from '@/components/users/UserAvatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ErrorContainer from '@/components/ErrorContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Interface para usuário no ranking
interface RankingUser {
  id: number;
  userId: number;
  username: string;
  name: string | null;
  profileimageurl: string | null;
  nivelacesso: string;
  totalPoints: number;
  rank: number;
  level: string;
  postCount: number;
  likesReceived: number;
  savesReceived: number;
  featuredCount: number;
  user: {
    id: number;
    username: string;
    name: string | null;
    profileimageurl: string | null;
    nivelacesso: string;
  };
}

// Interface para configurações do sistema de pontos
interface PointsSettings {
  prize1stPlace: string;
  prize2ndPlace: string;
  prize3rdPlace: string;
  levelThresholds: Record<string, number>;
}

interface RankingListProps {
  title?: string;
  description?: string;
  limit?: number;
  showPeriodSelector?: boolean;
  showPrizes?: boolean;
  initialPeriod?: 'week' | 'month' | 'year' | 'all_time';
  className?: string;
}

// Função para obter o ícone baseado no nível
const getLevelIcon = (level: string): React.ReactNode => {
  if (level.includes('Pro')) return <Sparkles className="h-4 w-4 text-red-600" />;
  if (level.includes('Referência')) return <Trophy className="h-4 w-4 text-orange-500" />;
  if (level.includes('Destaque')) return <Medal className="h-4 w-4 text-purple-600" />;
  if (level.includes('Cooperador')) return <Award className="h-4 w-4 text-blue-500" />;
  if (level.includes('Voluntário')) return <User className="h-4 w-4 text-green-500" />;
  return <User className="h-4 w-4 text-amber-800" />; // Membro (padrão)
};

// Componente para exibir medalha do pódio
const PodiumMedal: React.FC<{ position: number, prize: string }> = ({ position, prize }) => {
  let color = '';
  let icon = null;
  
  switch(position) {
    case 1:
      color = 'bg-gradient-to-b from-amber-200 to-amber-400 text-amber-900';
      icon = <Crown className="h-4 w-4" />;
      break;
    case 2:
      color = 'bg-gradient-to-b from-zinc-200 to-zinc-400 text-zinc-900';
      icon = <Medal className="h-4 w-4" />;
      break;
    case 3:
      color = 'bg-gradient-to-b from-amber-600 to-amber-800 text-amber-100';
      icon = <Medal className="h-4 w-4" />;
      break;
    default:
      color = 'bg-zinc-100 text-zinc-700';
      icon = <Star className="h-4 w-4" />;
  }
  
  return (
    <div className="shrink-0 ml-auto">
      <div className={`flex items-center gap-1 p-1 px-2 rounded-full ${color} shadow text-xs font-medium`}>
        {icon}
        <span>{prize}</span>
      </div>
    </div>
  );
};

// Componente de item do ranking com estilos baseados na posição
const RankingItem: React.FC<{ 
  user: RankingUser; 
  index: number;
  isCurrentUser?: boolean;
  period: 'week' | 'month' | 'year' | 'all_time';
  settings?: PointsSettings;
}> = ({ user, index, isCurrentUser, period, settings }) => {
  // Status baseados no nível e posição
  const isTopThree = index < 3;
  const rankColors = [
    'bg-amber-100 text-amber-800 border-amber-300',
    'bg-gray-100 text-gray-800 border-gray-300',
    'bg-orange-100 text-orange-800 border-orange-300',
  ];
  
  // Determinar se deve mostrar o prêmio
  const showPrize = period === 'month' && isTopThree && settings;
  
  // Determinar qual prêmio mostrar
  let prize = '';
  if (showPrize && settings) {
    switch(index) {
      case 0: prize = settings.prize1stPlace; break;
      case 1: prize = settings.prize2ndPlace; break;
      case 2: prize = settings.prize3rdPlace; break;
    }
  }
  
  return (
    <div 
      className={cn(
        "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0",
        isCurrentUser && "bg-blue-50 dark:bg-blue-900/20",
        isTopThree && "bg-zinc-50/80 dark:bg-zinc-800/30"
      )}
    >
      <div className={cn(
        "flex items-center justify-center text-sm sm:text-lg font-bold w-6 h-6 sm:w-8 sm:h-8 rounded-full shrink-0",
        isTopThree 
          ? rankColors[index] 
          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      )}>
        {index + 1}
      </div>
      
      <UserAvatar user={{
        id: user.user.id,
        username: user.user.username,
        name: user.user.name,
        profileimageurl: user.user.profileimageurl,
        nivelacesso: user.user.nivelacesso
      }} size="sm" linkToProfile={true} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] xs:max-w-[150px] sm:max-w-[200px]">{user.user.name || user.user.username}</p>
              <Badge variant="outline" className={`text-[10px] sm:text-xs py-0 h-4 sm:h-5 gap-1 shrink-0 ${
                user.level.includes('Pro') ? 'border-red-200 text-red-600 dark:border-red-800/50' :
                user.level.includes('Referência') ? 'border-orange-200 text-orange-500 dark:border-orange-800/50' :
                user.level.includes('Destaque') ? 'border-purple-200 text-purple-600 dark:border-purple-800/50' :
                user.level.includes('Cooperador') ? 'border-blue-200 text-blue-500 dark:border-blue-800/50' :
                user.level.includes('Voluntário') ? 'border-green-200 text-green-500 dark:border-green-800/50' :
                'border-amber-200 text-amber-800 dark:border-amber-800/50'
              }`}>
                {getLevelIcon(user.level)}
                <span className="hidden xs:inline">{user.level.replace(' D.Auto', '')}</span>
              </Badge>
            </div>
            <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[190px] xs:max-w-full">
              {user.totalPoints} pts • {user.postCount} posts • {user.likesReceived} <span className="hidden xs:inline">curtidas</span><span className="inline xs:hidden">❤️</span>
              {showPrize && prize && (
                <span className="inline sm:hidden ml-1 text-amber-600 dark:text-amber-400 font-medium"> • {prize}</span>
              )}
            </p>
          </div>
          
          {showPrize && prize && (
            <div className="hidden sm:block">
              <PodiumMedal position={index + 1} prize={prize} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Esqueleto para loading
const RankingItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
    <Skeleton className="w-6 h-6 sm:w-8 sm:h-8 rounded-full shrink-0" />
    <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0" />
    <div className="flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
        <Skeleton className="h-3 sm:h-4 w-24 sm:w-32 mb-1" />
        <Skeleton className="h-4 w-16 sm:h-5 sm:w-20 mb-1 sm:mb-0" />
      </div>
      <Skeleton className="h-2 sm:h-3 w-32 sm:w-40" />
    </div>
  </div>
);

// Componente principal do ranking
const RankingList: React.FC<RankingListProps> = ({
  title = "Ranking D.Auto",
  description = "Os melhores criadores da nossa comunidade",
  limit = 10,
  showPeriodSelector = true,
  showPrizes = true,
  initialPeriod = 'month',
  className
}) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all_time'>(initialPeriod);
  const { toast } = useToast();
  
  // Buscar ranking dos usuários
  const { 
    data: rankingData, 
    isLoading, 
    error, 
    refetch,
    isRefetching
  } = useQuery<{ users: RankingUser[], settings: PointsSettings }>({
    queryKey: ['/api/community/ranking', period, limit],
    refetchOnWindowFocus: false
  });
  
  // Extrair usuários do ranking e configurações
  const users = rankingData?.users || [];
  const settings = rankingData?.settings;
  
  // Buscar usuário atual da sessão
  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
    refetchOnWindowFocus: false
  });
  
  // Determinar ID do usuário atual para destacá-lo na lista
  const currentUserId = userData?.id || 0;
  
  // Atualizar o ranking ao mudar o período
  useEffect(() => {
    refetch();
  }, [period, refetch]);
  
  // Formatar período para exibição
  const getPeriodLabel = () => {
    switch(period) {
      case 'week': return 'Ranking Semanal';
      case 'month': return 'Ranking Mensal';
      case 'year': return 'Ranking Anual';
      case 'all_time': return 'Ranking Geral';
      default: return 'Ranking';
    }
  };
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        {title && <CardTitle>{getPeriodLabel()}</CardTitle>}
        {period === 'month' && (
          <CardDescription className="flex items-center gap-1">
            <Gift className="h-4 w-4 text-primary" />
            <span>Os top 3 do mês ganham prêmios em dinheiro!</span>
          </CardDescription>
        )}
        {period !== 'month' && description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      
      {showPeriodSelector && (
        <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-2 px-3 sm:px-6">
          <Button 
            variant={period === 'week' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriod('week')}
            disabled={isRefetching}
            className="whitespace-nowrap text-xs sm:text-sm h-8 px-1 sm:px-3"
          >
            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">Semanal</span>
          </Button>
          <Button 
            variant={period === 'month' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriod('month')}
            disabled={isRefetching}
            className="whitespace-nowrap text-xs sm:text-sm h-8 px-1 sm:px-3"
          >
            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">Mensal</span>
          </Button>
          <Button 
            variant={period === 'year' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriod('year')}
            disabled={isRefetching}
            className="whitespace-nowrap text-xs sm:text-sm h-8 px-1 sm:px-3"
          >
            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">Anual</span>
          </Button>
          <Button 
            variant={period === 'all_time' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriod('all_time')}
            disabled={isRefetching}
            className="whitespace-nowrap text-xs sm:text-sm h-8 px-1 sm:px-3"
          >
            <Trophy className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">Geral</span>
          </Button>
        </div>
      )}
      
      <CardContent className="p-0">
        {isLoading || isRefetching ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <RankingItemSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorContainer 
              title="Erro ao carregar ranking" 
              description="Não foi possível carregar o ranking da comunidade."
              onAction={() => refetch()}
            />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Trophy className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
            <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Ranking não disponível
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4 max-w-md mx-auto">
              Não há dados de ranking suficientes para este período. Comece a participar da comunidade para aparecer no ranking!
            </p>
            <Button 
              onClick={() => {
                refetch();
                toast({
                  title: "Atualizando ranking",
                  description: "Buscando dados mais recentes...",
                });
              }}
              size="sm"
              variant="outline"
            >
              <Loader2 className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
              Atualizar ranking
            </Button>
          </div>
        ) : (
          <div>
            {users.map((user, index) => (
              <RankingItem 
                key={user.id || index}
                user={user} 
                index={index} 
                isCurrentUser={user.user.id === currentUserId}
                period={period}
                settings={settings}
              />
            ))}
          </div>
        )}
      </CardContent>
      
      {showPrizes && settings && (period === 'month') && (
        <CardFooter className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-zinc-800/90 dark:to-zinc-800/70 p-3 sm:p-4 border-t">
          <div className="w-full">
            <h4 className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-1.5">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" /> 
              Premiação mensal D.Auto:
            </h4>
            <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center">
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-1.5 sm:p-2 shadow-sm border border-amber-200 dark:border-amber-900/30">
                <Crown className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-amber-500 mb-0.5 sm:mb-1" />
                <p className="text-[10px] sm:text-xs font-medium">1º Lugar</p>
                <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-bold">{settings.prize1stPlace}</p>
              </div>
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-1.5 sm:p-2 shadow-sm border border-zinc-200 dark:border-zinc-700">
                <Medal className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-zinc-400 mb-0.5 sm:mb-1" />
                <p className="text-[10px] sm:text-xs font-medium">2º Lugar</p>
                <p className="text-[10px] sm:text-xs text-zinc-600 dark:text-zinc-400 font-semibold">{settings.prize2ndPlace}</p>
              </div>
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-1.5 sm:p-2 shadow-sm border border-amber-700/30 dark:border-amber-900/30">
                <Medal className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-amber-700 mb-0.5 sm:mb-1" />
                <p className="text-[10px] sm:text-xs font-medium">3º Lugar</p>
                <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-600 font-semibold">{settings.prize3rdPlace}</p>
              </div>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default RankingList;