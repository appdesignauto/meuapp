import React, { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Play, 
  Clock, 
  Crown, 
  Eye, 
  CheckCircle,
  Lock,
  Search,
  Sparkles,
  BookmarkPlus,
  CheckCircle2,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tutorial } from './TutorialData';
import { formatDistanceToNow, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CourseRating from './CourseRating';

// Componente para destacar termos de pesquisa no texto
const HighlightText = ({ text, searchTerm }: { text: string, searchTerm?: string }) => {
  if (!searchTerm || !text) return <>{text}</>;
  
  const termLower = searchTerm.toLowerCase().trim();
  const searchTerms = termLower.split(/\s+/);
  
  // Se não tiver termo de busca, retorna o texto normal
  if (!searchTerms.length) return <>{text}</>;
  
  // Cria um regex que busca qualquer um dos termos, ignorando case
  const regex = new RegExp(`(${searchTerms.join('|')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => {
        // Verifica se a parte atual corresponde a qualquer um dos termos de busca
        const isMatch = searchTerms.some(term => part.toLowerCase().includes(term));
        return isMatch ? 
          <span key={i} className="bg-yellow-200 text-blue-900 font-medium px-0.5 rounded-sm">{part}</span> : 
          <span key={i}>{part}</span>;
      })}
    </>
  );
};

interface TutorialCardProps {
  tutorial?: Tutorial;
  isPremiumLocked?: boolean;
  isWide?: boolean;
  searchTerm?: string;
  // Propriedades individuais (para uso com o histórico de visualização)
  id?: number;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  durationFormatted?: string;
  moduloNome?: string;
  level?: string;
  isWatched?: boolean;
  isPremium?: boolean;
  views?: number;
  showProgressBar?: boolean;
  progress?: number;
}

const TutorialCard: React.FC<TutorialCardProps> = ({
  tutorial,
  isPremiumLocked = false,
  isWide = false,
  searchTerm,
  // Propriedades individuais
  id,
  title,
  description,
  thumbnailUrl,
  durationFormatted,
  moduloNome,
  level,
  isWatched = false,
  isPremium = false,
  views = 0,
  showProgressBar = false,
  progress = 0
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Verificar se o tutorial é novo (menos de 15 dias)
  const isNewTutorial = () => {
    try {
      // Se temos a propriedade individual, use-a
      if (tutorial?.createdAt) {
        const dataAdicionado = parseISO(tutorial.createdAt);
        const quinzeDiasAtras = new Date();
        quinzeDiasAtras.setDate(quinzeDiasAtras.getDate() - 15);
        return isAfter(dataAdicionado, quinzeDiasAtras);
      }
      return false;
    } catch (e) {
      return false;
    }
  };
  
  // Calcular o progresso de visualização do tutorial
  const getProgress = () => {
    // Se fornecido explicitamente com showProgressBar, use o valor passado
    if (showProgressBar && progress !== undefined) {
      return progress;
    }
    
    // Caso contrário, use o valor do tutorial completo, se disponível
    if (tutorial) {
      if (tutorial.isWatched) return 100;
      // Se não tiver progresso explícito, retorna 0 (não mais simulando valores aleatórios)
      return 0;
    }
    
    return 0;
  };
  
  // Determinar o nível do tutorial com cores e textos específicos
  const levelInfo = {
    iniciante: { text: 'Iniciante', color: 'bg-green-500/20 text-green-500' },
    intermediario: { text: 'Intermediário', color: 'bg-blue-500/20 text-blue-500' },
    avancado: { text: 'Avançado', color: 'bg-purple-500/20 text-purple-500' }
  };
  
  // Pegar os valores reais (priorizando propriedades individuais sobre o objeto tutorial)
  const actualId = id ?? tutorial?.id;
  const actualTitle = title ?? tutorial?.title ?? "Sem título";
  const actualDescription = description ?? tutorial?.description ?? "";
  const actualThumbnailUrl = thumbnailUrl ?? tutorial?.thumbnailUrl ?? "";
  const actualDurationFormatted = durationFormatted ?? tutorial?.durationFormatted ?? "00:00";
  const actualLevel = level ?? tutorial?.level ?? "iniciante";
  const actualIsWatched = isWatched || (tutorial?.isWatched ?? false);
  const actualIsPremium = isPremium || (tutorial?.isPremium ?? false);
  const actualViews = views ?? tutorial?.viewCount ?? tutorial?.views ?? 0;

  return (
    <motion.div
      className={`relative rounded-md overflow-hidden ${isWide ? 'h-60' : 'h-[220px]'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        y: -5,
        transition: { duration: 0.2 }
      }}
      style={{
        boxShadow: isHovered 
          ? '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)' 
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      {/* Thumbnail com efeito de zoom */}
      <div className="w-full h-full absolute inset-0 overflow-hidden">
        <motion.img
          src={actualThumbnailUrl}
          alt={actualTitle}
          className="w-full h-full object-cover"
          animate={{ 
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ duration: 0.4 }}
        />
      </div>
      
      {/* Overlay de gradiente */}
      <div className={`absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-neutral-900/70 to-blue-900/30 ${isHovered ? 'opacity-100' : 'opacity-90'}`} />
      
      {/* Badge de duração - estilo aprimorado */}
      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs py-1 px-2 rounded-sm flex items-center shadow-sm z-10">
        <Clock className="h-3 w-3 mr-1" />
        {actualDurationFormatted}
      </div>

      {/* Badge de visualizações - estilo aprimorado */}
      <div className="absolute top-2 left-2 bg-blue-900/70 backdrop-blur-sm text-white text-xs py-1 px-2 rounded-sm flex items-center shadow-sm">
        <Eye className="h-3 w-3 mr-1" />
        {actualViews.toLocaleString()}
      </div>
      
      {/* Badge de módulo - quando fornecido */}
      {moduloNome && (
        <div className="absolute top-12 left-2 bg-blue-600/80 backdrop-blur-sm text-white text-xs py-1 px-2 rounded-sm flex items-center shadow-sm z-10">
          {moduloNome}
        </div>
      )}
      
      {/* Badge NOVO para conteúdos recentes - estilo aprimorado para combinar com os outros badges */}
      {isNewTutorial() && (
        <div className="absolute top-12 right-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs py-1 px-2 rounded-sm flex items-center shadow-sm backdrop-blur-sm z-10">
          <Sparkles className="h-3 w-3 mr-1" />
          NOVO
        </div>
      )}
      
      {/* Barra de progresso para vídeos já iniciados mas não concluídos */}
      {showProgressBar && getProgress() > 0 && !actualIsWatched && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 z-20">
          <div 
            className="h-full bg-blue-500" 
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      )}
      
      {/* Marcador de conclusão */}
      {actualIsWatched && (
        <div className="absolute top-1/2 right-1/2 transform translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-green-500/90 rounded-full p-2 shadow-lg">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
        </div>
      )}
      
      {/* Overlay para conteúdo premium bloqueado */}
      {isPremiumLocked && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <Lock className="h-12 w-12 mb-3 text-amber-400" />
          <p className="text-lg font-semibold mb-1">Conteúdo Premium</p>
          <p className="text-sm text-white/80 mx-4 mb-3 text-center">
            Assine o plano premium para acessar este tutorial
          </p>
          <Link href="/planos">
            <Button variant="secondary" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0">
              <Crown className="h-4 w-4 mr-2" />
              Ver Planos
            </Button>
          </Link>
        </div>
      )}
      
      {/* Conteúdo do card */}
      <div className="absolute bottom-0 w-full p-3">
        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {actualIsPremium && (
            <Badge variant="outline" className="bg-gradient-to-r from-amber-500/90 to-amber-600/90 border-amber-500/30 text-white px-2 py-0.5 text-xs font-medium">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
          
          <Badge 
            variant="outline" 
            className={`${levelInfo[actualLevel].color} border-0 px-2 py-0.5 text-xs font-medium`}
          >
            {levelInfo[actualLevel].text}
          </Badge>

          {actualIsWatched && (
            <Badge variant="outline" className="bg-green-500/20 text-green-500 border-0 px-2 py-0.5 text-xs font-medium">
              <CheckCircle className="h-3 w-3 mr-1" />
              Assistido
            </Badge>
          )}
        </div>
        
        {/* Título com destaque de pesquisa e avaliação */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="text-white font-bold text-base line-clamp-1">
            {searchTerm ? (
              <HighlightText text={actualTitle} searchTerm={searchTerm} />
            ) : (
              actualTitle
            )}
          </h3>
          {/* Adicionando a avaliação ao lado do título com CourseRating */}
          {actualId && (
            <CourseRating 
              lessonId={actualId} 
              showCount={false}
              interactive={false}
              size="sm"
              className="text-yellow-300"
            />
          )}
        </div>
        
        {/* Detalhes quando hover */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {/* Módulo quando fornecido - exibido apenas em hover */}
            {moduloNome && (
              <div className="mb-2">
                <Badge variant="outline" className="bg-blue-500/20 text-blue-500 border-0 px-2 py-0.5 text-xs font-medium">
                  {moduloNome}
                </Badge>
              </div>
            )}
            
            <p className="text-white/80 text-xs mb-4 line-clamp-2">
              {searchTerm && actualDescription ? (
                <HighlightText text={actualDescription} searchTerm={searchTerm} />
              ) : (
                actualDescription
              )}
            </p>
            
            {/* Área de botões com duas colunas */}
            {!isPremiumLocked && (
              <div className="flex gap-2">
                {/* Botão principal de assistir */}
                <Link href={`/videoaulas/${actualId}`} className="flex-grow">
                  <Button 
                    className="w-full h-8 text-xs flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {actualIsWatched
                      ? <>Assistir novamente <Play className="h-3.5 w-3.5" /></>
                      : <>Assistir tutorial <Play className="h-3.5 w-3.5" /></>
                    }
                  </Button>
                </Link>
                
                {/* Botão para salvar/favoritar */}
                <Button 
                  variant="outline"
                  className={`h-8 w-8 flex items-center justify-center shrink-0 ${
                    isSaved 
                      ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' 
                      : 'bg-transparent text-white/70 border-white/30 hover:text-white hover:border-white'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsSaved(!isSaved);
                  }}
                >
                  <BookmarkPlus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
      
      {/* Botão play no centro quando hover */}
      {isHovered && !isPremiumLocked && (
        <Link href={`/videoaulas/${actualId}`}>
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="rounded-full bg-white/20 backdrop-blur-sm p-3">
              <Play className="h-10 w-10 text-white" />
            </div>
          </motion.div>
        </Link>
      )}
    </motion.div>
  );
};

export default TutorialCard;