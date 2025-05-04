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
        {/* Seção Hero ultra-minimalista */}
        <div className="w-full bg-transparent">
          <div className="container mx-auto px-4 py-6 relative z-10">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Título e pesquisa */}
              <div className="w-full md:flex-1">
                <h1 className="text-2xl text-white font-medium">
                  <span className="text-blue-300">Vídeo</span>aulas
                </h1>
              </div>
              
              {/* Video em destaque */}
              <div className="w-full md:w-auto flex-grow">
                <Link href={`/videoaulas/${tutorialDestaque.id}`}>
                  <div className="relative group rounded-lg overflow-hidden flex">
                    {/* Imagem com hover */}
                    <div className="w-24 h-16 md:w-32 md:h-20 relative flex-shrink-0">
                      <img 
                        src={tutorialDestaque.thumbnailUrl} 
                        alt={tutorialDestaque.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-blue-600/90 rounded-full p-1 scale-75 group-hover:scale-100 transition-transform">
                          <Play className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Informações */}
                    <div className="p-2 bg-blue-950/40 flex-grow flex flex-col justify-center">
                      <div className="flex items-center space-x-2 mb-0.5">
                        <Badge className="bg-blue-600/80 text-white border-0 py-0 px-1.5 text-[10px]">
                          Destaque
                        </Badge>
                        <span className="text-blue-200 text-xs flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {tutorialDestaque.duration}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-white line-clamp-1">{tutorialDestaque.title}</h3>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Barra de pesquisa minimalista e filtros */}
          <div className="mb-6 sticky top-16 z-20">
            <div className="flex flex-col md:flex-row items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-blue-950/80 to-neutral-950/80 backdrop-blur-sm border-b border-blue-900/20">
              {/* Barra de busca simplificada */}
              <div className="relative w-full md:w-auto md:min-w-[240px] flex-grow-0">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-400" size={16} />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar tutoriais..."
                  className="pl-8 py-1.5 h-9 bg-blue-900/20 border-0 text-white focus:ring-1 focus:ring-blue-500/40 placeholder:text-blue-300/50 text-sm rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-100 transition-colors"
                    onClick={() => setSearchTerm('')}
                  >
                    ×
                  </button>
                )}
              </div>
              
              {/* Filtros em formato de pills */}
              <div className="flex flex-wrap gap-1.5 mt-2 md:mt-0 w-full md:w-auto">
                <button 
                  onClick={() => setActiveTab('todos')}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    activeTab === 'todos' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-900/20 text-blue-200 hover:bg-blue-800/40'
                  }`}
                >
                  Todos
                </button>
                <button 
                  onClick={() => setActiveTab('iniciantes')}
                  className={`text-xs px-3 py-1 rounded-full flex items-center transition-colors ${
                    activeTab === 'iniciantes' 
                      ? 'bg-green-600/90 text-white' 
                      : 'bg-green-900/20 text-green-200 hover:bg-green-800/30'
                  }`}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Iniciantes
                </button>
                <button 
                  onClick={() => setActiveTab('intermediarios')}
                  className={`text-xs px-3 py-1 rounded-full flex items-center transition-colors ${
                    activeTab === 'intermediarios' 
                      ? 'bg-blue-600/90 text-white' 
                      : 'bg-blue-900/20 text-blue-200 hover:bg-blue-800/30'
                  }`}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Intermediários
                </button>
                <button 
                  onClick={() => setActiveTab('avancados')}
                  className={`text-xs px-3 py-1 rounded-full flex items-center transition-colors ${
                    activeTab === 'avancados' 
                      ? 'bg-purple-600/90 text-white' 
                      : 'bg-purple-900/20 text-purple-200 hover:bg-purple-800/30'
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
                        ? 'bg-teal-600/90 text-white' 
                        : 'bg-teal-900/20 text-teal-200 hover:bg-teal-800/30'
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
          </div>
        </div>
      </div>
    </>
  );
}