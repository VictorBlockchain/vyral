'use client';

import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useEffect, useState } from 'react';

type Follower = {
  id: string;
  displayName?: string | null;
  followerCount: number;
  mutual: boolean;
};

export default function DashboardPage() {
  const [topFollowers, setTopFollowers] = useState<Follower[]>([]);
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/mock/top-followers');
        if (!res.ok) return;
        const data = await res.json();
        setTopFollowers(data.followers || []);
      } catch (e) {
        // ignore for now
      }
    }
    load();
  }, []);
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast(message, type);
    }
  };

  return (
    <AppLayout>
      <section className="page-section">
        <div className="flex-between mb-lg">
          <h2 className="display-2">Dashboard</h2>
          <Button size="sm" onClick={() => showToast('Refreshing data...', 'info')}>
            Refresh
          </Button>
        </div>

        <div className="grid-3 mb-lg">
          <Card variant="stats">
            <div className="stat-label">Total Unfollows</div>
            <div className="stat-number">12,405</div>
            <p className="text-success" style={{ fontWeight: 700 }}>
              + 12% this week
            </p>
          </Card>
          <Card variant="stats">
            <div className="stat-label">Account Health</div>
            <div
              className="stat-number"
              style={{ color: 'var(--color-secondary)' }}
            >
              98%
            </div>
            <p className="body-sm">Excellent standing</p>
          </Card>
          <Card variant="stats">
            <div className="stat-label">Credits</div>
            <div
              className="stat-number"
              style={{ color: 'var(--color-accent)' }}
            >
              5,000
            </div>
            <Button variant="accent" size="sm" className="mt-md">
              Top Up
            </Button>
          </Card>
        </div>

        <div className="grid-2">
          <Card>
            <h3 className="h3">Activity (Last 7 Days)</h3>
            <div className="chart-bar-container">
              <div className="chart-bar" style={{ height: '40%' }}>
                <span>Mon</span>
              </div>
              <div
                className="chart-bar"
                style={{ height: '70%', background: 'var(--color-secondary)' }}
              >
                <span>Tue</span>
              </div>
              <div className="chart-bar" style={{ height: '50%' }}>
                <span>Wed</span>
              </div>
              <div className="chart-bar" style={{ height: '90%' }}>
                <span>Thu</span>
              </div>
              <div className="chart-bar" style={{ height: '60%' }}>
                <span>Fri</span>
              </div>
              <div className="chart-bar" style={{ height: '30%' }}>
                <span>Sat</span>
              </div>
              <div className="chart-bar" style={{ height: '45%' }}>
                <span>Sun</span>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="h3">Growth Distribution</h3>
            <div className="flex-center" style={{ flexDirection: 'column', height: '100%' }}>
              <div className="pie-chart"></div>
              <div
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  gap: '15px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                <span style={{ color: 'var(--color-primary)' }}>● Unfollowed</span>
                <span style={{ color: 'var(--color-secondary)' }}>● Following</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-lg">
          <Card>
            <h3 className="h3">Top Followers</h3>
            <div style={{ marginTop: 8 }}>
              {topFollowers.length === 0 && <p className="muted">No followers data available.</p>}
              {topFollowers.map(f => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--muted)' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{f.displayName || f.id}</div>
                    <div className="body-sm muted">@{f.id} {f.mutual ? '• mutual' : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{f.followerCount.toLocaleString()}</div>
                    <div className="body-sm muted">followers</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </AppLayout>
  );
}
