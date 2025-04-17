-- Adicionar coluna nivelacesso à tabela users se ela não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'nivelacesso'
    ) THEN 
        ALTER TABLE users ADD COLUMN nivelacesso TEXT NOT NULL DEFAULT 'usuario';
        
        -- Atualizar valores de nivelacesso com base no campo role
        UPDATE users SET nivelacesso = role WHERE role IS NOT NULL;
    END IF;
END $$;