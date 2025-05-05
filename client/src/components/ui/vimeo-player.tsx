import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';

// Função para extrair o ID de um vídeo Vimeo
const extractVimeoId = (url: string): string | null => {
  // Padrões comuns de URL do Vimeo 
  // Ex: https://vimeo.com/123456789, https://player.vimeo.com/video/123456789
  const regex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

interface VimeoPlayerProps {
  videoUrl: string;
  thumbnailUrl: string;
}

const VimeoPlayer: React.FC<VimeoPlayerProps> = ({ videoUrl, thumbnailUrl }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  
  // Extrair o ID do Vimeo
  const videoId = extractVimeoId(videoUrl);
  
  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-md sm:rounded-lg flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">
            <ExternalLink className="h-10 w-10 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">URL de vídeo inválida</h3>
          <p className="text-gray-600 text-sm mt-1">Não foi possível carregar o vídeo do Vimeo</p>
        </div>
      </div>
    );
  }
  
  // Manipuladores para eventos de carregamento
  const handleIframeLoad = () => {
    setIsLoading(false);
  };
  
  const handleIframeError = () => {
    setIsError(true);
    setIsLoading(false);
  };
  
  // URL do embed do Vimeo com parâmetros avançados
  // Parâmetros:
  // - byline=0: oculta a autoria
  // - portrait=0: oculta o avatar
  // - title=0: oculta o título
  // - transparent=1: fundo transparente 
  // - pip=0: desativa picture-in-picture
  // - autopause=0: não pausa outros vídeos
  // - controls=1: mantém os controles básicos
  // - playsinline=1: reproduz inline em dispositivos móveis
  // - dnt=1: não rastrear (privacidade)
  const embedUrl = `https://player.vimeo.com/video/${videoId}?byline=0&portrait=0&title=0&transparent=1&pip=0&autopause=0&controls=1&playsinline=1&dnt=1`;
  
  return (
    <div className="relative w-full aspect-video bg-black rounded-md sm:rounded-lg overflow-hidden">
      {/* Mostrar thumbnail enquanto carrega */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src={thumbnailUrl} 
            alt="Thumbnail do vídeo" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      )}
      
      {/* Mostrar mensagem de erro se não for possível carregar o iframe */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <div className="text-red-500 mb-2">
              <ExternalLink className="h-10 w-10 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Erro ao carregar o vídeo</h3>
            <p className="text-gray-600 text-sm mt-1">Verifique sua conexão com a internet</p>
          </div>
        </div>
      )}
      
      {/* iframe do Vimeo - sem sobreposições */}
      <iframe
        className="w-full h-full"
        src={embedUrl}
        title="Vimeo video player"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      ></iframe>
    </div>
  );
};

export default VimeoPlayer;