'use client';

import { usePathname } from 'next/navigation';
import { t } from '@/i18n/t';
import { 
  Home, 
  BookOpen, 
  Users, 
  User, 
  GraduationCap, 
  Calendar, 
  BarChart3, 
  Settings 
} from 'lucide-react';

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: 'admin' | 'teacher';
  };
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const menuItems = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: Home },
  { href: '/courses', labelKey: 'nav.courses', icon: BookOpen },
  { href: '/groups', labelKey: 'nav.groups', icon: Users },
  { href: '/students', labelKey: 'nav.students', icon: User },
  { href: '/teachers', labelKey: 'nav.teachers', icon: GraduationCap },
  { href: '/lessons', labelKey: 'nav.lessons', icon: Calendar },
  { href: '/reports', labelKey: 'nav.reports', icon: BarChart3 },
];

const adminMenuItems = [
  { href: '/users', labelKey: 'nav.users', icon: Settings },
];

const getIcon = (icon: string) => {
  switch (icon) {
    case 'home':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'book':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'users':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'user':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'teacher':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'calendar':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'chart':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case 'settings':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function Sidebar({ user, isOpen, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: isOpen ? 0 : '-256px',
        width: '256px',
        height: '100vh',
        backgroundColor: '#1e3a8a',
        color: '#e0e7ff',
        transition: 'left 0.3s ease',
        zIndex: 30,
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#1e3a8a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <img 
          src="/logo.svg" 
          alt="IT Robotics" 
          style={{ 
            width: '100%', 
            maxWidth: '200px', 
            height: 'auto', 
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            marginTop: '8px',
          }}
        />
      </div>

      <nav style={{ padding: '1.5rem 0.75rem', marginTop: '0.5rem' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                color: isActive ? '#fff' : '#bfdbfe',
                backgroundColor: isActive ? 'rgba(59, 130, 246, 0.4)' : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                marginBottom: '4px',
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#bfdbfe';
                }
              }}
            >
              <Icon width="20" height="20" style={{ color: isActive ? '#fff' : '#93c5fd' }} />
              {t(item.labelKey)}
            </a>
          );
        })}

        {user.role === 'admin' && (
          <>
            <div style={{ height: '1px', backgroundColor: 'rgba(147, 197, 253, 0.2)', margin: '1rem 0' }} />
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    color: isActive ? '#fff' : '#bfdbfe',
                    backgroundColor: isActive ? 'rgba(59, 130, 246, 0.4)' : 'transparent',
                    textDecoration: 'none',
                    fontWeight: isActive ? '600' : '500',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#bfdbfe';
                    }
                  }}
                >
                  <Icon width="20" height="20" style={{ color: isActive ? '#fff' : '#93c5fd' }} />
                  {t(item.labelKey)}
                </a>
              );
            })}
          </>
        )}
      </nav>

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '1rem',
        borderTop: '1px solid rgba(147, 197, 253, 0.2)',
      }}>
        <div style={{ 
          marginBottom: '0.75rem', 
          fontSize: '0.875rem',
          padding: '0.5rem',
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        }}>
          <div style={{ fontWeight: '600', color: '#fff' }}>{user.name}</div>
          <div style={{ color: '#93c5fd', fontSize: '0.75rem' }}>{user.email}</div>
        </div>
        <button
          onClick={onLogout}
          style={{ 
            width: '100%', 
            padding: '0.625rem 1rem',
            borderRadius: '12px',
            border: '1px solid rgba(147, 197, 253, 0.3)',
            backgroundColor: 'transparent',
            color: '#bfdbfe',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = '#dc2626';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#bfdbfe';
            e.currentTarget.style.borderColor = 'rgba(147, 197, 253, 0.3)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {t('actions.logout')}
        </button>
      </div>
    </aside>
  );
}
