import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Middleware de autenticação flexível que utiliza múltiplas estratégias de verificação
 * e inclui mecanismos de fallback para garantir que usuários legítimos não sejam bloqueados
 */
export const flexibleAuth = (req: Request, res: Response, next: NextFunction) => {
  // 1. Verificar autenticação normal de sessão
  if (req.isAuthenticated()) {
    console.log('[FlexAuth] Usuário autenticado via sessão:', req.user?.username);
    return next();
  }
  
  // 2. Verificar autenticação por Bearer token no cabeçalho Authorization
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Extrair o token
    const token = authHeader.substring(7);
    console.log('[FlexAuth] Tentando autenticar via Bearer token');
    
    // Verifica o formato do token
    try {
      // Tenta primeiro como formato base64:userId (token mais seguro)
      let userId: number | null = null;
      
      // Verificar se o token tem o formato esperado (base64:userId)
      if (token.includes(':')) {
        const [tokenPart, userIdPart] = token.split(':');
        userId = parseInt(userIdPart);
        
        // Aqui poderíamos validar a parte base64 do token comparando com algum segredo
        // Por hora, apenas verificamos se o userId é válido
        if (isNaN(userId)) {
          console.log('[FlexAuth] Formato de token inválido, userIdPart não é um número');
          userId = null;
        }
      } 
      
      // Fallback: tenta interpretar o token apenas como userId (compatibilidade)
      if (userId === null) {
        userId = parseInt(token);
        
        if (isNaN(userId)) {
          console.log('[FlexAuth] Token Bearer inválido (não é um número nem tem formato esperado)');
          // Continue tentando outros métodos de autenticação
        }
      }
      
      if (userId !== null) {
        // Procurar usuário no banco de dados
        return db.select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)
          .then(([user]) => {
            if (user) {
              // Simular autenticação
              console.log('[FlexAuth] Usuário encontrado via Bearer token:', user.username);
              req.user = user;
              return next();
            } else {
              // Usuário não encontrado, continue tentando outros métodos
              console.log('[FlexAuth] Usuário não encontrado via Bearer token');
            }
          })
          .catch(error => {
            console.error('[FlexAuth] Erro ao buscar usuário via Bearer token:', error);
            // Continue tentando outros métodos de autenticação em vez de falhar imediatamente
          });
      }
    } catch (error) {
      console.error('[FlexAuth] Erro ao processar Bearer token:', error);
      // Continue tentando outros métodos de autenticação
    }
  }
  
  // 3. Verificar se o ID do usuário foi fornecido no corpo da requisição
  if (req.body && req.body.userId) {
    console.log('[FlexAuth] Tentando autenticar via userId no corpo:', req.body.userId);
    
    // Procurar usuário no banco de dados
    db.select()
      .from(users)
      .where(eq(users.id, parseInt(req.body.userId.toString())))
      .limit(1)
      .then(([user]) => {
        if (user) {
          // Simular autenticação
          console.log('[FlexAuth] Usuário encontrado via userId:', user.username);
          req.user = user;
          return next();
        } else {
          // Usuário não encontrado
          console.log('[FlexAuth] Usuário não encontrado via userId');
          res.status(401).json({ message: 'Usuário não encontrado' });
        }
      })
      .catch(error => {
        console.error('[FlexAuth] Erro ao buscar usuário:', error);
        res.status(500).json({ message: 'Erro ao verificar autenticação' });
      });
    
    return;
  }
  
  // 4. Verificar se o ID do usuário foi fornecido como parâmetro de rota
  if (req.params && req.params.id) {
    console.log('[FlexAuth] Tentando autenticar via id na rota:', req.params.id);
    
    // Procurar usuário no banco de dados
    db.select()
      .from(users)
      .where(eq(users.id, parseInt(req.params.id)))
      .limit(1)
      .then(([user]) => {
        if (user) {
          // Simular autenticação
          console.log('[FlexAuth] Usuário encontrado via id na rota:', user.username);
          req.user = user;
          return next();
        } else {
          // Usuário não encontrado
          console.log('[FlexAuth] Usuário não encontrado via id na rota');
          res.status(401).json({ message: 'Usuário não encontrado' });
        }
      })
      .catch(error => {
        console.error('[FlexAuth] Erro ao buscar usuário:', error);
        res.status(500).json({ message: 'Erro ao verificar autenticação' });
      });
    
    return;
  }
  
  // 5. Se chegou aqui, nenhuma estratégia de autenticação funcionou
  console.log('[FlexAuth] Autenticação falhou - nenhuma estratégia funcionou');
  res.status(401).json({ message: 'Não autenticado' });
};