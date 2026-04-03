-- Step 1: Add new boolean columns with defaults
ALTER TABLE "User" ADD COLUMN "isHolder" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "isClaimer" BOOLEAN NOT NULL DEFAULT true;

-- Step 2: Backfill from existing role column
UPDATE "User" SET "isHolder" = true, "isClaimer" = false WHERE "role" = 'HOLDER';
UPDATE "User" SET "isHolder" = false, "isClaimer" = true WHERE "role" = 'CLAIMER';
UPDATE "User" SET "isHolder" = true, "isClaimer" = true WHERE "role" = 'BOTH';

-- Step 3: Drop old column and enum
ALTER TABLE "User" DROP COLUMN "role";
DROP TYPE "UserRole";
