import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FerramentaCardProps {
  id: number;
  nome: string;
  descricao: string | null;
  imageUrl: string | null;
  websiteUrl: string;
  isExterno: boolean;
  isNovo: boolean;
}

const FerramentaCard: React.FC<FerramentaCardProps> = ({
  nome,
  descricao,
  imageUrl,
  websiteUrl,
  isExterno,
  isNovo
}) => {
  // Função para abrir a URL da ferramenta
  const handleAcessar = () => {
    window.open(websiteUrl, '_blank', 'noopener,noreferrer');
  };

  // Se não houver imagem, usar uma imagem placeholder
  const imagemUrl = imageUrl || '/images/placeholder-tool.webp';

  return (
    <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col group">
      <div className="relative overflow-hidden">
        {/* Badge "NOVO" quando aplicável */}
        {isNovo && (
          <Badge 
            className="absolute top-2 right-2 z-10 bg-primary text-white" 
            variant="default"
          >
            NOVO
          </Badge>
        )}
        
        {/* Imagem da ferramenta com transição suave */}
        <div className="overflow-hidden h-44">
          <img
            src={imagemUrl}
            alt={nome}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>
      
      <CardContent className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold line-clamp-1 mb-2">{nome}</h3>
        
        {descricao && (
          <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">
            {descricao}
          </p>
        )}
        
        <Button 
          onClick={handleAcessar} 
          className="w-full mt-auto"
          variant="default"
        >
          Acessar
          {isExterno && <ExternalLink className="h-4 w-4 ml-2" />}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FerramentaCard;