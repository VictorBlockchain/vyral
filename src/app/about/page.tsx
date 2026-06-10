'use client';

import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/Button';

export default function AboutPage() {
  return (
    <AppLayout>
      <section className="page-section">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="display-1">Our Mission</h1>
          <p className="body-lg">
            To democratize social media growth for everyone.
          </p>
        </div>

        <div className="grid-2">
          <div>
            <img
              src="https://picsum.photos/seed/teamwork/600/400"
              alt="Team"
              style={{
                width: '100%',
                borderRadius: '20px',
                border: 'var(--border-thick)',
              }}
            />
          </div>
          <div className="flex-center">
            <div>
              <h3 className="h3">Who We Are</h3>
              <p>
                We are a small team of developers and social media experts obsessed
                with clean design and organic growth.
              </p>
              <p>
                Vyral was built because we were tired of overpriced tools and bots
                that ruin accounts. We believe in paying for what you use.
              </p>
              <a href="/contact" style={{ textDecoration: 'none' }}>
                <Button variant="secondary">Contact Support</Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
