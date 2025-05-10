import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type FerramentaCardProps = {
  id: number;
  nome: string;
  descricao?: string;
  imageUrl?: string;
  websiteUrl: string;
  isExterno: boolean;
  isNovo: boolean;
  categoriaId: number;
  categoria?: {
    id: number;
    nome: string;
    slug: string;
  };
  ordem?: number;
  ativo?: boolean;
  criadoEm?: string;
};

export const FerramentaCard: React.FC<FerramentaCardProps> = ({
  nome,
  descricao,
  imageUrl,
  websiteUrl,
  isExterno,
  isNovo,
  categoria,
}) => {
  // Calcular se a ferramenta foi adicionada recentemente (nos últimos 14 dias)
  const isRecente = isNovo;

  return (
    <motion.div
      className="flex flex-col h-full overflow-hidden rounded-lg shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
      whileHover={{ 
        y: -5,
        transition: { duration: 0.2 }
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Imagem da ferramenta */}
      <div className="relative w-full bg-gray-100 dark:bg-gray-700 aspect-[16/9] overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={nome} 
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-200 dark:bg-gray-700">
            <span className="text-gray-400 dark:text-gray-500 text-xl font-bold">{nome.charAt(0)}</span>
          </div>
        )}
        
        {/* Badge para ferramentas novas */}
        {isRecente && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 bg-primary text-white"
          >
            <Clock className="h-3 w-3 mr-1" />
            Novo
          </Badge>
        )}
        
        {/* Badge para categoria */}
        {categoria && (
          <Badge 
            variant="outline" 
            className="absolute bottom-2 left-2 bg-white/80 dark:bg-gray-800/80 text-primary dark:text-primary-foreground text-xs"
          >
            {categoria.nome}
          </Badge>
        )}
      </div>
      
      {/* Conteúdo */}
      <div className="flex flex-col flex-grow p-4">
        <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">{nome}</h3>
        
        {descricao && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 flex-grow">
            {descricao}
          </p>
        )}
        
        <div className="mt-auto pt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  className={cn(
                    "w-full justify-center",
                    isExterno && "group"
                  )}
                  onClick={() => window.open(websiteUrl, '_blank')}
                >
                  Acessar
                  {isExterno && (
                    <ExternalLink className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isExterno 
                    ? "Abre em uma nova janela" 
                    : "Acessar ferramenta"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  );
};

export default FerramentaCard;