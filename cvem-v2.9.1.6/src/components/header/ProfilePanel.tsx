import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  User, X, Zap, LogOut, BarChart2, MessageSquare,
  ChevronLeft, Sun, Moon, Monitor,
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

export function getRoleLabel(role: string) {
  switch (role) {
    case 'owner':    return 'مالك المنصة';
    case 'merchant': return 'صاحب محل';
    case 'delivery': return 'شركة توصيل';
    case 'support':  return 'موظف دعم';
    case 'customer': return 'عميل';
    default:         return 'مستخدم';
  }
}

export function getRoleDashboardPath(role: string): string | null {
  switch (role) {
    case 'owner':    return '/admin-cp/dashboard';
    case 'merchant': return '/store-portal/dashboard';
    case 'delivery': return '/logistics/dashboard';
    case 'support':  return '/helpdesk/dashboard';
    default:         return null;
  }
}

export function getCustomerInbox(): any[] {
  try { return JSON.parse(localStorage.getItem('customer_sent_messages') || '[]'); } catch { return []; }
}

export function getCustomerStoreChats(userId: string): any[] {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('customer_merchant_chat_'));
    const chats: any[] = [];
    for (const key of keys) {
      try {
        const threads: any[] = JSON.parse(localStorage.getItem(key) || '[]');
        const myThread = threads.find((t: any) => t.customerId === userId);
        if (myThread) chats.push(myThread);
      } catch {}
    }
    return chats.sort((a: any, b: any) => (b.lastAt || '').localeCompare(a.lastAt || ''));
  } catch { return []; }
}

export function hasUnreadSupportReply(): boolean {
  try {
    const keys = Object.keys(localStorage).filter(
      k => k.startsWith('customer_inquiry_') && !k.startsWith('customer_inquiry_read_'),
    );
    return keys.some(k => {
      try {
        const data = JSON.parse(localStorage.getItem(k) || 'null');
        const id = k.replace('customer_inquiry_', '');
        return data?.status === 'replied' && !localStorage.getItem(`customer_inquiry_read_${id}`);
      } catch { return false; }
    });
  } catch { return false; }
}

// ─── nav links (shared with MobileNav) ──────────────────────────────────────

const navLinks = [
  { name: 'الرئيسية',  path: '/' },
  { name: 'المنتجات',  path: '/products' },
  { name: 'المحلات',   path: '/stores' },
  { name: 'عروض خاصة', path: '/offers' },
  { name: 'المفضلة',   path: '/favorites' },
];

// ─── props ───────────────────────────────────────────────────────────────────

interface ProfilePanelProps {
  isOpen: boolean;
  user: any;
  onClose: () => void;
  onLogout: () => void;         // triggers the logout modal in Header
  // theme
  isLight: boolean;
  iconColor: string;
  activeColor: string;
  textColor: string;
  // theme-mode controls (passed down so user can change theme from panel)
  themeMode: string;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  // inbox state (lifted so tab survives panel re-open)
  profileTab: 'info' | 'inbox';
  setProfileTab: (tab: 'info' | 'inbox') => void;
  inboxSubTab: 'support' | 'stores';
  setInboxSubTab: (tab: 'support' | 'stores') => void;
}

// ─── component ───────────────────────────────────────────────────────────────

