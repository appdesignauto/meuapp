/**
 * Este arquivo implementa uma camada de conversão de URLs de imagens
 * para substituir as URLs diretas do Supabase Storage por um domínio personalizado
 * 
 * Isso melhora o SEO, a segurança, e a percepção de marca ao servir as imagens
 * do domínio próprio da aplicação
 */

import { Router, Request, Response, NextFunction } from 'express';
import { supabaseStorageService } from '../services/supabase-storage';

// Middleware para converter URLs de imagens em respostas JSON
export function convertImageUrlsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Captura o método original res.json
    const originalJson = res.json;
    
    // Substitui o método json por nossa versão personalizada
    res.json = function(body: any) {
      // Se o corpo da resposta for um objeto ou array, tenta converter as URLs
      if (body && (typeof body === 'object')) {
        // Campos comuns onde podem existir URLs de imagem
        const imageFields = [
          'imageUrl', 
          'thumbnailUrl', 
          'profileimageurl', 
          'avatarUrl', 
          'logoUrl', 
          'coverUrl', 
          'featuredImage',
          'bannerImageUrl'
        ];
        
        // Converte as URLs usando o serviço de storage
        body = supabaseStorageService.convertImageUrls(body, imageFields);
      }
      
      // Chama o método original com o corpo potencialmente modificado
      return originalJson.call(this, body);
    };
    
    next();
  };
}

// Cria um router com o middleware de conversão já aplicado
export const imageProxyRouter = Router();

// Adiciona o middleware para todas as rotas deste router
imageProxyRouter.use(convertImageUrlsMiddleware());

export default imageProxyRouter;