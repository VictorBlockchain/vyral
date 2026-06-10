'use client';

import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { DollarSign } from 'lucide-react';

export default function WalletPage() {
  const openAddFundsModal = () => {
    // This will be handled by the parent layout
    const event = new CustomEvent('openAddFundsModal');
    window.dispatchEvent(event);
  };

  return (
    <AppLayout>
      <section className="page-section">
        <h2 className="display-2 mb-lg">My Wallet</h2>

        <Card variant="blue" className="mb-lg">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <p className="stat-label">Current Balance</p>
              <div className="display-1">$14.50</div>
              <p className="body-sm">~ 0.09 SOL</p>
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.5)',
                padding: '10px',
                borderRadius: '50%',
                border: '2px solid black',
              }}
            >
              <DollarSign size={24} />
            </div>
          </div>
          <Button variant="white" className="mt-md" onClick={openAddFundsModal}>
            Add Funds
          </Button>
        </Card>

        <h3 className="h3">Recent Transactions</h3>
        <Card style={{ padding: 0 }}>
          <div
            style={{
              padding: '15px',
              borderBottom: '2px dashed #eee',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <strong>Bulk Unfollow</strong>
              <br />
              <span className="body-sm">Today, 10:23 AM</span>
            </div>
            <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>
              -$1.50
            </span>
          </div>
          <div
            style={{
              padding: '15px',
              borderBottom: '2px dashed #eee',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <strong>Wallet Top-up</strong>
              <br />
              <span className="body-sm">Yesterday</span>
            </div>
            <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>
              +$20.00
            </span>
          </div>
          <div
            style={{
              padding: '15px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <strong>Vy Bot Usage</strong>
              <br />
              <span className="body-sm">Oct 24</span>
            </div>
            <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>
              -$0.50
            </span>
          </div>
        </Card>
      </section>
    </AppLayout>
  );
}
