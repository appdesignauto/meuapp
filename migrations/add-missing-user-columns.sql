-- Adicionar coluna origemassinatura à tabela users se ela não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'origemassinatura'
    ) THEN 
        ALTER TABLE users ADD COLUMN origemassinatura TEXT;
    END IF;
END $$;

-- Adicionar coluna tipoplano à tabela users se ela não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'tipoplano'
    ) THEN 
        ALTER TABLE users ADD COLUMN tipoplano TEXT;
    END IF;
END $$;

-- Adicionar coluna dataassinatura à tabela users se ela não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'dataassinatura'
    ) THEN 
        ALTER TABLE users ADD COLUMN dataassinatura TIMESTAMP;
    END IF;
END $$;

-- Adicionar coluna dataexpiracao à tabela users se ela não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'dataexpiracao'
    ) THEN 
        ALTER TABLE users ADD COLUMN dataexpiracao TIMESTAMP;
    END IF;
END $$;

-- Adicionar coluna acessovitalicio à tabela users se ela não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'acessovitalicio'
    ) THEN 
        ALTER TABLE users ADD COLUMN acessovitalicio BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Adicionar coluna observacaoadmin à tabela users se ela não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'observacaoadmin'
    ) THEN 
        ALTER TABLE users ADD COLUMN observacaoadmin TEXT;
    END IF;
END $$;

-- Adicionar coluna ultimologin à tabela users se ela não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'ultimologin'
    ) THEN 
        ALTER TABLE users ADD COLUMN ultimologin TIMESTAMP;
    END IF;
END $$;

-- Adicionar coluna criadoem à tabela users se ela não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'criadoem'
    ) THEN 
        ALTER TABLE users ADD COLUMN criadoem TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Adicionar coluna atualizadoem à tabela users se ela não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'atualizadoem'
    ) THEN 
        ALTER TABLE users ADD COLUMN atualizadoem TIMESTAMP DEFAULT NOW();
    END IF;
END $$;