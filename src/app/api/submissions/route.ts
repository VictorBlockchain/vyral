import { NextResponse } from 'next/server';
import { submissionQueries, voteQueries } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { challengeId, userId, videoUrl, description } = body;

    if (!challengeId || !userId || !videoUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await submissionQueries.create({
      challengeId,
      userId,
      videoUrl,
      description,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ submission: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
