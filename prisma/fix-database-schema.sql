-- Fix User table schema issues
-- Run this in Supabase SQL Editor

-- Drop the User table if it exists and recreate it properly
DROP TABLE IF EXISTS "Vote" CASCADE;
DROP TABLE IF EXISTS "Submission" CASCADE;
DROP TABLE IF EXISTS "Challenge" CASCADE;
DROP TABLE IF EXISTS "Admin" CASCADE;
DROP TABLE IF EXISTS "Transaction" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Drop enums if they exist
DROP TYPE IF EXISTS "ChallengeStatus" CASCADE;
DROP TYPE IF EXISTS "SubmissionStatus" CASCADE;
DROP TYPE IF EXISTS "PayoutStatus" CASCADE;
DROP TYPE IF EXISTS "AdminRole" CASCADE;
DROP TYPE IF EXISTS "TransactionType" CASCADE;
DROP TYPE IF EXISTS "TransactionStatus" CASCADE;

-- Recreate enums
CREATE TYPE "ChallengeStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WINNER');
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR');
CREATE TYPE "TransactionType" AS ENUM ('ESCROW_DEPOSIT', 'PAYOUT', 'REFUND');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- Create User table with proper defaults
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "walletAddress" TEXT NOT NULL,
    "username" TEXT,
    "vyralBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create unique index on wallet address
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- Create Challenge table
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rewardAmount" DECIMAL(65,30) NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'ACTIVE',
    "creatorId" TEXT NOT NULL,
    "escrowPublicKey" TEXT,
    "escrowSecretKey" TEXT,
    "winnerId" TEXT,
    "payoutTxSignature" TEXT,
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "payoutAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "closedAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Challenge_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT
);

-- Create Submission table
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "description" TEXT,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Submission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE,
    CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT,
    CONSTRAINT "Submission_challengeId_userId_key" UNIQUE ("challengeId", "userId")
);

-- Create Vote table
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "submissionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Vote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE,
    CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT,
    CONSTRAINT "Vote_submissionId_userId_key" UNIQUE ("submissionId", "userId")
);

-- Create Admin table
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Admin_userId_key" UNIQUE ("userId")
);

-- Create Transaction table
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "challengeId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "txSignature" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Transaction_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE
);

-- Add winner relation
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_winnerId_fkey" 
    FOREIGN KEY ("winnerId") REFERENCES "Submission"("id") ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX "Challenge_creatorId_idx" ON "Challenge"("creatorId");
CREATE INDEX "Challenge_status_idx" ON "Challenge"("status");
CREATE INDEX "Challenge_endDate_idx" ON "Challenge"("endDate");
CREATE INDEX "Submission_challengeId_idx" ON "Submission"("challengeId");
CREATE INDEX "Submission_userId_idx" ON "Submission"("userId");
CREATE INDEX "Vote_submissionId_idx" ON "Vote"("submissionId");
CREATE INDEX "Vote_userId_idx" ON "Vote"("userId");

-- Create triggers for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenge_updated_at BEFORE UPDATE ON "Challenge"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS for development
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Challenge" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Vote" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Admin" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" DISABLE ROW LEVEL SECURITY;
