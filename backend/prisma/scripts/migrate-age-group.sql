-- Migrate AgeGroup enum from legacy Kiddy values to WLIDI values.
-- Run BEFORE: npx prisma db push
--
-- Mapping:
--   AGE_3_4   → AGE_3_5
--   AGE_5_6   → AGE_5_7
--   AGE_7_9   → AGE_7_10
--   AGE_10_12 → AGE_7_10

-- 1) Cast enum columns to text so we can rewrite values freely
ALTER TABLE "children" ALTER COLUMN "ageGroup" TYPE text USING "ageGroup"::text;
ALTER TABLE "activities" ALTER COLUMN "ageGroup" TYPE text USING "ageGroup"::text;
ALTER TABLE "challenges" ALTER COLUMN "ageGroup" TYPE text USING "ageGroup"::text;

-- 2) Rewrite legacy labels
UPDATE "children"
SET "ageGroup" = CASE
  WHEN "ageGroup" = 'AGE_3_4' THEN 'AGE_3_5'
  WHEN "ageGroup" = 'AGE_5_6' THEN 'AGE_5_7'
  WHEN "ageGroup" IN ('AGE_7_9', 'AGE_10_12') THEN 'AGE_7_10'
  ELSE "ageGroup"
END;

UPDATE "activities"
SET "ageGroup" = CASE
  WHEN "ageGroup" = 'AGE_3_4' THEN 'AGE_3_5'
  WHEN "ageGroup" = 'AGE_5_6' THEN 'AGE_5_7'
  WHEN "ageGroup" IN ('AGE_7_9', 'AGE_10_12') THEN 'AGE_7_10'
  ELSE "ageGroup"
END;

UPDATE "challenges"
SET "ageGroup" = CASE
  WHEN "ageGroup" = 'AGE_3_4' THEN 'AGE_3_5'
  WHEN "ageGroup" = 'AGE_5_6' THEN 'AGE_5_7'
  WHEN "ageGroup" IN ('AGE_7_9', 'AGE_10_12') THEN 'AGE_7_10'
  ELSE "ageGroup"
END
WHERE "ageGroup" IS NOT NULL;

-- 3) Replace enum type
DROP TYPE "AgeGroup";
CREATE TYPE "AgeGroup" AS ENUM ('AGE_3_5', 'AGE_5_7', 'AGE_7_10');

-- 4) Cast columns back to enum
ALTER TABLE "children" ALTER COLUMN "ageGroup" TYPE "AgeGroup" USING "ageGroup"::"AgeGroup";
ALTER TABLE "activities" ALTER COLUMN "ageGroup" TYPE "AgeGroup" USING "ageGroup"::"AgeGroup";
ALTER TABLE "challenges" ALTER COLUMN "ageGroup" TYPE "AgeGroup" USING "ageGroup"::"AgeGroup";
