'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/Button';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateChallengePage() {
  const { user, isAuthenticated } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rewardAmount: '',
    endDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please connect your wallet to create a challenge');
      return;
    }

    if (user.vyralBalance < parseFloat(formData.rewardAmount)) {
      alert('Insufficient VYRAL balance. Please add more tokens to your wallet.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rewardAmount: parseFloat(formData.rewardAmount),
          creatorId: user.id,
          tokenMint: process.env.NEXT_PUBLIC_VYRAL_TOKEN_MINT_ADDRESS,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/challenges/${data.challenge.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Error creating challenge');
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('Error creating challenge');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div
          style={{
            textAlign: 'center',
            padding: '60px',
            background: 'white',
            border: '3px solid black',
            borderRadius: '12px',
            boxShadow: '4px 4px 0px black',
            maxWidth: '600px',
            margin: '40px auto',
          }}
        >
          <h2 style={{ fontSize: '2rem', marginBottom: '15px' }}>Wallet Required</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Please connect your Solana wallet to create a challenge.
          </p>
          <Link href="/challenges" style={{ textDecoration: 'none' }}>
            <Button>Back to Challenges</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className="page-section">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '10px' }}>
            Create Challenge
          </h1>
          <p style={{ color: '#666', marginBottom: '40px' }}>
            Post a viral challenge and reward the best submissions with VYRAL tokens.
          </p>

          <div
            style={{
              background: 'white',
              border: '4px solid black',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '5px 5px 0px black',
            }}
          >
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Challenge Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Best TikTok Dance Challenge"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid black',
                    borderRadius: '8px',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the challenge rules, requirements, and judging criteria..."
                  required
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid black',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Reward Amount (VYRAL) *
                </label>
                <input
                  type="number"
                  value={formData.rewardAmount}
                  onChange={(e) => setFormData({ ...formData, rewardAmount: e.target.value })}
                  placeholder="100"
                  min="1"
                  step="0.01"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid black',
                    borderRadius: '8px',
                    fontSize: '1rem',
                  }}
                />
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>
                  Your balance: {user?.vyralBalance || 0} VYRAL
                </p>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  End Date *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid black',
                    borderRadius: '8px',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div
                style={{
                  background: '#f0f0f0',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '0.9rem',
                }}
              >
                <strong>Note:</strong> VYRAL tokens will be held in escrow until the challenge
                completes. The winner will receive the reward automatically.
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Challenge'}
                </Button>
                <Link href="/challenges" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" type="button">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
