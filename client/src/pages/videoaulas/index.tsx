import React, { useState, useRef, useEffect, useMemo } from 'react';
// Helmet comentado temporariamente para evitar erros
// import { Helmet } from 'react-helmet-async';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Play, 
  Info, 
  Clock, 
  Award, 
  CheckCircle, 
  Crown, 
  Filter,
  Zap,
  Sparkles,
  BookOpen,
  GraduationCap,
  Smartphone,
  Star,
  Eye,
  ChevronRight,
  ChevronLeft,
  Car,
  Camera,
  Palette,
  Wrench,
  Settings,
  BarChart4,
  Book,
  X,
  FileText,
  Folder
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

import TutorialCard from '@/components/videoaulas/TutorialCard';
import TutorialCategory from '@/components/videoaulas/TutorialCategory';
import { 
  Tutorial 
} from '@/components/videoaulas/TutorialData';

export default function VideoaulasPage() {
  const { user } = useAuth();
  const isPremiumUser = user && (user.nivelacesso === 'premium' || user.nivelacesso === 'admin');
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Capturar eventos de pesquisa enviados pelo cabeçalho
  useEffect(() => {
    const handleHeaderVideoSearch = (event: any) => {
      const { searchTerm } = event.detail;
      setSearchTerm(searchTerm);
    };
    
    window.addEventListener('video-search', handleHeaderVideoSearch);
    
    return () => {
      window.removeEventListener('video-search', handleHeaderVideoSearch);
    };
  }, []);
  
  // Buscar módulos e lições do banco de dados
  const { data: moduleData, isLoading: isLoadingModules } = useQuery({
    queryKey: ['/api/courses/modules'],
    retry: 1,
  });
  
  const { data: lessonsData, isLoading: isLoadingLessons } = useQuery({
    queryKey: ['/api/courses/lessons'],
    retry: 1,
  });
  
  // Buscar dados de site settings para informações do hero
  const { data: siteSettings, isLoading: isLoadingSiteSettings } = useQuery({
    queryKey: ['/api/site-settings'],
    retry: 1,
  });
  
  // Buscar configurações de cursos para obter título, descrição e imagem do banner
  const { data: courseSettings, isLoading: isLoadingCourseSettings } = useQuery({
    queryKey: ['/api/courses/settings'], // Corrigido para usar a rota do adaptador
    retry: 1,
  });
  
  // Transformar dados do banco para o formato esperado pelos componentes
  const transformarLicoesParaTutoriais = (modules = [], lessons = []) => {
    if (!modules.length || !lessons.length) return [];
    
    try {
      // Criamos um mapa de módulos por ID para acesso rápido
      const modulosMap = modules.reduce((acc, modulo) => {
        acc[modulo.id] = modulo;
        return acc;
      }, {});
  
      console.log("Mapa de módulos criado:", 
        Object.keys(modulosMap).map(id => ({
          id, 
          title: modulosMap[id].title,
          level: modulosMap[id].level
        }))
      );
      
      // Transformar lições
      const tutoriais = lessons.map(lesson => {
        // Encontrar o módulo correspondente
        const modulo = modulosMap[lesson.moduleId];
        
        console.log(`Processando lição ID ${lesson.id} (${lesson.title}) - Módulo: ${lesson.moduleId} - ${modulo ? modulo.title : 'Módulo não encontrado'}`);
        console.log(`Duração original: ${lesson.duration} (tipo: ${typeof lesson.duration})`);
        
        // Formatar a duração para exibição
        const duracaoFormatada = formatarDuracao(lesson.duration);
        console.log(`Duração formatada: ${duracaoFormatada}`);
        
        // Manter ambos os valores - o original e o formatado para garantir compatibilidade
        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          thumbnailUrl: lesson.thumbnailUrl,
          videoUrl: lesson.videoUrl,
          videoProvider: lesson.videoProvider,
          duration: lesson.duration, // Valor original em segundos
          durationFormatted: duracaoFormatada, // Valor formatado para exibição
          // Usar o nível do módulo encontrado ou 'iniciante' como fallback
          level: modulo?.level || 'iniciante',
          isPremium: lesson.isPremium,
          isWatched: false, // Será implementado com histórico do usuário no futuro
          views: Math.floor(Math.random() * 100) + 10, // Valor temporário para visualização
          moduleId: lesson.moduleId,
          moduloNome: modulo?.title || 'Módulo desconhecido',
          showLessonNumber: lesson.showLessonNumber !== false, // Por padrão, mostra número da aula
          tags: [] // Será implementado no futuro
        };
      });
      
      return tutoriais;
    } catch (error) {
      console.error("Erro ao transformar lições para tutoriais:", error);
      return []; // Retorna array vazio em caso de erro
    }
  };
  
  // Formatar duração de segundos para string "MM:SS" ou "HH:MM:SS" para vídeos longos
  const formatarDuracao = (segundos) => {
    if (segundos === undefined || segundos === null) return "00:00";
    
    // Verificar se já é uma string formatada como "MM:SS" ou "HH:MM:SS"
    if (typeof segundos === 'string' && segundos.includes(':')) {
      // Se já estiver no formato adequado, retorna a string diretamente
      return segundos;
    }
    
    // Garantir que segundos seja um número
    let totalSegundos = 0;
    
    if (typeof segundos === 'string') {
      totalSegundos = parseInt(segundos, 10);
    } else if (typeof segundos === 'number') {
      totalSegundos = segundos;
    }
    
    if (isNaN(totalSegundos) || totalSegundos < 0) {
      console.warn(`Valor inválido para formatação de duração: ${segundos}`);
      return "00:00";
    }
    
    // Calcular horas, minutos e segundos
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segsRestantes = totalSegundos % 60;
    
    // Formatar com horas se for necessário
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segsRestantes.toString().padStart(2, '0')}`;
    }
    
    // Formatar apenas com minutos e segundos (agora sempre com padding)
    return `${minutos.toString().padStart(2, '0')}:${segsRestantes.toString().padStart(2, '0')}`;
  };
  
  // Preparar dados
  const tutoriais = transformarLicoesParaTutoriais(moduleData || [], lessonsData || []);
  const tutoriaisPopulares = Array.isArray(tutoriais) && tutoriais.length > 0 ? tutoriais.slice(0, 8) : [];
  
  // Aguardar o carregamento completo dos dados antes de definir o tutorial destaque
  // Consulta para obter a última aula assistida (quando o usuário está autenticado)
  const { data: lastWatchedData, isLoading: isLoadingLastWatched } = useQuery({
    queryKey: ['/api/videoaulas/ultima-aula'],
    retry: 1,
    enabled: !!user, // Só executa a query se o usuário estiver autenticado
  });
  
  // Consulta para obter o histórico de aulas assistidas (quando o usuário está autenticado)
  const { data: watchHistoryData, isLoading: isLoadingWatchHistory } = useQuery({
    queryKey: ['/api/videoaulas/historico-aulas'],
    retry: 1,
    enabled: !!user, // Só executa a query se o usuário estiver autenticado
  });
  
  const tutorialDestaque = useMemo(() => {
    if (isLoadingModules || isLoadingLessons || isLoadingSiteSettings || isLoadingCourseSettings) {
      return null;
    }
    
    // Se temos uma última aula assistida e o usuário está autenticado, usar como destaque
    if (user && lastWatchedData?.hasLastWatched && !isLoadingLastWatched) {
      // Encontrar a aula completa no array de tutoriais baseado no ID da última assistida
      const lastWatchedLesson = tutoriais.find(t => t.id === lastWatchedData.lessonId);
      return lastWatchedLesson || (Array.isArray(tutoriais) && tutoriais.length > 0 ? tutoriais[0] : null);
    }
    
    // Caso contrário, usar a primeira aula como destaque
    return Array.isArray(tutoriais) && tutoriais.length > 0 ? tutoriais[0] : null;
  }, [tutoriais, isLoadingModules, isLoadingLessons, isLoadingSiteSettings, isLoadingCourseSettings, lastWatchedData, isLoadingLastWatched, user]);
  
  // Agrupar por níveis
  const iniciantes = Array.isArray(tutoriais) ? tutoriais.filter(t => t.level === 'iniciante') : [];
  const intermediarios = Array.isArray(tutoriais) ? tutoriais.filter(t => t.level === 'intermediario') : [];
  const avancados = Array.isArray(tutoriais) ? tutoriais.filter(t => t.level === 'avancado') : [];
  
  // Função para verificar se o conteúdo premium deve ser bloqueado
  const isPremiumLocked = (isPremium: boolean) => {
    if (!isPremium) return false;
    return !isPremiumUser;
  };
  
  // Filtrar tutoriais com base na busca - versão avançada
  const filteredTutoriais = searchTerm && Array.isArray(tutoriais) && tutoriais.length > 0
    ? tutoriais.filter(tutorial => {
        const termLower = searchTerm.toLowerCase().trim();
        const searchTerms = termLower.split(/\s+/); // Divide a busca em palavras individuais
        
        // Busca por título (prioridade mais alta)
        const titleMatch = tutorial.title?.toLowerCase().includes(termLower);
        
        // Busca por palavras individuais no título
        const titleWordsMatch = searchTerms.some(term => 
          tutorial.title?.toLowerCase().includes(term)
        );
        
        // Busca por descrição
        const descriptionMatch = tutorial.description?.toLowerCase().includes(termLower);
        
        // Busca por palavras individuais na descrição
        const descriptionWordsMatch = searchTerms.some(term => 
          tutorial.description?.toLowerCase().includes(term)
        );
        
        // Busca por tags
        const tagMatch = Array.isArray(tutorial.tags) && tutorial.tags.some(tag => 
          tag.toLowerCase().includes(termLower)
        );
        
        // Busca por módulo (nome do módulo)
        const moduleMatch = Array.isArray(moduleData) && moduleData.find(m => m.id === tutorial.moduleId)?.title
          ?.toLowerCase().includes(termLower);
          
        // Retorna true se qualquer um dos critérios for atendido
        return titleMatch || titleWordsMatch || descriptionMatch || 
               descriptionWordsMatch || tagMatch || moduleMatch;
      })
    : [];
    
  // Filtrar tutoriais por nível baseado na tab ativa
  const getFilteredTutoriais = () => {
    if (searchTerm) return filteredTutoriais;
    
    switch (activeTab) {
      case 'iniciantes':
        return iniciantes;
      case 'intermediarios':
        return intermediarios;
      case 'avancados':
        return avancados;
      case 'vistos':
        return Array.isArray(tutoriais) ? tutoriais.filter(t => t.isWatched) : [];
      default:
        return Array.isArray(tutoriais) ? tutoriais : [];
    }
  };

  return (
    <>
      {/* <Helmet>
        <title>Videoaulas | DesignAuto</title>
      </Helmet> */}
      
      <div className="bg-white min-h-screen">
        {/* Seção Hero estilo MBA com imagem de fundo */}
        <div className="relative w-full h-[450px] overflow-hidden">
          {/* Fundo com imagem do banner */}
          <div className="absolute inset-0 z-0">
            {/* Imagem de banner personalizada com estado de carregamento */}
            {isLoadingCourseSettings ? (
              <div className="absolute inset-0 bg-blue-700"></div>
            ) : (
              <div 
                className="absolute inset-0 bg-center bg-cover"
                style={{
                  backgroundImage: courseSettings?.bannerImageUrl 
                    ? `url('${courseSettings.bannerImageUrl}')` 
                    : 'linear-gradient(to right, #3b82f6, #2563eb)',
                }}
              ></div>
            )}
          </div>
          
          {/* Overlay gradiente aprimorado para melhor contraste e coerência com o tema geral */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-800/85 via-blue-700/75 to-blue-600/60 z-1"></div>
          
          {/* Conteúdo sobreposto */}
          <div className="container mx-auto h-full flex flex-col justify-center relative z-10">
            <div className="px-4 md:px-8 max-w-3xl">
              {isLoadingCourseSettings ? (
                <>
                  <div className="bg-white/10 backdrop-blur-sm h-12 w-80 animate-pulse rounded-md mb-4"></div>
                  <div className="h-1 w-16 md:w-24 bg-yellow-500 mb-4 md:mb-6 shadow-sm"></div>
                  <div className="bg-white/10 backdrop-blur-sm h-24 w-full max-w-2xl animate-pulse rounded-md"></div>
                </>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 text-white drop-shadow-sm">
                    {courseSettings?.bannerTitle || "App DesignAuto"}
                  </h1>
                  <div className="h-1 w-16 md:w-24 bg-yellow-500 mb-4 md:mb-6 shadow-sm"></div>
                  <p className="text-base sm:text-lg md:text-xl text-white mb-6 md:mb-8 max-w-2xl leading-relaxed shadow-sm">
                    {courseSettings?.bannerDescription || "A formação completa para você criar designs profissionais para seu negócio automotivo de forma simples e totalmente descomplicada."}
                  </p>
                </>
              )}
              
              {/* Botões estilo Netflix */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                {/* Botão Assistir - principal, com ícone de Play */}
                {tutorialDestaque ? (
                  <Link 
                    href={user && lastWatchedData?.hasLastWatched 
                      ? `/videoaulas/${lastWatchedData.lessonId}` 
                      : tutorialDestaque ? `/videoaulas/${tutorialDestaque.id}` : '#'
                    } 
                    className="w-full sm:w-auto"
                  >
                    <Button 
                      className="bg-white hover:bg-white/90 text-black border-0 py-3 md:py-5 px-6 md:px-8 text-base md:text-lg font-semibold w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                      disabled={isLoadingLastWatched}
                    >
                      <div className="relative flex items-center justify-center">
                        {isLoadingLastWatched ? (
                          <>
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span>Carregando...</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 md:h-6 md:w-6 mr-2 text-black" fill="black" />
                            <span>{user && lastWatchedData?.hasLastWatched ? 'Continuar Assistindo' : 'Assistir'}</span>
                          </>
                        )}
                      </div>
                    </Button>
                  </Link>
                ) : (
                  <Button disabled className="bg-white/70 text-black border-0 py-3 md:py-5 px-6 md:px-8 text-base md:text-lg font-semibold w-full sm:w-auto shadow-lg transition-all duration-300 relative overflow-hidden">
                    <div className="relative flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Carregando...</span>
                    </div>
                  </Button>
                )}
                
                {/* Botão de Informações - secundário, com ícone de Info */}
                <Button 
                  variant="outline" 
                  className="bg-gray-700/50 text-white hover:bg-gray-700/80 border border-gray-600 py-3 md:py-5 px-6 md:px-8 text-base md:text-lg font-medium w-full sm:w-auto transition-all duration-300"
                  disabled={!tutorialDestaque}
                  onClick={() => setInfoModalOpen(true)}
                >
                  <div className="flex items-center justify-center">
                    <Info className="h-5 w-5 md:h-6 md:w-6 mr-2" />
                    <span>Informações</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto py-8">
          {/* Navegação principal das videoaulas - Estilo moderno sem barra de pesquisa */}
          <div className="px-4 md:px-8">
            <div className="mb-6 sticky top-16 z-20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-white shadow-md border border-gray-100 gap-3">
                {/* Título da seção com ícone mais elegante */}
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 h-10 w-10 rounded-lg flex items-center justify-center shadow-sm">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-blue-800 text-lg">Videoaulas</div>
                    <div className="text-blue-500 text-xs">Aprenda com tutoriais exclusivos</div>
                  </div>
                </div>
                
                {/* Filtros em formato de pills com estilo mais moderno */}
                <div className="flex flex-wrap gap-2 w-full sm:w-auto bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                  <button 
                    onClick={() => setActiveTab('todos')}
                    className={`text-xs px-4 py-1.5 rounded-full transition-all font-medium ${
                      activeTab === 'todos' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm transform scale-105' 
                        : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-100'
                    }`}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setActiveTab('iniciantes')}
                    className={`text-xs px-4 py-1.5 rounded-full transition-all font-medium ${
                      activeTab === 'iniciantes' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm transform scale-105' 
                        : 'bg-white text-green-700 hover:bg-green-50 border border-green-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Iniciantes
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('intermediarios')}
                    className={`text-xs px-4 py-1.5 rounded-full transition-all font-medium ${
                      activeTab === 'intermediarios' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm transform scale-105' 
                        : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      <Star className="h-3 w-3 mr-1" />
                      Intermediários
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('avancados')}
                    className={`text-xs px-4 py-1.5 rounded-full transition-all font-medium ${
                      activeTab === 'avancados' 
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm transform scale-105' 
                        : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      <Star className="h-3 w-3 mr-1" />
                      <Star className="h-3 w-3 mr-1" />
                      Avançados
                    </div>
                  </button>
                  {user && (
                    <button 
                      onClick={() => setActiveTab('vistos')}
                      className={`text-xs px-4 py-1.5 rounded-full transition-all font-medium ${
                        activeTab === 'vistos' 
                          ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-sm transform scale-105' 
                          : 'bg-white text-teal-700 hover:bg-teal-50 border border-teal-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Vistos
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Conteúdo principal baseado na filtragem */}
          <div className="px-4 md:px-8 mt-6">
            {/* Resultados de pesquisa */}
            {searchTerm && (
              <div className="mb-10">
                <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                  <Search className="mr-2 h-5 w-5 text-blue-500" />
                  Resultados para: "{searchTerm}"
                </h3>
                
                {filteredTutoriais.length === 0 ? (
                  <div className="bg-blue-50 border border-blue-100 text-blue-700 p-4 rounded-lg flex items-start mb-8">
                    <Info className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-blue-500" />
                    <div>
                      <h3 className="font-medium">Nenhum tutorial encontrado</h3>
                      <p className="text-sm text-blue-600">
                        Não encontramos tutoriais com o termo "{searchTerm}". Tente outra busca.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                    {filteredTutoriais.map((tutorial: Tutorial) => (
                      <TutorialCard
                        key={tutorial.id}
                        tutorial={tutorial}
                        isPremiumLocked={isPremiumLocked(tutorial.isPremium)}
                        searchTerm={searchTerm}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Visualização estilo Netflix quando não está pesquisando */}
            {!searchTerm && (
              <>
                {/* Seção Continuar Assistindo - Exibida apenas quando o usuário tem histórico de aulas */}
                {user && watchHistoryData?.hasHistory && !isLoadingWatchHistory && watchHistoryData.lessons && watchHistoryData.lessons.length > 0 && (
                  <div className="mb-8 sm:mb-12">
                    <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-4 sm:mb-6 flex items-center">
                      <Clock className="mr-2 h-6 w-6 text-blue-600" />
                      Continuar Assistindo
                    </h2>
                    
                    <Carousel
                      opts={{
                        align: "start",
                        loop: false,
                        skipSnaps: false,
                        containScroll: "trimSnaps",
                        dragFree: true
                      }}
                      className="w-full overflow-visible relative"
                    >
                      <CarouselContent className="-ml-3 sm:-ml-4">
                        {watchHistoryData.lessons.map((lesson) => (
                          <CarouselItem 
                            key={`history-${lesson.lessonId}`} 
                            className="pl-3 sm:pl-4 basis-3/4 sm:basis-2/5 md:basis-1/3 lg:basis-1/4 xl:basis-1/4"
                          >
                            <Link href={`/videoaulas/${lesson.lessonId}`} className="block h-full">
                              <div className="group relative h-full flex flex-col overflow-hidden">
                                <div className="relative overflow-hidden rounded-md bg-gray-100 shadow-sm">
                                  <div className="aspect-[16/9] overflow-hidden">
                                    <img 
                                      src={lesson.thumbnailUrl || '/images/placeholder-thumbnail.jpg'} 
                                      alt={lesson.title} 
                                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />
                                  </div>
                                  
                                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                  
                                  <div className="absolute top-2 left-2">
                                    <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded-sm text-xs font-medium text-white shadow-sm">
                                      {lesson.moduleName || "Módulo"}
                                    </div>
                                  </div>
                                  
                                  <div className="absolute bottom-2 right-2">
                                    <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded-sm text-xs text-white shadow-sm flex items-center">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {lesson.durationFormatted || "00:00"}
                                    </div>
                                  </div>
                                  
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <div className="bg-white/90 rounded-full p-3 transform scale-90 group-hover:scale-100 transition-all duration-300 shadow-md">
                                      <Play className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                      <div className="px-4 py-2 text-center">
                                        <h3 className="text-white font-semibold text-lg">{lesson.title}</h3>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {lesson.progress > 0 && lesson.progress < 100 && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[3px]">
                                      <div className="h-full bg-blue-600" style={{ width: `${lesson.progress}%` }} />
                                    </div>
                                  )}
                                  
                                  {lesson.isCompleted && (
                                    <div className="absolute top-2 right-2">
                                      <div className="bg-green-600/80 px-2 py-0.5 rounded-sm text-xs font-medium text-white shadow-sm flex items-center">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Assistido
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="mt-3 flex flex-col flex-grow">
                                  <h3 className="font-medium text-gray-800 mb-1.5 line-clamp-2 text-sm md:text-base">
                                    {lesson.title || "Tutorial sem título"}
                                  </h3>
                                </div>
                              </div>
                            </Link>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 hidden md:flex" />
                      <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 hidden md:flex" />
                    </Carousel>
                  </div>
                )}
                
                {/* Tutoriais em destaque ou recomendados - sempre visíveis */}
                {/* Lista de reprodução estilo Shark Tank */}
                <div className="mb-8 sm:mb-12" id="categorias">
                  <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-4 sm:mb-6 flex items-center">
                    Lista de Reprodução
                  </h2>
                  <Carousel
                    opts={{
                      align: "start",
                      loop: false,
                      skipSnaps: false,
                      containScroll: "trimSnaps",
                      dragFree: true
                    }}
                    className="w-full overflow-visible relative"
                  >
                    <CarouselContent className="-ml-3 sm:-ml-4">
                      {Array.isArray(tutoriaisPopulares) && tutoriaisPopulares.map((tutorial, index) => (
                        <CarouselItem key={tutorial.id} className="pl-3 sm:pl-4 basis-3/4 sm:basis-2/5 md:basis-1/3 lg:basis-1/4 xl:basis-1/4">
                          <Link href={`/videoaulas/${tutorial.id}`} className="block h-full">
                            {/* Card estilo Netflix - minimalista e clean */}
                            <div className="group relative h-full flex flex-col overflow-hidden">
                              {/* Thumbnail com proporção mais moderna */}
                              <div className="relative overflow-hidden rounded-md bg-gray-100 shadow-sm">
                                {/* Imagem de thumbnail */}
                                <div className="aspect-[16/9] overflow-hidden">
                                  <img 
                                    src={tutorial.thumbnailUrl || ""} 
                                    alt={tutorial.title || "Tutorial"} 
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                                  />
                                </div>
                                
                                {/* Overlay escuro sutil */}
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                
                                {/* Badge de módulo - estilo clean */}
                                {tutorial.showLessonNumber !== false && (
                                  <div className="absolute top-2 left-2">
                                    <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded-sm text-xs font-medium text-white shadow-sm">
                                      Aula {index + 1}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Badge de duração - estilo clean */}
                                <div className="absolute bottom-2 right-2">
                                  <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded-sm text-xs text-white shadow-sm flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {tutorial.durationFormatted || formatarDuracao(tutorial.duration) || ""}
                                  </div>
                                </div>
                                
                                {/* Indicador NOVO - clean e minimalista, posicionado para evitar sobreposição com PREMIUM */}
                                {tutorial.createdAt && new Date(tutorial.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                                  <div className={`absolute ${tutorial.isPremium ? 'top-9' : 'top-2'} right-2 bg-red-600 px-2 py-0.5 rounded-sm text-xs font-medium text-white shadow-sm`}>
                                    NOVO
                                  </div>
                                )}
                                
                                {/* Botão de play minimalista */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                  <div className="bg-white/90 rounded-full p-3 transform scale-90 group-hover:scale-100 transition-all duration-300 shadow-md">
                                    <Play className="h-6 w-6 text-blue-600" />
                                  </div>
                                </div>
                                
                                {/* Barra de progresso minimalista */}
                                {Math.random() > 0.5 && (
                                  <div className="absolute bottom-0 left-0 right-0 h-[3px]">
                                    <div className="h-full bg-red-600" style={{ width: `${Math.floor(Math.random() * 90)}%` }} />
                                  </div>
                                )}
                              </div>
                              
                              {/* Conteúdo - estilo Netflix clean */}
                              <div className="mt-3 flex flex-col flex-grow">
                                {/* Título - fonte clean e espaçamento */}
                                <h3 className="font-medium text-gray-800 mb-1.5 line-clamp-2 text-sm md:text-base">
                                  {tutorial.title || "Tutorial sem título"}
                                </h3>
                                
                                {/* Meta informação em linha - estilo Netflix */}
                                <div className="flex items-center text-xs text-gray-500 space-x-2">
                                  <span className="line-clamp-1">{tutorial.level === 'iniciante' ? 'Iniciante' : 
                                   tutorial.level === 'intermediario' ? 'Intermediário' : 'Avançado'}</span>
                                  <span>•</span>
                                  <span>{tutorial.views} visualizações</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {/* Netflix style: último card parcialmente visível */}
                  </Carousel>
                </div>
              
                {/* Modulos organizados por categorias estilo Shark Tank */}
                {moduleData && moduleData.map((categoria) => (
                  <div key={categoria.id} className="mb-10 sm:mb-16 relative">
                    <div className="flex flex-col mb-4 sm:mb-6">
                      <div className="flex items-center mb-1">
                        <div className="bg-blue-100 h-8 sm:h-10 w-8 sm:w-10 rounded-lg flex items-center justify-center mr-2 sm:mr-3 text-blue-600">
                          {categoria.id === 1 ? <Car className="h-5 w-5" /> : 
                           categoria.id === 2 ? <Palette className="h-5 w-5" /> : 
                           categoria.id === 3 ? <Smartphone className="h-5 w-5" /> :
                           categoria.id === 4 ? <Camera className="h-5 w-5" /> :
                           categoria.id === 5 ? <Wrench className="h-5 w-5" /> :
                           categoria.id === 6 ? <Settings className="h-5 w-5" /> :
                           categoria.id === 7 ? <BarChart4 className="h-5 w-5" /> :
                           categoria.id === 8 ? <Book className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mr-4">
                          {categoria.title}
                        </h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-blue-100 to-transparent self-center"></div>
                      </div>
                      <p className="text-blue-600 text-xs sm:text-sm ml-12">{categoria.description || "Módulo de aprendizado"}</p>
                    </div>
                    
                    {categoria.lessons && categoria.lessons.length > 0 ? (
                      <Carousel
                        opts={{
                          align: "start",
                          loop: false,
                          skipSnaps: false,
                          containScroll: "trimSnaps",
                          dragFree: true
                        }}
                        className="w-full overflow-visible"
                      >
                        <CarouselContent className="-ml-3 sm:-ml-4">
                          {categoria.lessons && categoria.lessons.map((tutorial, moduleIdx: number) => (
                            <CarouselItem key={tutorial.id} className="pl-3 sm:pl-4 basis-3/4 sm:basis-2/5 md:basis-1/3 lg:basis-1/4 xl:basis-1/4">
                              <Link href={`/videoaulas/${tutorial.id}`} className="block h-full">
                                {/* Card estilo Netflix - minimalista e clean */}
                                <div className="group relative h-full flex flex-col overflow-hidden">
                                  {/* Thumbnail com proporção mais moderna */}
                                  <div className="relative overflow-hidden rounded-md bg-gray-100 shadow-sm">
                                    {/* Imagem de thumbnail */}
                                    <div className="aspect-[16/9] overflow-hidden">
                                      <img 
                                        src={tutorial.thumbnailUrl || ""} 
                                        alt={tutorial.title || "Tutorial"} 
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                                      />
                                    </div>
                                    
                                    {/* Overlay escuro sutil */}
                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    
                                    {/* Badge de aula - estilo clean */}
                                    {tutorial.showLessonNumber !== false && (
                                      <div className="absolute top-2 left-2">
                                        <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded-sm text-xs font-medium text-white shadow-sm">
                                          Aula {moduleIdx + 1}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Badge de duração - estilo clean */}
                                    <div className="absolute bottom-2 right-2">
                                      <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded-sm text-xs text-white shadow-sm flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {tutorial.durationFormatted || formatarDuracao(tutorial.duration) || "00:00"}
                                      </div>
                                    </div>
                                    
                                    {/* Indicador Premium - clean e minimalista */}
                                    {tutorial.isPremium && (
                                      <div className="absolute top-2 right-2 bg-amber-500 px-2 py-0.5 rounded-sm text-xs font-medium text-gray-900 shadow-sm z-10">
                                        PREMIUM
                                      </div>
                                    )}
                                    
                                    {/* Botão de play minimalista */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                      <div className="bg-white/90 rounded-full p-3 transform scale-90 group-hover:scale-100 transition-all duration-300 shadow-md">
                                        <Play className="h-6 w-6 text-blue-600" />
                                      </div>
                                    </div>
                                    
                                    {/* Barra de progresso minimalista */}
                                    {Math.random() > 0.7 && (
                                      <div className="absolute bottom-0 left-0 right-0 h-[3px]">
                                        <div className="h-full bg-red-600" style={{ width: `${Math.floor(Math.random() * 80)}%` }} />
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Conteúdo - estilo Netflix clean */}
                                  <div className="mt-3 flex flex-col flex-grow">
                                    {/* Título - fonte clean e espaçamento */}
                                    <h3 className="font-medium text-gray-800 mb-1.5 line-clamp-2 text-sm md:text-base">
                                      {tutorial.title || "Tutorial sem título"}
                                    </h3>
                                    
                                    {/* Meta informação em linha - estilo Netflix */}
                                    <div className="flex items-center text-xs text-gray-500 space-x-2">
                                      <span className="line-clamp-1">{categoria.title}</span>
                                      <span>•</span>
                                      <span>{tutorial.views} visualizações</span>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                      </Carousel>
                    ) : (
                      <div className="bg-blue-50 border border-blue-100 text-blue-700 p-4 rounded-lg">
                        <p className="text-sm text-blue-700">
                          Nenhum tutorial disponível nesta categoria no momento.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Bloco CTA Premium */}
                {!isPremiumUser && (
                  <div className="mb-10 sm:mb-16 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                    {/* Decoração de background */}
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 overflow-hidden opacity-10 hidden sm:block">
                      <div className="w-full h-full bg-contain bg-no-repeat bg-right-top" 
                           style={{backgroundImage: "url('https://images.unsplash.com/photo-1617651823081-270acchia626?q=80&w=1970&auto=format&fit=crop')"}}></div>
                    </div>
                    
                    <div className="relative z-10 max-w-3xl">
                      <div className="flex items-center mb-3 sm:mb-4">
                        <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 mr-2 sm:mr-3" />
                        <h2 className="text-xl sm:text-2xl font-bold text-blue-800">Desbloqueie Todo o Conteúdo Premium</h2>
                      </div>
                      <p className="text-blue-700 text-sm sm:text-base mb-4 sm:mb-6">
                        Tenha acesso a mais de 50+ videoaulas exclusivas, downloads ilimitados de artes e suporte prioritário da nossa equipe.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Link href="/planos" className="w-full sm:w-auto">
                          <Button size="default" className="bg-yellow-500 hover:bg-yellow-600 text-blue-950 border-0 shadow-md w-full sm:w-auto">
                            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            Conheça os Planos
                          </Button>
                        </Link>
                        <Link href="/cursos" className="w-full sm:w-auto">
                          <Button variant="outline" size="default" className="border-blue-600 text-blue-700 hover:bg-blue-50 w-full sm:w-auto">
                            Ver Todos os Cursos
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Modal de Informações estilo Netflix - Otimizado */}
        <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
          <DialogContent className="sm:max-w-4xl bg-gradient-to-b from-zinc-900 to-zinc-950 border-zinc-800 text-white p-0 overflow-hidden rounded-xl shadow-2xl">
            <DialogTitle className="sr-only">Detalhes da aula: {tutorialDestaque?.title}</DialogTitle>
            <DialogDescription className="sr-only">Informações detalhadas sobre a aula e conteúdo relacionado</DialogDescription>
            
            <div className="relative">
              {/* Header com imagem de fundo e gradiente */}
              <div className="relative h-72 sm:h-96 w-full overflow-hidden">
                {tutorialDestaque?.thumbnailUrl ? (
                  <img 
                    src={tutorialDestaque.thumbnailUrl} 
                    alt={tutorialDestaque.title || "Thumbnail da aula"} 
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900"></div>
                )}
                
                {/* Gradiente de sobreposição sofisticado */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/90 to-transparent"></div>
                
                {/* Botão de fechar refinado */}
                <DialogClose className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 p-2.5 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/10 shadow-lg z-50">
                  <X className="h-5 w-5 text-white" />
                  <span className="sr-only">Fechar detalhes</span>
                </DialogClose>
                
                {/* Título e metadados com melhor hierarquia e espacamento */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent">
                  <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
                    {tutorialDestaque?.title || "Carregando..."}
                  </h2>
                  
                  <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-sm mb-4">
                    {tutorialDestaque?.moduloNome && (
                      <div className="flex items-center px-3 py-1.5 bg-zinc-800/60 backdrop-blur-sm rounded-md border border-zinc-700/30">
                        <Folder className="h-4 w-4 mr-2 text-blue-400" />
                        <span className="font-medium text-blue-100">{tutorialDestaque.moduloNome}</span>
                      </div>
                    )}
                    {tutorialDestaque?.durationFormatted && (
                      <div className="flex items-center px-3 py-1.5 bg-zinc-800/60 backdrop-blur-sm rounded-md border border-zinc-700/30">
                        <Clock className="h-4 w-4 mr-2 text-blue-400" />
                        <span className="font-medium text-blue-100">{tutorialDestaque.durationFormatted}</span>
                      </div>
                    )}
                    {tutorialDestaque?.level && (
                      <div className="flex items-center px-3 py-1.5 bg-zinc-800/60 backdrop-blur-sm rounded-md border border-zinc-700/30">
                        <GraduationCap className="h-4 w-4 mr-2 text-blue-400" />
                        <span className="font-medium text-blue-100 capitalize">{tutorialDestaque.level}</span>
                      </div>
                    )}
                    {tutorialDestaque?.isPremium && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black px-3 py-1.5 rounded-md font-semibold text-xs shadow-md">
                        <Crown className="h-3.5 w-3.5 mr-1.5" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Corpo do modal redesenhado */}
              <div className="px-6 sm:px-8 py-6">
                {/* Descrição com design melhorado */}
                <div className="mb-8 bg-zinc-800/30 p-5 rounded-xl border border-zinc-700/30">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-400" />
                    Sobre esta aula
                  </h3>
                  <p className="text-zinc-300 leading-relaxed text-base">
                    {tutorialDestaque?.description || 
                     "Aprenda passo a passo com este tutorial exclusivo do DesignAuto. Esta aula faz parte de um módulo completo para ajudar você a dominar a edição de designs automotivos."}
                  </p>
                </div>
                
                {/* Botões de ação redesenhados */}
                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                  <Link 
                    href={user && lastWatchedData?.hasLastWatched && lastWatchedData.lessonId === tutorialDestaque?.id
                      ? `/videoaulas/${tutorialDestaque.id}` 
                      : tutorialDestaque ? `/videoaulas/${tutorialDestaque.id}` : '#'
                    } 
                    className="w-full sm:w-auto"
                    onClick={() => setInfoModalOpen(false)}
                  >
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white border-0 py-3 px-8 text-base font-semibold w-full sm:w-auto shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-center">
                        <Play className="h-5 w-5 mr-2 text-white" fill="white" />
                        <span>{user && lastWatchedData?.hasLastWatched && lastWatchedData.lessonId === tutorialDestaque?.id ? 'Continuar Assistindo' : 'Assistir Agora'}</span>
                      </div>
                    </Button>
                  </Link>
                  
                  <DialogClose asChild>
                    <Button 
                      variant="outline" 
                      className="bg-transparent hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 hover:border-zinc-600 py-3 px-8 text-base font-medium w-full sm:w-auto transition-all duration-300"
                    >
                      <div className="flex items-center justify-center">
                        <X className="h-5 w-5 mr-2" />
                        <span>Fechar</span>
                      </div>
                    </Button>
                  </DialogClose>
                </div>
                
                {/* Recomendações redesenhadas */}
                <div className="mt-10">
                  <h3 className="text-xl font-semibold text-white mb-5 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-blue-400" />
                    Aulas relacionadas do mesmo módulo
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {Array.isArray(tutoriais) && tutoriais
                      .filter(t => t.moduleId === tutorialDestaque?.moduleId && t.id !== tutorialDestaque?.id)
                      .slice(0, 3)
                      .map(tutorial => (
                        <Link 
                          key={tutorial.id} 
                          href={`/videoaulas/${tutorial.id}`}
                          onClick={() => setInfoModalOpen(false)}
                          className="group bg-zinc-800/30 hover:bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/30 hover:border-zinc-700/60 transition-all duration-300"
                        >
                          <div className="flex gap-3 h-full">
                            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                              <img 
                                src={tutorial.thumbnailUrl || ""}
                                alt={tutorial.title || ""}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                            <div className="flex flex-col justify-center">
                              <h4 className="text-sm font-medium text-zinc-100 group-hover:text-white transition-colors line-clamp-2">
                                {tutorial.title}
                              </h4>
                              <div className="flex items-center text-xs text-zinc-400 mt-2 font-medium">
                                <Clock className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                                <span>{tutorial.durationFormatted}</span>
                              </div>
                              <div className="mt-2">
                                <Badge variant="outline" className="text-[10px] px-2 py-0 border-zinc-600 text-zinc-400">
                                  {tutorial.level}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                  </div>
                  
                  {/* Botão para explorar todo o módulo */}
                  {tutorialDestaque?.moduleId && (
                    <div className="mt-6 text-center">
                      <Link
                        href="#categorias"
                        onClick={() => setInfoModalOpen(false)}
                        className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                      >
                        <span>Ver todas as aulas deste módulo</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}