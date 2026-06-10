// Script to create initial admin user
// Run with: npx tsx scripts/seed-admin.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const adminWallet = process.env.INITIAL_ADMIN_WALLET;

if (!adminWallet) {
  console.error('Error: INITIAL_ADMIN_WALLET not set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedAdmin() {
  console.log('Seeding admin user...');
  console.log('Wallet:', adminWallet);

  try {
    // Create or update user
    const { data: user, error: userError } = await supabase
      .from('User')
      .upsert({
        walletAddress: adminWallet,
        isAdmin: true,
        username: 'Admin',
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      process.exit(1);
    }

    console.log('User created/updated:', user.id);

    // Create admin record
    const { data: admin, error: adminError } = await supabase
      .from('Admin')
      .upsert({
        userId: user.id,
        role: 'SUPER_ADMIN',
        permissions: ['*'],
      })
      .select()
      .single();

    if (adminError) {
      console.error('Error creating admin:', adminError);
      process.exit(1);
    }

    console.log('Admin created successfully!');
    console.log('Admin ID:', admin.id);
    console.log('Role:', admin.role);
    console.log('Permissions:', admin.permissions);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

seedAdmin();
