-- Verificar se a coluna isVisible já existe na tabela arts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'arts' AND column_name = 'isVisible'
  ) THEN
    -- Adicionar a coluna isVisible se não existir
    ALTER TABLE arts ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT TRUE;
    RAISE NOTICE 'Coluna isVisible adicionada com sucesso à tabela arts.';
  ELSE
    RAISE NOTICE 'A coluna isVisible já existe na tabela arts.';
  END IF;
END $$;