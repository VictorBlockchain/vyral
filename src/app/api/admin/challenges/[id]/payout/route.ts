import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { EscrowService } from '@/lib/escrow';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').slice(-2, -1)[0];
    const walletAddress = request.headers.get('x-wallet-address');

    const adminStatus = await verifyAdmin(walletAddress || '');
    if (!adminStatus.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { submissionId, action } = body;

    // Get challenge with escrow info
    const { data: challenge, error: challengeError } = await supabase
      .from('Challenge')
      .select('*')
      .eq('id', id)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (!challenge.escrowSecretKey) {
      return NextResponse.json({ error: 'No escrow wallet for this challenge' }, { status: 400 });
    }

    const escrowService = new EscrowService();

    if (action === 'PAYOUT' && submissionId) {
      // Get winner submission
      const { data: submission, error: submissionError } = await supabase
        .from('Submission')
        .select('*, user:User(walletAddress)')
        .eq('id', submissionId)
        .single();

      if (submissionError || !submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }

      // Process payout
      const txSignature = await escrowService.payoutWinner(
        challenge.escrowSecretKey,
        challenge.tokenMint,
        challenge.rewardAmount,
        submission.user.walletAddress
      );

      // Update challenge
      const { error: updateError } = await supabase
        .from('Challenge')
        .update({
          winnerId: submissionId,
          payoutTxSignature: txSignature,
          payoutStatus: 'COMPLETED',
          payoutAt: new Date().toISOString(),
          status: 'COMPLETED',
          closedBy: walletAddress,
          closedAt: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating challenge:', updateError);
      }

      // Update submission status
      await supabase
        .from('Submission')
        .update({ status: 'WINNER' })
        .eq('id', submissionId);

      // Record transaction
      await supabase.from('Transaction').insert({
        challengeId: id,
        type: 'PAYOUT',
        amount: challenge.rewardAmount,
        fromAddress: challenge.escrowPublicKey,
        toAddress: submission.user.walletAddress,
        txSignature,
        status: 'CONFIRMED',
      });

      return NextResponse.json({ success: true, txSignature });
    }

    if (action === 'REFUND') {
      // Get creator
      const { data: creator, error: creatorError } = await supabase
        .from('User')
        .select('walletAddress')
        .eq('id', challenge.creatorId)
        .single();

      if (creatorError || !creator) {
        return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
      }

      // Process refund
      const txSignature = await escrowService.refundCreator(
        challenge.escrowSecretKey,
        challenge.tokenMint,
        challenge.rewardAmount,
        creator.walletAddress
      );

      // Update challenge
      await supabase
        .from('Challenge')
        .update({
          payoutStatus: 'REFUNDED',
          status: 'CANCELLED',
          cancellationReason: body.reason || 'Refunded by admin',
          closedBy: walletAddress,
          closedAt: new Date().toISOString(),
        })
        .eq('id', id);

      // Record transaction
      await supabase.from('Transaction').insert({
        challengeId: id,
        type: 'REFUND',
        amount: challenge.rewardAmount,
        fromAddress: challenge.escrowPublicKey,
        toAddress: creator.walletAddress,
        txSignature,
        status: 'CONFIRMED',
      });

      return NextResponse.json({ success: true, txSignature });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing payout/refund:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
