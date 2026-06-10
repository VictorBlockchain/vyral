'use client';

import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/Button';

export default function ContactPage() {
  return (
    <AppLayout>
      <section className="page-section">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="display-1">Contact Us</h1>
          <p className="body-lg">
            Get in touch with our team for support or inquiries.
          </p>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <label className="label">Name</label>
            <input type="text" className="input" placeholder="Your name" />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="your@email.com" />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label className="label">Message</label>
            <textarea className="textarea" rows={5} placeholder="How can we help?"></textarea>
          </div>
          <Button>Send Message</Button>
        </div>
      </section>
    </AppLayout>
  );
}
