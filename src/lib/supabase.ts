import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_vyral_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_vyral_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})

// Helper functions for common queries
export const challengeQueries = {
  getAll: async (filters?: { status?: string; limit?: number; offset?: number }) => {
    let query = supabase
      .from('Challenge')
      .select('*, creator:User(username, walletAddress)')
      .order('createdAt', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    return await query
  },

  getById: async (id: string) => {
    return await supabase
      .from('Challenge')
      .select('*, creator:User(username, walletAddress), submissions:Submission(*, user:User(username, walletAddress), votes:Vote(*))')
      .eq('id', id)
      .single()
  },

  getByCreator: async (creatorId: string) => {
    return await supabase
      .from('Challenge')
      .select('*')
      .eq('creatorId', creatorId)
      .order('createdAt', { ascending: false })
  },
}

export const userQueries = {
  getByWallet: async (walletAddress: string) => {
    return await supabase
      .from('User')
      .select('*')
      .eq('walletAddress', walletAddress)
      .single()
  },

  create: async (data: { walletAddress: string; username?: string }) => {
    return await supabase
      .from('User')
      .insert(data)
      .select()
      .single()
  },

  updateBalance: async (walletAddress: string, balance: number) => {
    return await supabase
      .from('User')
      .update({ vyralBalance: balance })
      .eq('walletAddress', walletAddress)
      .select()
      .single()
  },
}

export const submissionQueries = {
  create: async (data: { challengeId: string; userId: string; videoUrl: string; description?: string }) => {
    return await supabase
      .from('Submission')
      .insert(data)
      .select()
      .single()
  },

  getByChallenge: async (challengeId: string) => {
    return await supabase
      .from('Submission')
      .select('*, user:User(username, walletAddress), votes:Vote(*)')
      .eq('challengeId', challengeId)
      .order('voteCount', { ascending: false })
  },
}

export const voteQueries = {
  create: async (data: { submissionId: string; userId: string }) => {
    return await supabase
      .from('Vote')
      .insert(data)
      .select()
      .single()
  },

  hasVoted: async (submissionId: string, userId: string) => {
    const { data, error } = await supabase
      .from('Vote')
      .select('id')
      .eq('submissionId', submissionId)
      .eq('userId', userId)
      .single()

    return { hasVoted: !!data, error }
  },
}
