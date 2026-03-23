-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('HOLDER', 'CLAIMER', 'BOTH');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('GOING_MYSELF', 'AVAILABLE', 'CLAIMED', 'TRANSFERRED', 'COMPLETE', 'SOLD_ELSEWHERE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'CONFIRMED', 'RELEASED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'REQUESTED', 'PAID', 'WAIVED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('NOT_STARTED', 'SENT', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EMAIL_VERIFY', 'PASSWORD_RESET', 'MAGIC_LINK');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CLAIM_CREATED', 'CLAIM_RELEASED', 'PAYMENT_UPDATED', 'TRANSFER_UPDATED', 'GAME_ADDED', 'GAME_UPDATED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLAIMER',
    "venmoHandle" TEXT,
    "zelleInfo" TEXT,
    "emailVerified" TIMESTAMP(3),
    "notificationPrefs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sport" TEXT NOT NULL DEFAULT 'MLB',
    "team" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "row" TEXT,
    "seats" TEXT NOT NULL,
    "seatCount" INTEGER NOT NULL,
    "season" TEXT NOT NULL,
    "shareLinkSlug" TEXT NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "defaultPricePerTicket" DECIMAL(10,2),
    "defaultAvailability" "GameStatus" NOT NULL DEFAULT 'AVAILABLE',
    "defaultSplitRule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "opponent" TEXT NOT NULL,
    "opponentLogo" TEXT,
    "status" "GameStatus" NOT NULL DEFAULT 'AVAILABLE',
    "pricePerTicket" DECIMAL(10,2),
    "splitRule" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "claimerUserId" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "transferStatus" "TransferStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "releasedAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "claimerUserId" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" "BillingCycle",
    "packagesCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Package_shareLinkSlug_key" ON "Package"("shareLinkSlug");

-- CreateIndex
CREATE INDEX "Package_userId_idx" ON "Package"("userId");

-- CreateIndex
CREATE INDEX "Game_packageId_idx" ON "Game"("packageId");

-- CreateIndex
CREATE INDEX "Game_date_idx" ON "Game"("date");

-- CreateIndex
CREATE INDEX "Game_status_idx" ON "Game"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Game_packageId_date_key" ON "Game"("packageId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_gameId_key" ON "Claim"("gameId");

-- CreateIndex
CREATE INDEX "Claim_claimerUserId_idx" ON "Claim"("claimerUserId");

-- CreateIndex
CREATE INDEX "Claim_transferStatus_idx" ON "Claim"("transferStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_packageId_claimerUserId_key" ON "Invitation"("packageId", "claimerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Token_token_key" ON "Token"("token");

-- CreateIndex
CREATE INDEX "Token_userId_idx" ON "Token"("userId");

-- CreateIndex
CREATE INDEX "Token_token_idx" ON "Token"("token");

-- CreateIndex
CREATE INDEX "Activity_packageId_idx" ON "Activity"("packageId");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_sentAt_idx" ON "Notification"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_claimerUserId_fkey" FOREIGN KEY ("claimerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_claimerUserId_fkey" FOREIGN KEY ("claimerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
