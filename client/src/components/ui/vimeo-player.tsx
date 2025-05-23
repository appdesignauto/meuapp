import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

interface VimeoPlayerProps {
  videoUrl: string;
  thumbnailUrl: string;
}

const extractVimeoVideoId = (url: string): string | null => {
  // Verificar se a URL está vazia ou é indefinida
  if (!url) return null;
  
  // Formatos de URL do Vimeo suportados:
  // - https://vimeo.com/1234567
  // - https://vimeo.com/channels/staffpicks/1234567
  // - https://vimeo.com/groups/name/videos/1234567
  // - https://player.vimeo.com/video/1234567
  
  const regExp = /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|video\/|)(\d+)(?:|\/\?)|player\.vimeo\.com\/video\/(\d+)(?:\/\?)?)/;
  
  const match = url.match(regExp);
  
  // Se encontrar um match, retornar o ID do vídeo
  if (match) {
    // O ID pode estar no grupo 1 ou 2 dependendo do formato da URL
    return match[1] || match[2];
  }
  
  return null;
};

const VimeoPlayer: React.FC<VimeoPlayerProps> = ({ videoUrl, thumbnailUrl }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  
  useEffect(() => {
    // Extrair o ID do vídeo do Vimeo da URL quando a URL mudar
    const id = extractVimeoVideoId(videoUrl);
    console.log("[Vimeo Player] URL:", videoUrl, "ID extraído:", id);
    setVideoId(id);
    
    // Resetar estados quando a URL mudar
    setIsLoading(true);
    setIsError(false);
  }, [videoUrl]);
  
  // Manipuladores para eventos de carregamento
  const handleIframeLoad = () => {
    console.log("[Vimeo Player] Iframe carregado com sucesso");
    setIsLoading(false);
  };
  
  const handleIframeError = () => {
    console.log("[Vimeo Player] Erro ao carregar iframe");
    setIsError(true);
    setIsLoading(false);
  };
  
  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-md sm:rounded-lg flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">
            <ExternalLink className="h-10 w-10 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">URL de vídeo inválida</h3>
          <p className="text-gray-600 text-sm mt-1">
            Não foi possível extrair o ID do vídeo do Vimeo: {videoUrl}
          </p>
        </div>
      </div>
    );
  }
  
  // Preparar a URL do embed do Vimeo com parâmetros para melhor experiência
  // byline=0 - esconde o nome do autor
  // portrait=0 - esconde o avatar
  // title=0 - esconde o título
  // transparent=1 - torna o fundo transparente
  // dnt=1 - "Do Not Track" (privacidade)
  const embedUrl = `https://player.vimeo.com/video/${videoId}?byline=0&portrait=0&title=0&transparent=1&pip=0&autopause=0&controls=1&playsinline=1&dnt=1`;
  
  return (
    <div className="relative w-full aspect-video bg-black rounded-md sm:rounded-lg overflow-hidden">
      {/* Mostrar thumbnail enquanto carrega */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src={thumbnailUrl || `/images/placeholder-video.jpg`} 
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
            <p className="text-gray-400 text-xs mt-2">ID: {videoId}</p>
          </div>
        </div>
      )}
      
      {/* iframe do Vimeo - com uma camada invisível para evitar cliques indesejados */}
      <iframe
        className={`w-full h-full ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        src={embedUrl}
        title="Vimeo video player"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      ></iframe>
    </div>
  );
};

export default VimeoPlayer;