-- Verificar se a tabela já existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'failedWebhooks'
  ) THEN
    -- Criar a tabela failedWebhooks
    CREATE TABLE "failedWebhooks" (
      "id" SERIAL PRIMARY KEY,
      "webhookLogId" INTEGER,
      "source" VARCHAR(50) NOT NULL,
      "payload" JSONB NOT NULL,
      "errorMessage" TEXT NOT NULL,
      "retryCount" INTEGER DEFAULT 0,
      "lastRetryAt" TIMESTAMP,
      "status" VARCHAR(50) DEFAULT 'pending' NOT NULL,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Adicionar índice na coluna status
    CREATE INDEX idx_failed_webhooks_status ON "failedWebhooks" ("status");
    
    -- Adicionar índice na coluna source
    CREATE INDEX idx_failed_webhooks_source ON "failedWebhooks" ("source");
    
    RAISE NOTICE 'Tabela failedWebhooks e índices criados com sucesso!';
  ELSE
    RAISE NOTICE 'A tabela failedWebhooks já existe.';
  END IF;
END $$;