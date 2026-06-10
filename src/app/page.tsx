'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChallengeCard } from '@/components/ChallengeCard';

export default function Page() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await fetch('/api/challenges?status=ACTIVE&limit=6');
        const data = await response.json();
        setChallenges(data.challenges || []);
      } catch (error) {
        console.error('Error fetching challenges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  const features = [
    {
      icon: '🎯',
      title: 'Create Challenges',
      color: 'var(--color-primary)',
      description: 'Post viral challenges and engage the community with VYRAL token rewards.',
    },
    {
      icon: '🎥',
      title: 'Submit Videos',
      color: 'var(--color-secondary)',
      description: 'Accept challenges and submit your best video content to compete.',
    },
    {
      icon: '🗳️',
      title: 'Vote & Win',
      color: 'var(--color-success)',
      description: 'Vote on submissions with VYRAL tokens. Best submission wins the reward!',
    },
    {
      icon: '💎',
      title: 'Web3 Powered',
      color: 'var(--color-accent)',
      description: 'Built on Solana. Connect your wallet and start earning VYRAL tokens.',
    },
  ];

  return (
    <AppLayout>
      <section className="page-section">
        {/* Hero Section */}
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            borderRadius: '20px',
            color: 'white',
            border: '4px solid black',
            boxShadow: '6px 6px 0px black',
            marginBottom: '60px',
          }}
        >
          <h1
            style={{
              fontSize: '3rem',
              fontWeight: 800,
              marginBottom: '20px',
              textShadow: '3px 3px 0px rgba(0,0,0,0.2)',
            }}
          >
            Viral Challenges Marketplace
          </h1>
          <p style={{ fontSize: '1.25rem', marginBottom: '30px', opacity: 0.95 }}>
            Create, accept, and win viral challenges. Earn VYRAL tokens on Solana.
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/challenges" style={{ textDecoration: 'none' }}>
              <Button variant="white">Browse Challenges</Button>
            </Link>
            <Link href="/challenges/create" style={{ textDecoration: 'none' }}>
              <Button
                style={{
                  background: 'white',
                  color: 'var(--color-primary)',
                  border: '3px solid black',
                }}
              >
                Create Challenge
              </Button>
            </Link>
          </div>
        </div>

        {/* Active Challenges Section */}
        <section style={{ marginBottom: '60px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px',
            }}
          >
            <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Active Challenges</h2>
            <Link href="/challenges" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              View All →
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading challenges...</div>
          ) : challenges.length === 0 ? (
            <Card>
              <p style={{ textAlign: 'center' }}>No active challenges yet. Be the first to create one!</p>
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link href="/challenges/create" style={{ textDecoration: 'none' }}>
                  <Button>Create Challenge</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '20px',
              }}
            >
              {challenges.map((challenge: any) => (
                <ChallengeCard
                  key={challenge.id}
                  id={challenge.id}
                  title={challenge.title}
                  description={challenge.description}
                  rewardAmount={challenge.rewardAmount}
                  endDate={challenge.endDate}
                  submissionsCount={challenge.submissions?.length || 0}
                  status={challenge.status}
                  creator={challenge.creator}
                />
              ))}
            </div>
          )}
        </section>

        {/* How It Works Section */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '30px', textAlign: 'center' }}>
            How It Works
          </h2>
          <div className="card-grid">
            {features.map((feature, index) => (
              <Card key={index}>
                <h3 style={{ color: feature.color, marginBottom: '10px', fontSize: '1.5rem' }}>
                  {feature.icon} {feature.title}
                </h3>
                <p>{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section
          style={{
            background: 'var(--color-black)',
            color: 'white',
            padding: '40px',
            borderRadius: '16px',
            marginBottom: '60px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '30px',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-primary)' }}>100+</div>
              <div style={{ fontSize: '1rem', opacity: 0.8 }}>Active Challenges</div>
            </div>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-secondary)' }}>50K+</div>
              <div style={{ fontSize: '1rem', opacity: 0.8 }}>VYRAL Distributed</div>
            </div>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-success)' }}>5K+</div>
              <div style={{ fontSize: '1rem', opacity: 0.8 }}>Active Users</div>
            </div>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-accent)' }}>10K+</div>
              <div style={{ fontSize: '1rem', opacity: 0.8 }}>Submissions</div>
            </div>
          </div>
        </section>

        {/* Chrome Plugin Tool Section */}
        <section style={{ marginBottom: '60px' }}>
          <Card>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '15px' }}>
              🛠️ Vyral Tools - Chrome Plugin
            </h2>
            <p style={{ marginBottom: '20px' }}>
              Unfollow bad social citizens. Account clean up to boost visibility and increase account legitimacy.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link href="/download" style={{ textDecoration: 'none' }}>
                <Button variant="secondary">Download Plugin</Button>
              </Link>
              <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <Button variant="white">Dashboard</Button>
              </Link>
            </div>
          </Card>
        </section>
      </section>
    </AppLayout>
  );
}
