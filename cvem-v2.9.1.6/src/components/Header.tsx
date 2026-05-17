import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, User, Menu, X,
  Zap, Sun, Moon, Store, Truck, Headset, LogOut, Car,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import NotificationMenu, { Notification as AppNotification } from './header/NotificationMenu';
import SearchBar from './header/SearchBar';
import MobileNav from './header/MobileNav';
import ProfilePanel, { hasUnreadSupportReply } from './header/ProfilePanel';
import CarTrackingPanel from './header/CarTrackingPanel';
// ─── app version (single source of truth) ────────────────────────────────────
export const APP_VERSION = 'v2.9.1.6';

// ─── nav links ────────────────────────────────────────────────────────────────
const navLinks = [
  { name: 'الرئيسية',     path: '/' },
  { name: 'المنتجات',     path: '/products' },
  { name: 'المحلات',      path: '/stores' },
  { name: 'شركات التوصيل', path: '/delivery-companies' },
  { name: 'عروض',    path: '/offers' },
  { name: 'المفضلة',      path: '/favorites' },
];

// ─── logout confirmation modal ────────────────────────────────────────────────
function LogoutModal({
  isLight,
  onConfirm,
  onCancel,
}: {
  isLight: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
    }}>
      <div style={{
        background: isLight ? '#fff' : 'linear-gradient(135deg, #020817, #0d3a6e)',
        borderRadius: 20, padding: '2rem', maxWidth: 380, width: '100%',
        border: `1px solid ${isLight ? 'rgba(0,112,200,0.2)' : 'rgba(0,176,255,0.3)'}`,
        boxShadow: isLight ? '0 16px 48px rgba(0,0,0,0.15)' : '0 16px 48px rgba(0,176,255,0.15)',
        textAlign: 'center', fontFamily: 'Tajawal, sans-serif', direction: 'rtl',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: '0 auto 1.25rem',
          background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LogOut style={{ width: 26, height: 26, color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: isLight ? '#0d3a6e' : '#e0f2fe', marginBottom: '0.5rem' }}>
          تسجيل الخروج
        </h3>
        <p style={{ fontSize: '0.9rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.6)', marginBottom: '1.75rem' }}>
          هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '0.75rem', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff', fontWeight: 700, fontSize: '0.95rem',
            fontFamily: 'Tajawal, sans-serif', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(239,68,68,0.35)',
          }}>نعم، خروج</button>
          <button onClick={onCancel} style={{
            flex: 1, padding: '0.75rem', borderRadius: 12,
            border: `1.5px solid ${isLight ? 'rgba(0,112,200,0.3)' : 'rgba(0,176,255,0.4)'}`,
            background: isLight ? 'rgba(0,112,200,0.07)' : 'rgba(0,176,255,0.1)',
            color: isLight ? '#0d3a6e' : '#e0f2fe', fontWeight: 700, fontSize: '0.95rem',
            fontFamily: 'Tajawal, sans-serif', cursor: 'pointer',
          }}>لا، تراجع</button>
        </div>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
