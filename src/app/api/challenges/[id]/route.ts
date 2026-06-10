import { NextResponse } from 'next/server';
import { supabase, challengeQueries, submissionQueries } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    const { data, error } = await challengeQueries.getById(id);

    if (error || !data) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    return NextResponse.json({ challenge: data });
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    const { data, error } = await supabase
      .from('Challenge')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ challenge: data });
  } catch (error) {
    console.error('Error updating challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
