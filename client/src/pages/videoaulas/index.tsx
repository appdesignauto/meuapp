import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
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
  ChevronLeft
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
  tutoriais,
  tutoriaisPorCategoria,
  tutoriaisRecentes,
  tutoriaisPopulares,
  tutorialDestaque,
  iniciantes,
  intermediarios,
  avancados,
  Tutorial
} from '@/components/videoaulas/TutorialData';

export default function VideoaulasPage() {
  const { user } = useAuth();
  const isPremiumUser = user && (user.nivelacesso === 'premium' || user.nivelacesso === 'admin');
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Função para verificar se o conteúdo premium deve ser bloqueado
  const isPremiumLocked = (isPremium: boolean) => {
    if (!isPremium) return false;
    return !isPremiumUser;
  };
  
  // Filtrar tutoriais com base na busca
  const filteredTutoriais = searchTerm 
    ? tutoriais.filter(tutorial => 
        tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutorial.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutorial.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
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
        return tutoriais.filter(t => t.isWatched);
      default:
        return tutoriais;
    }
  };

  return (
    <>
      <Helmet>
        <title>Videoaulas | DesignAuto</title>
      </Helmet>
      
      <div className="bg-white min-h-screen">
        {/* Seção Hero estilo MBA com imagem de fundo/shark em tons claros */}
        <div className="relative w-full h-[450px] overflow-hidden">
          {/* Fundo sólido com carro sutil */}
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-blue-50 to-white">
            {/* Imagem de carro sutil no fundo */}
            <div 
              className="absolute inset-0 opacity-10 bg-right-bottom bg-no-repeat"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1617651823081-270acchia626?q=80&w=1970&auto=format&fit=crop')",
                backgroundSize: '60%',
                backgroundPosition: 'right bottom'
              }}
            ></div>
          </div>
          
          {/* Overlay gradiente para melhorar contraste */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-blue-50/30 to-transparent z-1"></div>
          
          {/* Conteúdo sobreposto */}
          <div className="container mx-auto h-full flex flex-col justify-center relative z-10">
            <div className="px-4 md:px-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 text-blue-800">
                DesignAuto Videoaulas
              </h1>
              <div className="h-1 w-16 md:w-24 bg-yellow-500 mb-4 md:mb-6"></div>
              <p className="text-base sm:text-lg md:text-xl text-blue-700 mb-6 md:mb-8 max-w-2xl">
                A formação completa para você criar designs profissionais para seu negócio automotivo
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href={`/videoaulas/${tutorialDestaque.id}`} className="w-full sm:w-auto">
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-blue-950 border-0 py-4 md:py-6 px-5 md:px-8 text-base md:text-lg font-medium w-full sm:w-auto">
                    <Play className="h-4 md:h-5 w-4 md:w-5 mr-2" />
                    Começar Agora
                  </Button>
                </Link>
                <Link href="#categorias" className="w-full sm:w-auto">
                  <Button variant="outline" className="bg-transparent border-blue-700 text-blue-700 hover:bg-blue-50 py-4 md:py-6 px-5 md:px-8 text-base md:text-lg font-medium w-full sm:w-auto">
                    Ver Categorias
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto py-8">
          {/* Barra de pesquisa clean com filtros em formato de pills */}
          <div className="px-4 md:px-8">
            <div className="mb-6 sticky top-16 z-20">
              <div className="flex flex-col md:flex-row items-center gap-3 p-3 rounded-lg bg-white shadow-sm border border-gray-100">
                {/* Barra de busca estilo clean */}
                <div className="relative w-full md:w-auto md:min-w-[240px] flex-grow-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" size={16} />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar tutoriais..."
                    className="pl-9 py-1.5 h-10 bg-white border-gray-200 text-blue-900 focus:ring-1 focus:ring-blue-300 focus:border-blue-300 placeholder:text-blue-300 text-sm rounded-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-600 transition-colors"
                      onClick={() => setSearchTerm('')}
                    >
                      ×
                    </button>
                  )}
                </div>
                
                {/* Filtros em formato de pills com tons claros de azul */}
                <div className="flex flex-wrap gap-1.5 mt-2 md:mt-0 w-full md:w-auto">
                  <button 
                    onClick={() => setActiveTab('todos')}
                    className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                      activeTab === 'todos' 
                        ? 'bg-blue-600 text-white font-medium' 
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setActiveTab('iniciantes')}
                    className={`text-xs px-3 py-1.5 rounded-full flex items-center transition-colors ${
                      activeTab === 'iniciantes' 
                        ? 'bg-green-600 text-white font-medium' 
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Iniciantes
                  </button>
                  <button 
                    onClick={() => setActiveTab('intermediarios')}
                    className={`text-xs px-3 py-1.5 rounded-full flex items-center transition-colors ${
                      activeTab === 'intermediarios' 
                        ? 'bg-blue-600 text-white font-medium' 
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Intermediários
                  </button>
                  <button 
                    onClick={() => setActiveTab('avancados')}
                    className={`text-xs px-3 py-1.5 rounded-full flex items-center transition-colors ${
                      activeTab === 'avancados' 
                        ? 'bg-purple-600 text-white font-medium' 
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    <Award className="h-3 w-3 mr-1" />
                    Avançados
                  </button>
                  {user && (
                    <button 
                      onClick={() => setActiveTab('vistos')}
                      className={`text-xs px-3 py-1.5 rounded-full flex items-center transition-colors ${
                        activeTab === 'vistos' 
                          ? 'bg-teal-600 text-white font-medium' 
                          : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                      }`}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Vistos
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
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Visualização estilo Netflix quando não está pesquisando */}
            {!searchTerm && (
              <>
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
                      containScroll: "keepSnaps",
                      dragFree: true
                    }}
                    className="w-full overflow-visible relative"
                  >
                    <CarouselContent className="-ml-3 sm:-ml-4">
                      {tutoriaisPopulares.slice(0, 8).map((tutorial, index) => (
                        <CarouselItem key={tutorial.id} className="pl-3 sm:pl-4 basis-3/4 sm:basis-2/5 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                          <Link href={`/videoaulas/${tutorial.id}`} className="block h-full">
                            <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all group">
                              <div className="relative">
                                {/* Numeração de módulo estilo Shark Tank */}
                                <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end z-10">
                                  <div className="text-3xl font-black text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)] flex items-center">
                                    <span className="text-yellow-500">Módulo</span>
                                    <span className="ml-2 text-4xl text-white">{index + 1}</span>
                                  </div>
                                  <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-sm">
                                    {tutorial.duration}
                                  </div>
                                </div>
                                
                                {/* Imagem do tutorial */}
                                <img 
                                  src={tutorial.thumbnailUrl} 
                                  alt={tutorial.title} 
                                  className="w-full aspect-[3/2] object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                />
                                
                                {/* Overlay gradiente */}
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-blue-900/40 to-transparent"></div>
                              </div>
                              
                              <div className="p-4">
                                <h3 className="font-bold text-blue-800 mb-1 group-hover:text-blue-600 transition-colors">
                                  {tutorial.title}
                                </h3>
                                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                                  {tutorial.description || "Aprenda técnicas avançadas de design automotivo neste tutorial completo."}
                                </p>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-yellow-600 font-medium">
                                    {tutorial.level === "iniciante" ? "INICIE AQUI" : 
                                     tutorial.level === "intermediario" ? "DESENVOLVIMENTO" : "AVANÇADO"}
                                  </span>
                                  <div className="text-xs text-gray-500 flex items-center">
                                    <Eye className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                    {tutorial.views.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {/* Indicador minimalista de navegação */}
                    <div className="absolute right-2 bottom-2 flex items-center z-10">
                      <div className="flex items-center gap-1 mt-3">
                        {Array.from({ length: Math.min(5, tutoriaisPopulares.length) }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-1.5 rounded-full transition-all duration-300 
                              ${i === 0 ? 'w-5 bg-blue-600' : 'w-1.5 bg-blue-300'}`}
                          />
                        ))}
                      </div>
                      <div className="ml-3">
                        <div className="rounded-full bg-blue-100 p-1.5 text-blue-600 hover:bg-blue-200 transition-colors cursor-pointer">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  </Carousel>
                </div>
              
                {/* Modulos organizados por categorias estilo Shark Tank */}
                {tutoriaisPorCategoria.map((categoria, idx) => (
                  <div key={categoria.id} className="mb-10 sm:mb-16 relative">
                    <div className="flex items-center mb-4 sm:mb-6">
                      <div className="bg-blue-100 h-8 sm:h-10 w-8 sm:w-10 rounded-lg flex items-center justify-center mr-2 sm:mr-3 text-blue-600">
                        {categoria.icon}
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-blue-800">{categoria.title}</h2>
                        <p className="text-blue-600 text-xs sm:text-sm">{categoria.subtitle}</p>
                      </div>
                    </div>
                    
                    <Carousel
                      opts={{
                        align: "start",
                        loop: false,
                        skipSnaps: false,
                        containScroll: "keepSnaps",
                        dragFree: true
                      }}
                      className="w-full overflow-visible"
                    >
                      <CarouselContent className="-ml-3 sm:-ml-4">
                        {categoria.modules.map((tutorial, moduleIdx) => (
                          <CarouselItem key={tutorial.id} className="pl-3 sm:pl-4 basis-3/4 sm:basis-2/5 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                            <Link href={`/videoaulas/${tutorial.id}`} className="block h-full">
                              <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all group">
                                <div className="relative">
                                  {/* Numeração de módulo estilo Shark Tank */}
                                  <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end z-10">
                                    <div className="text-3xl font-black text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)] flex items-center">
                                      <span className="text-yellow-500">Parte</span>
                                      <span className="ml-2 text-4xl text-white">{moduleIdx + 1}</span>
                                    </div>
                                    <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-sm">
                                      {tutorial.duration}
                                    </div>
                                  </div>
                                  
                                  {/* Imagem do tutorial */}
                                  <img 
                                    src={tutorial.thumbnailUrl} 
                                    alt={tutorial.title} 
                                    className="w-full aspect-[3/2] object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                  />
                                  
                                  {/* Overlay gradiente */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-blue-900/40 to-transparent"></div>
                                  
                                  {/* Indicador Premium */}
                                  {tutorial.isPremium && (
                                    <div className="absolute top-3 right-3 bg-yellow-500 text-blue-900 text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-md">
                                      <Crown className="h-3 w-3 mr-1" />
                                      PREMIUM
                                    </div>
                                  )}
                                </div>
                                
                                <div className="p-4">
                                  <h3 className="font-bold text-blue-800 mb-1 group-hover:text-blue-600 transition-colors">
                                    {tutorial.title}
                                  </h3>
                                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                                    {tutorial.description || "Aprenda técnicas avançadas de design automotivo neste tutorial completo."}
                                  </p>
                                  
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-blue-600 font-medium">
                                      {tutorial.level === "iniciante" ? "INICIANTE" : 
                                      tutorial.level === "intermediario" ? "INTERMEDIÁRIO" : "AVANÇADO"}
                                    </span>
                                    <div className="text-xs text-gray-500 flex items-center">
                                      <Eye className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                      {tutorial.views.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {/* Indicador minimalista de navegação */}
                      <div className="absolute right-2 bottom-2 flex items-center z-10">
                        <div className="flex items-center gap-1 mt-3">
                          {Array.from({ length: Math.min(5, categoria.modules.length) }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`h-1.5 rounded-full transition-all duration-300 
                                ${i === 0 ? 'w-5 bg-blue-600' : 'w-1.5 bg-blue-300'}`}
                            />
                          ))}
                        </div>
                        <div className="ml-3">
                          <div className="rounded-full bg-blue-100 p-1.5 text-blue-600 hover:bg-blue-200 transition-colors cursor-pointer">
                            <ChevronRight size={16} />
                          </div>
                        </div>
                      </div>
                    </Carousel>
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
      </div>
    </>
  );
}