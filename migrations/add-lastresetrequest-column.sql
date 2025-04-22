-- Adicionar coluna lastresetrequest à tabela users se ela não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'lastresetrequest'
    ) THEN 
        ALTER TABLE users ADD COLUMN lastresetrequest TIMESTAMP;
        RAISE NOTICE 'Coluna lastresetrequest adicionada com sucesso à tabela users';
    ELSE
        RAISE NOTICE 'Coluna lastresetrequest já existia na tabela users';
    END IF;
END $$;