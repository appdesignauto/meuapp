-- Create popup tables
CREATE TABLE IF NOT EXISTS "popups" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "imageUrl" TEXT,
  "buttonText" TEXT,
  "buttonUrl" TEXT,
  "backgroundColor" TEXT DEFAULT '#FFFFFF',
  "textColor" TEXT DEFAULT '#000000',
  "buttonColor" TEXT DEFAULT '#4F46E5',
  "buttonTextColor" TEXT DEFAULT '#FFFFFF',
  "position" TEXT DEFAULT 'center',
  "size" TEXT DEFAULT 'medium',
  "animation" TEXT DEFAULT 'fade',
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  "showOnce" BOOLEAN DEFAULT false,
  "showToLoggedUsers" BOOLEAN DEFAULT true,
  "showToGuestUsers" BOOLEAN DEFAULT true,
  "showToPremiumUsers" BOOLEAN DEFAULT true,
  "frequency" INTEGER DEFAULT 1,
  "delay" INTEGER DEFAULT 2,
  "isActive" BOOLEAN DEFAULT true,
  "createdBy" INTEGER NOT NULL REFERENCES "users"("id"),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "popupViews" (
  "id" SERIAL PRIMARY KEY,
  "popupId" INTEGER NOT NULL REFERENCES "popups"("id"),
  "userId" INTEGER REFERENCES "users"("id"),
  "sessionId" TEXT,
  "action" TEXT DEFAULT 'view',
  "viewedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);