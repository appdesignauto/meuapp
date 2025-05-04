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
        {/* Seção Hero estilo MBA com imagem de fundo/shark */}
        <div className="relative w-full h-[450px] overflow-hidden">
          {/* Fundo com imagem ou gradiente */}
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800">
            <div className="absolute inset-0 opacity-20 bg-[url('/images/backgrounds/auto-pattern.png')] bg-center"></div>
          </div>
          
          {/* Overlay gradiente para melhorar contraste */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/70 to-transparent z-1"></div>
          
          {/* Conteúdo sobreposto */}
          <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                DesignAuto Videoaulas
              </h1>
              <div className="h-1 w-24 bg-yellow-500 mb-6"></div>
              <p className="text-xl text-gray-100 mb-8 max-w-2xl">
                A formação completa para você criar designs profissionais para seu negócio automotivo
              </p>
              
              <div className="flex gap-4">
                <Link href={`/videoaulas/${tutorialDestaque.id}`}>
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-blue-950 border-0 py-6 px-8 text-lg font-medium">
                    <Play className="h-5 w-5 mr-2" />
                    Começar Agora
                  </Button>
                </Link>
                <Link href="#categorias">
                  <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 py-6 px-8 text-lg font-medium">
                    Ver Categorias
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Imagem/Logo flutuante à direita (semelhante ao MBA Shark na imagem de referência) */}
          <div className="absolute right-0 bottom-0 md:right-10 md:top-1/2 md:transform md:-translate-y-1/2 z-10 hidden md:block">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20">
              <img 
                src={tutorialDestaque.thumbnailUrl} 
                alt="DesignAuto Academy" 
                className="w-full max-w-[220px] h-auto rounded shadow-2xl"
              />
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
                {/* Lista de reprodução estilo Shark Tank */}
                <div className="mb-12" id="categorias">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    Lista de Reprodução
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {tutoriaisPopulares.slice(0, 8).map((tutorial, index) => (
                      <Link key={tutorial.id} href={`/videoaulas/${tutorial.id}`}>
                        <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-lg overflow-hidden shadow-lg border border-blue-800/30 hover:border-blue-700/50 transition-all group">
                          <div className="relative">
                            {/* Numeração de módulo estilo Shark Tank */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end z-10">
                              <div className="text-3xl font-black text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)] flex items-center">
                                <span className="text-yellow-500">Módulo</span>
                                <span className="ml-2 text-4xl text-white">{index}</span>
                              </div>
                              <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
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
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/40 to-transparent"></div>
                          </div>
                          
                          <div className="p-4">
                            <h3 className="font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">
                              {tutorial.title}
                            </h3>
                            <p className="text-blue-200 text-sm line-clamp-2 mb-3">
                              {tutorial.description || "Aprenda técnicas avançadas de design automotivo neste tutorial completo."}
                            </p>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-yellow-500 font-medium">
                                {tutorial.level === "iniciante" ? "INICIE AQUI" : 
                                 tutorial.level === "intermediario" ? "DESENVOLVIMENTO" : "AVANÇADO"}
                              </span>
                              <div className="text-xs text-blue-300 flex items-center">
                                <Eye className="h-3.5 w-3.5 mr-1 text-blue-300/80" />
                                {tutorial.views.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              
                {/* Modulos organizados por categorias estilo Shark Tank */}
                {tutoriaisPorCategoria.map((categoria, idx) => (
                  <div key={categoria.id} className="mb-16 relative">
                    <div className="flex items-center mb-6">
                      <div className="bg-blue-800/30 h-10 w-10 rounded-lg flex items-center justify-center mr-3">
                        {categoria.icon}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{categoria.title}</h2>
                        <p className="text-blue-200 text-sm">{categoria.subtitle}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {categoria.modules.map((tutorial, moduleIdx) => (
                        <Link key={tutorial.id} href={`/videoaulas/${tutorial.id}`}>
                          <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg overflow-hidden shadow-lg border border-blue-800/30 hover:border-blue-700/50 transition-all group">
                            <div className="relative">
                              {/* Numeração de módulo estilo Shark Tank */}
                              <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end z-10">
                                <div className="text-3xl font-black text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)] flex items-center">
                                  <span className="text-yellow-500">Módulo</span>
                                  <span className="ml-2 text-4xl text-white">{idx + moduleIdx + 1}</span>
                                </div>
                                <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
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
                              <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/40 to-transparent"></div>
                            </div>
                            
                            <div className="p-4">
                              <h3 className="font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">
                                {tutorial.title}
                              </h3>
                              <p className="text-blue-200 text-sm line-clamp-2 mb-3">
                                {tutorial.description || `${categoria.title}: Aprenda técnicas avançadas neste módulo.`}
                              </p>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-yellow-500 font-medium uppercase">
                                  {tutorial.level === "iniciante" ? "Base" : 
                                   tutorial.level === "intermediario" ? "Desenvolvimento" : "Avançado"}
                                </span>
                                <div className="text-xs text-blue-300 flex items-center">
                                  <Eye className="h-3.5 w-3.5 mr-1 text-blue-300/80" />
                                  {tutorial.views.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
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