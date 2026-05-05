-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT IF EXISTS "Invitation_claimerUserId_fkey";
ALTER TABLE "Invitation" DROP CONSTRAINT IF EXISTS "Invitation_packageId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "isHolder";
ALTER TABLE "User" DROP COLUMN IF EXISTS "isClaimer";

-- DropTable
DROP TABLE IF EXISTS "Invitation";
