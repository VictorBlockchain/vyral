'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface ChallengeCardProps {
  id: string;
  title: string;
  description: string;
  rewardAmount: number;
  endDate: string;
  submissionsCount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  creator?: {
    username: string | null;
    walletAddress: string;
  };
}

export function ChallengeCard({
  id,
  title,
  description,
  rewardAmount,
  endDate,
  submissionsCount,
  status,
  creator,
}: ChallengeCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'ACTIVE':
        return 'var(--color-success)';
      case 'COMPLETED':
        return 'var(--color-primary)';
      case 'CANCELLED':
        return 'var(--color-error, #ef4444)';
      default:
        return 'var(--color-gray)';
    }
  };

  const timeLeft = formatDistanceToNow(new Date(endDate), { addSuffix: true });

  return (
    <div
      style={{
        background: 'white',
        border: '3px solid black',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '4px 4px 0px black',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translate(-2px, -2px)';
        e.currentTarget.style.boxShadow = '6px 6px 0px black';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translate(0, 0)';
        e.currentTarget.style.boxShadow = '4px 4px 0px black';
      }}
    >
      <Link href={`/challenges/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ marginBottom: '12px' }}>
          <span
            style={{
              background: getStatusColor(),
              color: 'white',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'inline-block',
              marginBottom: '8px',
            }}
          >
            {status}
          </span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>{title}</h3>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '12px', lineHeight: 1.5 }}>
            {description.substring(0, 100)}
            {description.length > 100 ? '...' : ''}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: '2px solid #f0f0f0',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>Reward</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {rewardAmount} VYRAL
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>Submissions</div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{submissionsCount}</div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>Ends</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{timeLeft}</div>
          </div>
        </div>
      </Link>
    </div>
  );
}
