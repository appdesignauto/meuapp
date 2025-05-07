import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';

// Tipos para o popup
interface PopupProps {
  title: string;
  content: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'small' | 'medium' | 'large';
  animation?: 'fade' | 'slide' | 'zoom';
  sessionId?: string;
  popupId: number;
  onClose: () => void;
}

// Componente de popup
export const Popup = ({
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
  sessionId,
  popupId,
  onClose
}: PopupProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  // Registrar visualização do popup
  useEffect(() => {
    const registerView = async () => {
      try {
        await apiRequest('POST', '/api/popups/view', {
          popupId,
          sessionId,
          action: 'view'
        });
      } catch (error) {
        console.error('Erro ao registrar visualização do popup:', error);
      }
    };

    registerView();
  }, [popupId, sessionId]);

  // Função para fechar o popup
  const handleClose = async () => {
    setIsVisible(false);
    
    try {
      await apiRequest('POST', '/api/popups/view', {
        popupId,
        sessionId,
        action: 'dismiss'
      });
    } catch (error) {
      console.error('Erro ao registrar fechamento do popup:', error);
    }
    
    setTimeout(() => {
      onClose();
    }, 300); // Esperar a animação terminar
  };

  // Função para clicar no botão
  const handleButtonClick = async () => {
    try {
      await apiRequest('POST', '/api/popups/view', {
        popupId,
        sessionId,
        action: 'click'
      });
      
      if (buttonUrl) {
        window.open(buttonUrl, '_blank');
      }
      
      handleClose();
    } catch (error) {
      console.error('Erro ao registrar clique no botão do popup:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar sua ação. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  // Determinar a posição do popup
  const getPositionClass = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  // Determinar o tamanho do popup
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'max-w-sm';
      case 'large':
        return 'max-w-2xl';
      default:
        return 'max-w-md';
    }
  };

  // Definir variantes de animação
  const getAnimationVariants = () => {
    switch (animation) {
      case 'slide':
        return {
          hidden: { y: 50, opacity: 0 },
          visible: { y: 0, opacity: 1 },
          exit: { y: 50, opacity: 0 }
        };
      case 'zoom':
        return {
          hidden: { scale: 0.8, opacity: 0 },
          visible: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 }
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50"
            onClick={handleClose}
          />
          
          {/* Popup */}
          <motion.div
            className={`fixed z-50 shadow-lg rounded-lg overflow-hidden ${getPositionClass()} ${getSizeClass()}`}
            style={{ backgroundColor }}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={getAnimationVariants()}
            transition={{ duration: 0.3 }}
          >
            {/* Botão de fechar */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200/20 transition-colors"
              aria-label="Fechar"
            >
              <X size={24} style={{ color: textColor }} />
            </button>
            
            {/* Conteúdo do popup */}
            <div className="p-6">
              {/* Imagem (se existir) */}
              {imageUrl && (
                <div className="mb-4">
                  <img 
                    src={imageUrl} 
                    alt={title} 
                    className="w-full rounded-md object-cover" 
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              )}
              
              {/* Título */}
              <h2 
                className="text-2xl font-bold mb-2" 
                style={{ color: textColor }}
              >
                {title}
              </h2>
              
              {/* Conteúdo */}
              <div 
                className="mb-4 whitespace-pre-wrap" 
                style={{ color: textColor }}
                dangerouslySetInnerHTML={{ __html: content.replace(/\\n/g, '<br>') }}
              />
              
              {/* Botão (se existir) */}
              {buttonText && (
                <Button
                  onClick={handleButtonClick}
                  className="w-full"
                  style={{
                    backgroundColor: buttonColor,
                    color: buttonTextColor,
                    border: 'none'
                  }}
                >
                  {buttonText}
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Componente de container de popups
interface PopupContainerProps {
  checkInterval?: number; // Intervalo para verificar popups disponíveis (em ms)
}

export const PopupContainer = ({ checkInterval = 30000 }: PopupContainerProps) => {
  const [popup, setPopup] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Função para buscar popups disponíveis
  const fetchActivePopup = async () => {
    try {
      const res = await apiRequest('GET', `/api/popups/active${sessionId ? `?sessionId=${sessionId}` : ''}`);
      const data = await res.json();
      
      if (data.hasActivePopup) {
        setPopup(data.popup);
        setSessionId(data.sessionId);
      }
    } catch (error) {
      console.error('Erro ao buscar popups ativos:', error);
    }
  };
  
  // Iniciar a verificação de popups quando o componente montar
  useEffect(() => {
    fetchActivePopup();
    
    // Configurar verificação periódica
    const interval = setInterval(() => {
      if (!popup) {
        fetchActivePopup();
      }
    }, checkInterval);
    
    return () => clearInterval(interval);
  }, [user?.id]);
  
  // Fechar o popup
  const handleClosePopup = () => {
    setPopup(null);
  };
  
  if (!popup) return null;
  
  return (
    <Popup
      title={popup.title}
      content={popup.content}
      imageUrl={popup.imageUrl}
      buttonText={popup.buttonText}
      buttonUrl={popup.buttonUrl}
      backgroundColor={popup.backgroundColor}
      textColor={popup.textColor}
      buttonColor={popup.buttonColor}
      buttonTextColor={popup.buttonTextColor}
      position={popup.position}
      size={popup.size}
      animation={popup.animation}
      sessionId={sessionId || undefined}
      popupId={popup.id}
      onClose={handleClosePopup}
    />
  );
};