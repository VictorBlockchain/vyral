import { NextResponse } from 'next/server';
import { voteQueries, supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { submissionId, userId } = body;

    if (!submissionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already voted
    const { hasVoted, error: voteCheckError } = await voteQueries.hasVoted(submissionId, userId);

    if (hasVoted) {
      return NextResponse.json({ error: 'Already voted' }, { status: 400 });
    }

    // Create vote
    const { data: vote, error: voteError } = await voteQueries.create({
      submissionId,
      userId,
    });

    if (voteError) {
      return NextResponse.json({ error: voteError.message }, { status: 500 });
    }

    // Update submission vote count
    const { error: updateError } = await supabase
      .from('Submission')
      .update({ voteCount: supabase.rpc('increment_vote_count') })
      .eq('id', submissionId);

    if (updateError) {
      // Fallback: manually increment
      await supabase.rpc('increment_vote_count', { submission_id: submissionId });
    }

    return NextResponse.json({ vote }, { status: 201 });
  } catch (error) {
    console.error('Error voting on submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
