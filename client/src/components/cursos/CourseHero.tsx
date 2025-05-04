import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  PlayCircle, 
  Crown, 
  GraduationCap,
  ArrowRight
} from 'lucide-react';

interface CourseHeroProps {
  title: string;
  description: string;
  imageUrl: string;
  courseId: number;
  isPremium: boolean;
  isPremiumUser: boolean;
  totalLessons?: number;
  level?: "iniciante" | "intermediario" | "avancado";
}

const CourseHero: React.FC<CourseHeroProps> = ({
  title,
  description,
  imageUrl,
  courseId,
  isPremium,
  isPremiumUser,
  totalLessons,
  level = "iniciante"
}) => {
  // Selos de nível de dificuldade
  const levelLabels = {
    iniciante: "Iniciante",
    intermediario: "Intermediário",
    avancado: "Avançado"
  };

  const isPremiumLocked = isPremium && !isPremiumUser;

  return (
    <div className="relative overflow-hidden bg-neutral-900 mb-12">
      {/* Imagem com efeito de zoom */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <motion.img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover opacity-40"
          initial={{ scale: 1.1 }}
          animate={{ 
            scale: 1, 
            opacity: 0.3 
          }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-2xl">
          {/* Badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            {isPremium && (
              <div className="flex items-center bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm px-4 py-1.5 rounded-full">
                <Crown className="h-4 w-4 mr-2" />
                <span className="font-medium">Conteúdo Premium</span>
              </div>
            )}
            <div className="flex items-center bg-neutral-800 text-white text-sm px-4 py-1.5 rounded-full">
              <GraduationCap className="h-4 w-4 mr-2" />
              <span className="font-medium">Nível: {levelLabels[level]}</span>
            </div>
            {totalLessons && (
              <div className="flex items-center bg-neutral-800 text-white text-sm px-4 py-1.5 rounded-full">
                <PlayCircle className="h-4 w-4 mr-2" />
                <span className="font-medium">{totalLessons} aulas</span>
              </div>
            )}
          </div>

          {/* Título com destaque */}
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {title}
          </motion.h1>

          {/* Descrição */}
          <motion.p 
            className="text-lg text-neutral-300 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {description}
          </motion.p>

          {/* Botões de ação */}
          <motion.div 
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {!isPremiumLocked ? (
              <Link href={`/cursos/${courseId}`}>
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white group"
                >
                  <PlayCircle className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                  Assistir agora
                </Button>
              </Link>
            ) : (
              <Link href="/planos">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white group"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Assinar Premium
                </Button>
              </Link>
            )}
            
            <Link href="/cursos">
              <Button 
                variant="outline" 
                size="lg"
                className="border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800"
              >
                Ver todos os cursos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CourseHero;