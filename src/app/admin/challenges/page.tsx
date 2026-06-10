'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchChallenges();
  }, [filter]);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/challenges?status=${filter}`);
      const data = await response.json();
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (challengeId: string, action: string, submissionId?: string) => {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this challenge?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/challenges/${challengeId}/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, submissionId }),
      });

      if (response.ok) {
        alert(`${action} successful!`);
        fetchChallenges();
      } else {
        const error = await response.json();
        alert(error.error || 'Action failed');
      }
    } catch (error) {
      console.error('Error processing action:', error);
      alert('Action failed');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Manage Challenges</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 16px',
                background: filter === status ? 'var(--color-primary)' : 'white',
                color: filter === status ? 'white' : 'black',
                border: '2px solid black',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          background: 'white',
          border: '3px solid black',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '4px 4px 0px black',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0', borderBottom: '2px solid black' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Title</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Creator</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Reward</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Payout</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {challenges.map((challenge: any) => (
              <tr
                key={challenge.id}
                style={{ borderBottom: '1px solid #e0e0e0' }}
              >
                <td style={{ padding: '12px' }}>
                  <Link
                    href={`/challenges/${challenge.id}`}
                    style={{ color: 'var(--color-primary)', fontWeight: 600 }}
                  >
                    {challenge.title}
                  </Link>
                </td>
                <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                  {challenge.creator?.username ||
                    `${challenge.creator?.walletAddress?.slice(0, 6)}...`}
                </td>
                <td style={{ padding: '12px', fontWeight: 700 }}>
                  {challenge.rewardAmount} VYRAL
                </td>
                <td style={{ padding: '12px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background:
                        challenge.status === 'ACTIVE'
                          ? 'var(--color-success)'
                          : challenge.status === 'COMPLETED'
                          ? 'var(--color-primary)'
                          : '#ef4444',
                      color: 'white',
                    }}
                  >
                    {challenge.status}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background:
                        challenge.payoutStatus === 'COMPLETED'
                          ? 'var(--color-success)'
                          : challenge.payoutStatus === 'PENDING'
                          ? '#f59e0b'
                          : '#999',
                      color: 'white',
                    }}
                  >
                    {challenge.payoutStatus || 'N/A'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {challenge.status === 'ACTIVE' && (
                      <>
                        <button
                          onClick={() => handleAction(challenge.id, 'REFUND')}
                          style={{
                            padding: '6px 12px',
                            background: '#ef4444',
                            color: 'white',
                            border: '2px solid black',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Refund
                        </button>
                      </>
                    )}
                    {challenge.status === 'COMPLETED' && challenge.payoutStatus === 'PENDING' && (
                      <button
                        onClick={() =>
                          handleAction(challenge.id, 'PAYOUT', challenge.winnerId)
                        }
                        style={{
                          padding: '6px 12px',
                          background: 'var(--color-success)',
                          color: 'white',
                          border: '2px solid black',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Payout
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
