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
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      
      <div className="bg-gradient-to-b from-blue-950 to-neutral-950">
        {/* Seção Hero com destaque */}
        <div className="relative w-full bg-black">
          {/* Imagem de fundo com overlay */}
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full">
              <img 
                src={tutorialDestaque.thumbnailUrl}
                alt="Tutorial em destaque" 
                className="w-full h-[500px] object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 to-black/50" />
            </div>
          </div>
          
          {/* Conteúdo sobreposto */}
          <div className="container mx-auto px-4 py-16 md:py-20 lg:py-24 relative z-10 flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 text-white mb-8 md:mb-0 md:pr-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Aprenda a usar o DesignAuto com tutoriais passo a passo
              </h1>
              <p className="text-lg md:text-xl text-blue-200 mb-6">
                Domine todas as funcionalidades da plataforma e crie designs profissionais para o seu negócio automotivo, mesmo sem experiência prévia em design.
              </p>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <Badge variant="outline" className="bg-blue-700/30 text-blue-200 border-blue-500/30 py-1 px-2">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Tutoriais rápidos
                </Badge>
                <Badge variant="outline" className="bg-green-700/30 text-green-200 border-green-500/30 py-1 px-2">
                  <GraduationCap className="h-3.5 w-3.5 mr-1" />
                  Passo a passo
                </Badge>
                <Badge variant="outline" className="bg-purple-700/30 text-purple-200 border-purple-500/30 py-1 px-2">
                  <Smartphone className="h-3.5 w-3.5 mr-1" />
                  Acesso Mobile
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Link href={`/videoaulas/${tutorialDestaque.id}`}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Play className="h-4 w-4 mr-2" />
                    Assistir tutorial
                  </Button>
                </Link>
                <Button variant="outline" className="border-blue-600 text-blue-200 hover:bg-blue-900/50">
                  <Info className="h-4 w-4 mr-2" />
                  Como funciona
                </Button>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 flex justify-center md:justify-end">
              <div className="relative w-full max-w-md">
                {/* Card do tutorial em destaque */}
                <div className="rounded-lg overflow-hidden shadow-2xl border border-blue-900/30 transform transition-transform hover:scale-[1.01]">
                  <div className="relative">
                    <img 
                      src={tutorialDestaque.thumbnailUrl} 
                      alt={tutorialDestaque.title} 
                      className="w-full aspect-video object-cover"
                    />
                    
                    {/* Badge de destaque no canto superior */}
                    <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center">
                      <Star className="h-3 w-3 mr-1 fill-white" />
                      Tutorial em Destaque
                    </div>
                    
                    {/* Duração no canto */}
                    <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {tutorialDestaque.duration}
                    </div>
                    
                    {/* Gradiente na parte inferior */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black to-transparent"></div>
                  </div>
                  
                  <div className="bg-blue-950 p-4">
                    <h3 className="text-lg font-bold text-white mb-2">{tutorialDestaque.title}</h3>
                    <p className="text-blue-200 text-sm mb-4 line-clamp-2">{tutorialDestaque.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <Badge className="bg-blue-700/50 text-white border-0">
                        {tutorialDestaque.level === "iniciante" ? "Iniciante" : 
                         tutorialDestaque.level === "intermediario" ? "Intermediário" : "Avançado"}
                      </Badge>
                      
                      <div className="flex items-center text-blue-300 text-xs">
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        {tutorialDestaque.views.toLocaleString()} visualizações
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Sombra decorativa */}
                <div className="absolute -bottom-4 -right-4 -left-4 h-1/2 bg-blue-600/10 blur-xl rounded-full -z-10"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Barra de pesquisa e filtros */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Tutoriais e Videoaulas</h2>
              <p className="text-blue-200/80">Aprenda a utilizar todas as funcionalidades da plataforma DesignAuto</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-56">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" size={16} />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar tutoriais..."
                  className="pl-9 bg-blue-950/50 border-blue-900/50 text-white placeholder:text-blue-300/60 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-200"
                    onClick={() => setSearchTerm('')}
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Menu de categorias (tabs) */}
          <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="mb-5 bg-transparent flex gap-1">
              <TabsTrigger 
                value="todos" 
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=inactive]:bg-blue-950/60 data-[state=inactive]:text-blue-200 data-[state=inactive]:hover:bg-blue-900/80"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Todos
              </TabsTrigger>
              <TabsTrigger 
                value="iniciantes" 
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=inactive]:bg-blue-950/60 data-[state=inactive]:text-blue-200 data-[state=inactive]:hover:bg-blue-900/80"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciantes
              </TabsTrigger>
              <TabsTrigger 
                value="intermediarios" 
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=inactive]:bg-blue-950/60 data-[state=inactive]:text-blue-200 data-[state=inactive]:hover:bg-blue-900/80"
              >
                <Zap className="h-4 w-4 mr-2" />
                Intermediários
              </TabsTrigger>
              <TabsTrigger 
                value="avancados" 
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=inactive]:bg-blue-950/60 data-[state=inactive]:text-blue-200 data-[state=inactive]:hover:bg-blue-900/80"
              >
                <Award className="h-4 w-4 mr-2" />
                Avançados
              </TabsTrigger>
              {user && (
                <TabsTrigger 
                  value="vistos" 
                  className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=inactive]:bg-blue-950/60 data-[state=inactive]:text-blue-200 data-[state=inactive]:hover:bg-blue-900/80"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Já Vistos
                </TabsTrigger>
              )}
            </TabsList>
        
            <TabsContent value={activeTab} className="mt-0">
              {/* Resultados de pesquisa */}
              {searchTerm && (
                <div className="mb-10">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Search className="mr-2 h-5 w-5 text-blue-400" />
                    Resultados para: "{searchTerm}"
                  </h3>
                  
                  {filteredTutoriais.length === 0 ? (
                    <div className="bg-blue-950/50 border border-blue-900/50 text-blue-200 p-4 rounded-lg flex items-start mb-8">
                      <Info className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium">Nenhum tutorial encontrado</h3>
                        <p className="text-sm text-blue-300/80">
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
                  <div className="mb-12">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                      <Star className="mr-2 h-5 w-5 text-yellow-400 fill-yellow-400" />
                      Tutoriais Recomendados
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {tutoriaisPopulares.slice(0, 4).map(tutorial => (
                        <TutorialCard
                          key={tutorial.id}
                          tutorial={tutorial}
                          isPremiumLocked={isPremiumLocked(tutorial.isPremium)}
                        />
                      ))}
                    </div>
                  </div>
                
                  {/* Conteúdo principal organizado por categorias */}
                  {tutoriaisPorCategoria.map((categoria) => (
                    <TutorialCategory
                      key={categoria.id}
                      title={categoria.title}
                      subtitle={categoria.subtitle}
                      icon={categoria.icon}
                      tutorials={categoria.modules}
                      isPremiumUser={!!isPremiumUser}
                      slidesPerView={4}
                    />
                  ))}
                  
                  {/* Seção "Precisa de ajuda?" */}
                  <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl p-8 text-white mt-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="mb-6 md:mb-0 md:mr-8">
                        <h2 className="text-2xl font-bold mb-3">Precisa de ajuda adicional?</h2>
                        <p className="text-blue-100 mb-4">
                          Entre em contato com nosso suporte técnico caso tenha alguma dificuldade que não tenha sido abordada nos vídeos.
                        </p>
                        <ul className="space-y-2 mb-6">
                          <li className="flex items-center">
                            <CheckCircle className="h-5 w-5 mr-2 text-blue-200" />
                            <span>Suporte rápido e atencioso</span>
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-5 w-5 mr-2 text-blue-200" />
                            <span>Assistência por e-mail ou WhatsApp</span>
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-5 w-5 mr-2 text-blue-200" />
                            <span>Atendimento personalizado</span>
                          </li>
                        </ul>
                      </div>
                      <div className="flex-shrink-0">
                        <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50">
                          <span className="mr-2">💬</span>
                          Falar com o Suporte
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}