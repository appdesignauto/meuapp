-- Adicionar a coluna slug à tabela courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug TEXT;

-- Atualizar registros existentes com slugs baseados nos títulos
UPDATE courses
SET slug = 
  lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(title, '[àáâãäåāăąÀÁÂÃÄÅĀĂĄ]', 'a', 'g'),
            '[èéêëēĕėęěÈÉÊËĒĔĖĘĚ]', 'e', 'g'),
          '[ìíîïìĩīĭÌÍÎÏÌĨĪĬ]', 'i', 'g'),
        '[òóôõöōŏőÒÓÔÕÖŌŎŐ]', 'o', 'g'),
      '[ùúûüũūŭůÙÚÛÜŨŪŬŮ]', 'u', 'g')
  ) -- Remove acentos
  COLLATE "C" -- Força collation "C" para normalizção
);

-- Substituir os espaços por traços
UPDATE courses
SET slug = regexp_replace(slug, '[^a-z0-9]+', '-', 'g');

-- Remover hífens duplicados
UPDATE courses
SET slug = regexp_replace(slug, '-+', '-', 'g');

-- Remover hífens do início e fim
UPDATE courses
SET slug = regexp_replace(regexp_replace(slug, '^-+', ''), '-+$', '');

-- Adicionar um timestamp para slugs vazios
UPDATE courses
SET slug = CONCAT('curso-', EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::TEXT)
WHERE slug IS NULL OR slug = '';

-- Verificar slugs duplicados e adicionar um número ao final
WITH duplicates AS (
  SELECT slug, COUNT(*) as count, MIN(id) as first_id
  FROM courses
  GROUP BY slug
  HAVING COUNT(*) > 1
)
UPDATE courses c
SET slug = CONCAT(c.slug, '-', c.id)
WHERE EXISTS (
  SELECT 1 FROM duplicates d
  WHERE d.slug = c.slug AND c.id != d.first_id
);

-- Adicionar restrição UNIQUE para o slug para garantir que não haja duplicatas no futuro
ALTER TABLE courses ADD CONSTRAINT courses_slug_unique UNIQUE (slug);