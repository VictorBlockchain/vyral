'use client';

import { useState } from 'react';
import { useWalletContext } from '@/context/WalletContext';

interface TokenBalanceProps {
  className?: string;
}

export function TokenBalance({ className }: TokenBalanceProps) {
  const { vyralBalance } = useWalletContext();
  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) {
    return (
      <div className={className} style={{ padding: '12px', background: '#f0f0f0', borderRadius: '8px' }}>
        Loading balance...
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        padding: '16px',
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
        color: 'white',
        borderRadius: '12px',
        border: '3px solid black',
        boxShadow: '3px 3px 0px black',
      }}
    >
      <div style={{ fontSize: '0.85rem', marginBottom: '8px', opacity: 0.9 }}>VYRAL Balance</div>
      <div style={{ fontSize: '2rem', fontWeight: 800 }}>{vyralBalance.toLocaleString()}</div>
      {vyralBalance === 0 && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '6px',
            fontSize: '0.8rem',
          }}
        >
          Get VYRAL tokens to create challenges and vote
        </div>
      )}
    </div>
  );
}
