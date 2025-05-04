import React from 'react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/netflix-carousel';
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
        <CarouselContent>
          {sortedTutorials.map((tutorial) => (
            <CarouselItem key={tutorial.id}>
              <TutorialCard
                tutorial={tutorial}
                isPremiumLocked={shouldLockPremiumContent(tutorial.isPremium)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default TutorialCategory;