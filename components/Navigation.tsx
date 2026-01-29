'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  if (!user) {
    return null;
  }

  const navItems = [
    { href: '/', label: '홈', icon: '🏠' },
    { href: '/strategy/new', label: '전략 생성', icon: '➕' },
    { href: '/history', label: '히스토리', icon: '🧾' },
    { href: '/settings', label: '설정', icon: '⚙️' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav
      style={{
        background: 'var(--background)',
        borderBottom: '1px solid var(--border)',
        padding: '1rem 0',
        marginBottom: '2rem',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link
              href="/"
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                textDecoration: 'none',
                color: 'var(--foreground)',
              }}
            >
              coinmate
            </Link>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    color: isActive(item.href) ? 'var(--primary)' : 'var(--secondary)',
                    background: isActive(item.href) ? 'var(--primary)20' : 'transparent',
                    fontWeight: isActive(item.href) ? '600' : '400',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>
              {user.email}
            </span>
            <button
              onClick={signOut}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--danger)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

