-- Tornando título e conteúdo dos popups opcionais

-- Modificar a coluna title para aceitar valores nulos
ALTER TABLE popups ALTER COLUMN title DROP NOT NULL;

-- Modificar a coluna content para aceitar valores nulos
ALTER TABLE popups ALTER COLUMN content DROP NOT NULL;

-- Opcionalmente, podemos definir valores padrão para os campos
-- ALTER TABLE popups ALTER COLUMN title SET DEFAULT NULL;
-- ALTER TABLE popups ALTER COLUMN content SET DEFAULT NULL;