import React, { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Play, 
  Crown, 
  GraduationCap, 
  Award, 
  Star, 
  Info,
  Clock,
  Users,
  Video,
  Bookmark,
  CheckCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Interface para o módulo de curso
interface CourseModule {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  level: "iniciante" | "intermediario" | "avancado";
  isPremium: boolean;
  totalLessons?: number;
  completedLessons?: number;
  isActive?: boolean;
  viewCount?: number;
  lastUpdateDate?: string;
}

interface NetflixCardProps {
  module: CourseModule;
  isPremiumLocked: boolean;
  isWide?: boolean;
}

const NetflixCard: React.FC<NetflixCardProps> = ({
  module,
  isPremiumLocked,
  isWide = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calcular porcentagem de conclusão
  const completionPercentage = module.completedLessons && module.totalLessons 
    ? Math.round((module.completedLessons / module.totalLessons) * 100) 
    : 0;
  
  // Labels e cores para níveis
  const levelLabels = {
    iniciante: "Iniciante",
    intermediario: "Intermediário",
    avancado: "Avançado"
  };
  
  const levelIcons = {
    iniciante: <GraduationCap className="h-3.5 w-3.5" />,
    intermediario: <Award className="h-3.5 w-3.5" />,
    avancado: <Star className="h-3.5 w-3.5" />
  };
  
  const levelColors = {
    iniciante: "bg-green-500/20 text-green-700 ring-1 ring-green-500/30",
    intermediario: "bg-blue-500/20 text-blue-700 ring-1 ring-blue-500/30",
    avancado: "bg-purple-500/20 text-purple-700 ring-1 ring-purple-500/30"
  };

  // Verificar se é recente (últimos 7 dias)
  const isRecentlyUpdated = module.lastUpdateDate && (
    new Date().getTime() - new Date(module.lastUpdateDate).getTime() < 7 * 24 * 60 * 60 * 1000
  );
  
  return (
    <motion.div
      className={`relative rounded-md overflow-hidden shadow-md ${isWide ? 'h-64' : 'h-[200px]'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Imagem com efeito de zoom */}
      <div className="w-full h-full absolute inset-0 overflow-hidden">
        <motion.img
          src={module.thumbnailUrl || '/images/placeholder-course.jpg'} 
          alt={module.title}
          className="w-full h-full object-cover"
          animate={{ 
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ duration: 0.4 }}
        />
      </div>
      
      {/* Overlay de gradiente */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent ${isHovered ? 'opacity-100' : 'opacity-80'}`} />
      
      {/* Overlay de bloqueio para conteúdo premium */}
      {isPremiumLocked && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <Crown className="h-12 w-12 mb-3 text-amber-400" />
          <p className="text-lg font-semibold mb-1">Conteúdo Premium</p>
          <p className="text-sm text-center mx-4 mb-3 text-white/80">
            Acesse todos os conteúdos exclusivos com uma assinatura
          </p>
          <Button variant="secondary" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0">
            Assinar Premium
          </Button>
        </div>
      )}
      
      {/* Conteúdo padrão (sempre visível) */}
      <div className="absolute bottom-0 w-full p-3">
        <div className="flex items-center justify-between">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {module.isPremium && (
              <Badge variant="outline" className="bg-gradient-to-r from-amber-500/90 to-amber-600/90 border-amber-500/30 text-white px-2 py-0.5 text-xs font-medium">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
            
            <Badge variant="outline" className={`px-2 py-0.5 text-xs font-medium flex items-center ${levelColors[module.level]}`}>
              {levelIcons[module.level]}
              <span className="ml-1">{levelLabels[module.level]}</span>
            </Badge>
            
            {isRecentlyUpdated && (
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30 px-2 py-0.5 text-xs font-medium">
                Novo
              </Badge>
            )}
          </div>
        </div>
        
        <h3 className="text-white font-bold text-base line-clamp-1">{module.title}</h3>
        
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <p className="text-white/80 text-xs mb-3 line-clamp-2">{module.description}</p>
            
            {/* Barra de progresso */}
            {module.completedLessons !== undefined && (
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-white/80 mb-1">
                  <span className="flex items-center">
                    {completionPercentage > 0 ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1 text-blue-400" />
                        <span>{completionPercentage}% concluído</span>
                      </>
                    ) : (
                      <>
                        <Info className="h-3 w-3 mr-1 text-gray-400" />
                        <span>Inicie este curso</span>
                      </>
                    )}
                  </span>
                  <span>{module.completedLessons}/{module.totalLessons} aulas</span>
                </div>
                <Progress 
                  value={completionPercentage} 
                  className="h-1.5 bg-white/20" 
                />
              </div>
            )}
            
            {/* Estatísticas do curso */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center text-[11px] text-white/80">
                <Video className="h-3 w-3 mr-1" />
                <span>{module.totalLessons || 0} aulas</span>
              </div>
              
              {module.viewCount && module.viewCount > 0 && (
                <div className="flex items-center text-[11px] text-white/80">
                  <Users className="h-3 w-3 mr-1" />
                  <span>{module.viewCount} alunos</span>
                </div>
              )}
            </div>
            
            {/* Botão de ação */}
            {!isPremiumLocked && (
              <Link href={`/cursos/${module.id}`}>
                <Button 
                  className="w-full h-8 text-xs flex items-center justify-center gap-1.5 bg-white hover:bg-white/90 text-neutral-900"
                >
                  {module.completedLessons && module.completedLessons > 0 
                    ? <>Continuar <Clock className="h-3.5 w-3.5" /></>
                    : <>Assistir agora <Play className="h-3.5 w-3.5" /></>
                  }
                </Button>
              </Link>
            )}
          </motion.div>
        )}
      </div>
      
      {/* Botão play no centro quando hover e não estiver exibindo detalhes */}
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

export default NetflixCard;