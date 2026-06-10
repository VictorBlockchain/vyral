// Canister Type Definitions
// Generated from Motoko canister interface

export interface UserProfile {
  principal: string;
  username?: string;
  email?: string;
  icpBalance: bigint;
  totalUnfollows: number;
  totalEarnings: bigint;
  linkedAt: number;
  lastActive: number;
  tikTokHandle?: string;
}

export interface UnfollowSession {
  id: string;
  principal: string;
  startedAt: number;
  endedAt?: number;
  unfollowCount: number;
  costPerUnfollow: bigint;
  totalCost: bigint;
  status: 'active' | 'completed' | 'failed';
}

export interface RegisterRequest {
  tikTokHandle: string;
  email: string;
}

export interface DepositRequest {
  amount: bigint;
}

export interface UnfollowRequest {
  count: number;
  costPerUnfollow: bigint;
}

export interface RegisterResponse {
  ok: boolean;
  message: string;
}

export interface GetProfileResponse {
  ok: boolean;
  profile?: UserProfile;
  message: string;
}

export interface DepositResponse {
  ok: boolean;
  newBalance: bigint;
  message: string;
}

export interface StartSessionResponse {
  ok: boolean;
  sessionId?: string;
  message: string;
}

export interface CompleteSessionResponse {
  ok: boolean;
  message: string;
}

export interface GetSessionResponse {
  ok: boolean;
  session?: UnfollowSession;
  message: string;
}

export interface StatsResponse {
  totalUsers: number;
  activeSessions: number;
  totalUnfollows: number;
}
