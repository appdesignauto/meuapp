import express, { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

const router = express.Router();

// Middleware para verificar se o usuário está autenticado
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Não autenticado' });
};

// Rota para atualizar informações do perfil
router.put('/api/user/profile', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { name, bio } = req.body;
    
    // Valida os dados recebidos
    if (name && typeof name !== 'string') {
      return res.status(400).json({ error: 'Nome inválido' });
    }
    
    if (bio && typeof bio !== 'string') {
      return res.status(400).json({ error: 'Biografia inválida' });
    }

    // Atualiza no banco de dados
    const updatedUser = await storage.updateUser(userId, {
      name: name || null,
      bio: bio || null
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Retorna os dados atualizados (sem a senha)
    const { password, ...userWithoutPassword } = updatedUser;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar perfil',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota para obter informações do perfil
router.get('/api/user/profile', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Retorna os dados do usuário (sem a senha)
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ 
      error: 'Erro ao obter perfil',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;