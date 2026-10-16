-- Phase 2C: Unified product architecture

-- Remove duplicate children (keep the row with the smallest id per parent)
DELETE FROM "children"
WHERE "id" NOT IN (
  SELECT DISTINCT ON ("parentId") "id"
  FROM "children"
  ORDER BY "parentId", "createdAt" ASC, "id" ASC
);

-- CreateEnum
CREATE TYPE "UnlockSource" AS ENUM ('AUTO', 'MANUAL');

-- AlterTable: children
ALTER TABLE "children" ADD COLUMN IF NOT EXISTS "protectionActive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "children" ADD COLUMN IF NOT EXISTS "onboardingComplete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "children" ADD COLUMN IF NOT EXISTS "defaultRuleId" TEXT;

-- CreateTable: protected_apps
CREATE TABLE IF NOT EXISTS "protected_apps" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "appLabel" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protected_apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable: reward_rules
CREATE TABLE IF NOT EXISTS "reward_rules" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "starsRequired" INTEGER NOT NULL,
    "minutesGranted" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_rules_pkey" PRIMARY KEY ("id")
);

-- AlterTable: unlocks
ALTER TABLE "unlocks" ADD COLUMN IF NOT EXISTS "source" "UnlockSource" NOT NULL DEFAULT 'MANUAL';

-- Unique constraint: one child per parent
CREATE UNIQUE INDEX IF NOT EXISTS "children_parentId_key" ON "children"("parentId");

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "protected_apps_childId_packageName_key" ON "protected_apps"("childId", "packageName");
CREATE INDEX IF NOT EXISTS "protected_apps_childId_idx" ON "protected_apps"("childId");
CREATE UNIQUE INDEX IF NOT EXISTS "reward_rules_childId_starsRequired_key" ON "reward_rules"("childId", "starsRequired");
CREATE INDEX IF NOT EXISTS "reward_rules_childId_idx" ON "reward_rules"("childId");
CREATE INDEX IF NOT EXISTS "unlocks_childId_appPackage_status_idx" ON "unlocks"("childId", "appPackage", "status");

-- ForeignKeys
ALTER TABLE "protected_apps" DROP CONSTRAINT IF EXISTS "protected_apps_childId_fkey";
ALTER TABLE "protected_apps" ADD CONSTRAINT "protected_apps_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reward_rules" DROP CONSTRAINT IF EXISTS "reward_rules_childId_fkey";
ALTER TABLE "reward_rules" ADD CONSTRAINT "reward_rules_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;
