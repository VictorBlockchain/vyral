'use client';

import { useEffect, useState } from 'react';

interface EncryptionKeyInfo {
  keyId: string;
  createdAt: string;
  isActive: boolean;
  keyPreview: string;
}

interface KeyStats {
  totalChallenges: number;
  newFormatCount: number;
  legacyFormatCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalChallenges: 0,
    activeChallenges: 0,
    totalUsers: 0,
    totalSubmissions: 0,
    pendingPayouts: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Encryption key management state
  const [keyInfo, setKeyInfo] = useState<{
    currentKeyId: string;
    keys: EncryptionKeyInfo[];
    stats: KeyStats;
  } | null>(null);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [keyActionLoading, setKeyActionLoading] = useState(false);
  const [keyMessage, setKeyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        setStats(data.stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
  
    const fetchKeyInfo = async () => {
      try {
        const walletAddress = localStorage.getItem('walletAddress') || '';
        const response = await fetch(`/api/admin/encryption-keys?walletAddress=${walletAddress}`);
        const data = await response.json();
        if (data.success) {
          setKeyInfo(data);
        }
      } catch (error) {
        console.error('Error fetching key info:', error);
      }
    };
  
    fetchStats();
    fetchKeyInfo();
  }, []);
  
  const handleGenerateKey = async () => {
    try {
      setKeyActionLoading(true);
      setKeyMessage(null);
        
      const walletAddress = localStorage.getItem('walletAddress') || '';
      const response = await fetch(`/api/admin/encryption-keys?walletAddress=${walletAddress}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      });
        
      const data = await response.json();
      if (data.success) {
        setShowNewKey(data.newKey);
        setKeyMessage({ type: 'success', text: 'New key generated! Copy it securely before rotating.' });
      } else {
        setKeyMessage({ type: 'error', text: data.error });
      }
    } catch (error: any) {
      setKeyMessage({ type: 'error', text: error.message });
    } finally {
      setKeyActionLoading(false);
    }
  };
  
  const handleRotateKey = async () => {
    if (!confirm('⚠️ This will rotate the encryption key and re-encrypt all data. Continue?')) {
      return;
    }
  
    try {
      setKeyActionLoading(true);
      setKeyMessage(null);
        
      const walletAddress = localStorage.getItem('walletAddress') || '';
      const response = await fetch(`/api/admin/encryption-keys?walletAddress=${walletAddress}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rotate' }),
      });
        
      const data = await response.json();
      if (data.success) {
        setKeyMessage({ 
          type: 'success', 
          text: `✅ Key rotated successfully! ${data.updatedCount} challenges updated.` 
        });
        // Refresh key info
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setKeyMessage({ type: 'error', text: data.error });
      }
    } catch (error: any) {
      setKeyMessage({ type: 'error', text: error.message });
    } finally {
      setKeyActionLoading(false);
    }
  };
  
  const handlePurgeKeys = async () => {
    if (!confirm('⚠️ WARNING: This will permanently delete all old encryption keys. Continue?')) {
      return;
    }
  
    try {
      setKeyActionLoading(true);
      setKeyMessage(null);
        
      const walletAddress = localStorage.getItem('walletAddress') || '';
      const response = await fetch(`/api/admin/encryption-keys?walletAddress=${walletAddress}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purge' }),
      });
        
      const data = await response.json();
      if (data.success) {
        setKeyMessage({ type: 'success', text: `✅ Purged ${data.keysRemoved} old keys.` });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setKeyMessage({ type: 'error', text: data.error });
      }
    } catch (error: any) {
      setKeyMessage({ type: 'error', text: error.message });
    } finally {
      setKeyActionLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '30px' }}>
        Admin Dashboard
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            background: 'white',
            border: '3px solid black',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '4px 4px 0px black',
          }}
        >
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>
            Total Challenges
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {stats.totalChallenges}
          </div>
        </div>

        <div
          style={{
            background: 'white',
            border: '3px solid black',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '4px 4px 0px black',
          }}
        >
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>
            Active Challenges
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-success)' }}>
            {stats.activeChallenges}
          </div>
        </div>

        <div
          style={{
            background: 'white',
            border: '3px solid black',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '4px 4px 0px black',
          }}
        >
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>Total Users</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
            {stats.totalUsers}
          </div>
        </div>

        <div
          style={{
            background: 'white',
            border: '3px solid black',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '4px 4px 0px black',
          }}
        >
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>
            Submissions
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-accent)' }}>
            {stats.totalSubmissions}
          </div>
        </div>

        <div
          style={{
            background: stats.pendingPayouts > 0 ? '#fef3c7' : 'white',
            border: '3px solid black',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '4px 4px 0px black',
          }}
        >
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>
            Pending Payouts
          </div>
          <div
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: stats.pendingPayouts > 0 ? '#f59e0b' : '#999',
            }}
          >
            {stats.pendingPayouts}
          </div>
        </div>
      </div>

      {/* Encryption Key Management Section */}
      {keyInfo && (
        <div
          style={{
            background: 'white',
            border: '3px solid black',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '4px 4px 0px black',
            marginBottom: '30px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '1.8rem' }}>🔐</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              Encryption Key Management
            </h2>
          </div>

          {/* Message Display */}
          {keyMessage && (
            <div
              style={{
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                background: keyMessage.type === 'success' ? '#d1fae5' : '#fee2e2',
                border: `2px solid ${keyMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
                color: keyMessage.type === 'success' ? '#065f46' : '#991b1b',
                fontWeight: 500,
              }}
            >
              {keyMessage.text}
            </div>
          )}

          {/* New Key Display */}
          {showNewKey && (
            <div
              style={{
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                background: '#fef3c7',
                border: '2px solid #f59e0b',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '10px', color: '#92400e' }}>
                ⚠️ New Encryption Key Generated
              </div>
              <div
                style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  wordBreak: 'break-all',
                  border: '2px solid #fbbf24',
                  marginBottom: '10px',
                }}
              >
                {showNewKey}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: '10px' }}>
                ⚠️ Copy this key to a secure location immediately. You will need it to update your .env.local file.
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(showNewKey);
                  alert('Key copied to clipboard!');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#f59e0b',
                  color: 'white',
                  border: '2px solid black',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginRight: '10px',
                }}
              >
                📋 Copy Key
              </button>
              <button
                onClick={() => setShowNewKey(null)}
                style={{
                  padding: '8px 16px',
                  background: '#6b7280',
                  color: 'white',
                  border: '2px solid black',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ✕ Hide Key
              </button>
            </div>
          )}

          {/* Current Key Info */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '25px',
            }}
          >
            <div
              style={{
                padding: '15px',
                background: '#dbeafe',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#1e40af', marginBottom: '5px' }}>
                Current Key ID
              </div>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                {keyInfo.currentKeyId}
              </div>
            </div>

            <div
              style={{
                padding: '15px',
                background: '#d1fae5',
                border: '2px solid #10b981',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#065f46', marginBottom: '5px' }}>
                New Format
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>
                {keyInfo.stats.newFormatCount}
              </div>
            </div>

            <div
              style={{
                padding: '15px',
                background: keyInfo.stats.legacyFormatCount > 0 ? '#fef3c7' : '#f3f4f6',
                border: `2px solid ${keyInfo.stats.legacyFormatCount > 0 ? '#f59e0b' : '#d1d5db'}`,
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: '5px' }}>
                Legacy Format
              </div>
              <div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  color: keyInfo.stats.legacyFormatCount > 0 ? '#d97706' : '#9ca3af',
                }}
              >
                {keyInfo.stats.legacyFormatCount}
              </div>
            </div>
          </div>

          {/* Keys List */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '15px' }}>
              Encryption Keys ({keyInfo.keys.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {keyInfo.keys.map((key) => (
                <div
                  key={key.keyId}
                  style={{
                    padding: '15px',
                    background: key.isActive ? '#ecfdf5' : '#f9fafb',
                    border: `2px solid ${key.isActive ? '#10b981' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          background: key.isActive ? '#10b981' : '#9ca3af',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {key.isActive ? 'ACTIVE' : 'RETIRED'}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1f2937' }}>
                        {key.keyId}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      Key: {key.keyPreview}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '5px' }}>
                      Created: {new Date(key.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleGenerateKey}
              disabled={keyActionLoading}
              style={{
                padding: '12px 24px',
                background: keyActionLoading ? '#9ca3af' : '#8b5cf6',
                color: 'white',
                border: '2px solid black',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: keyActionLoading ? 'not-allowed' : 'pointer',
                opacity: keyActionLoading ? 0.6 : 1,
              }}
            >
              🔑 Generate New Key
            </button>

            <button
              onClick={handleRotateKey}
              disabled={keyActionLoading}
              style={{
                padding: '12px 24px',
                background: keyActionLoading ? '#9ca3af' : '#f59e0b',
                color: 'white',
                border: '2px solid black',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: keyActionLoading ? 'not-allowed' : 'pointer',
                opacity: keyActionLoading ? 0.6 : 1,
              }}
            >
              🔄 Rotate Key & Re-encrypt
            </button>

            <button
              onClick={handlePurgeKeys}
              disabled={keyActionLoading || keyInfo.keys.length <= 1}
              style={{
                padding: '12px 24px',
                background:
                  keyActionLoading || keyInfo.keys.length <= 1 ? '#9ca3af' : '#ef4444',
                color: 'white',
                border: '2px solid black',
                borderRadius: '8px',
                fontWeight: 600,
                cursor:
                  keyActionLoading || keyInfo.keys.length <= 1 ? 'not-allowed' : 'pointer',
                opacity: keyActionLoading || keyInfo.keys.length <= 1 ? 0.6 : 1,
              }}
            >
              🗑️ Purge Old Keys
            </button>
          </div>

          {/* Help Text */}
          <div
            style={{
              marginTop: '20px',
              padding: '15px',
              background: '#f3f4f6',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#4b5563',
            }}
          >
            <strong>💡 How to rotate keys:</strong>
            <ol style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
              <li>Click "Generate New Key" and copy it securely</li>
              <li>Update the ENCRYPTION_KEY in your .env.local file</li>
              <li>Click "Rotate Key & Re-encrypt" to migrate all data</li>
              <li>Verify all challenges show "New Format" count</li>
              <li>Click "Purge Old Keys" to remove retired keys (optional)</li>
            </ol>
          </div>
        </div>
      )}

      <div
        style={{
          background: 'white',
          border: '3px solid black',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '4px 4px 0px black',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '20px' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="/admin/challenges"
            style={{
              padding: '12px 24px',
              background: 'var(--color-primary)',
              color: 'white',
              border: '2px solid black',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Manage Challenges
          </a>
          <a
            href="/admin/users"
            style={{
              padding: '12px 24px',
              background: 'var(--color-secondary)',
              color: 'white',
              border: '2px solid black',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Manage Users
          </a>
        </div>
      </div>
    </div>
  );
}
