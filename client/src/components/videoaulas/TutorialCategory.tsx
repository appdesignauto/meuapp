import React from 'react';
import { Carousel } from '@/components/ui/carousel';
import TutorialCard from './TutorialCard';
import { Tutorial } from './TutorialData';

interface TutorialCategoryProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  tutorials: Tutorial[];
  isPremiumUser: boolean;
  slidesPerView?: number;
}

const TutorialCategory: React.FC<TutorialCategoryProps> = ({
  title,
  subtitle,
  icon,
  tutorials,
  isPremiumUser,
  slidesPerView = 4
}) => {
  // Função para verificar se o conteúdo premium deve ser bloqueado
  const shouldLockPremiumContent = (isPremium: boolean) => {
    if (!isPremium) return false;
    return !isPremiumUser;
  };

  // Apenas exibir categorias com tutoriais
  if (!tutorials || tutorials.length === 0) {
    return null;
  }
  
  // Ordenar os tutoriais por ordem
  const sortedTutorials = [...tutorials].sort((a, b) => a.order - b.order);

  return (
    <div className="mb-12">
      <div className="flex items-center mb-4">
        {icon && <span className="mr-2">{icon}</span>}
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      {subtitle && (
        <p className="text-sm text-blue-200/80 mb-4">{subtitle}</p>
      )}
      
      <Carousel
        slidesPerView={slidesPerView}
        spacing={12}
        gradient={true}
      >
        {sortedTutorials.map((tutorial) => (
          <TutorialCard
            key={tutorial.id}
            tutorial={tutorial}
            isPremiumLocked={shouldLockPremiumContent(tutorial.isPremium)}
          />
        ))}
      </Carousel>
    </div>
  );
};

export default TutorialCategory;