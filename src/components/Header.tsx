'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useAdmin } from '@/context/AdminContext';
import { WalletConnectButton } from './WalletConnectButton';

interface HeaderProps {
  currentPage: string;
  onPageChange?: (pageId: string) => void;
}

export function Header({ currentPage }: HeaderProps) {
  const pathname = usePathname();
  const { isAuthenticated, user } = useUser();
  const { isAdmin } = useAdmin();

  const navItems = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'challenges', label: 'Challenges', href: '/challenges' },
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
    { id: 'wallet', label: 'Wallet', href: '/wallet' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const displayWallet = user?.walletAddress
    ? `${user.walletAddress.slice(0, 4)}...${user.walletAddress.slice(-4)}`
    : 'Wallet';

  return (
    <header className="shared-header">
      <div className="header-inner">
        <Link href="/" className="brand">
          Vyral<span style={{ color: 'var(--color-primary)' }}>.</span>buzz
          <div className="brand-dot"></div>
        </Link>

        <nav className="desktop-nav">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={isActive(item.href) ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="active" style={{ background: 'var(--color-accent)' }}>
              Admin
            </Link>
          )}
        </nav>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isAuthenticated && (
            <Link
              href="/profile"
              className="btn btn-sm hidden-mobile"
              style={{ 
                textDecoration: 'none',
                background: 'var(--color-secondary)',
                color: 'white',
                border: '2px solid black',
                borderRadius: '8px',
                padding: '6px 12px',
                fontWeight: 600,
              }}
            >
              {user?.username || displayWallet}
            </Link>
          )}
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
