'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ChallengeCard } from '@/components/ChallengeCard';
import { Button } from '@/components/Button';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const { user } = useUser();

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const statusParam = filter === 'ALL' ? '' : `&status=${filter}`;
        const response = await fetch(`/api/challenges?limit=50${statusParam}`);
        const data = await response.json();
        setChallenges(data.challenges || []);
      } catch (error) {
        console.error('Error fetching challenges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [filter]);

  return (
    <AppLayout>
      <section className="page-section">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Viral Challenges</h1>
          <Link href="/challenges/create" style={{ textDecoration: 'none' }}>
            <Button>Create Challenge</Button>
          </Link>
        </div>

        {/* Filters */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '30px',
            flexWrap: 'wrap',
          }}
        >
          {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '10px 20px',
                border: '3px solid black',
                borderRadius: '8px',
                background: filter === f ? 'var(--color-primary)' : 'white',
                color: filter === f ? 'white' : 'black',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {f === 'ALL' ? 'All' : f === 'ACTIVE' ? 'Active' : 'Completed'}
            </button>
          ))}
        </div>

        {/* Challenges Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>Loading challenges...</div>
        ) : challenges.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px',
              background: 'white',
              border: '3px solid black',
              borderRadius: '12px',
              boxShadow: '4px 4px 0px black',
            }}
          >
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>No challenges found</h3>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              {filter === 'ALL'
                ? 'Be the first to create a challenge!'
                : `No ${filter.toLowerCase()} challenges yet.`}
            </p>
            <Link href="/challenges/create" style={{ textDecoration: 'none' }}>
              <Button>Create Challenge</Button>
            </Link>
          </div>
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
    </AppLayout>
  );
}
