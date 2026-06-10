'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { userQueries } from '@/lib/supabase';

interface User {
  id: string;
  walletAddress: string;
  username: string | null;
  vyralBalance: number;
  createdAt: string;
  updatedAt: string;
}

interface UserContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  vyralBalance: number;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, connected } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrCreateUser = useCallback(async () => {
    if (!publicKey || !connected) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const walletAddress = publicKey.toBase58();
      
      // Try to fetch existing user
      const { data: existingUser, error } = await userQueries.getByWallet(walletAddress);
      
      if (error || !existingUser) {
        // Create new user if doesn't exist
        const { data: newUser, error: createError } = await userQueries.create({
          walletAddress,
        });
        
        if (createError) {
          console.error('Error creating user:', createError);
          setUser(null);
        } else {
          setUser(newUser);
        }
      } else {
        setUser(existingUser);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connected]);

  useEffect(() => {
    fetchOrCreateUser();
  }, [fetchOrCreateUser]);

  const refreshUser = useCallback(async () => {
    await fetchOrCreateUser();
  }, [fetchOrCreateUser]);

  const value = useMemo(
    () => ({
      isAuthenticated: !!user && connected,
      isLoading,
      user,
      vyralBalance: user?.vyralBalance || 0,
      refreshUser,
    }),
    [user, isLoading, connected, refreshUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
}
