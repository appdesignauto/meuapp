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
      whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
      className={cn("h-full", className)}
    >
      <Card className="h-full overflow-hidden border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 shadow-md hover:shadow-lg transition-all">
        <div className="relative group">
          {isNovo && (
            <Badge className="absolute top-3 right-3 z-10 bg-blue-500 text-white font-medium px-2 py-1">
              Novo
            </Badge>
          )}
          <div className="aspect-video overflow-hidden bg-gray-50 dark:bg-gray-800">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={nome}
                className="h-full w-full object-cover transition-all duration-500 ease-in-out group-hover:scale-110 group-hover:brightness-110"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                <span className="text-3xl font-bold text-primary opacity-40">
                  {nome.charAt(0)}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </div>
        
        <CardContent className="p-5">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">{nome}</h3>
          {descricao && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {descricao}
            </p>
          )}
        </CardContent>
        
        <CardFooter className="p-5 pt-0 mt-auto">
          <Button 
            onClick={handleClick} 
            className="w-full shadow-sm font-medium tracking-wide" 
            variant="default"
            size="sm"
          >
            Acessar Ferramenta
            {isExterno && <ExternalLink className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default FerramentaCard;