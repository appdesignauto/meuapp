/**
 * Script para testar a funcionalidade de logs de webhook
 * Insere alguns logs de teste na tabela webhook_logs
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createTestLogs() {
  try {
    console.log('Inserindo logs de teste no banco de dados...');
    
    // Criar alguns logs de teste com diferentes tipos de eventos
    const eventTypes = [
      'PURCHASE_APPROVED',
      'SUBSCRIPTION_CANCELLATION',
      'SUBSCRIPTION_REACTIVATED',
      'PURCHASE_COMPLETE',
      'SUBSCRIPTION_EXPIRED'
    ];
    
    const statuses = ['success', 'error'];
    const emails = [
      'cliente1@example.com',
      'cliente2@example.com',
      'cliente3@example.com',
      'teste@hotmart.com',
      'suporte@designauto.app'
    ];
    
    // Criar 10 logs de teste
    for (let i = 0; i < 10; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const email = emails[Math.floor(Math.random() * emails.length)];
      
      // Payload de exemplo para os logs
      const payload = {
        data: {
          product: { id: '5381714', name: 'Design Auto Premium' },
          purchase: {
            offer: { code: 'aukjngrt' },
            transaction: `TRANS${Date.now()}${i}`,
            buyer: { email }
          },
          subscription: {
            subscriber: { email, code: `SUB${Date.now()}${i}` }
          }
        },
        event: eventType,
        id: `EVT${Date.now()}${i}`,
        source: 'hotmart'
      };
      
      // Criar o log usando SQL direto para garantir compatibilidade com nomes das colunas
      await prisma.$executeRawUnsafe(`
        INSERT INTO webhook_logs (event_type, status, email, source, raw_payload, error_message)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, 
      eventType, 
      status, 
      email, 
      'hotmart', 
      JSON.stringify(payload),
      status === 'error' ? 'Erro simulado para teste' : null
      );
      
      console.log(`✅ Log ${i+1} criado: ${eventType} - ${status} - ${email}`);
    }
    
    console.log('✅ Todos os logs de teste foram criados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar logs de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a função para criar os logs de teste
createTestLogs();