-- Adicionar campo de seguidores iniciais na tabela socialNetworks
ALTER TABLE "socialNetworks" ADD COLUMN IF NOT EXISTS "initialFollowers" integer DEFAULT 0 NOT NULL;

-- Adicionar campo de crescimento calculado na tabela socialGrowthData
ALTER TABLE "socialGrowthData" ADD COLUMN IF NOT EXISTS "growthFromPrevious" integer DEFAULT 0;

-- Atualizar os comentários das colunas existentes
COMMENT ON COLUMN "socialGrowthData"."recordDate" IS 'Data do registro (flexível - não apenas primeiro dia do mês)';
COMMENT ON COLUMN "socialGrowthData"."followers" IS 'Valor absoluto atual de seguidores';
COMMENT ON COLUMN "socialGrowthData"."growthFromPrevious" IS 'Crescimento/queda calculado automaticamente';
COMMENT ON COLUMN "socialNetworks"."initialFollowers" IS 'Seguidores iniciais no momento do cadastro';