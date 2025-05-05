import React, { useState, useRef, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  
  // Transformar dados do banco para o formato esperado pelos componentes
  const transformarLicoesParaTutoriais = (modules = [], lessons = []) => {
    if (!modules.length || !lessons.length) {
      console.log("Nenhum dado de módulos ou lições disponível");
      return [];
    }
    
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
        
        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          thumbnailUrl: lesson.thumbnailUrl,
          videoUrl: lesson.videoUrl,
          videoProvider: lesson.videoProvider,
          duration: formatarDuracao(lesson.duration),
          // Usar o nível do módulo encontrado ou 'iniciante' como fallback
          level: modulo?.level || 'iniciante',
          isPremium: lesson.isPremium,
          isWatched: false, // Será implementado com histórico do usuário no futuro
          views: 0, // Será implementado no futuro
          moduleId: lesson.moduleId,
          moduloNome: modulo?.title || 'Módulo desconhecido',
          tags: [] // Será implementado no futuro
        };
      });
      
      console.log(`Total de tutoriais processados: ${tutoriais.length}`);
      return tutoriais;
    } catch (error) {
      console.error("Erro ao transformar lições para tutoriais:", error);
      return []; // Retornar array vazio em caso de erro
    }
  };
  
  // Formatar duração de segundos para string "MM:SS" ou "HH:MM:SS" para vídeos longos
  const formatarDuracao = (segundos) => {
    if (!segundos) return "00:00";
    
    // Garantir que segundos seja um número
    const totalSegundos = typeof segundos === 'string' ? parseInt(segundos, 10) : segundos;
    
    if (isNaN(totalSegundos)) return "00:00";
    
    // Calcular horas, minutos e segundos
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segsRestantes = totalSegundos % 60;
    
    // Formatar com horas se for necessário
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segsRestantes.toString().padStart(2, '0')}`;
    }
    
    // Formatar apenas com minutos e segundos
    return `${minutos}:${segsRestantes.toString().padStart(2, '0')}`;
  };
  
  // Preparar dados
  const tutoriais = transformarLicoesParaTutoriais(moduleData, lessonsData);
  const tutoriaisPopulares = tutoriais?.slice(0, 8) || [];
  const tutorialDestaque = tutoriais?.length ? tutoriais[0] : { id: 1, title: 'Carregando...' };
  
  // Agrupar por níveis
  const iniciantes = tutoriais?.filter(t => t.level === 'iniciante') || [];
  const intermediarios = tutoriais?.filter(t => t.level === 'intermediario') || [];
  const avancados = tutoriais?.filter(t => t.level === 'avancado') || [];
  
  // Função para verificar se o conteúdo premium deve ser bloqueado
  const isPremiumLocked = (isPremium: boolean) => {
    if (!isPremium) return false;
    return !isPremiumUser;
  };
  
  // Filtrar tutoriais com base na busca - versão avançada
  const filteredTutoriais = searchTerm && tutoriais
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
        const tagMatch = tutorial.tags?.some(tag => 
          tag.toLowerCase().includes(termLower)
        );
        
        // Busca por módulo (nome do módulo)
        const moduleMatch = moduleData?.find(m => m.id === tutorial.moduleId)?.title
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
        return tutoriais?.filter(t => t.isWatched) || [];
      default:
        return tutoriais || [];
    }
  };

  // Array de filteredTutoriais para exibição
  const filteredTutoriaisToDisplay = getFilteredTutoriais();

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
            {/* Imagem de banner personalizada */}
            <div 
              className="absolute inset-0 bg-center bg-cover"
              style={{
                backgroundImage: `url('${siteSettings?.courseHeroImageUrl || "https://images.unsplash.com/photo-1617651823081-270acchia626?q=80&w=1970&auto=format&fit=crop"}')`,
              }}
            ></div>
          </div>
          
          {/* Overlay gradiente para melhorar contraste e legibilidade do texto */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-800/60 to-blue-700/30 z-1"></div>
          
          {/* Conteúdo sobreposto */}
          <div className="container mx-auto h-full flex flex-col justify-center relative z-10">
            <div className="px-4 md:px-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 text-white">
                {siteSettings?.courseHeroTitle || "DesignAuto Videoaulas"}
              </h1>
              <div className="h-1 w-16 md:w-24 bg-yellow-500 mb-4 md:mb-6"></div>
              <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-3 md:mb-4 max-w-2xl">
                {siteSettings?.courseHeroSubtitle || "A formação completa para você criar designs profissionais para seu negócio automotivo"}
              </p>
              
              <div className="flex items-center gap-5 mb-6 md:mb-8 text-sm md:text-base">
                <div className="flex items-center">
                  <div className="flex text-yellow-400">
                    <Star className="h-4 w-4 md:h-5 md:w-5 fill-current" />
                    <Star className="h-4 w-4 md:h-5 md:w-5 fill-current" />
                    <Star className="h-4 w-4 md:h-5 md:w-5 fill-current" />
                    <Star className="h-4 w-4 md:h-5 md:w-5 fill-current" />
                    <Star className="h-4 w-4 md:h-5 md:w-5 fill-yellow-100/30" strokeWidth={1.5} />
                  </div>
                  <span className="ml-2 font-medium text-white">{siteSettings?.courseRating || "4.8"}</span>
                  <span className="ml-1 text-blue-200">({siteSettings?.courseReviewCount || "287"})</span>
                </div>
                
                <div className="flex items-center text-blue-100 font-medium">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 mr-1.5 text-blue-200" />
                  <span>{siteSettings?.courseTotalHours || "42 horas de conteúdo"}</span>
                </div>
                
                <div className="flex items-center text-blue-100 font-medium">
                  <BookOpen className="h-4 w-4 md:h-5 md:w-5 mr-1.5 text-blue-200" />
                  <span>{siteSettings?.courseTotalModules || "18"} módulos</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href={`/videoaulas/${tutorialDestaque.id}`} className="w-full sm:w-auto">
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-blue-950 border-0 py-4 md:py-6 px-5 md:px-8 text-base md:text-lg font-medium w-full sm:w-auto">
                    <Play className="h-4 md:h-5 w-4 md:w-5 mr-2" />
                    Começar Agora
                  </Button>
                </Link>
                <Link href="#categorias" className="w-full sm:w-auto">
                  <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 py-4 md:py-6 px-5 md:px-8 text-base md:text-lg font-medium w-full sm:w-auto">
                    Ver Categorias
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto py-8">
          {/* Navegação principal das videoaulas - Estilo moderno sem barra de pesquisa */}
          <div className="px-4 md:px-8">
            <div className="mb-6 sticky top-16 z-20">
              <div className="flex flex-col md:flex-row items-center gap-3 p-3 rounded-lg bg-white shadow-sm border border-gray-100">
                {/* Cabeçalho com informações sobre cursos */}
                <div className="flex items-center gap-3 text-blue-800">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <div className="font-medium">Cursos</div>
                  <div className="hidden md:flex items-center text-sm text-blue-600">
                    <span className="mx-1.5 text-blue-300">|</span>
                    <span className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-1.5" />
                      {moduleData?.length || '0'} módulos
                    </span>
                    <span className="mx-1.5 text-blue-300">|</span>
                    <span className="flex items-center">
                      <Play className="h-4 w-4 mr-1.5" />
                      {lessonsData?.length || '0'} aulas
                    </span>
                  </div>
                </div>
                
                {/* Campo de pesquisa */}
                <div className="relative w-full md:w-auto md:flex-1 md:max-w-xs ml-auto mr-2">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-neutral-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Buscar em todos os vídeos..."
                    className="pl-10 pr-4 py-2 h-9 rounded-full border border-blue-200 text-sm w-full focus:border-blue-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    ref={searchInputRef}
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-2 flex items-center"
                    >
                      <X className="h-4 w-4 text-neutral-400 hover:text-blue-600" />
                    </button>
                  )}
                </div>
                
                {/* Filtros em formato de pills com tons claros de azul */}
                <div className="flex flex-wrap gap-1.5 mt-2 md:mt-0 w-full md:w-auto">
                  <button 
                    onClick={() => setActiveTab('todos')}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${activeTab === 'todos' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-100/50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    Todos
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('iniciantes')}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors flex items-center ${activeTab === 'iniciantes' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-green-100/50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Iniciantes
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('intermediarios')}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors flex items-center ${activeTab === 'intermediarios' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-100/50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Intermediários
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('avancados')}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors flex items-center ${activeTab === 'avancados' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-purple-100/50 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    <Award className="h-3 w-3 mr-1" />
                    Avançados
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('vistos')}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors flex items-center ${activeTab === 'vistos' 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-teal-100/50 text-teal-700 hover:bg-teal-100'
                    }`}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Assistidos
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Exibição de resultados para pesquisa */}
          {searchTerm && (
            <div className="px-4 md:px-8 mb-8">
              <div className="border-b border-gray-200 pb-3 mb-5">
                <h2 className="text-xl font-bold text-blue-900">
                  Resultados para "{searchTerm}"
                  <Badge variant="outline" className="ml-2 bg-blue-50 border-blue-200 text-blue-700">
                    {filteredTutoriaisToDisplay.length} {filteredTutoriaisToDisplay.length === 1 ? 'resultado' : 'resultados'}
                  </Badge>
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Buscando por título, descrição e categorias
                </p>
              </div>
              
              {filteredTutoriaisToDisplay.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum resultado encontrado</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Não encontramos nenhum vídeo correspondente à sua busca. Tente termos diferentes ou navegue por categorias.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {filteredTutoriaisToDisplay.map((tutorial) => (
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
          
          {!searchTerm && (
            <>
              {/* Módulos populares - Estilo Netflix */}
              <div className="px-4 md:px-8 mb-12">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-blue-900 flex items-center">
                    <Crown className="h-5 w-5 mr-2 text-amber-500" strokeWidth={1.5} />
                    Aulas Populares
                    <Badge variant="outline" className="ml-2 bg-amber-50 border-amber-200 text-amber-700">
                      Mais assistidas
                    </Badge>
                  </h2>
                  <Link href="/videoaulas/populares">
                    <Button variant="link" className="gap-1 text-blue-600 hover:text-blue-800 p-0 h-auto">
                      Ver todas <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {tutoriaisPopulares.slice(0, 4).map((tutorial) => (
                    <TutorialCard
                      key={tutorial.id}
                      tutorial={tutorial}
                      isPremiumLocked={isPremiumLocked(tutorial.isPremium)}
                    />
                  ))}
                </div>
              </div>
              
              {/* Categorias */}
              <div id="categorias" className="px-4 md:px-8 mb-12">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-blue-900">
                    <span>Categorias de Videoaulas</span>
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {/* Categoria de design */}
                  <TutorialCategory
                    id={1}
                    title="Design Automotivo"
                    description="Aprenda a criar artes profissionais para seu negócio automotivo"
                    count={iniciantes.length} 
                    image="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=1287&auto=format&fit=crop"
                  />
                  
                  {/* Categoria de redes sociais */}
                  <TutorialCategory
                    id={2}
                    title="Marketing Digital"
                    description="Estratégias para promover seu negócio nas redes sociais"
                    count={intermediarios.length}
                    image="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1374&auto=format&fit=crop"
                  />
                  
                  {/* Categoria de Configurações */}
                  <TutorialCategory
                    id={3}
                    title="Configurações"
                    description="Aprenda a configurar e personalizar a plataforma"
                    count={avancados.length}
                    image="https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1470&auto=format&fit=crop"
                  />
                </div>
              </div>
              
              {/* Tutoriais para iniciantes em slider horizontal */}
              {iniciantes.length > 0 && (
                <div className="px-4 md:px-8 mb-12">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-blue-900 flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-green-500" />
                      Para Iniciantes
                    </h2>
                    <button
                      onClick={() => setActiveTab('iniciantes')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      Ver todos <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                  
                  <Carousel
                    opts={{
                      align: "start",
                      dragFree: true
                    }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-4">
                      {iniciantes.map((tutorial) => (
                        <CarouselItem key={tutorial.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                          <TutorialCard
                            tutorial={tutorial}
                            isPremiumLocked={isPremiumLocked(tutorial.isPremium)}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <div className="hidden md:flex">
                      <CarouselPrevious className="relative -left-4" />
                      <CarouselNext className="relative -right-4" />
                    </div>
                  </Carousel>
                </div>
              )}
              
              {/* Tutoriais intermediários */}
              {intermediarios.length > 0 && (
                <div className="px-4 md:px-8 mb-12">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-blue-900 flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-blue-500" />
                      Nível Intermediário
                    </h2>
                    <button
                      onClick={() => setActiveTab('intermediarios')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      Ver todos <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                  
                  <Carousel
                    opts={{
                      align: "start",
                      dragFree: true
                    }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-4">
                      {intermediarios.map((tutorial) => (
                        <CarouselItem key={tutorial.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                          <TutorialCard
                            tutorial={tutorial}
                            isPremiumLocked={isPremiumLocked(tutorial.isPremium)}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <div className="hidden md:flex">
                      <CarouselPrevious className="relative -left-4" />
                      <CarouselNext className="relative -right-4" />
                    </div>
                  </Carousel>
                </div>
              )}
              
              {/* Tutoriais avançados */}
              {avancados.length > 0 && (
                <div className="px-4 md:px-8 mb-12">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-blue-900 flex items-center">
                      <Award className="h-5 w-5 mr-2 text-purple-500" />
                      Nível Avançado
                    </h2>
                    <button
                      onClick={() => setActiveTab('avancados')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      Ver todos <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                  
                  <Carousel
                    opts={{
                      align: "start",
                      dragFree: true
                    }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-4">
                      {avancados.map((tutorial) => (
                        <CarouselItem key={tutorial.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                          <TutorialCard
                            tutorial={tutorial}
                            isPremiumLocked={isPremiumLocked(tutorial.isPremium)}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <div className="hidden md:flex">
                      <CarouselPrevious className="relative -left-4" />
                      <CarouselNext className="relative -right-4" />
                    </div>
                  </Carousel>
                </div>
              )}
              
              {/* Botão para acessar mais cursos */}
              <div className="flex justify-center mb-20">
                <Link href="/planos">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-800 text-white font-medium">
                    <Crown className="h-5 w-5 mr-2" />
                    Acessar todos os cursos
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}