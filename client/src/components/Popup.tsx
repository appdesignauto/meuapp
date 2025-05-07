import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

export interface PopupProps {
  id: number;
  title: string;
  content: string;
  imageUrl?: string | null;
  buttonText?: string | null;
  buttonUrl?: string | null;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
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

  // Registrar visualização
  useEffect(() => {
    const registerView = async () => {
      try {
        await apiRequest('POST', '/api/popups/view', {
          popupId: id,
          sessionId,
          action: 'view'
        });
      } catch (error) {
        console.error('Erro ao registrar visualização:', error);
      }
    };
    
    registerView();
  }, [id, sessionId]);

  // Mostrar popup com delay
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
          animClass = 'animate-slide-in';
          break;
        case 'zoom':
          animClass = 'animate-zoom-in';
          break;
        default:
          animClass = 'animate-fade-in';
      }
      
      setAnimationClass(animClass);
    }, delay * 1000);
    
    return () => clearTimeout(timer);
  }, [delay, animation]);

  // Fechar popup quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        handleDismiss();
      }
    };
    
    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  const handleButtonClick = async () => {
    try {
      // Registrar clique no botão
      await apiRequest('POST', '/api/popups/view', {
        popupId: id,
        sessionId,
        action: 'click'
      });
      
      // Se tiver URL, abrir em nova aba
      if (buttonUrl) {
        window.open(buttonUrl, '_blank');
      }
      
      // Fechar popup
      onClose();
    } catch (error) {
      console.error('Erro ao registrar clique:', error);
      onClose();
    }
  };

  const handleDismiss = async () => {
    try {
      // Registrar fechamento
      await apiRequest('POST', '/api/popups/view', {
        popupId: id,
        sessionId,
        action: 'dismiss'
      });
      
      // Fechar popup
      onClose();
    } catch (error) {
      console.error('Erro ao registrar fechamento:', error);
      onClose();
    }
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

  // Definir classes de tamanho
  let sizeClasses = 'w-[90%] sm:w-[500px] md:w-[600px]';
  switch (size) {
    case 'small':
      sizeClasses = 'w-[90%] sm:w-[300px] md:w-[350px]';
      break;
    case 'large':
      sizeClasses = 'w-[95%] sm:w-[700px] md:w-[800px]';
      break;
    default:
      sizeClasses = 'w-[90%] sm:w-[500px] md:w-[600px]';
  }

  return (
    <div className={positionClasses}>
      {position === 'center' && (
        <div className="fixed inset-0 bg-black/50" onClick={handleDismiss} />
      )}
      
      <div
        ref={popupRef}
        className={cn(
          "rounded-lg shadow-lg overflow-hidden",
          sizeClasses,
          animationClass
        )}
        style={{ backgroundColor }}
      >
        {/* Botão de fechar */}
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
          aria-label="Fechar"
        >
          <X size={20} color={textColor} />
        </button>
        
        {/* Conteúdo do popup */}
        <div className="p-6">
          {imageUrl && (
            <div className="mb-4 flex justify-center">
              <img 
                src={imageUrl} 
                alt={title} 
                className="max-w-full h-auto rounded-md object-cover"
                style={{ maxHeight: size === 'large' ? '400px' : size === 'small' ? '150px' : '250px' }}
              />
            </div>
          )}
          
          <h2 
            className="text-xl font-bold mb-2" 
            style={{ color: textColor }}
          >
            {title}
          </h2>
          
          <div 
            className="mb-4 whitespace-pre-wrap"
            style={{ color: textColor }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
          
          {buttonText && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={handleButtonClick}
                className="px-6 py-2 rounded-md transition-all duration-200 hover:opacity-90"
                style={{ 
                  backgroundColor: buttonColor, 
                  color: buttonTextColor,
                }}
              >
                {buttonText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PopupContainer() {
  const [popup, setPopup] = useState<Omit<PopupProps, 'onClose'> | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  // Buscar popups ativos
  const fetchActivePopup = async () => {
    try {
      const response = await apiRequest('GET', `/api/popups/active?sessionId=${sessionId}`);
      const data = await response.json();
      
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }
      
      if (data.hasActivePopup && data.popup) {
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
          position: data.popup.position,
          size: data.popup.size,
          animation: data.popup.animation,
          delay: data.popup.delay,
          sessionId: data.sessionId
        });
      }
    } catch (error) {
      console.error('Erro ao buscar popups ativos:', error);
    }
  };

  useEffect(() => {
    fetchActivePopup();
  }, []);

  const handleClose = () => {
    setPopup(null);
  };

  if (!popup) {
    return null;
  }

  return (
    <Popup {...popup} onClose={handleClose} />
  );
}