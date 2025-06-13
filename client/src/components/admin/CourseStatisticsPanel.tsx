import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Users,
  BookOpen,
  TrendingUp,
  MessageSquare,
  Clock,
  Award,
  Database,
  FolderTree,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface CourseStats {
  totalCourses: number;
  totalModules: number;
  totalLessons: number;
  totalStudents: number;
  averageCompletion: number;
  averageRating: number;
  totalComments: number;
}

interface ModuleStats {
  id: number;
  title: string;
  lessonsCount: number;
  studentsEnrolled: number;
  completionRate: number;
  averageTimeSpent: number;
}

interface RecentComment {
  id: number;
  content: string;
  userName: string;
  lessonTitle: string;
  createdAt: string;
  rating?: number;
}

const CourseStatisticsPanel = () => {
  const { data: courseStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/course/statistics'],
    queryFn: async () => {
      const response = await fetch('/api/course/statistics');
      if (!response.ok) {
        throw new Error('Falha ao carregar estatísticas dos cursos');
      }
      return await response.json();
    }
  });

  const { data: moduleStats, isLoading: isLoadingModules } = useQuery({
    queryKey: ['/api/course/modules/statistics'],
    queryFn: async () => {
      const response = await fetch('/api/course/modules/statistics');
      if (!response.ok) {
        throw new Error('Falha ao carregar estatísticas dos módulos');
      }
      return await response.json();
    }
  });

  const { data: recentComments, isLoading: isLoadingComments } = useQuery({
    queryKey: ['/api/course/comments/recent'],
    queryFn: async () => {
      const response = await fetch('/api/course/comments/recent');
      if (!response.ok) {
        throw new Error('Falha ao carregar comentários recentes');
      }
      return await response.json();
    }
  });

  if (isLoadingStats || isLoadingModules || isLoadingComments) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats: CourseStats = courseStats || {
    totalCourses: 0,
    totalModules: 0,
    totalLessons: 0,
    totalStudents: 0,
    averageCompletion: 0,
    averageRating: 0,
    totalComments: 0
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Cursos disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Módulos</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalModules}</div>
            <p className="text-xs text-muted-foreground">Total de módulos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLessons}</div>
            <p className="text-xs text-muted-foreground">Total de aulas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Usuários matriculados</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Performance */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taxa de Conclusão Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{stats.averageCompletion}%</div>
            <Progress value={stats.averageCompletion} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Avaliação Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{stats.averageRating}/5</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  className={`w-4 h-4 rounded-full ${
                    star <= Math.round(stats.averageRating)
                      ? 'bg-yellow-400'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments}</div>
            <p className="text-xs text-muted-foreground">Total de feedbacks</p>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Módulo */}
      {moduleStats && moduleStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Análise por Módulo</CardTitle>
            <CardDescription>Performance detalhada de cada módulo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {moduleStats.map((module: ModuleStats) => (
                <div key={module.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{module.title}</h4>
                    <Badge variant="secondary">{module.lessonsCount} aulas</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Estudantes:</span>
                      <p className="font-medium">{module.studentsEnrolled}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Conclusão:</span>
                      <p className="font-medium">{module.completionRate}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tempo médio:</span>
                      <p className="font-medium">{module.averageTimeSpent}min</p>
                    </div>
                  </div>
                  <Progress value={module.completionRate} className="h-1 mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comentários Recentes */}
      {recentComments && recentComments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comentários Recentes</CardTitle>
            <CardDescription>Últimos feedbacks dos estudantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentComments.map((comment: RecentComment) => (
                <div key={comment.id} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm">{comment.userName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{comment.lessonTitle}</p>
                  <p className="text-sm">{comment.content}</p>
                  {comment.rating && (
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className={`w-3 h-3 rounded-full ${
                            star <= comment.rating!
                              ? 'bg-yellow-400'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(!courseStats || !moduleStats || !recentComments) && (
        <Alert>
          <Database className="h-4 w-4" />
          <AlertTitle>Dados Indisponíveis</AlertTitle>
          <AlertDescription>
            Algumas estatísticas podem não estar disponíveis. Verifique se os cursos estão configurados corretamente.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CourseStatisticsPanel;