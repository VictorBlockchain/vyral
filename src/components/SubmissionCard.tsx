'use client';

import { useState } from 'react';

interface SubmissionCardProps {
  id: string;
  videoUrl: string;
  description: string | null;
  voteCount: number;
  user: {
    username: string | null;
    walletAddress: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WINNER';
  onVote?: (submissionId: string) => void;
  hasVoted?: boolean;
}

export function SubmissionCard({
  id,
  videoUrl,
  description,
  voteCount,
  user,
  status,
  onVote,
  hasVoted = false,
}: SubmissionCardProps) {
  const [isVoting, setIsVoting] = useState(false);

  const getStatusColor = () => {
    switch (status) {
      case 'WINNER':
        return 'var(--color-success)';
      case 'APPROVED':
        return 'var(--color-primary)';
      case 'REJECTED':
        return 'var(--color-error, #ef4444)';
      default:
        return 'var(--color-gray)';
    }
  };

  const handleVote = async () => {
    if (hasVoted || !onVote) return;
    
    setIsVoting(true);
    try {
      await onVote(id);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const getVideoEmbed = () => {
    // Simple video URL parsing for YouTube, TikTok, etc.
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = videoUrl.includes('youtu.be')
        ? videoUrl.split('/').pop()
        : new URL(videoUrl).searchParams.get('v');
      return (
        <iframe
          width="100%"
          height="200"
          src={`https://www.youtube.com/embed/${videoId}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ borderRadius: '8px' }}
        />
      );
    }
    
    // For other URLs, just show a placeholder
    return (
      <div
        style={{
          width: '100%',
          height: '200px',
          background: '#f0f0f0',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '3rem',
        }}
      >
        🎥
      </div>
    );
  };

  return (
    <div
      style={{
        background: 'white',
        border: '3px solid black',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '3px 3px 0px black',
      }}
    >
      <div style={{ marginBottom: '12px' }}>{getVideoEmbed()}</div>

      {description && (
        <p style={{ fontSize: '0.9rem', marginBottom: '12px', lineHeight: 1.5 }}>{description}</p>
      )}

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
          <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>Submitted by</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
            {user.username || `${user.walletAddress.slice(0, 4)}...${user.walletAddress.slice(-4)}`}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              background: getStatusColor(),
              color: 'white',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {status}
          </span>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {voteCount}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#999' }}>votes</div>
          </div>

          {onVote && (
            <button
              onClick={handleVote}
              disabled={hasVoted || isVoting}
              style={{
                background: hasVoted ? '#ccc' : 'var(--color-primary)',
                color: 'white',
                border: '2px solid black',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 600,
                cursor: hasVoted ? 'not-allowed' : 'pointer',
                opacity: hasVoted ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              {isVoting ? 'Voting...' : hasVoted ? 'Voted' : 'Vote'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
