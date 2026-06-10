'use client';

import { useAdmin } from '@/context/AdminContext';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px',
          background: 'white',
          border: '4px solid black',
          borderRadius: '16px',
          maxWidth: '600px',
          margin: '40px auto',
          boxShadow: '5px 5px 0px black',
        }}
      >
        <h2 style={{ fontSize: '2rem', marginBottom: '15px', color: '#ef4444' }}>
          Access Denied
        </h2>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Admin access required to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
