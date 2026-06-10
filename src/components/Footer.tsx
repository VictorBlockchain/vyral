'use client';

import Link from 'next/link';

export function Footer() {
  const footerLinks = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'about', label: 'About', href: '/about' },
    { id: 'terms', label: 'User Agreement', href: '/terms' },
    { id: 'uikit', label: 'UI Kit', href: '/uikit' },
    { id: 'design', label: 'Design Notes', href: '/design' },
  ];

  return (
    <footer className="shared-footer">
      <div className="footer-links">
        {footerLinks.map((link) => (
          <Link key={link.id} href={link.href}>
            {link.label}
          </Link>
        ))}
      </div>
      <p className="body-sm">&copy; 2023 Vyral.buzz. All rights reserved.</p>
    </footer>
  );
}
