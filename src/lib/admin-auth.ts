import { supabase } from './supabase';

export async function verifyAdmin(walletAddress: string): Promise<{
  isAdmin: boolean;
  role?: string;
  permissions?: string[];
}> {
  const { data: user, error: userError } = await supabase
    .from('User')
    .select('id, isAdmin')
    .eq('walletAddress', walletAddress)
    .single();

  if (userError || !user?.isAdmin) {
    return { isAdmin: false };
  }

  const { data: admin, error: adminError } = await supabase
    .from('Admin')
    .select('role, permissions')
    .eq('userId', user.id)
    .single();

  return {
    isAdmin: true,
    role: admin?.role || 'ADMIN',
    permissions: admin?.permissions || []
  };
}
