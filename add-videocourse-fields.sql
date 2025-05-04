-- Adicionar campos para a página de videoaulas nas configurações do site
ALTER TABLE "siteSettings"
ADD COLUMN IF NOT EXISTS "courseHeroTitle" TEXT DEFAULT 'DesignAuto Videoaulas',
ADD COLUMN IF NOT EXISTS "courseHeroSubtitle" TEXT DEFAULT 'A formação completa para você criar designs profissionais para seu negócio automotivo',
ADD COLUMN IF NOT EXISTS "courseHeroImageUrl" TEXT DEFAULT 'https://images.unsplash.com/photo-1617651823081-270acchia626?q=80&w=1970&auto=format&fit=crop',
ADD COLUMN IF NOT EXISTS "courseRating" TEXT DEFAULT '4.8',
ADD COLUMN IF NOT EXISTS "courseReviewCount" INTEGER DEFAULT 287,
ADD COLUMN IF NOT EXISTS "courseTotalHours" TEXT DEFAULT '42 horas',
ADD COLUMN IF NOT EXISTS "courseTotalModules" INTEGER DEFAULT 18;