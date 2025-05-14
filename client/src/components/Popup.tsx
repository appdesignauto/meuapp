import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

export interface PopupProps {
  id: number;
  title?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  buttonText?: string | null;
  buttonUrl?: string | null;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonRadius?: number;
  buttonWidth?: string;
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'small' | 'medium' | 'large';
  animation?: 'fade' | 'slide' | 'zoom';
  delay?: number;
  onClose: () => void;
  sessionId: string;
}

export function Popup({
  id,
  title,
  content,
  imageUrl,
  buttonText,
  buttonUrl,
  backgroundColor = '#FFFFFF',
  textColor = '#000000',
  buttonColor = '#4F46E5',
  buttonTextColor = '#FFFFFF',
  buttonRadius = 4,
  buttonWidth = 'auto',
  position = 'center',
  size = 'medium',
  animation = 'fade',
  delay = 2,
  onClose,
  sessionId
}: PopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('opacity-0');
  const popupRef = useRef<HTMLDivElement>(null);
  
  // Estado para controlar as dimensões da imagem
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // Função para calcular o tamanho ideal do popup baseado na imagem
  const calculateOptimalSize = (width: number, height: number) => {
    const ratio = width / height;
    if (ratio > 1.8) {
      // Imagem muito larga
      return 'landscape';
    } else if (ratio < 0.6) {
      // Imagem muito alta
      return 'portrait';
    }
    return 'balanced';
  };

  // Registrar visualização
  useEffect(() => {
    // Registrar visualização em segundo plano sem bloquear o carregamento do popup
    apiRequest('POST', '/api/popups/view', {
      popupId: id,
      sessionId,
      action: 'view'
    }).catch(error => {
      // Se o popup não for encontrado (404), significa que ele foi deletado ou desativado
      if (error.message && error.message.includes('404')) {
        console.log('Popup não encontrado ou desativado, notificando para fechar...');
        onClose(); // Fechar o popup se ele já não existir mais no servidor
      } else {
        console.error('Erro ao registrar visualização:', error);
      }
    });
  }, [id, sessionId, onClose]);

  // Mostrar popup com delay e aplicar animação de entrada
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      
      // Aplicar animação de entrada
      let animClass = '';
      switch (animation) {
        case 'fade':
          animClass = 'animate-fade-in';
          break;
        case 'slide':
          animClass = 'animate-slide-in-bounce';
          break;
        case 'zoom':
          animClass = 'animate-zoom-in-bounce animate-popupEntrance';
          break;
        default:
          animClass = 'animate-popupEntrance';
      }
      
      setAnimationClass(animClass);
    }, delay * 1000);
    
    return () => clearTimeout(timer);
  }, [delay, animation]);

  const handleButtonClick = () => {
    // Se tiver URL, abrir em nova aba
    if (buttonUrl) {
      window.open(buttonUrl, '_blank');
    }
    
    // Fechar popup imediatamente para melhorar a experiência do usuário
    onClose();
    
    // Registrar clique no botão em segundo plano sem bloquear a interface
    apiRequest('POST', '/api/popups/view', {
      popupId: id,
      sessionId,
      action: 'click'
    }).catch(error => {
      console.error('Erro ao registrar clique:', error);
    });
  };

  const handleDismiss = () => {
    // Fechar o popup imediatamente para melhorar a experiência do usuário
    onClose();
    
    // Registrar fechamento em segundo plano sem bloquear a interface
    apiRequest('POST', '/api/popups/view', {
      popupId: id,
      sessionId,
      action: 'dismiss'
    }).catch(error => {
      console.error('Erro ao registrar fechamento:', error);
    });
  };

  if (!isVisible) {
    return null;
  }

  // Definir classes de posição
  let positionClasses = 'fixed inset-0 flex items-center justify-center z-50';
  switch (position) {
    case 'top-left':
      positionClasses = 'fixed top-4 left-4 z-50';
      break;
    case 'top-right':
      positionClasses = 'fixed top-4 right-4 z-50';
      break;
    case 'bottom-left':
      positionClasses = 'fixed bottom-4 left-4 z-50';
      break;
    case 'bottom-right':
      positionClasses = 'fixed bottom-4 right-4 z-50';
      break;
    default:
      positionClasses = 'fixed inset-0 flex items-center justify-center z-50';
  }

  // Definir classes de tamanho - voltando ao tamanho anterior
  let sizeClasses = 'w-[90%] sm:w-auto sm:max-w-2xl';
  switch (size) {
    case 'small':
      sizeClasses = 'w-[90%] sm:w-auto sm:max-w-lg';
      break;
    case 'large':
      sizeClasses = 'w-[95%] sm:w-auto sm:max-w-4xl';
      break;
    default:
      sizeClasses = 'w-[90%] sm:w-auto sm:max-w-2xl';
  }

  // Determinar se precisamos de classes especiais baseado nas dimensões da imagem
  const getImageFormatClass = () => {
    if (!imageDimensions || !hasLoaded) return '';
    
    const ratio = imageDimensions.width / imageDimensions.height;
    if (ratio > 1.8) {
      return 'popup-image-landscape';
    } else if (ratio < 0.6) {
      return 'popup-image-portrait';
    }
    return '';
  };

  const imageFormatClass = getImageFormatClass();
  const isImageOnly = !title && !content && !buttonText;

  return (
    <div className={positionClasses}>
      {position === 'center' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" />
      )}
      
      <div
        ref={popupRef}
        className={cn(
          "rounded-lg shadow-2xl border-4 border-white overflow-hidden z-50 flex flex-col",
          "p-[2px]", // Moldura interna com padding mínimo
          sizeClasses,
          animationClass,
          isImageOnly ? "popup-image-only" : "",
          isImageOnly && imageFormatClass ? imageFormatClass : ""
        )}
        style={{ backgroundColor }}
      >
        <div className="relative w-full h-full rounded-md overflow-hidden flex flex-col">
          {/* Botão de fechar */}
          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-opacity-90 hover:scale-110 transition-all duration-200 bg-indigo-800 w-10 h-10 flex items-center justify-center z-10 shadow-md"
            aria-label="Fechar"
          >
            <X size={24} color="white" strokeWidth={3} />
          </button>
          
          {/* Conteúdo do popup */}
          <div className={cn("p-0", !title && !content && !buttonText ? "flex-1" : "")}>
            {imageUrl && (
              <div className={cn(
                "flex justify-center w-full",
                !title && !content && !buttonText ? "h-full" : ""
              )}>
                <img 
                  src={imageUrl} 
                  alt={title || "Popup promocional"} 
                  className={cn(
                    "w-full h-auto", 
                    !title && !content && !buttonText ? "object-contain max-h-full" : "object-contain"
                  )}
                  style={{ 
                    maxHeight: !title && !content && !buttonText 
                      ? '85vh' 
                      : size === 'large' ? '80vh' : size === 'small' ? '50vh' : '65vh',
                    maxWidth: '100%'
                  }}
                  onLoad={(e) => {
                    // Ajusta o tamanho do popup com base na imagem carregada
                    const img = e.target as HTMLImageElement;
                    
                    // Armazena as dimensões da imagem
                    setImageDimensions({
                      width: img.naturalWidth,
                      height: img.naturalHeight
                    });
                    setHasLoaded(true);
                    
                    const ratio = img.naturalWidth / img.naturalHeight;
                    console.log(`Popup imagem carregada - Proporção: ${ratio.toFixed(2)}, Tamanho: ${img.naturalWidth}x${img.naturalHeight}`);
                    
                    // Ajustar tamanho do container baseado na imagem
                    const popupElement = popupRef.current;
                    if (popupElement && !title && !content && !buttonText) {
                      // Para popups somente com imagem
                      if (ratio > 1.8) {
                        // Imagem panorâmica/paisagem - ajustar largura
                        popupElement.style.width = 'auto';
                        popupElement.style.maxWidth = '90vw';
                        img.classList.replace('object-contain', 'object-scale-down');
                      } else if (ratio < 0.6) {
                        // Imagem vertical/retrato - ajustar altura
                        popupElement.style.height = 'auto';
                        popupElement.style.maxHeight = '90vh';
                        img.classList.replace('object-contain', 'object-scale-down');
                      }
                    } else {
                      // Para popups com texto/botão
                      if (ratio > 2 || ratio < 0.5) {
                        img.classList.replace('object-contain', 'object-scale-down');
                      }
                    }
                  }}
                />
              </div>
            )}
            
            {(title || content || buttonText) && (
              <div className={cn(
                "p-6", 
                !title && !content ? "pt-2 pb-4 px-4" : ""
              )}>
                {title && (
                  <h2 
                    className="text-2xl font-bold mb-4 text-center" 
                    style={{ color: textColor }}
                  >
                    {title}
                  </h2>
                )}
                
                {content && (
                  <div 
                    className="mb-6 whitespace-pre-wrap text-center text-base"
                    style={{ color: textColor }}
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                )}
                
                {buttonText && (
                  <div className={cn(
                    "flex justify-center",
                    title || content ? "mt-6" : "mt-2"
                  )}>
                    <button
                      onClick={handleButtonClick}
                      className="px-6 py-3 text-base font-bold transition-all duration-300 hover:brightness-110 hover:scale-105 flex items-center justify-center gap-2 shadow-lg animate-pulse-glow"
                      style={{ 
                        backgroundColor: buttonColor, 
                        color: buttonTextColor,
                        borderRadius: `${buttonRadius}px`,
                        width: buttonWidth,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {buttonText}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PopupContainer() {
  const [popup, setPopup] = useState<Omit<PopupProps, 'onClose'> | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [fetched, setFetched] = useState(false);
  const [location] = useLocation();

  // Limpar cache de popups se necessário (para depuração)
  useEffect(() => {
    // Checar por erros 404 recentes no console para limpar automaticamente o histórico
    const removedPopupIds = localStorage.getItem('removed_popup_ids');
    if (removedPopupIds) {
      try {
        // Limpa o histórico de popups que foram removidos
        const removedIds = JSON.parse(removedPopupIds);
        const popupHistory = JSON.parse(localStorage.getItem('popup_history') || '{}');
        
        let changed = false;
        removedIds.forEach((id: number) => {
          if (popupHistory[id]) {
            delete popupHistory[id];
            changed = true;
          }
        });
        
        if (changed) {
          localStorage.setItem('popup_history', JSON.stringify(popupHistory));
          console.log('Cache de popups atualizado, popups removidos foram eliminados da memória');
        }
        
        // Limpar lista de IDs removidos após processamento
        localStorage.removeItem('removed_popup_ids');
      } catch (e) {
        console.error('Erro ao processar IDs de popups removidos:', e);
        localStorage.removeItem('removed_popup_ids');
      }
    }
  }, []);

  // Buscar popups ativos
  const fetchActivePopup = async () => {
    try {
      // Usar sessionId existente se disponível
      const storedSessionId = localStorage.getItem('popup_session_id') || sessionId;
      
      // Obter o path atual sem a "/" inicial para simplificar a correspondência
      const currentPath = location === '/' ? 'home' : location.substring(1);
      console.log('Verificando popups para a página atual:', currentPath);
      
      const response = await apiRequest('GET', `/api/popups/active?sessionId=${storedSessionId}&currentPath=${currentPath}`);
      const data = await response.json();
      
      // Salvar o sessionId no estado e localStorage para consistência entre sessões
      if (data.sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem('popup_session_id', data.sessionId);
      }
      
      if (data.hasActivePopup && data.popup) {
        console.log('Popup ativo encontrado:', data.popup.title);
        setPopup({
          id: data.popup.id,
          title: data.popup.title,
          content: data.popup.content,
          imageUrl: data.popup.imageUrl,
          buttonText: data.popup.buttonText,
          buttonUrl: data.popup.buttonUrl,
          backgroundColor: data.popup.backgroundColor,
          textColor: data.popup.textColor,
          buttonColor: data.popup.buttonColor,
          buttonTextColor: data.popup.buttonTextColor,
          buttonRadius: data.popup.buttonRadius || 4,
          buttonWidth: data.popup.buttonWidth || 'auto',
          position: data.popup.position,
          size: data.popup.size,
          animation: data.popup.animation,
          delay: data.popup.delay,
          sessionId: data.sessionId
        });
      } else {
        console.log('Nenhum popup ativo disponível para esta página');
        // Se não há popups ativos, limpar o popup atual para evitar exibição incorreta
        setPopup(null);
      }
      
      setFetched(true);
    } catch (error) {
      console.error('Erro ao buscar popups ativos:', error);
      setFetched(true);
      // Em caso de erro, limpar popup para evitar exibição incorreta
      setPopup(null);
    }
  };

  // Buscar popups quando o componente montar ou quando mudar de página
  useEffect(() => {
    // Forçar limpeza do cache local antes de buscar popups
    const forceClean = localStorage.getItem('force_clean_popups') === 'true';
    if (forceClean) {
      console.log('Limpando cache de popups devido à solicitação de limpeza forçada');
      localStorage.removeItem('popup_history');
      localStorage.removeItem('popup_session_id');
      localStorage.removeItem('force_clean_popups');
    }
    
    // Tentar buscar imediatamente
    fetchActivePopup();
    
    // E depois a cada 30 segundos para verificar novos popups ou mudanças
    // Reduzido de 5 minutos para 30 segundos para facilitar testes e evitar problemas de cache
    const interval = setInterval(() => {
      fetchActivePopup();
    }, 30 * 1000);
    
    return () => clearInterval(interval);
  }, [location]); // Re-executar quando a localização (rota) mudar

  const handleClose = () => {
    // Registrar no localstorage que o popup foi fechado 
    // para evitar exibição repetida no mesmo dia (se for showOnce)
    if (popup) {
      const popupHistory = JSON.parse(localStorage.getItem('popup_history') || '{}');
      popupHistory[popup.id] = new Date().toISOString();
      localStorage.setItem('popup_history', JSON.stringify(popupHistory));
      
      // Registrar também que este popup foi fechado manualmente
      localStorage.setItem('last_closed_popup_id', String(popup.id));
    }
    
    setPopup(null);
    
    // Força recarregar popups após 500ms
    setTimeout(() => {
      fetchActivePopup();
    }, 500);
  };

  if (!popup) {
    return null;
  }

  return (
    <Popup {...popup} onClose={handleClose} />
  );
}