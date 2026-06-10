import { NextResponse } from 'next/server';
import { challengeQueries } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { EscrowService } from '@/lib/escrow';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data, error } = await challengeQueries.getAll({
      status: status || undefined,
      limit,
      offset,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ challenges: data });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, rewardAmount, tokenMint, endDate, creatorId } = body;

    // Validate required fields
    if (!title || !description || !rewardAmount || !endDate || !creatorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate escrow wallet for the challenge
    const { publicKey: escrowPublicKey, encryptedSecretKey } = 
      await EscrowService.createEscrowWallet();

    // TODO: Verify user has enough VYRAL tokens before creating challenge
    // TODO: Create escrow transaction for reward amount

    const { data, error } = await supabase.from('Challenge').insert({
      title,
      description,
      rewardAmount,
      tokenMint: tokenMint || process.env.NEXT_PUBLIC_VYRAL_TOKEN_MINT_ADDRESS,
      endDate: new Date(endDate).toISOString(),
      creatorId,
      status: 'ACTIVE',
      escrowPublicKey,
      escrowSecretKey: encryptedSecretKey,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ challenge: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
