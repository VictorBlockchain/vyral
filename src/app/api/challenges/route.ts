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

    console.log('Fetching challenges with filters:', { status, limit, offset });

    const { data, error } = await challengeQueries.getAll({
      status: status || undefined,
      limit,
      offset,
    });

    if (error) {
      console.error('Supabase error fetching challenges:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    console.log('Successfully fetched challenges:', data?.length || 0);
    return NextResponse.json({ challenges: data });
  } catch (error: any) {
    console.error('Error fetching challenges:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, rewardAmount, tokenMint, endDate, creatorId, thumbnailUrl } = body;

    // Validate required fields
    if (!title || !description || !rewardAmount || !endDate || !creatorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Creating challenge with escrow wallet...');

    // Generate escrow wallet for the challenge
    const { publicKey: escrowPublicKey, encryptedSecretKey } = 
      await EscrowService.createEscrowWallet();

    console.log('Escrow wallet generated:', escrowPublicKey);

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
      thumbnailUrl: thumbnailUrl || null,
      escrowPublicKey,
      escrowSecretKey: encryptedSecretKey,
    }).select().single();

    if (error) {
      console.error('Error inserting challenge:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Challenge created successfully:', data.id);
    return NextResponse.json({ challenge: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating challenge:', error);
    console.error('Error details:', error.message);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
