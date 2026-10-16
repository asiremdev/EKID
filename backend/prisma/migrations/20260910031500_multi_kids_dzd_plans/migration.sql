-- Plans: yearly + founder lifetime
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'YEAR_1';
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'LIFETIME';

-- Multiple children per parent
DROP INDEX IF EXISTS "children_parentId_key";
CREATE INDEX IF NOT EXISTS "children_parentId_idx" ON "children"("parentId");
