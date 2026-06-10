-- Vyral Database Schema - PostgreSQL
-- Generated from Prisma schema with improvements

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE "ChallengeStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'PAUSED');
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WINNER');
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR');
CREATE TYPE "TransactionType" AS ENUM ('ESCROW_DEPOSIT', 'PAYOUT', 'REFUND');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');
CREATE TYPE "NotificationType" AS ENUM ('CHALLENGE_CREATED', 'SUBMISSION_RECEIVED', 'VOTE_RECEIVED', 'CHALLENGE_WON', 'PAYOUT_COMPLETED');

-- Users table
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "walletAddress" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "websiteUrl" TEXT,
    "twitterHandle" TEXT,
    "tiktokHandle" TEXT,
    "vyralBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalChallengesCreated" INTEGER NOT NULL DEFAULT 0,
    "totalChallengesWon" INTEGER NOT NULL DEFAULT 0,
    "totalSubmissions" INTEGER NOT NULL DEFAULT 0,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3), -- Soft delete

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create unique index on wallet address (only for non-deleted users)
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress") WHERE "deletedAt" IS NULL;

-- Create index for email lookups
CREATE INDEX "User_email_idx" ON "User"("email") WHERE "email" IS NOT NULL;

-- Challenges table
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rewardAmount" DECIMAL(65,30) NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "category" TEXT, -- e.g., 'video', 'design', 'music', 'writing'
    "tags" TEXT[], -- Array of tags for filtering
    "requirements" TEXT, -- Detailed requirements for the challenge
    "rules" TEXT, -- Rules and guidelines
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxSubmissions" INTEGER, -- NULL for unlimited
    "status" "ChallengeStatus" NOT NULL DEFAULT 'ACTIVE',
    "creatorId" TEXT NOT NULL,
    
    -- Escrow wallet
    "escrowPublicKey" TEXT,
    "escrowSecretKey" TEXT,
    
    -- Winner & payout tracking
    "winnerId" TEXT,
    "payoutTxSignature" TEXT,
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "payoutAt" TIMESTAMP(3),
    
    -- Admin tracking
    "closedBy" TEXT,
    "closedAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    
    -- Metrics
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "submissionCount" INTEGER NOT NULL DEFAULT 0,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    
    -- Media
    "thumbnailUrl" TEXT,
    "bannerUrl" TEXT,
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3), -- Soft delete

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Challenge_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT,
    CONSTRAINT "Challenge_rewardAmount_check" CHECK ("rewardAmount" > 0),
    CONSTRAINT "Challenge_endDate_check" CHECK ("endDate" > "startDate")
);

-- Unique slug for SEO-friendly URLs
CREATE UNIQUE INDEX "Challenge_slug_key" ON "Challenge"("slug") WHERE "deletedAt" IS NULL;

-- Indexes for common queries
CREATE INDEX "Challenge_creatorId_idx" ON "Challenge"("creatorId");
CREATE INDEX "Challenge_status_idx" ON "Challenge"("status");
CREATE INDEX "Challenge_endDate_idx" ON "Challenge"("endDate");
CREATE INDEX "Challenge_category_idx" ON "Challenge"("category");
CREATE INDEX "Challenge_createdAt_idx" ON "Challenge"("createdAt" DESC);

-- Submissions table
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT, -- Admin feedback
    "reviewedBy" TEXT, -- Admin who reviewed
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3), -- Soft delete

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Submission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE,
    CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT,
    CONSTRAINT "Submission_challengeId_userId_key" UNIQUE ("challengeId", "userId")
);

-- Indexes for submissions
CREATE INDEX "Submission_challengeId_idx" ON "Submission"("challengeId");
CREATE INDEX "Submission_userId_idx" ON "Submission"("userId");
CREATE INDEX "Submission_status_idx" ON "Submission"("status");
CREATE INDEX "Submission_voteCount_idx" ON "Submission"("voteCount" DESC);
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt" DESC);

-- Votes table
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "submissionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1, -- For future: weighted voting based on token holdings
    "ipAddress" TEXT, -- For rate limiting (hashed for privacy)
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Vote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE,
    CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT,
    CONSTRAINT "Vote_submissionId_userId_key" UNIQUE ("submissionId", "userId")
);

-- Indexes for votes
CREATE INDEX "Vote_submissionId_idx" ON "Vote"("submissionId");
CREATE INDEX "Vote_userId_idx" ON "Vote"("userId");
CREATE INDEX "Vote_createdAt_idx" ON "Vote"("createdAt" DESC);

-- Admins table
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "permissions" TEXT[], -- Array of permission strings
    "notes" TEXT,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Admin_userId_key" UNIQUE ("userId")
);

CREATE INDEX "Admin_role_idx" ON "Admin"("role");

-- Transactions table (Audit trail)
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "challengeId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "txSignature" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB, -- Additional transaction data
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Transaction_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE,
    CONSTRAINT "Transaction_amount_check" CHECK ("amount" > 0)
);

CREATE INDEX "Transaction_challengeId_idx" ON "Transaction"("challengeId");
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt" DESC);
CREATE INDEX "Transaction_txSignature_idx" ON "Transaction"("txSignature");

-- Notifications table
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT, -- URL to related resource
    "metadata" JSONB, -- Additional data
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt" DESC);

-- Challenge bookmarks/favorites
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Bookmark_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE,
    CONSTRAINT "Bookmark_userId_challengeId_key" UNIQUE ("userId", "challengeId")
);

CREATE INDEX "Bookmark_userId_idx" ON "Bookmark"("userId");
CREATE INDEX "Bookmark_challengeId_idx" ON "Bookmark"("challengeId");

-- Activity log for auditing
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT,
    "action" TEXT NOT NULL, -- e.g., 'CHALLENGE_CREATED', 'VOTE_CAST'
    "entityType" TEXT NOT NULL, -- e.g., 'Challenge', 'Submission'
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt" DESC);

-- Add winner relation to Challenge (separate from the circular relation)
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_winnerId_fkey" 
    FOREIGN KEY ("winnerId") REFERENCES "Submission"("id") ON DELETE SET NULL;

-- Triggers for automatic timestamp updates
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

CREATE TRIGGER update_submission_updated_at BEFORE UPDATE ON "Submission"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_updated_at BEFORE UPDATE ON "Admin"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update challenge submission count
CREATE OR REPLACE FUNCTION update_challenge_submission_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "Challenge" 
        SET "submissionCount" = "submissionCount" + 1 
        WHERE "id" = NEW."challengeId";
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE "Challenge" 
        SET "submissionCount" = "submissionCount" - 1 
        WHERE "id" = OLD."challengeId";
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_challenge_submission_count_trigger
    AFTER INSERT OR DELETE ON "Submission"
    FOR EACH ROW EXECUTE FUNCTION update_challenge_submission_count();

-- Trigger to update submission vote count
CREATE OR REPLACE FUNCTION update_submission_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "Submission" 
        SET "voteCount" = "voteCount" + 1 
        WHERE "id" = NEW."submissionId";
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE "Submission" 
        SET "voteCount" = "voteCount" - 1 
        WHERE "id" = OLD."submissionId";
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_submission_vote_count_trigger
    AFTER INSERT OR DELETE ON "Vote"
    FOR EACH ROW EXECUTE FUNCTION update_submission_vote_count();
