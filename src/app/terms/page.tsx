'use client';

import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/Card';

export default function TermsPage() {
  return (
    <AppLayout>
      <section className="page-section">
        <h1 className="display-2 mb-lg">User Agreement</h1>
        <Card variant="dashed">
          <h3 className="h3">1. Acceptance of Terms</h3>
          <p className="body-sm">
            By accessing this tool, you agree to be bound by these Terms of Service.
          </p>

          <h3 className="h3">2. Usage Limits</h3>
          <p className="body-sm">
            Users are limited to 3,000 unfollows per account at the base rate.
            Excessive usage may result in temporary throttling to ensure platform
            stability.
          </p>

          <h3 className="h3">3. Payments</h3>
          <p className="body-sm">
            All payments are processed via the Internet Computer (ICP) network. Refunds are handled on a
            case-by-case basis.
          </p>
        </Card>
      </section>
    </AppLayout>
  );
}
