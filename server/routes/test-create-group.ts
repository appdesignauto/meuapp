import { Router, Request, Response } from 'express';
import { db } from '../db';
import { arts } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Rota de teste para criar um grupo de artes (apenas para desenvolvimento/teste)
router.get('/api/test/create-group', async (req: Request, res: Response) => {
  try {
    // Criar um ID de grupo para vincular as artes
    const groupId = uuidv4();
    console.log(`Criando grupo de teste com ID: ${groupId}`);
    
    // Obter a lista de artes existentes
    const result = await db.execute(sql`
      SELECT * FROM artes 
      LIMIT 6
    `);
    
    const existingArts = result.rows || [];
    if (existingArts.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Não há artes suficientes para criar um grupo de teste'
      });
    }
    
    // Usar as 4 primeiras artes para criar um grupo
    const artsToUpdate = existingArts.slice(0, 4);
    const updatedArts = [];
    
    // Atualizar as artes com o mesmo groupId
    for (let i = 0; i < artsToUpdate.length; i++) {
      const art = artsToUpdate[i];
      
      // Atribuir formatos diferentes para cada arte
      const formato = ['Feed', 'Stories', 'Cartaz', 'Web Banner'][i];
      
      // Atualizar a arte no banco de dados
      const updateResult = await db.execute(sql`
        UPDATE artes 
        SET "groupId" = ${groupId}, format = ${formato}
        WHERE id = ${art.id}
        RETURNING *
      `);
      
      if (updateResult.rows && updateResult.rows.length > 0) {
        updatedArts.push(updateResult.rows[0]);
      }
    }
    
    // Retornar o resultado
    return res.json({
      success: true,
      message: 'Grupo de teste criado com sucesso',
      groupId,
      arts: updatedArts
    });
  } catch (error) {
    console.error('Erro ao criar grupo de teste:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar grupo de teste'
    });
  }
});

export default router;