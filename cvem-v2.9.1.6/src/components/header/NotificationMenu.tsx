import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date | string;
  type?: 'order' | 'system' | 'promo';
}

interface NotificationMenuProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
}

export default function NotificationMenu({ notifications, onMarkAllRead, onDismiss }: NotificationMenuProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Persist unread count
  useEffect(() => {
    localStorage.setItem('cvem_notif_unread', String(unreadCount));
  }, [unreadCount]);

  // ✅ Auto mark all as read when opening the menu
  useEffect(() => {
    if (open && unreadCount > 0) {
      onMarkAllRead();
    }
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer',
          width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isLight ? '#0d3a6e' : '#c7e6ff',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = isLight ? 'rgba(0,112,200,0.08)' : 'rgba(0,176,255,0.12)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        title="الإشعارات"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="notif-badge" style={{ '--notif-border': isLight ? '#f0f6ff' : '#020817' } as React.CSSProperties}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="notif-dropdown"
          dir="rtl"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: 320,
            maxHeight: 420,
            overflowY: 'auto',
            borderRadius: 16,
            background: isLight ? '#fff' : '#0d1e35',
            border: `1px solid ${isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)'}`,
            boxShadow: isLight
              ? '0 16px 48px rgba(0,80,180,0.15)'
              : '0 16px 48px rgba(0,0,0,0.5), 0 0 24px rgba(0,176,255,0.08)',
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderBottom: `1px solid ${isLight ? '#e8f0fe' : 'rgba(0,176,255,0.1)'}`,
            position: 'sticky', top: 0, background: isLight ? '#fff' : '#0d1e35', zIndex: 2,
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isLight ? '#0d3a6e' : '#e0f2fe' }}>
              الإشعارات {unreadCount > 0 && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>({unreadCount} جديد)</span>}
            </span>
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <Bell style={{ width: 32, height: 32, margin: '0 auto 0.75rem', opacity: 0.3, color: isLight ? '#0d3a6e' : '#e0f2fe' }} />
              <p style={{ fontSize: '0.85rem', color: isLight ? '#4a7eb2' : 'rgba(147,216,255,0.5)' }}>لا توجد إشعارات</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                style={{
                  display: 'flex', gap: 12, padding: '12px 16px',
                  borderBottom: `1px solid ${isLight ? '#f0f6ff' : 'rgba(0,176,255,0.06)'}`,
                  background: n.read
                    ? 'transparent'
                    : isLight ? 'rgba(0,112,200,0.04)' : 'rgba(0,176,255,0.06)',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                  background: n.read ? 'transparent' : '#00b0ff',
                  boxShadow: n.read ? 'none' : '0 0 6px rgba(0,176,255,0.6)',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.82rem', color: isLight ? '#0d3a6e' : '#e0f2fe', marginBottom: 2 }}>{n.title}</p>
                  <p style={{ fontSize: '0.76rem', color: isLight ? '#4a7eb2' : 'rgba(147,216,255,0.6)', lineHeight: 1.4 }}>{n.body}</p>
                  <p style={{ fontSize: '0.68rem', color: isLight ? '#94a3b8' : 'rgba(147,216,255,0.35)', marginTop: 4 }}>
                    {new Date(n.createdAt).toLocaleDateString('ar-LY', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => onDismiss(n.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLight ? '#94a3b8' : 'rgba(147,216,255,0.4)', flexShrink: 0, padding: '2px' }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
