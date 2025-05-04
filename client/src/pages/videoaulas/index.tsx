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
      
      <div className="bg-gradient-to-b from-blue-950 to-neutral-950 min-h-screen">
        {/* Seção Hero com visual clean em tons de branco */}
        <div className="relative w-full bg-white/5">
          {/* Fundo com gradiente sutíl */}
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-50/5 to-white/5 opacity-20" />
          
          {/* Conteúdo sobreposto */}
          <div className="container mx-auto px-4 py-12 md:py-16 relative z-10 flex flex-col md:flex-row items-center">
            <div className="w-full md:w-3/5 text-white mb-8 md:mb-0 md:pr-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Videoaulas do DesignAuto
              </h1>
              <p className="text-lg text-gray-100 mb-6">
                Aprenda a criar designs profissionais para seu negócio automotivo com tutoriais práticos.
              </p>
              
              <div className="flex gap-3">
                <Link href={`/videoaulas/${tutorialDestaque.id}`}>
                  <Button className="bg-white hover:bg-gray-100 text-blue-900 hover:text-blue-950 border border-white/20">
                    <Play className="h-4 w-4 mr-2" />
                    Tutorial em destaque
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="w-full md:w-2/5 flex justify-center md:justify-end">
              <div className="relative w-full max-w-md">
                {/* Card do tutorial em destaque */}
                <div className="rounded-xl overflow-hidden shadow-lg border border-white/10 hover:shadow-white/10 hover:border-white/20 transition-all duration-300 bg-white/5">
                  <div className="relative group">
                    <img 
                      src={tutorialDestaque.thumbnailUrl} 
                      alt={tutorialDestaque.title} 
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Badge de destaque no canto superior */}
                    <div className="absolute top-3 left-3 bg-white text-blue-900 text-xs font-medium px-2 py-1 rounded-md flex items-center">
                      <Star className="h-3 w-3 mr-1 fill-blue-900" />
                      Em Destaque
                    </div>
                    
                    {/* Duração no canto */}
                    <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {tutorialDestaque.duration}
                    </div>
                    
                    {/* Play button on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white rounded-full p-4">
                        <Play className="h-8 w-8 text-blue-900" />
                      </div>
                    </div>
                    
                    {/* Gradiente na parte inferior */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black to-transparent"></div>
                  </div>
                  
                  <div className="bg-white/10 p-4">
                    <h3 className="text-lg font-bold text-white mb-2">{tutorialDestaque.title}</h3>
                    <p className="text-gray-200 text-sm mb-3 line-clamp-2">{tutorialDestaque.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <Badge className="bg-white/20 text-white border-0">
                        {tutorialDestaque.level === "iniciante" ? "Iniciante" : 
                         tutorialDestaque.level === "intermediario" ? "Intermediário" : "Avançado"}
                      </Badge>
                      
                      <div className="flex items-center text-gray-300 text-xs">
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        {tutorialDestaque.views.toLocaleString()} visualizações
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Barra de pesquisa clean com filtros em formato de pills */}
          <div className="mb-6 sticky top-16 z-20">
            <div className="flex flex-col md:flex-row items-center gap-3 p-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
              {/* Barra de busca estilo clean */}
              <div className="relative w-full md:w-auto md:min-w-[240px] flex-grow-0">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/60" size={16} />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar tutoriais..."
                  className="pl-8 py-1.5 h-9 bg-white/5 border-white/10 text-white focus:ring-1 focus:ring-white/30 placeholder:text-white/40 text-sm rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                    onClick={() => setSearchTerm('')}
                  >
                    ×
                  </button>
                )}
              </div>
              
              {/* Filtros em formato de pills com tons de branco */}
              <div className="flex flex-wrap gap-1.5 mt-2 md:mt-0 w-full md:w-auto">
                <button 
                  onClick={() => setActiveTab('todos')}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    activeTab === 'todos' 
                      ? 'bg-white text-blue-950 font-medium' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Todos
                </button>
                <button 
                  onClick={() => setActiveTab('iniciantes')}
                  className={`text-xs px-3 py-1 rounded-full flex items-center transition-colors ${
                    activeTab === 'iniciantes' 
                      ? 'bg-white text-green-900 font-medium' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Iniciantes
                </button>
                <button 
                  onClick={() => setActiveTab('intermediarios')}
                  className={`text-xs px-3 py-1 rounded-full flex items-center transition-colors ${
                    activeTab === 'intermediarios' 
                      ? 'bg-white text-blue-900 font-medium' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Intermediários
                </button>
                <button 
                  onClick={() => setActiveTab('avancados')}
                  className={`text-xs px-3 py-1 rounded-full flex items-center transition-colors ${
                    activeTab === 'avancados' 
                      ? 'bg-white text-purple-900 font-medium' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Award className="h-3 w-3 mr-1" />
                  Avançados
                </button>
                {user && (
                  <button 
                    onClick={() => setActiveTab('vistos')}
                    className={`text-xs px-3 py-1 rounded-full flex items-center transition-colors ${
                      activeTab === 'vistos' 
                        ? 'bg-white text-teal-900 font-medium' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Vistos
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Conteúdo principal baseado na filtragem */}
          <div className="mt-6">
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
                    <Star className="mr-2 h-5 w-5 text-white fill-white/80" />
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
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-white mt-12">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="mb-6 md:mb-0 md:mr-8">
                      <h2 className="text-2xl font-bold mb-3">Precisa de ajuda adicional?</h2>
                      <p className="text-gray-200 mb-4">
                        Entre em contato com nosso suporte técnico caso tenha alguma dificuldade que não tenha sido abordada nos vídeos.
                      </p>
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 mr-2 text-white/70" />
                          <span>Suporte rápido e atencioso</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 mr-2 text-white/70" />
                          <span>Assistência por e-mail ou WhatsApp</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 mr-2 text-white/70" />
                          <span>Atendimento personalizado</span>
                        </li>
                      </ul>
                    </div>
                    <div className="flex-shrink-0">
                      <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100">
                        <span className="mr-2">💬</span>
                        Falar com o Suporte
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}