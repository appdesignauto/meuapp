import React from 'react';
import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type FerramentaCardProps = {
  id: number;
  nome: string;
  descricao?: string;
  imageUrl?: string;
  websiteUrl: string;
  isExterno: boolean;
  isNovo: boolean;
  className?: string;
};

const FerramentaCard: React.FC<FerramentaCardProps> = ({
  nome,
  descricao,
  imageUrl,
  websiteUrl,
  isExterno,
  isNovo,
  className
}) => {
  const handleClick = () => {
    if (isExterno) {
      window.open(websiteUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = websiteUrl;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={cn("h-full", className)}
    >
      <Card className="h-full overflow-hidden border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 shadow-sm hover:shadow">
        <div className="relative">
          {isNovo && (
            <Badge className="absolute top-2 right-2 z-10 bg-blue-500 text-white">
              Novo
            </Badge>
          )}
          <div className="aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={nome}
                className="h-full w-full object-cover transition-all hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                  {nome.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-medium text-lg mb-1 line-clamp-1">{nome}</h3>
          {descricao && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {descricao}
            </p>
          )}
        </CardContent>
        
        <CardFooter className="p-4 pt-0 mt-auto">
          <Button 
            onClick={handleClick} 
            className="w-full" 
            variant="default"
          >
            Acessar
            {isExterno && <ExternalLink className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default FerramentaCard;