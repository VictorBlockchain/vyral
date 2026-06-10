-- Disable Row Level Security for development
-- Run this in Supabase SQL Editor to allow anonymous access
-- WARNING: Only use this for development. Enable RLS with proper policies for production!

-- Disable RLS on all tables
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Challenge" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Vote" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Admin" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled, create permissive policies
-- Uncomment the section below instead of the DISABLE commands above

/*
-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable all access for User" ON "User";
DROP POLICY IF EXISTS "Enable all access for Challenge" ON "Challenge";
DROP POLICY IF EXISTS "Enable all access for Submission" ON "Submission";
DROP POLICY IF EXISTS "Enable all access for Vote" ON "Vote";
DROP POLICY IF EXISTS "Enable all access for Admin" ON "Admin";
DROP POLICY IF EXISTS "Enable all access for Transaction" ON "Transaction";

-- Create permissive policies for development
CREATE POLICY "Enable all access for User" ON "User"
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for Challenge" ON "Challenge"
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for Submission" ON "Submission"
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for Vote" ON "Vote"
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for Admin" ON "Admin"
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for Transaction" ON "Transaction"
    FOR ALL USING (true) WITH CHECK (true);
*/
