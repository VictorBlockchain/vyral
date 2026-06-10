import { NextResponse } from 'next/server';
import { Actor, HttpAgent } from '@dfinity/agent';
import { IDL } from '@dfinity/candid';

// Server-side proxy to the canister. Configure CANISTER_ID in your environment.
export async function GET() {
  const canisterId = process.env.CANISTER_ID || process.env.NEXT_PUBLIC_CANISTER_ID || process.env.NEXT_PUBLIC_VYRAL_CANISTER_ID;
  if (!canisterId) {
    return NextResponse.json({ ok: false, message: 'Canister ID not configured' }, { status: 500 });
  }

  const idlFactory = (IDLParam: typeof IDL) => {
    const Follower = IDLParam.Record({
      id: IDLParam.Text,
      displayName: IDLParam.Opt(IDLParam.Text),
      profileBio: IDLParam.Opt(IDLParam.Text),
      followerCount: IDLParam.Nat64,
      followingCount: IDLParam.Nat64,
      verified: IDLParam.Bool,
      accountType: IDLParam.Opt(IDLParam.Text),
      location: IDLParam.Opt(IDLParam.Text),
      language: IDLParam.Opt(IDLParam.Text),
      joinDate: IDLParam.Opt(IDLParam.Int),
      mutual: IDLParam.Bool,
      engagementWithYou: IDLParam.Nat64,
      lastActive: IDLParam.Int,
      topInterests: IDLParam.Vec(IDLParam.Text),
      topVideos: IDLParam.Vec(IDLParam.Text),
      createdAt: IDLParam.Int,
      updatedAt: IDLParam.Int,
      riskFlags: IDLParam.Vec(IDLParam.Text),
    });

    const TopRet = IDLParam.Record({ ok: IDLParam.Bool, followers: IDLParam.Vec(Follower), message: IDLParam.Text });

    return IDLParam.Service({
      'topFollowers': IDLParam.Func([IDLParam.Nat], [TopRet], ['query']),
    });
  };

  const agent = new HttpAgent({ host: 'https://ic0.app' });
  // fetch root key only for local development; production should omit
  await agent.fetchRootKey().catch(() => {});
  const actor = Actor.createActor(idlFactory, { agent, canisterId });

  try {
    const res = await (actor as any).topFollowers(5n);
    if (!res.ok) {
      return NextResponse.json({ ok: false, message: res.message || 'error from canister' }, { status: 500 });
    }

    const followers = (res.followers || []).map((f: any) => ({
      id: f.id,
      displayName: (f.displayName && f.displayName[0]) || null,
      followerCount: Number(f.followerCount || 0n),
      mutual: !!f.mutual,
    }));

    return NextResponse.json({ ok: true, followers });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: String(err?.message || err) }, { status: 500 });
  }
}
