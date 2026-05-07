-- CreateEnum
CREATE TYPE "PackageRole" AS ENUM ('OWNER', 'CO_OWNER', 'CLAIMER');

-- CreateTable
CREATE TABLE "PackageMember" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "PackageRole" NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "PackageMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PackageMember_userId_idx" ON "PackageMember"("userId");

-- CreateIndex
CREATE INDEX "PackageMember_packageId_role_idx" ON "PackageMember"("packageId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "PackageMember_packageId_userId_key" ON "PackageMember"("packageId", "userId");

-- AddForeignKey
ALTER TABLE "PackageMember" ADD CONSTRAINT "PackageMember_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageMember" ADD CONSTRAINT "PackageMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
