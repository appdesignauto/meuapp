import React from 'react';
import { Carousel } from '@/components/ui/carousel';
import NetflixCard from './NetflixCard';
import { LucideIcon } from 'lucide-react';

// Interface para o módulo de curso
interface CourseModule {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  level: "iniciante" | "intermediario" | "avancado";
  isPremium: boolean;
  order: number;
  totalLessons?: number;
  completedLessons?: number;
  isActive?: boolean;
  viewCount?: number;
  lastUpdateDate?: string;
}

interface CourseCategoryProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  modules: CourseModule[];
  isPremiumUser: boolean;
  slidesPerView?: number;
}

const CourseCategory: React.FC<CourseCategoryProps> = ({
  title,
  subtitle,
  icon,
  modules,
  isPremiumUser,
  slidesPerView = 4
}) => {
  // Função para verificar se o conteúdo premium deve ser bloqueado
  const shouldLockPremiumContent = (isPremium: boolean) => {
    if (!isPremium) return false;
    return !isPremiumUser;
  };

  // Apenas exibir categorias com módulos
  if (modules.length === 0) {
    return null;
  }
  
  // Ordenar os módulos por ordem
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  return (
    <Carousel
      title={title}
      subtitle={subtitle}
      titleIcon={icon}
      slidesPerView={slidesPerView}
      spacing={12}
    >
      {sortedModules.map((module) => (
        <NetflixCard
          key={module.id}
          module={module}
          isPremiumLocked={shouldLockPremiumContent(module.isPremium)}
        />
      ))}
    </Carousel>
  );
};

export default CourseCategory;