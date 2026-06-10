import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = supabase
      .from('User')
      .select(`
        *,
        createdChallenges(count),
        submissions(count),
        votes(count)
      `)
      .order('createdAt', { ascending: false });

    if (search) {
      query = query.or(`walletAddress.ilike.%${search}%,username.ilike.%${search}%`);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');
    const adminStatus = await verifyAdmin(walletAddress || '');
    
    if (!adminStatus.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, isAdmin, username } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updates: any = {};
    if (isAdmin !== undefined) updates.isAdmin = isAdmin;
    if (username !== undefined) updates.username = username;

    const { data, error } = await supabase
      .from('User')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
