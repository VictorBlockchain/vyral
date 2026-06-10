'use client';

import React, { FC, ReactNode, useMemo, useCallback, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletContextValue {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  select: (walletName: string) => void;
  disconnect: () => Promise<void>;
  vyralBalance: number;
  refreshBalance: () => Promise<void>;
}

const WalletContext = React.createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <WalletContextProvider>{children}</WalletContextProvider>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

function WalletContextProvider({ children }: { children: ReactNode }) {
  const { publicKey, connected, connecting, select, disconnect } = useWallet();
  const [vyralBalance, setVyralBalance] = useState(0);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setVyralBalance(0);
      return;
    }

    try {
      // TODO: Implement actual token balance fetching
      // This requires the VYRAL token mint address and SPL token logic
      // For now, we'll return a mock value
      setVyralBalance(0);
    } catch (error) {
      console.error('Error fetching VYRAL balance:', error);
      setVyralBalance(0);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const value = useMemo(
    () => ({
      publicKey,
      connected,
      connecting,
      select,
      disconnect,
      vyralBalance,
      refreshBalance: fetchBalance,
    }),
    [publicKey, connected, connecting, select, disconnect, vyralBalance, fetchBalance]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletContext() {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}

// Re-export useWallet from Solana adapter for convenience
export { useWallet };