export default function Header() {
  const { getCartItemsCount, isLoggedIn, user, setUser, showToastMessage, clearCart, activeOrderId, orders, masterOrders } = useStore();
  const { theme, themeMode, setThemeMode } = useTheme();
  const location = useLocation();
  const navigate  = useNavigate();

  // UI state
  const [isMenuOpen,      setIsMenuOpen]      = useState(false);
  const [showCarPanel,    setShowCarPanel]    = useState(false);
  const [isScrolled,      setIsScrolled]      = useState(false);
  const [showProfile,     setShowProfile]     = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hasUnread,       setHasUnread]       = useState(false);
  // inbox tabs lifted here so they survive panel re-open
  const [profileTab,    setProfileTab]    = useState<'info' | 'inbox'>('info');
  const [inboxSubTab,   setInboxSubTab]   = useState<'support' | 'stores'>('support');
  // notifications
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (savedUser?.id && savedUser?.role === 'customer') {
        const customerKey = `customer_notifications_${savedUser.id}`;
        const customerNotifs = JSON.parse(localStorage.getItem(customerKey) || '[]');
        if (customerNotifs.length > 0) return customerNotifs;
      }
      return JSON.parse(localStorage.getItem('cvem_notifications') || '[]');
    } catch { return []; }
  });

  // ── theme tokens ──
  const isLight      = theme === 'light';
  const iconColor    = isLight ? '#0070c8' : '#67e8f9';
  const activeColor  = iconColor;
  const textColor    = isLight ? '#0d3a6e' : 'rgba(255,255,255,0.82)';
  const inputBg      = isLight ? 'rgba(210,232,255,0.7)' : 'rgba(8,15,34,0.5)';
  const inputBorder  = isLight ? 'rgba(0,120,200,0.2)'   : 'rgba(0,176,255,0.25)';
  const borderColor  = isLight ? 'rgba(0,120,200,0.18)'  : 'rgba(0,176,255,0.18)';
  const iconBg       = isLight ? 'rgba(210,232,255,0.8)' : 'rgba(15,23,42,0.72)';
  const menuBg       = isLight
    ? 'rgba(230,244,255,0.98)'
    : 'linear-gradient(180deg,rgba(6,10,26,0.98),rgba(9,14,40,0.98))';
  const headerBg     = isLight
    ? (isScrolled ? 'rgba(240,248,255,0.97)' : 'rgba(224,242,254,0.96)')
    : (isScrolled ? 'rgba(6,10,26,0.92)' : 'linear-gradient(90deg,rgba(3,7,18,0.98),rgba(9,14,40,0.96),rgba(0,176,255,0.35))');
  const headerShadow = isLight
    ? (isScrolled ? '0 2px 16px rgba(0,112,200,0.10)' : '0 2px 12px rgba(0,112,200,0.08)')
    : (isScrolled ? '0 0 24px rgba(0,176,255,0.18)'   : '0 0 24px rgba(0,176,255,0.12)');

  const actionBtn = {
    padding: '0.5rem', borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
  } as const;

  const portalBtn = {
    ...actionBtn, gap: 6, padding: '0.45rem 0.7rem',
    textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem',
    background: isLight ? 'rgba(0,112,200,0.12)' : 'rgba(0,176,255,0.16)',
    color: isLight ? '#0d3a6e' : '#e0f2fe', whiteSpace: 'nowrap' as const,
    border: `1px solid ${isLight ? 'rgba(0,112,200,0.2)' : 'rgba(0,176,255,0.22)'}`,
  };

  const cartCount = getCartItemsCount();

  // ── effects ──
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setIsMenuOpen(false); setShowProfile(false); setShowCarPanel(false); }, [location]);

  useEffect(() => {
    setHasUnread(user?.role === 'customer' ? hasUnreadSupportReply() : false);
  }, [user, showProfile]);

  // تحميل إشعارات العميل عند تغيير المستخدم
  useEffect(() => {
    if (user?.role === 'customer' && user?.id) {
      const key = `customer_notifications_${user.id}`;
      try {
        const saved = JSON.parse(localStorage.getItem(key) || '[]');
        setAppNotifications(saved);
      } catch {}
    } else if (!user) {
      setAppNotifications([]);
    }
  }, [user]);

  // الاستماع لإشعارات جديدة في الوقت الفعلي (عند توصيل الطلب من تبويب آخر)
  useEffect(() => {
    if (!user?.id || user?.role !== 'customer') return;
    const key = `customer_notifications_${user.id}`;
    const onStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try { setAppNotifications(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user]);

  // ── handlers ──
  const handleNotifMarkAll = () => {
    const updated = appNotifications.map(n => ({ ...n, read: true }));
    setAppNotifications(updated);
    if (user?.role === 'customer' && user?.id) {
      localStorage.setItem(`customer_notifications_${user.id}`, JSON.stringify(updated));
    } else {
      localStorage.setItem('cvem_notifications', JSON.stringify(updated));
    }
  };
  const handleNotifDismiss = (id: string) => {
    const updated = appNotifications.filter(n => n.id !== id);
    setAppNotifications(updated);
    if (user?.role === 'customer' && user?.id) {
      localStorage.setItem(`customer_notifications_${user.id}`, JSON.stringify(updated));
    } else {
      localStorage.setItem('cvem_notifications', JSON.stringify(updated));
    }
  };
  const confirmLogout = () => {
    const uid = user?.id;
    setUser(null);
    clearCart();
    ['token', 'user', 'cart', 'activeOrderId', 'cvem_dismissed_ratings'].forEach(k => localStorage.removeItem(k));
    if (uid) localStorage.removeItem(`last_order_${uid}`);
    showToastMessage('تم تسجيل الخروج', 'info');
    navigate('/');
    setShowProfile(false);
    setShowLogoutModal(false);
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Car tracking side-panel */}
      <CarTrackingPanel isOpen={showCarPanel} onClose={() => setShowCarPanel(false)} />

      {/* Profile side-panel */}
      <ProfilePanel
        isOpen={showProfile}
        user={user}
        onClose={() => setShowProfile(false)}
        onLogout={() => { setShowProfile(false); setShowLogoutModal(true); }}
        isLight={isLight}
        iconColor={iconColor}
        activeColor={activeColor}
        textColor={textColor}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        profileTab={profileTab}
        setProfileTab={setProfileTab}
        inboxSubTab={inboxSubTab}
        setInboxSubTab={setInboxSubTab}
      />

      {/* Logout confirmation */}
      {showLogoutModal && (
        <LogoutModal
          isLight={isLight}
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      {/* ── Sticky header bar ── */}
      <header dir="rtl" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: headerBg, boxShadow: headerShadow,
        backdropFilter: 'blur(14px)', borderBottom: `1px solid ${borderColor}`,
        transition: 'background 0.3s, box-shadow 0.3s',
        padding: isScrolled ? '0.5rem 1rem' : '0.9rem 1rem',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

          {/* Logo */}
          <Link
            to="/"
            onClick={e => { if (location.pathname === '/') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', flexShrink: 0 }}
          >
            <div data-header-zap style={{
              width: 44, height: 44, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              background: isLight ? 'rgba(0,112,200,0.12)' : 'linear-gradient(135deg,rgba(0,176,255,0.35),rgba(124,58,237,0.35))',
              border: `1px solid ${isLight ? 'rgba(0,112,200,0.25)' : 'rgba(0,176,255,0.35)'}`,
              boxShadow: isLight ? '0 0 12px rgba(0,112,200,0.12)' : '0 0 18px rgba(0,176,255,0.35)',
            }}>
              <Zap style={{ width: 24, height: 24, color: iconColor }} />
            </div>
            <div style={{ display: 'none' }} className="sm-logo">
              <div style={{ fontWeight: 800, fontSize: '1rem', color: isLight ? '#0d3a6e' : '#e0f2fe', lineHeight: 1.2, textShadow: isLight ? 'none' : '0 0 12px rgba(0,176,255,0.45)' }}>
                CyberVolt e-Mall
              </div>
              <div style={{ fontSize: '0.7rem', color: isLight ? '#3a7ab8' : 'rgba(224,242,254,0.8)' }}>
                {APP_VERSION}
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'none', alignItems: 'center', gap: 0, flexShrink: 0 }} className="desktop-nav">
            {navLinks.filter(link => link.path !== '/favorites' || (isLoggedIn && user?.role === 'customer')).map(link => (
              <Link key={link.path} to={link.path} style={{
                padding: '0.35rem 0.55rem', borderRadius: 10, fontWeight: 600, fontSize: '0.82rem',
                textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.2s',
                background: location.pathname === link.path ? (isLight ? 'rgba(0,112,200,0.12)' : 'rgba(0,176,255,0.18)') : 'transparent',
                color: location.pathname === link.path ? activeColor : textColor,
                border: location.pathname === link.path ? `1px solid ${isLight ? 'rgba(0,112,200,0.25)' : 'rgba(103,232,249,0.3)'}` : '1px solid transparent',
              }}>{link.name}</Link>
            ))}
          </nav>

          {/* Search (desktop) */}
          <div style={{ flex: 1, minWidth: 0, display: 'none' }} className="search-bar">
            <SearchBar inputBg={inputBg} inputBorder={inputBorder} iconColor={iconColor} isLight={isLight} />
          </div>

          {/* Right-side actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, marginRight: 'auto' }}>

            {!isLoggedIn && (
              <>
                <Link to="/store-portal/login" style={{ ...portalBtn, padding: '0.45rem 0.6rem' }} title="بوابة المحلات" className="portal-btn">
                  <Store style={{ width: 18, height: 18, flexShrink: 0 }} />
                </Link>
                <Link to="/logistics/login" style={{ ...portalBtn, padding: '0.45rem 0.6rem' }} title="بوابة التوصيل" className="portal-btn">
                  <Truck style={{ width: 18, height: 18, flexShrink: 0 }} />
                </Link>
                <Link to="/helpdesk/login" style={{ ...portalBtn, padding: '0.45rem 0.6rem' }} title="بوابة الدعم الفني" className="portal-btn">
                  <Headset style={{ width: 18, height: 18, flexShrink: 0 }} />
                </Link>
              </>
            )}

            {isLoggedIn && (
              <NotificationMenu
                notifications={appNotifications}
                onMarkAllRead={handleNotifMarkAll}
                onDismiss={handleNotifDismiss}
              />
            )}

            {/* My orders icon — customer only */}
            {isLoggedIn && user?.role === 'customer' && (
              <button
                onClick={() => navigate('/tracking')}
                style={{ ...actionBtn, position: 'relative', background: iconBg, border: `1px solid ${inputBorder}` }}
                title="طلباتي"
              >
                <Car style={{ width: 22, height: 22, color: iconColor }} />
                {activeOrderId && (() => {
                  const activeMo = masterOrders.find(mo => mo.id === activeOrderId && mo.customerId === user?.id);
                  if (activeMo) {
                    const allDone = activeMo.subOrders.every(so => so.status === 'delivered');
                    return !allDone ? (
                      <span style={{ position: 'absolute', top: -4, left: -4, width: 12, height: 12, background: '#ef4444', borderRadius: '50%', border: '2px solid white', boxShadow: '0 0 6px #ef4444' }} />
                    ) : null;
                  }
                  const activeOrder = orders.find(o => o.id === activeOrderId && o.customerId === user?.id);
                  return activeOrder && activeOrder.status !== 'delivered' ? (
                    <span style={{ position: 'absolute', top: -4, left: -4, width: 12, height: 12, background: '#ef4444', borderRadius: '50%', border: '2px solid white', boxShadow: '0 0 6px #ef4444' }} />
                  ) : null;
                })()}
              </button>
            )}

            {(!isLoggedIn || user?.role === 'customer') && (
              isLoggedIn ? (
                <Link to="/cart" style={{ ...actionBtn, position: 'relative', background: iconBg, border: `1px solid ${inputBorder}`, textDecoration: 'none' }}>
                  <ShoppingCart style={{ width: 22, height: 22, color: iconColor }} />
                  {cartCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, left: -4, width: 20, height: 20,
                      background: '#7c3aed', color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{cartCount}</span>
                  )}
                </Link>
              ) : (
                <button
                  onClick={() => navigate('/auth/login')}
                  style={{ ...actionBtn, position: 'relative', background: iconBg, border: `1px solid ${inputBorder}`, cursor: 'pointer' }}
                >
                  <ShoppingCart style={{ width: 22, height: 22, color: iconColor }} />
                </button>
              )
            )}

            {isLoggedIn ? (
              <button
                onClick={() => { setShowProfile(!showProfile); setHasUnread(false); }}
                style={{
                  ...actionBtn, position: 'relative',
                  background: isLight ? 'rgba(0,112,200,0.15)' : 'rgba(0,176,255,0.2)',
                  border: `1px solid ${isLight ? 'rgba(0,112,200,0.3)' : 'rgba(0,176,255,0.35)'}`,
                }}
              >
                <User style={{ width: 22, height: 22, color: iconColor }} />
                {hasUnread && <span style={{ position: 'absolute', top: -3, right: -3, width: 10, height: 10, background: '#ef4444', borderRadius: '50%', border: '2px solid white' }} />}
              </button>
            ) : (
              <Link to="/auth/login" style={{ ...actionBtn, background: iconBg, border: `1px solid ${inputBorder}`, textDecoration: 'none' }}>
                <User style={{ width: 22, height: 22, color: iconColor }} />
              </Link>
            )}

            <button
              onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
              aria-label="تبديل الوضع"
              style={{ ...actionBtn, background: iconBg, border: `1px solid ${inputBorder}` }}
            >
              {isLight
                ? <Moon style={{ width: 20, height: 20, color: '#0070c8' }} />
                : <Sun  style={{ width: 20, height: 20, color: '#fde68a' }} />}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ ...actionBtn, background: iconBg, border: `1px solid ${inputBorder}` }}
              className="mobile-menu-btn"
            >
              {isMenuOpen
                ? <X    style={{ width: 22, height: 22, color: iconColor }} />
                : <Menu style={{ width: 22, height: 22, color: iconColor }} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown nav */}
        <MobileNav
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onOpenProfile={() => setShowProfile(true)}
          onOpenLogoutModal={() => setShowLogoutModal(true)}
          isLoggedIn={isLoggedIn}
          userRole={user?.role}
          isLight={isLight}
          menuBg={menuBg}
          borderColor={borderColor}
          inputBg={inputBg}
          inputBorder={inputBorder}
          iconColor={iconColor}
        />

        <style>{`
          @media (min-width: 640px)  { .sm-logo        { display: block !important; } }
          @media (min-width: 768px)  { .search-bar     { display: block !important; } .portal-label { display: inline !important; } }
          @media (min-width: 1024px) { .desktop-nav    { display: flex  !important; } .mobile-menu-btn { display: none !important; } }
          @media (max-width: 767px)  { .portal-label   { display: none  !important; } }
          @media (max-width: 639px)  { .portal-btn     { padding: 0.4rem !important; } }
          @keyframes slideFromLeft   { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `}</style>
      </header>
    </>
  );
}
