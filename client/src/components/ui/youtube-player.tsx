import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

interface YouTubePlayerProps {
  videoUrl: string;
  thumbnailUrl: string;
}

const extractYouTubeVideoId = (url: string): string | null => {
  // Verificar se a URL está vazia ou é indefinida
  if (!url) return null;
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoUrl, thumbnailUrl }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  
  useEffect(() => {
    // Extrair o ID do vídeo do YouTube da URL quando a URL mudar
    const id = extractYouTubeVideoId(videoUrl);
    console.log("[YouTube Player] URL:", videoUrl, "ID extraído:", id);
    setVideoId(id);
    
    // Resetar estados quando a URL mudar
    setIsLoading(true);
    setIsError(false);
  }, [videoUrl]);
  
  // Manipuladores para eventos de carregamento
  const handleIframeLoad = () => {
    console.log("[YouTube Player] Iframe carregado com sucesso");
    setIsLoading(false);
  };
  
  const handleIframeError = () => {
    console.log("[YouTube Player] Erro ao carregar iframe");
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
            Não foi possível extrair o ID do vídeo do YouTube: {videoUrl}
          </p>
        </div>
      </div>
    );
  }
  
  // Preparar a URL do embed do YouTube apenas com parâmetros essenciais para melhor experiência
  // modestbranding=1 - reduz o branding do YouTube
  // rel=0 - não mostra vídeos relacionados ao final do vídeo
  // origin - especifica a origem para segurança
  // enablejsapi=1 - habilita a API JavaScript
  const embedUrl = `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
  
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
      
      {/* iframe do YouTube - com uma camada invisível para evitar cliques indesejados */}
      <iframe
        className={`w-full h-full ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        src={embedUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      ></iframe>
    </div>
  );
};

export default YouTubePlayer;