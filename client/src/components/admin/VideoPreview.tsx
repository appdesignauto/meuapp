import React, { useState, useEffect } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import YouTubePlayer from '@/components/ui/youtube-player';
import VimeoPlayer from '@/components/ui/vimeo-player';

interface VideoPreviewProps {
  videoUrl: string;
  videoProvider: string;
  thumbnailUrl?: string;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ videoUrl, videoProvider, thumbnailUrl = '' }) => {
  const [showVideo, setShowVideo] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(true);

  useEffect(() => {
    // Resetar estado quando a URL muda
    setShowVideo(false);
    setIsValidUrl(videoUrl?.trim() !== '');
  }, [videoUrl]);

  if (!videoUrl) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-md flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-gray-400 mb-2">
            <Play className="h-10 w-10 mx-auto" />
          </div>
          <h3 className="text-sm font-medium text-gray-700">Insira uma URL de vídeo</h3>
          <p className="text-xs text-gray-500 mt-1">
            Suportamos YouTube, Vimeo e outros provedores
          </p>
        </div>
      </div>
    );
  }

  if (!isValidUrl) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-md flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">
            <ExternalLink className="h-10 w-10 mx-auto" />
          </div>
          <h3 className="text-sm font-medium text-gray-700">URL de vídeo inválida</h3>
          <p className="text-xs text-gray-500 mt-1">
            Verifique se a URL está correta
          </p>
        </div>
      </div>
    );
  }

  // Se ainda não clicou para mostrar o vídeo, mostrar apenas a thumbnail com botão de play
  if (!showVideo) {
    return (
      <div 
        className="w-full aspect-video rounded-md relative cursor-pointer group"
        onClick={() => setShowVideo(true)}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt="Thumbnail do vídeo" 
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-md" />
          )}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 flex items-center justify-center transition-colors">
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:bg-white transition-colors">
              <Play className="h-8 w-8 text-blue-600 ml-1" />
            </div>
          </div>
        </div>
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {videoProvider.toUpperCase()}
        </div>
        <div className="absolute bottom-2 right-2 text-xs text-white bg-black/70 px-2 py-1 rounded">
          Clique para pré-visualizar
        </div>
      </div>
    );
  }

  // Renderizar o player apropriado com base no provedor
  switch (videoProvider.toLowerCase()) {
    case 'youtube':
      return <YouTubePlayer videoUrl={videoUrl} thumbnailUrl={thumbnailUrl} />;
    case 'vimeo':
      return <VimeoPlayer videoUrl={videoUrl} thumbnailUrl={thumbnailUrl} />;
    default:
      // Fallback para outros provedores de vídeo ou URL direta
      return (
        <div className="w-full aspect-video bg-gray-100 rounded-md flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-blue-500 mb-2">
              <ExternalLink className="h-10 w-10 mx-auto" />
            </div>
            <h3 className="text-sm font-medium text-gray-700">Provedor não suportado para pré-visualização</h3>
            <p className="text-xs text-gray-500 mt-1">
              Provedor: {videoProvider}
            </p>
            <a 
              href={videoUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-blue-500 hover:underline mt-2 inline-block"
            >
              Abrir link externo
            </a>
          </div>
        </div>
      );
  }
};

export default VideoPreview;