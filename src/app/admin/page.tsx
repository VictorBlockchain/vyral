'use client';

import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalChallenges: 0,
    activeChallenges: 0,
    totalUsers: 0,
    totalSubmissions: 0,
    pendingPayouts: 0,
  });
  const [loading, setLoading] = useState(true);

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

    fetchStats();
  }, []);

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
