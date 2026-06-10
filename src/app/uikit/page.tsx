'use client';

import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export default function UiKitPage() {
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast(message, type);
    }
  };

  return (
    <AppLayout>
      <section className="page-section">
        <h1 className="display-1">Component Library</h1>
        <p className="mb-lg">A comprehensive guide to the Vyral design system.</p>

        {/* Buttons */}
        <Card>
          <div
            style={{ borderBottom: '2px dashed #eee', paddingBottom: '10px', marginBottom: '15px' }}
          >
            <h3 className="h3">Buttons</h3>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="white">White</Button>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Button variant="ghost" size="sm">
              Ghost Link
            </Button>
            <Button size="sm">Small Primary</Button>
          </div>
        </Card>

        {/* Forms */}
        <Card>
          <div
            style={{ borderBottom: '2px dashed #eee', paddingBottom: '10px', marginBottom: '15px' }}
          >
            <h3 className="h3">Forms & Inputs</h3>
          </div>
          <div className="grid-2">
            <div>
              <label className="label">Standard Input</label>
              <input type="text" className="input" placeholder="Type here..." />
            </div>
            <div>
              <label className="label">Select Dropdown</label>
              <div className="select-wrapper">
                <select className="select">
                  <option>Option A</option>
                  <option>Option B</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-md">
            <label className="label">Text Area</label>
            <textarea className="textarea" placeholder="Write a message..."></textarea>
          </div>
        </Card>

        {/* Notifications Test */}
        <Card>
          <div
            style={{ borderBottom: '2px dashed #eee', paddingBottom: '10px', marginBottom: '15px' }}
          >
            <h3 className="h3">Notifications (Toasts)</h3>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-success btn-sm"
              style={{ background: 'var(--color-success)', color: 'white' }}
              onClick={() => showToast('Success! Operation completed.', 'success')}
            >
              Trigger Success
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => showToast('Error! Something went wrong.', 'error')}
            >
              Trigger Error
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => showToast('Info: New update available.', 'info')}
            >
              Trigger Info
            </button>
          </div>
        </Card>

        <div className="text-center mt-md">
          <a href="/design" style={{ textDecoration: 'none' }}>
            <Button variant="secondary">
              View Full Design Notes
            </Button>
          </a>
        </div>
      </section>
    </AppLayout>
  );
}
