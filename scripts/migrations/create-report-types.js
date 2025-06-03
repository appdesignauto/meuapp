import 'dotenv/config'; // Carregar variáveis de ambiente

// Importar o necessário para conectar ao banco de dados
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

// Função principal para conectar ao banco e criar os tipos de denúncia
async function main() {
  try {
    console.log('Conectando ao banco de dados...');
    const sql = neon(process.env.DATABASE_URL);
    
    // Verificar se a tabela reportTypes existe
    const checkTableResult = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'reportTypes'
      );
    `;

    const tableExists = checkTableResult[0].exists;
    if (!tableExists) {
      console.log('A tabela reportTypes não existe. Criando...');
      await sql`
        CREATE TABLE "reportTypes" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `;
      console.log('Tabela reportTypes criada com sucesso');
    }

    // Verificar se já existem tipos de denúncia
    const existingTypes = await sql`SELECT * FROM "reportTypes";`;
    if (existingTypes.length > 0) {
      console.log(`Já existem ${existingTypes.length} tipos de denúncia no banco:`);
      existingTypes.forEach(type => {
        console.log(`- ${type.id}: ${type.name}`);
      });
      return;
    }

    // Tipos de denúncia padrão
    const defaultReportTypes = [
      {
        name: 'Plágio',
        description: 'Conteúdo copiado sem autorização ou crédito apropriado'
      },
      {
        name: 'Conteúdo impróprio',
        description: 'Material ofensivo, inadequado ou violento'
      },
      {
        name: 'Erro técnico',
        description: 'Problemas técnicos com a plataforma ou conteúdo'
      },
      {
        name: 'Direitos autorais',
        description: 'Violação de direitos autorais ou propriedade intelectual'
      },
      {
        name: 'Outros',
        description: 'Outros problemas não listados acima'
      }
    ];

    // Inserir os tipos de denúncia
    console.log('Inserindo tipos de denúncia padrão...');
    for (const type of defaultReportTypes) {
      await sql`
        INSERT INTO "reportTypes" ("name", "description")
        VALUES (${type.name}, ${type.description});
      `;
    }

    console.log('Tipos de denúncia inseridos com sucesso!');
    
    // Mostrar os tipos criados
    const createdTypes = await sql`SELECT * FROM "reportTypes";`;
    console.log('Tipos de denúncia disponíveis:');
    createdTypes.forEach(type => {
      console.log(`- ${type.id}: ${type.name} - ${type.description}`);
    });

  } catch (error) {
    console.error('Erro ao criar tipos de denúncia:', error);
  }
}

// Executar a função principal
main().then(() => process.exit(0)).catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});

// Necessário para módulos ES
export {};