import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const [
      totalChallengesResult,
      activeChallengesResult,
      totalUsersResult,
      totalSubmissionsResult,
      pendingPayoutsResult,
    ] = await Promise.all([
      supabase.from('Challenge').select('*', { count: 'exact', head: true }),
      supabase.from('Challenge').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('User').select('*', { count: 'exact', head: true }),
      supabase.from('Submission').select('*', { count: 'exact', head: true }),
      supabase.from('Challenge').select('*', { count: 'exact', head: true }).eq('payoutStatus', 'PENDING'),
    ]);

    const stats = {
      totalChallenges: totalChallengesResult.count || 0,
      activeChallenges: activeChallengesResult.count || 0,
      totalUsers: totalUsersResult.count || 0,
      totalSubmissions: totalSubmissionsResult.count || 0,
      pendingPayouts: pendingPayoutsResult.count || 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
