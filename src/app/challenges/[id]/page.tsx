'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { SubmissionCard } from '@/components/SubmissionCard';
import { CountdownTimer } from '@/components/CountdownTimer';
import { Button } from '@/components/Button';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ChallengeDetailPage() {
  const params = useParams();
  const { user, isAuthenticated } = useUser();
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const response = await fetch(`/api/challenges?id=${params.id}`);
        const data = await response.json();
        setChallenge(data.challenge);
      } catch (error) {
        console.error('Error fetching challenge:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchChallenge();
    }
  }, [params.id]);

  const handleVote = async (submissionId: string) => {
    if (!user) {
      alert('Please connect your wallet to vote');
      return;
    }

    try {
      const response = await fetch(`/api/submissions/${submissionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          userId: user.id,
        }),
      });

      if (response.ok) {
        // Refresh challenge data
        const updatedResponse = await fetch(`/api/challenges?id=${params.id}`);
        const updatedData = await updatedResponse.json();
        setChallenge(updatedData.challenge);
      } else {
        const error = await response.json();
        alert(error.error || 'Error voting');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Error voting');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please connect your wallet to submit');
      return;
    }

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: params.id,
          userId: user.id,
          videoUrl,
          description,
        }),
      });

      if (response.ok) {
        setShowSubmitModal(false);
        setVideoUrl('');
        setDescription('');
        // Refresh challenge data
        const updatedResponse = await fetch(`/api/challenges?id=${params.id}`);
        const updatedData = await updatedResponse.json();
        setChallenge(updatedData.challenge);
      } else {
        const error = await response.json();
        alert(error.error || 'Error submitting');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Error submitting');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>
      </AppLayout>
    );
  }

  if (!challenge) {
    return (
      <AppLayout>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <h2>Challenge not found</h2>
          <Link href="/challenges" style={{ textDecoration: 'none' }}>
            <Button style={{ marginTop: '20px' }}>Back to Challenges</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className="page-section">
        {/* Challenge Header */}
        <div
          style={{
            background: 'white',
            border: '4px solid black',
            borderRadius: '16px',
            padding: '30px',
            marginBottom: '40px',
            boxShadow: '5px 5px 0px black',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <span
              style={{
                background: challenge.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-primary)',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'inline-block',
                marginBottom: '12px',
              }}
            >
              {challenge.status}
            </span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '15px' }}>
              {challenge.title}
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#666', lineHeight: 1.6, marginBottom: '20px' }}>
              {challenge.description}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', color: '#999', marginBottom: '8px' }}>Reward</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {challenge.rewardAmount} VYRAL
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#999', marginBottom: '8px' }}>Submissions</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                {challenge.submissions?.length || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#999', marginBottom: '8px' }}>Ends In</div>
              <CountdownTimer endDate={challenge.endDate} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {challenge.status === 'ACTIVE' && (
              <Button onClick={() => setShowSubmitModal(true)}>Submit Entry</Button>
            )}
          </div>
        </div>

        {/* Submissions */}
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '30px' }}>
            Submissions ({challenge.submissions?.length || 0})
          </h2>

          {challenge.submissions?.length === 0 ? (
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
              <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>No submissions yet</h3>
              <p style={{ color: '#666' }}>Be the first to submit!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {challenge.submissions?.map((submission: any) => (
                <SubmissionCard
                  key={submission.id}
                  id={submission.id}
                  videoUrl={submission.videoUrl}
                  description={submission.description}
                  voteCount={submission.voteCount}
                  user={submission.user}
                  status={submission.status}
                  onVote={handleVote}
                  hasVoted={submission.votes?.some((v: any) => v.userId === user?.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Submit Modal */}
        {showSubmitModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
            onClick={() => setShowSubmitModal(false)}
          >
            <div
              style={{
                background: 'white',
                border: '4px solid black',
                borderRadius: '16px',
                padding: '30px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '20px' }}>
                Submit Your Entry
              </h2>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                    Video URL *
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
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
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us about your submission..."
                    rows={4}
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
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button type="submit">Submit Entry</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowSubmitModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </AppLayout>
  );
}
