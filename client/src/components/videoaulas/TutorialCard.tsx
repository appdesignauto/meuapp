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
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tutorial } from './TutorialData';

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
  tutorial: Tutorial;
  isPremiumLocked: boolean;
  isWide?: boolean;
  searchTerm?: string;
}

const TutorialCard: React.FC<TutorialCardProps> = ({
  tutorial,
  isPremiumLocked,
  isWide = false,
  searchTerm
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determinar o nível do tutorial com cores e textos específicos
  const levelInfo = {
    iniciante: { text: 'Iniciante', color: 'bg-green-500/20 text-green-500' },
    intermediario: { text: 'Intermediário', color: 'bg-blue-500/20 text-blue-500' },
    avancado: { text: 'Avançado', color: 'bg-purple-500/20 text-purple-500' }
  };

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
          src={tutorial.thumbnailUrl}
          alt={tutorial.title}
          className="w-full h-full object-cover"
          animate={{ 
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ duration: 0.4 }}
        />
      </div>
      
      {/* Overlay de gradiente */}
      <div className={`absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-neutral-900/70 to-blue-900/30 ${isHovered ? 'opacity-100' : 'opacity-90'}`} />
      
      {/* Badge de duração */}
      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs py-1 px-2 rounded-md flex items-center">
        <Clock className="h-3 w-3 mr-1" />
        {tutorial.duration}
      </div>

      {/* Badge de visualizações */}
      <div className="absolute top-2 left-2 bg-blue-900/60 text-white text-xs py-1 px-2 rounded-md flex items-center">
        <Eye className="h-3 w-3 mr-1" />
        {tutorial.views.toLocaleString()}
      </div>
      
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
          {tutorial.isPremium && (
            <Badge variant="outline" className="bg-gradient-to-r from-amber-500/90 to-amber-600/90 border-amber-500/30 text-white px-2 py-0.5 text-xs font-medium">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
          
          <Badge 
            variant="outline" 
            className={`${levelInfo[tutorial.level].color} border-0 px-2 py-0.5 text-xs font-medium`}
          >
            {levelInfo[tutorial.level].text}
          </Badge>

          {tutorial.isWatched && (
            <Badge variant="outline" className="bg-green-500/20 text-green-500 border-0 px-2 py-0.5 text-xs font-medium">
              <CheckCircle className="h-3 w-3 mr-1" />
              Assistido
            </Badge>
          )}
        </div>
        
        {/* Título com destaque de pesquisa */}
        <h3 className="text-white font-bold text-base line-clamp-1">
          {searchTerm ? (
            <HighlightText text={tutorial.title} searchTerm={searchTerm} />
          ) : (
            tutorial.title
          )}
        </h3>
        
        {/* Detalhes quando hover */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <p className="text-white/80 text-xs mb-4 line-clamp-2">
              {searchTerm ? (
                <HighlightText text={tutorial.description} searchTerm={searchTerm} />
              ) : (
                tutorial.description
              )}
            </p>
            
            {/* Botão de ação */}
            {!isPremiumLocked && (
              <Link href={`/videoaulas/${tutorial.id}`}>
                <Button 
                  className="w-full h-8 text-xs flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {tutorial.isWatched
                    ? <>Assistir novamente <Play className="h-3.5 w-3.5" /></>
                    : <>Assistir tutorial <Play className="h-3.5 w-3.5" /></>
                  }
                </Button>
              </Link>
            )}
          </motion.div>
        )}
      </div>
      
      {/* Botão play no centro quando hover */}
      {isHovered && !isPremiumLocked && (
        <motion.div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="rounded-full bg-white/20 backdrop-blur-sm p-3">
            <Play className="h-10 w-10 text-white" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TutorialCard;