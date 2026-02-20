'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { t } from '@/i18n/t';
import Sidebar from './Sidebar/Sidebar';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher';
}

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  headerActions?: React.ReactNode;
}

const menuItems = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: 'home' },
  { href: '/courses', labelKey: 'nav.courses', icon: 'book' },
  { href: '/groups', labelKey: 'nav.groups', icon: 'users' },
  { href: '/students', labelKey: 'nav.students', icon: 'user' },
  { href: '/teachers', labelKey: 'nav.teachers', icon: 'teacher' },
  { href: '/lessons', labelKey: 'nav.lessons', icon: 'calendar' },
  { href: '/reports', labelKey: 'nav.reports', icon: 'chart' },
];

const adminMenuItems = [
  { href: '/users', labelKey: 'nav.users', icon: 'settings' },
];

export default function Layout({ children, user, headerActions }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const getPageTitle = () => {
    const menuItem = menuItems.find(m => m.href === pathname);
    if (menuItem) return t(menuItem.labelKey);
    const adminMenuItem = adminMenuItems.find(m => m.href === pathname);
    if (adminMenuItem) return t(adminMenuItem.labelKey);
    return t('app.name');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <div style={{
        flex: 1,
        marginLeft: sidebarOpen ? '256px' : 0,
        transition: 'margin-left 0.3s ease',
      }}>
        {/* Top bar */}
        <header style={{
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          zIndex: 20,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: '#4b5563',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
            {getPageTitle()}
          </h2>

          {headerActions && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {headerActions}
            </div>
          )}
        </header>

        {/* Page content */}
        <main style={{ padding: '1.5rem' }}>
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 20,
          }}
        />
      )}
    </div>
  );
}
