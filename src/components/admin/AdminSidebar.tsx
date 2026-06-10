'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { label: 'Dashboard', href: '/admin', icon: '📊' },
    { label: 'Challenges', href: '/admin/challenges', icon: '🎯' },
    { label: 'Users', href: '/admin/users', icon: '👥' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      style={{
        width: '250px',
        background: 'white',
        borderRight: '3px solid black',
        minHeight: '100vh',
        padding: '20px',
      }}
    >
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Admin Panel</h2>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: isActive(item.href) ? 'var(--color-primary)' : 'transparent',
              color: isActive(item.href) ? 'white' : 'black',
              border: '2px solid black',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
