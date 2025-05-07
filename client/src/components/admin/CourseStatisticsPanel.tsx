import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Eye,
  Users,
  CheckCircle,
  MessageSquare,
  Award,
  TrendingUp,
  Clock,
  Star,
  Database,
  FolderTree,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// Definição das interfaces para tipagem
interface CourseStatistics {
  totalViews: number;
  activeUsers: number;
  completedLessons: number;
  averageViewTime: number;
  totalComments: number;
  completionRate: number;
  popularLessons: PopularLesson[];
  totalCourses: number;
  totalModules: number;
  totalLessons: number;
}

interface PopularLesson {
  id: number;
  title: string;
  moduleId: number;
  viewCount: number;
  moduleName: string;
}

interface RecentComment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  lessonId: number;
  username: string;
  name: string;
  profileImageUrl: string;
  lessonTitle: string;
  moduleName: string;
}

interface ModuleStats {
  moduleId: number;
  moduleName: string;
  lessonCount: number;
  totalViews: number;
  averageViews: number;
  topLessons: TopLesson[];
}

interface TopLesson {
  id: number;
  title: string;
  viewCount: number;
  duration: number;
}

// Funções utilitárias
const formatTime = (seconds: number): string => {
  if (!seconds) return '0 min';
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}min`;
  } else {
    return `${minutes} min`;
  }
};

const getInitials = (name: string): string => {
  if (!name) return '??';
  return name
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('pt-BR').format(num);
};

const CourseStatisticsPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Consulta para estatísticas gerais
  const { 
    data: statistics, 
    isLoading: loadingStats,
    error: statsError
  } = useQuery<CourseStatistics>({
    queryKey: ['/api/videoaulas/estatisticas'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/videoaulas/estatisticas');
      if (!response.ok) {
        throw new Error('Falha ao carregar estatísticas');
      }
      return response.json();
    }
  });

  // Consulta para comentários recentes
  const { 
    data: recentComments, 
    isLoading: loadingComments,
    error: commentsError
  } = useQuery<RecentComment[]>({
    queryKey: ['/api/videoaulas/comentarios-recentes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/videoaulas/comentarios-recentes?limit=5');
      if (!response.ok) {
        throw new Error('Falha ao carregar comentários');
      }
      return response.json();
    }
  });

  // Consulta para estatísticas por módulo
  const { 
    data: moduleStats, 
    isLoading: loadingModuleStats,
    error: moduleStatsError
  } = useQuery<ModuleStats[]>({
    queryKey: ['/api/videoaulas/aulas-mais-assistidas'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/videoaulas/aulas-mais-assistidas');
      if (!response.ok) {
        throw new Error('Falha ao carregar estatísticas por módulo');
      }
      return response.json();
    }
  });

  // Formatar a data relativa para comentários
  const formatRelativeDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return formatDistance(date, new Date(), { 
        addSuffix: true,
        locale: ptBR
      });
    } catch (error) {
      return 'Data desconhecida';
    }
  };

  // Verificar se há algum erro
  const hasError = statsError || commentsError || moduleStatsError;

  return (
    <div className="space-y-6">
      {hasError && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar estatísticas</AlertTitle>
          <AlertDescription>
            {statsError 
              ? (statsError as Error).message 
              : commentsError 
                ? (commentsError as Error).message 
                : (moduleStatsError as Error).message}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="modules">Análise por Módulo</TabsTrigger>
          <TabsTrigger value="comments">Comentários Recentes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cards de estatísticas gerais */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  Total de Visualizações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{formatNumber(statistics?.totalViews || 0)}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-500" />
                  Usuários Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{formatNumber(statistics?.activeUsers || 0)}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Aulas Completadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{formatNumber(statistics?.completedLessons || 0)}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Tempo Médio de Visualização
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{formatTime(statistics?.averageViewTime || 0)}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  Total de Comentários
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{formatNumber(statistics?.totalComments || 0)}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Taxa de Conclusão
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{statistics?.completionRate || 0}%</div>
                )}
                {!loadingStats && (
                  <Progress value={statistics?.completionRate || 0} className="h-2 mt-2" />
                )}
              </CardContent>
            </Card>
            
            {/* Estatísticas de Conteúdo */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  Total de Cursos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{formatNumber(statistics?.totalCourses || 0)}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-purple-600" />
                  Total de Módulos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{formatNumber(statistics?.totalModules || 0)}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-500" />
                  Total de Aulas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{formatNumber(statistics?.totalLessons || 0)}</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Aulas mais populares */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Aulas Mais Populares
              </CardTitle>
              <CardDescription>
                As 5 aulas mais assistidas da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {statistics?.popularLessons?.length === 0 ? (
                    <div className="text-center py-3 text-gray-500">
                      Nenhuma aula foi assistida ainda
                    </div>
                  ) : (
                    statistics?.popularLessons?.map((lesson, index) => (
                      <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{lesson.title}</h4>
                            <p className="text-sm text-gray-500">{lesson.moduleName}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(lesson.viewCount || 0)}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="mt-6">
          {loadingModuleStats ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : moduleStats?.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhum módulo encontrado
            </div>
          ) : (
            <div className="space-y-6">
              {moduleStats?.map((module) => (
                <Card key={module.moduleId}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{module.moduleName}</span>
                      <Badge variant="outline" className="ml-2">
                        {module.lessonCount} {module.lessonCount === 1 ? 'aula' : 'aulas'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Total de visualizações: {formatNumber(module.totalViews)}
                      <span className="mx-2">•</span>
                      Média por aula: {formatNumber(Math.round(module.averageViews))}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <h4 className="text-sm font-medium mb-3">Aulas mais assistidas deste módulo:</h4>
                    <div className="space-y-3">
                      {module.topLessons?.length === 0 ? (
                        <div className="text-center py-3 text-gray-500">
                          Nenhuma aula disponível neste módulo
                        </div>
                      ) : (
                        module.topLessons?.map((lesson, index) => (
                          <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-medium">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-medium">{lesson.title}</h4>
                                {lesson.duration > 0 && (
                                  <p className="text-sm text-gray-500">{formatTime(lesson.duration)}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {formatNumber(lesson.viewCount || 0)}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                Comentários Recentes
              </CardTitle>
              <CardDescription>
                Últimos comentários feitos pelos alunos nos cursos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingComments ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : recentComments?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum comentário disponível
                </div>
              ) : (
                <div className="space-y-5">
                  {recentComments?.map(comment => (
                    <div key={comment.id} className="relative">
                      <div className="flex gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={comment.profileImageUrl} alt={comment.name} />
                          <AvatarFallback>{getInitials(comment.name || comment.username)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{comment.name || comment.username}</h4>
                            <span className="text-sm text-gray-500">
                              {formatRelativeDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Badge variant="outline" className="text-xs">
                              {comment.lessonTitle}
                            </Badge>
                            <span className="mx-1">•</span>
                            <span>{comment.moduleName}</span>
                          </div>
                        </div>
                      </div>
                      <Separator className="my-4" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseStatisticsPanel;