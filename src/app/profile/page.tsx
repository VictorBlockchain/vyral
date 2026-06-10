'use client';

import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useUser } from '@/context/UserContext';

export default function ProfilePage() {
  const { isAuthenticated, principal, login } = useUser();

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast(message, type);
    }
  };

  const userId = principal ?? 'Not connected';
  const connectionStatus = isAuthenticated ? 'Connected via Internet Identity' : 'Not connected';

  return (
    <AppLayout>
      <section className="page-section">
        <Card variant="glass" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <img
            src="https://picsum.photos/seed/avatar1/150/150"
            alt="User"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: '3px solid var(--color-black)',
              marginBottom: '15px',
            }}
          />
          <h2 className="display-2">{isAuthenticated ? 'Creator' : 'Guest'}</h2>
          <p className="text-primary" style={{ fontWeight: 700 }}>
            {connectionStatus}
          </p>
          <p style={{ marginTop: '10px', fontSize: '0.95rem', color: '#555' }}>
            {userId}
          </p>
          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <Button
              size="sm"
              onClick={() =>
                isAuthenticated
                  ? showToast('Profile Updated', 'success')
                  : login()
              }
            >
              {isAuthenticated ? 'Edit Profile' : 'Connect'}
            </Button>
            <Button variant="white" size="sm">
              <a href="/terms" style={{ textDecoration: 'none', color: 'inherit' }}>
                Terms
              </a>
            </Button>
          </div>
        </Card>

        <div className="grid-2 mt-md">
          <Card>
            <h3 className="h3">Settings</h3>
            <div className="form-group">
              <label className="label">Display Name</label>
              <input type="text" className="input" defaultValue="Alex Creator" />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input type="email" className="input" defaultValue="alex@vyral.buzz" />
            </div>
            <div className="form-group">
              <label className="label">Role</label>
              <div className="select-wrapper">
                <select className="select">
                  <option>Content Creator</option>
                  <option>Agency</option>
                  <option>Brand</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Bio</label>
              <textarea
                className="textarea"
                rows={3}
                defaultValue="Helping brands grow on TikTok using AI."
              />
            </div>
          </Card>
          <Card>
            <h3 className="h3">Preferences</h3>
            <div
              className="flex-between"
              style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}
            >
              <span>Push Notifications</span>
              <input type="checkbox" defaultChecked />
            </div>
            <div
              className="flex-between"
              style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}
            >
              <span>Email Reports</span>
              <input type="checkbox" />
            </div>
            <div
              className="flex-between"
              style={{ padding: '10px 0' }}
            >
              <span>Dark Mode (Beta)</span>
              <input type="checkbox" />
            </div>
          </Card>
        </div>
      </section>
    </AppLayout>
  );
}