export default function ProfilePanel({
  isOpen,
  user,
  onClose,
  onLogout,
  isLight,
  iconColor,
  activeColor,
  textColor,
  themeMode,
  setThemeMode,
  profileTab,
  setProfileTab,
  inboxSubTab,
  setInboxSubTab,
}: ProfilePanelProps) {
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);

  // lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // click-outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const inboxMessages = user.role === 'customer' ? getCustomerInbox() : [];
  const storeChats    = user.role === 'customer' && user.id ? getCustomerStoreChats(user.id) : [];
  const dashboardPath = getRoleDashboardPath(user.role);

  const divider = `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)'}`;
  const cardStyle = {
    background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.04)',
    borderRadius: 14, padding: '1rem',
    border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.1)'}`,
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        onClick={e => e.stopPropagation()}
        dir="rtl"
        style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: '100%', maxWidth: 380,
          background: isLight ? '#fff' : '#0d1526',
          boxShadow: '4px 0 32px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
          animation: 'slideFromLeft 0.25s ease',
        }}
      >
        {/* ── Header: logo + close + nav links ── */}
        <div style={{ padding: '1rem', borderBottom: divider, background: isLight ? '#f8fafc' : '#080e1c' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <Link to="/" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: isLight ? 'rgba(0,112,200,0.12)' : 'rgba(0,176,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${isLight ? 'rgba(0,112,200,0.25)' : 'rgba(0,176,255,0.3)'}`,
              }}>
                <Zap style={{ width: 18, height: 18, color: iconColor }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isLight ? '#0d3a6e' : '#e0f2fe' }}>
                CyberVolt e-Mall
              </span>
            </Link>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem', borderRadius: 8, color: isLight ? '#6b7280' : 'rgba(224,242,254,0.5)' }}
            >
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>
          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={onClose}
                style={{
                  padding: '0.4rem 0.85rem', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600,
                  textDecoration: 'none', transition: 'all 0.15s',
                  background: location.pathname === link.path
                    ? (isLight ? 'rgba(0,112,200,0.12)' : 'rgba(0,176,255,0.18)')
                    : (isLight ? 'rgba(0,112,200,0.05)' : 'rgba(255,255,255,0.06)'),
                  color: location.pathname === link.path ? activeColor : textColor,
                  border: `1px solid ${location.pathname === link.path
                    ? (isLight ? 'rgba(0,112,200,0.25)' : 'rgba(103,232,249,0.3)')
                    : 'transparent'}`,
                }}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Avatar + name + role ── */}
        <div style={{
          padding: '1.25rem 1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem',
          borderBottom: `1px solid ${isLight ? '#f3f4f6' : 'rgba(0,176,255,0.08)'}`,
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
            background: isLight
              ? 'linear-gradient(135deg,rgba(0,112,200,0.15),rgba(124,58,237,0.15))'
              : 'linear-gradient(135deg,rgba(0,176,255,0.25),rgba(124,58,237,0.25))',
            border: `2px solid ${isLight ? 'rgba(0,112,200,0.3)' : 'rgba(0,176,255,0.4)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User style={{ width: 28, height: 28, color: iconColor }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: '1.05rem', color: isLight ? '#0d3a6e' : '#e0f2fe', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </p>
            <p style={{ fontSize: '0.78rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.5)', margin: '0.15rem 0 0' }}>
              {user.email}
            </p>
            <span style={{
              display: 'inline-block', marginTop: '0.3rem', padding: '0.15rem 0.65rem',
              borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
              background: isLight ? 'rgba(0,112,200,0.1)' : 'rgba(0,176,255,0.15)',
              color: isLight ? '#0070c8' : '#67e8f9',
            }}>
              {getRoleLabel(user.role)}
            </span>
          </div>
        </div>

        {/* ── Tabs (customer only) ── */}
        {user.role === 'customer' && (
          <div style={{ display: 'flex', borderBottom: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.1)'}` }}>
            {[
              { id: 'info',  label: 'الملف الشخصي' },
              { id: 'inbox', label: `الرسائل (${inboxMessages.length + storeChats.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setProfileTab(tab.id as 'info' | 'inbox')}
                style={{
                  flex: 1, padding: '0.65rem', border: 'none', cursor: 'pointer',
                  fontFamily: 'Tajawal, sans-serif', fontSize: '0.82rem', fontWeight: 700, transition: 'all 0.15s',
                  background: profileTab === tab.id ? (isLight ? '#fff' : '#0d1526') : (isLight ? '#f8fafc' : '#080e1c'),
                  color: profileTab === tab.id ? (isLight ? '#0070c8' : '#67e8f9') : (isLight ? '#6b7280' : 'rgba(224,242,254,0.45)'),
                  borderBottom: profileTab === tab.id ? `2px solid ${isLight ? '#0070c8' : '#67e8f9'}` : '2px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Main content ── */}
        <div style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {(profileTab === 'info' || user.role !== 'customer') && (
            <>
              {/* Account info */}
              <div style={cardStyle}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem' }}>
                  معلومات الحساب
                </p>
                {[
                  { label: 'الاسم',  value: user.name },
                  { label: 'الدور',  value: getRoleLabel(user.role) },
                  { label: 'الدولة', value: '🇱🇾 ليبيا' },
                  { label: 'اللغة',  value: 'العربية (مثبتة)' },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: i < 3 ? `1px solid ${isLight ? '#f3f4f6' : 'rgba(255,255,255,0.05)'}` : 'none',
                  }}>
                    <span style={{ fontSize: '0.82rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.5)' }}>{row.label}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isLight ? '#0d3a6e' : '#e0f2fe' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Theme mode */}
              <div style={cardStyle}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem' }}>
                  إعدادات العرض
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { id: 'system', label: 'تلقائي', Icon: Monitor },
                    { id: 'light',  label: 'فاتح',   Icon: Sun },
                    { id: 'dark',   label: 'داكن',   Icon: Moon },
                  ].map(({ id, label, Icon }) => {
                    const active = themeMode === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setThemeMode(id as any)}
                        style={{
                          padding: '0.55rem 0.4rem', borderRadius: 10,
                          border: `1.5px solid ${active ? (isLight ? '#0070c8' : '#67e8f9') : (isLight ? '#e5e7eb' : 'rgba(255,255,255,0.1)')}`,
                          background: active ? (isLight ? 'rgba(0,112,200,0.1)' : 'rgba(0,176,255,0.15)') : 'transparent',
                          cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                          fontFamily: 'Tajawal, sans-serif', transition: 'all 0.15s',
                        }}
                      >
                        <Icon style={{ width: 17, height: 17, color: active ? (isLight ? '#0070c8' : '#67e8f9') : (isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)') }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: active ? (isLight ? '#0070c8' : '#67e8f9') : (isLight ? '#6b7280' : 'rgba(224,242,254,0.5)') }}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dashboard shortcut */}
              {dashboardPath && (
                <Link
                  to={dashboardPath}
                  onClick={onClose}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.85rem 1rem', borderRadius: 12, textDecoration: 'none', transition: 'all 0.15s',
                    background: isLight ? 'rgba(0,112,200,0.07)' : 'rgba(0,176,255,0.1)',
                    border: `1px solid ${isLight ? 'rgba(0,112,200,0.18)' : 'rgba(0,176,255,0.2)'}`,
                    color: isLight ? '#0070c8' : '#67e8f9',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <BarChart2 style={{ width: 18, height: 18 }} />
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>لوحة التحكم</span>
                  </div>
                  <ChevronLeft style={{ width: 16, height: 16 }} />
                </Link>
              )}
            </>
          )}

          {/* ── Inbox tab (customer only) ── */}
          {profileTab === 'inbox' && user.role === 'customer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Sub-tabs */}
              <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.15)'}` }}>
                {[
                  { id: 'support', label: `رسائل الدعم (${inboxMessages.length})` },
                  { id: 'stores',  label: `رسائل المحلات (${storeChats.length})` },
                ].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setInboxSubTab(st.id as 'support' | 'stores')}
                    style={{
                      flex: 1, padding: '0.5rem', border: 'none', cursor: 'pointer',
                      fontFamily: 'Tajawal, sans-serif', fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.15s',
                      background: inboxSubTab === st.id ? '#0070c8' : (isLight ? '#f8fafc' : '#080e1c'),
                      color: inboxSubTab === st.id ? '#fff' : (isLight ? '#6b7280' : 'rgba(224,242,254,0.45)'),
                    }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Support messages */}
              {inboxSubTab === 'support' && (
                inboxMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', ...cardStyle }}>
                    <MessageSquare style={{ width: 36, height: 36, color: isLight ? '#d1d5db' : 'rgba(224,242,254,0.2)', margin: '0 auto 0.75rem' }} />
                    <p style={{ color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.35)', fontSize: '0.85rem', margin: 0 }}>لا توجد رسائل دعم بعد</p>
                  </div>
                ) : (
                  inboxMessages.map((msg: any, i: number) => (
                    <div key={i} style={{ ...cardStyle, borderRadius: 12, padding: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isLight ? '#0d3a6e' : '#e0f2fe' }}>{msg.merchantName || 'محل'}</span>
                        <span style={{ fontSize: '0.7rem', color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.35)' }}>{new Date(msg.createdAt).toLocaleDateString('ar-LY')}</span>
                      </div>
                      {msg.productName && <p style={{ fontSize: '0.72rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.45)', margin: '0 0 0.35rem' }}>بخصوص: {msg.productName}</p>}
                      <p style={{ fontSize: '0.82rem', color: isLight ? '#374151' : '#e0f2fe', margin: 0, lineHeight: 1.6 }}>{msg.text}</p>
                      {msg.reply && (
                        <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.75rem', borderRadius: 8, background: isLight ? '#f0fdf4' : 'rgba(22,163,74,0.1)', border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(22,163,74,0.2)'}` }}>
                          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', margin: '0 0 0.2rem' }}>رد المحل:</p>
                          <p style={{ fontSize: '0.78rem', color: isLight ? '#374151' : '#e0f2fe', margin: 0 }}>{msg.reply}</p>
                        </div>
                      )}
                    </div>
                  ))
                )
              )}

              {/* Store chats */}
              {inboxSubTab === 'stores' && (
                storeChats.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', ...cardStyle }}>
                    <MessageSquare style={{ width: 36, height: 36, color: isLight ? '#d1d5db' : 'rgba(224,242,254,0.2)', margin: '0 auto 0.75rem' }} />
                    <p style={{ color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.35)', fontSize: '0.85rem', margin: 0 }}>لا توجد محادثات مع محلات بعد</p>
                    <p style={{ color: isLight ? '#cbd5e1' : 'rgba(224,242,254,0.25)', fontSize: '0.78rem', margin: '0.35rem 0 0' }}>راسل المحلات من صفحات المنتجات</p>
                  </div>
                ) : (
                  storeChats.map((thread: any, i: number) => (
                    <div key={i} style={{ ...cardStyle, borderRadius: 12, padding: 0, overflow: 'hidden' }}>
                      <div style={{ padding: '0.6rem 0.85rem', background: isLight ? '#f0f9ff' : 'rgba(0,176,255,0.08)', borderBottom: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.1)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isLight ? '#0d3a6e' : '#e0f2fe' }}>{thread.merchantName || 'محل'}</span>
                        <span style={{ fontSize: '0.68rem', color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.35)' }}>{thread.messages.length} رسالة</span>
                      </div>
                      <div style={{ padding: '0.6rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 160, overflowY: 'auto' }}>
                        {thread.messages.map((msg: any, mi: number) => (
                          <div key={mi} style={{ display: 'flex', flexDirection: msg.from === 'merchant' ? 'row-reverse' : 'row' }}>
                            <div style={{
                              maxWidth: '85%', padding: '0.4rem 0.7rem',
                              borderRadius: msg.from === 'merchant' ? '10px 3px 10px 10px' : '3px 10px 10px 10px',
                              background: msg.from === 'merchant' ? (isLight ? '#0070c8' : '#1a4a8a') : (isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)'),
                              color: msg.from === 'merchant' ? '#fff' : (isLight ? '#374151' : '#e0f2fe'),
                              fontSize: '0.78rem', lineHeight: 1.5,
                            }}>
                              {msg.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          )}
        </div>

        {/* ── Logout button ── */}
        <div style={{ padding: '1rem 1.25rem', borderTop: `1px solid ${isLight ? '#f3f4f6' : 'rgba(0,176,255,0.08)'}` }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              padding: '0.75rem', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.07)', color: '#ef4444',
              fontFamily: 'Tajawal, sans-serif', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            <LogOut style={{ width: 18, height: 18 }} />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
