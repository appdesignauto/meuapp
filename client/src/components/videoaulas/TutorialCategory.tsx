import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TutorialCategoryProps {
  id: number;
  title: string;
  description: string;
  count: number;
  image: string;
}

const TutorialCategory: React.FC<TutorialCategoryProps> = ({
  id,
  title,
  description,
  count,
  image
}) => {
  return (
    <motion.div
      className="relative rounded-lg overflow-hidden group cursor-pointer h-40 md:h-52"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      {/* Imagem de fundo com efeito de zoom */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <motion.img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4 }}
        />
      </div>
      
      {/* Gradiente de overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-900/50 to-transparent"></div>
      
      {/* Conteúdo */}
      <div className="relative h-full w-full flex flex-col justify-end p-4">
        <h3 className="text-white font-bold text-lg mb-1 group-hover:text-blue-200 transition-colors">
          {title}
        </h3>
        <p className="text-white/80 text-sm mb-2 line-clamp-2">
          {description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-blue-200">
            {count} tutoriais disponíveis
          </span>
          <Link href={`/videoaulas?categoria=${id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-white p-0 h-auto hover:bg-transparent hover:text-blue-300"
            >
              <span className="text-xs">Ver todos</span>
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default TutorialCategory;