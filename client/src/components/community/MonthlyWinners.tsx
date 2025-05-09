import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Trophy, Medal, Crown, Gift, CalendarIcon, ChevronDown, Loader2, RefreshCw, 
  User, Award, Sparkles, AlertCircle, Info
} from 'lucide-react';
import { format, isThisMonth, isThisYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import UserAvatar from '@/components/users/UserAvatar';
import { useToast } from '@/hooks/use-toast';

// Função para obter o nível e cor com base na pontuação
const getLevelInfo = (points: number) => {
  if (points >= 5000) return { level: 'Pro D.Auto', color: 'text-red-600' };
  if (points >= 3000) return { level: 'Referência D.Auto', color: 'text-orange-500' };
  if (points >= 1500) return { level: 'Destaque D.Auto', color: 'text-purple-600' };
  if (points >= 700) return { level: 'Cooperador D.Auto', color: 'text-blue-500' };
  if (points >= 200) return { level: 'Voluntário D.Auto', color: 'text-green-500' };
  return { level: 'Membro D.Auto', color: 'text-amber-800' };
};

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

interface PointsSettings {
  prize1stPlace: string;
  prize2ndPlace: string;
  prize3rdPlace: string;
  levelThresholds: Record<string, number>
}

interface MonthlyWinnersProps {
  className?: string;
}

const MonthlyWinners: React.FC<MonthlyWinnersProps> = ({ className }) => {
  // Estado para controlar o mês selecionado no dropdown
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Por padrão, usamos o mês atual
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const { toast } = useToast();

  // Gerar lista de meses para o dropdown (12 meses anteriores)
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    // Adicionar os 12 meses anteriores mais o mês atual
    for (let i = 0; i < 13; i++) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = format(date, 'MMMM yyyy', { locale: ptBR });
      
      options.push({ value, label });
    }
    
    return options;
  };
  
  const monthOptions = getMonthOptions();
  
  // Buscar dados do ranking para o mês selecionado
  const { 
    data: rankingData, 
    isLoading, 
    error, 
    refetch,
    isRefetching
  } = useQuery<{ users: RankingUser[], settings: PointsSettings }>({
    queryKey: ['/api/community/ranking', `month-${selectedMonth}`, 3],
    queryFn: async () => {
      const response = await fetch(`/api/community/ranking?period=month&monthYear=${selectedMonth}&limit=3`);
      if (!response.ok) {
        throw new Error('Falha ao carregar o ranking mensal');
      }
      return response.json();
    },
    refetchOnWindowFocus: false
  });

  // Extrair usuários (top 3) e configurações
  const topUsers = rankingData?.users || [];
  const settings = rankingData?.settings;
  
  // Função para formatar o mês selecionado de forma legível
  const formatSelectedMonth = () => {
    if (!selectedMonth) return '';
    
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    
    return format(date, 'MMMM yyyy', { locale: ptBR });
  };
  
  // Verificar se é o mês atual
  const isCurrentMonth = () => {
    if (!selectedMonth) return false;
    
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    
    return isThisMonth(date) && isThisYear(date);
  };
  
  // Componente para exibir vencedor
  const WinnerCard = ({ user, position, prize }: { user: RankingUser, position: number, prize: string }) => {
    const positionIcons = [
      <Crown key="crown" className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />,
      <Medal key="silver" className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400" />,
      <Medal key="bronze" className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700" />
    ];
    
    const bgColors = [
      'bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/10',
      'bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-800/50 dark:to-zinc-800/30',
      'bg-gradient-to-b from-amber-50/50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/5'
    ];
    
    const borderColors = [
      'border-amber-200 dark:border-amber-900/50',
      'border-zinc-200 dark:border-zinc-700',
      'border-amber-200/70 dark:border-amber-900/30'
    ];
    
    return (
      <div className={cn(
        "flex flex-col items-center p-3 sm:p-4 rounded-lg border", 
        bgColors[position], 
        borderColors[position]
      )}>
        <div className="mb-1 sm:mb-2">
          {positionIcons[position]}
        </div>
        
        <UserAvatar 
          user={user.user} 
          size="lg" 
          linkToProfile={true}
          className="mb-1 sm:mb-2"
        />
        
        <p className="font-medium text-center text-sm sm:text-base mb-0.5 sm:mb-1 line-clamp-1 w-full">
          {user.user.name || user.user.username}
        </p>
        
        <div className="flex items-center justify-center mb-1 sm:mb-2">
          <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
            {user.totalPoints} pontos
          </p>
        </div>
        
        <div className="flex flex-col gap-1 items-center">
          <p className={`text-[10px] sm:text-xs font-medium ${getLevelInfo(user.totalPoints).color}`}>
            {getLevelInfo(user.totalPoints).level.replace(' D.Auto', '')}
          </p>
          <div className="bg-white dark:bg-zinc-800 py-0.5 sm:py-1 px-2 sm:px-3 rounded-full border border-amber-200 dark:border-amber-900/30">
            <p className="text-[10px] sm:text-xs font-medium text-amber-600 dark:text-amber-400">
              {position === 0 ? "1º Lugar" : position === 1 ? "2º Lugar" : "3º Lugar"}
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  // Componente Skeleton para carregamento
  const WinnerCardSkeleton = () => (
    <div className="flex flex-col items-center p-3 sm:p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
      <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 rounded-full mb-1 sm:mb-2" />
      <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-full mb-1 sm:mb-2" />
      <Skeleton className="h-3 sm:h-4 w-20 sm:w-24 mb-0.5 sm:mb-1" />
      <Skeleton className="h-2 sm:h-3 w-14 sm:w-16 mb-1 sm:mb-2" />
      <Skeleton className="h-4 sm:h-6 w-14 sm:w-16 rounded-full" />
    </div>
  );
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2 xs:gap-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" /> 
              <span className="whitespace-nowrap">Vencedores Mensais</span>
            </CardTitle>
            <div className="flex items-center gap-1.5 flex-wrap">
              <CardDescription className="text-xs sm:text-sm">
                Top 3 criadores de {formatSelectedMonth()}
              </CardDescription>
              {isCurrentMonth() && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-[10px] sm:text-xs py-0 px-1.5 ml-1 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                        <span className="text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                          <Info className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Parcial
                        </span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[280px] text-xs sm:text-sm">
                      <p>Resultados parciais para o mês atual. Classificação e prêmios finais serão definidos ao término do mês.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          
          <Select
            value={selectedMonth}
            onValueChange={setSelectedMonth}
          >
            <SelectTrigger className="w-full xs:w-32 sm:w-36 h-8 text-xs sm:text-sm">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel className="text-xs sm:text-sm">Meses</SelectLabel>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4">
        {isLoading || isRefetching ? (
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4">
            <WinnerCardSkeleton />
            <WinnerCardSkeleton />
            <WinnerCardSkeleton />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
            <p className="text-zinc-600 dark:text-zinc-400 mb-3">
              Erro ao carregar os vencedores
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch();
                toast({
                  title: "Atualizando ranking",
                  description: "Buscando dados de vencedores...",
                });
              }}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
              Tentar novamente
            </Button>
          </div>
        ) : topUsers.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
            <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Sem vencedores
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-3 max-w-md mx-auto">
              Não há dados de ranking para este mês ainda. Talvez seja um mês novo ou não houve atividade suficiente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4">
            {topUsers.map((user, index) => (
              <WinnerCard 
                key={user.id} 
                user={user} 
                position={index}
                prize={index === 0 ? settings?.prize1stPlace || "R$ 100,00" : 
                       index === 1 ? settings?.prize2ndPlace || "R$ 50,00" : 
                       settings?.prize3rdPlace || "R$ 25,00"}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyWinners;