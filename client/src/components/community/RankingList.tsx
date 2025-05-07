import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Trophy, Medal, Award, Sparkles, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import UserAvatar from '@/components/users/UserAvatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ErrorContainer from '@/components/ErrorContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

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

// Mapeamento de ícones para níveis
const LEVEL_ICONS: Record<string, React.ReactNode> = {
  'Iniciante KDG': <User className="h-4 w-4 text-zinc-500" />,
  'Colaborador KDG': <Award className="h-4 w-4 text-blue-500" />,
  'Destaque KDG': <Medal className="h-4 w-4 text-yellow-500" />,
  'Elite KDG': <Trophy className="h-4 w-4 text-amber-500" />,
  'Lenda KDG': <Sparkles className="h-4 w-4 text-purple-500" />
};

// Componente de item do ranking com estilos baseados na posição
const RankingItem: React.FC<{ 
  user: RankingUser; 
  index: number;
  isCurrentUser?: boolean;
}> = ({ user, index, isCurrentUser }) => {
  // Status baseados no nível e posição
  const isTopThree = index < 3;
  const rankColors = [
    'bg-amber-100 text-amber-800 border-amber-300',
    'bg-gray-100 text-gray-800 border-gray-300',
    'bg-orange-100 text-orange-800 border-orange-300',
  ];
  
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0",
        isCurrentUser && "bg-blue-50 dark:bg-blue-900/20"
      )}
    >
      <div className={cn(
        "flex items-center justify-center text-lg font-bold w-8 h-8 rounded-full",
        isTopThree 
          ? rankColors[index] 
          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      )}>
        {index + 1}
      </div>
      
      <UserAvatar user={{
        id: user.userId,
        username: user.username,
        name: user.name,
        profileimageurl: user.profileimageurl,
        nivelacesso: user.nivelacesso
      }} size="sm" linkToProfile={true} />
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{user.name || user.username}</p>
          <Badge variant="outline" className="text-xs py-0 h-5 gap-1">
            {LEVEL_ICONS[user.level] || <User className="h-3 w-3" />}
            <span>{user.level}</span>
          </Badge>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {user.totalPoints} pontos • {user.postCount} posts • {user.likesReceived} curtidas
        </p>
      </div>
    </div>
  );
};

// Esqueleto para loading
const RankingItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
    <Skeleton className="w-8 h-8 rounded-full" />
    <Skeleton className="w-8 h-8 rounded-full" />
    <div className="flex-1">
      <Skeleton className="h-4 w-32 mb-1" />
      <Skeleton className="h-3 w-40" />
    </div>
  </div>
);

// Componente principal do ranking
const RankingList: React.FC<RankingListProps> = ({
  title = "Ranking KDGPRO",
  description = "Os melhores criadores da nossa comunidade",
  limit = 10,
  showPeriodSelector = true,
  showPrizes = true,
  initialPeriod = 'week',
  className
}) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all_time'>(initialPeriod);
  
  // Buscar ranking dos usuários
  const { 
    data: rankingData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<{ users: RankingUser[], settings: PointsSettings }>({
    queryKey: ['/api/community/ranking', period, limit],
    refetchOnWindowFocus: false
  });
  
  // Extrair usuários do ranking e configurações
  const users = rankingData?.users || [];
  const settings = rankingData?.settings;
  
  // Determinar ID do usuário atual para destacá-lo na lista
  const currentUserId = 0; // Atualizar quando a integração de auth estiver pronta
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      {(title || description) && (
        <CardHeader className="pb-2">
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      
      {showPeriodSelector && (
        <div className="flex items-center gap-2 mb-2 px-6 overflow-x-auto pb-2">
          <Button 
            variant={period === 'week' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriod('week')}
          >
            <Clock className="h-3 w-3 mr-1" /> Semanal
          </Button>
          <Button 
            variant={period === 'month' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriod('month')}
          >
            <Clock className="h-3 w-3 mr-1" /> Mensal
          </Button>
          <Button 
            variant={period === 'year' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriod('year')}
          >
            <Clock className="h-3 w-3 mr-1" /> Anual
          </Button>
          <Button 
            variant={period === 'all_time' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriod('all_time')}
          >
            <Trophy className="h-3 w-3 mr-1" /> Geral
          </Button>
        </div>
      )}
      
      <CardContent className="p-0">
        {isLoading ? (
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
          </div>
        ) : (
          <div>
            {users.map((user, index) => (
              <RankingItem 
                key={user.userId} 
                user={user} 
                index={index} 
                isCurrentUser={user.userId === currentUserId}
              />
            ))}
          </div>
        )}
      </CardContent>
      
      {showPrizes && settings && (period === 'month' || period === 'year') && (
        <CardFooter className="bg-zinc-50 dark:bg-zinc-800/50 p-4 border-t">
          <div className="w-full">
            <h4 className="text-sm font-medium mb-2">Premiação deste período:</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-2 shadow-sm">
                <Medal className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                <p className="text-xs font-medium">1º Lugar</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">{settings.prize1stPlace}</p>
              </div>
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-2 shadow-sm">
                <Medal className="h-5 w-5 mx-auto text-zinc-400 mb-1" />
                <p className="text-xs font-medium">2º Lugar</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{settings.prize2ndPlace}</p>
              </div>
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-2 shadow-sm">
                <Medal className="h-5 w-5 mx-auto text-amber-700 mb-1" />
                <p className="text-xs font-medium">3º Lugar</p>
                <p className="text-xs text-amber-700 dark:text-amber-600">{settings.prize3rdPlace}</p>
              </div>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default RankingList;