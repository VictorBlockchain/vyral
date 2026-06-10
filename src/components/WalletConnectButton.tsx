'use client';

import { FC, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface WalletConnectButtonProps {
  className?: string;
}

export const WalletConnectButton: FC<WalletConnectButtonProps> = ({ className }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className={`btn btn-primary btn-sm ${className || ''}`}
        style={{
          background: 'var(--color-primary)',
          color: 'white',
          border: '2px solid black',
          borderRadius: '8px',
          padding: '8px 16px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <WalletMultiButton
      className={`btn btn-primary btn-sm ${className || ''}`}
      style={{
        background: 'var(--color-primary)',
        color: 'white',
        border: '2px solid black',
        borderRadius: '8px',
        padding: '8px 16px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    />
  );
};
