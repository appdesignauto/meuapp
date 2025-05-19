/**
 * Script para criar a tabela de fila de webhooks da Hotmart
 * 
 * Este script cria uma tabela para armazenar todos os webhooks recebidos
 * da Hotmart, permitindo processamento assíncrono e prevenindo bloqueios
 * no servidor principal.
 */

import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function createWebhookQueueTable() {
  try {
    console.log('Criando tabela de fila de webhooks da Hotmart...');
    
    // Verificar se a tabela já existe
    const checkTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'hotmart_webhooks'
      );
    `);
    
    const tableExists = checkTableExists.rows[0].exists;
    
    if (tableExists) {
      console.log('A tabela hotmart_webhooks já existe. Pulando criação.');
      return;
    }
    
    // Criar a tabela de fila de webhooks
    await db.execute(sql`
      CREATE TABLE hotmart_webhooks (
        id SERIAL PRIMARY KEY,
        received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        processed_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'pending',
        event_type VARCHAR(100),
        purchase_transaction VARCHAR(100),
        payload JSONB,
        processing_attempts INTEGER DEFAULT 0,
        processing_error TEXT,
        processing_result JSONB
      );
    `);
    
    // Criar índices para melhorar a performance
    await db.execute(sql`
      CREATE INDEX idx_hotmart_webhooks_status ON hotmart_webhooks (status);
      CREATE INDEX idx_hotmart_webhooks_event_type ON hotmart_webhooks (event_type);
      CREATE INDEX idx_hotmart_webhooks_purchase_transaction ON hotmart_webhooks (purchase_transaction);
    `);
    
    console.log('Tabela hotmart_webhooks criada com sucesso!');
    
  } catch (error) {
    console.error('Erro ao criar tabela de fila de webhooks:', error);
    throw error;
  }
}

// Executar a função principal
createWebhookQueueTable()
  .then(() => {
    console.log('Script concluído com sucesso.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao executar script:', error);
    process.exit(1);
  });