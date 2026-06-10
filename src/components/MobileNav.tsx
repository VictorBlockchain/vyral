'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Wallet, User, Plus } from 'lucide-react';

interface MobileNavProps {
  currentPage: string;
}

export function MobileNav({ currentPage }: MobileNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="mobile-nav">
      <div className="nav-group">
        <Link
          href="/"
          className={`nav-link ${isActive('/') ? 'active' : ''}`}
        >
          <Home size={24} />
          <span>Home</span>
        </Link>
        <Link
          href="/dashboard"
          className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
        >
          <LayoutGrid size={24} />
          <span>Data</span>
        </Link>
      </div>

      <Link href="/dashboard" className="nav-fab">
        <Plus size={30} color="white" />
      </Link>

      <div className="nav-group">
        <Link
          href="/wallet"
          className={`nav-link ${isActive('/wallet') ? 'active' : ''}`}
        >
          <Wallet size={24} />
          <span>Wallet</span>
        </Link>
        <Link
          href="/profile"
          className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
        >
          <User size={24} />
          <span>Me</span>
        </Link>
      </div>
    </nav>
  );
}
