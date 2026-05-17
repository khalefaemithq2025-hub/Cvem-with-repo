import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Smartphone, Laptop, Headphones, Tablet, Store, Truck, User, LogOut, Headset,
} from 'lucide-react';
import SearchBar from './SearchBar';
import { categories } from '../../data/mockData';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenLogoutModal: () => void;
  isLoggedIn: boolean;
  userRole?: string;
  // Theme values
  isLight: boolean;
  menuBg: string;
  borderColor: string;
  inputBg: string;
  inputBorder: string;
  iconColor: string;
}

const navLinks = [
  { name: 'الرئيسية',     path: '/' },
  { name: 'المنتجات',     path: '/products' },
  { name: 'المحلات',      path: '/stores' },
  { name: 'شركات التوصيل', path: '/delivery-companies' },
  { name: 'عروض',    path: '/offers' },
  { name: 'المفضلة',      path: '/favorites' },
];

const getCategoryIcon = (iconName: string) => {
  if (iconName === 'Smartphone') return <Smartphone className="w-5 h-5" />;
  if (iconName === 'Tablet') return <Tablet className="w-5 h-5" />;
  if (iconName === 'Laptop') return <Laptop className="w-5 h-5" />;
  if (iconName === 'Headphones') return <Headphones className="w-5 h-5" />;
  return null;
};

export default function MobileNav({
  isOpen,
  onClose,
  onOpenProfile,
  onOpenLogoutModal,
  isLoggedIn,
  userRole,
  isLight,
  menuBg,
  borderColor,
  inputBg,
  inputBorder,
  iconColor,
}: MobileNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  if (!isOpen) return null;

  return (
    <div dir="rtl" style={{ background: menuBg, padding: '1rem 0 1.5rem', borderTop: `1px solid ${borderColor}` }}>
      <div className="container">

        {/* Search */}
        <div style={{ marginBottom: '1rem' }}>
          <SearchBar
            inputBg={inputBg}
            inputBorder={inputBorder}
            iconColor={iconColor}
            isLight={isLight}
            onSearch={onClose}
            style={{ width: '100%' }}
          />
        </div>

        {/* Nav links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: '1rem' }}>
          {navLinks.filter(link => link.path !== '/favorites' || (isLoggedIn && userRole === 'customer')).map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={onClose}
              style={{
                padding: '0.75rem 1rem', borderRadius: 8, fontWeight: 500, textDecoration: 'none',
                background: currentPath === link.path
                  ? (isLight ? 'rgba(0,112,200,0.12)' : 'rgba(0,176,255,0.2)')
                  : 'transparent',
                color: isLight ? '#0d3a6e' : '#fff', transition: 'background 0.2s',
              }}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Categories */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ color: isLight ? '#3a7ab8' : 'rgba(255,255,255,0.7)', fontWeight: 500, padding: '0 1rem', marginBottom: 6 }}>
            الفئات
          </div>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '0.65rem 1rem',
                borderRadius: 8, color: isLight ? '#0d3a6e' : '#fff', textDecoration: 'none',
              }}
            >
              {getCategoryIcon(cat.icon)}
              <span>{cat.name}</span>
              <span style={{ marginRight: 'auto', color: isLight ? '#5a9abf' : 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                {cat.count} منتج
              </span>
            </Link>
          ))}
        </div>

        {/* Portal links — only for guests */}
        {!isLoggedIn && (
          <div style={{
            display: 'flex', gap: 8, paddingTop: '1rem',
            borderTop: `1px solid ${borderColor}`, flexWrap: 'wrap',
          }}>
            {[
              { to: '/store-portal/login', Icon: Store, label: 'المحلات' },
              { to: '/logistics/login', Icon: Truck, label: 'التوصيل' },
              { to: '/helpdesk/login', Icon: Headset, label: 'الدعم' },
            ].map(({ to, Icon, label }) => (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '0.75rem 0.5rem', borderRadius: 8,
                  background: isLight ? 'rgba(0,112,200,0.1)' : 'rgba(0,176,255,0.14)',
                  color: isLight ? '#0d3a6e' : '#fff', textDecoration: 'none', fontWeight: 500,
                  border: `1px solid ${isLight ? 'rgba(0,112,200,0.2)' : 'rgba(0,176,255,0.22)'}`,
                  fontSize: '0.82rem',
                }}
              >
                <Icon style={{ width: 16, height: 16 }} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Logged-in actions */}
        {isLoggedIn && (
          <div style={{ paddingTop: '1rem', borderTop: `1px solid ${borderColor}` }}>
            <button
              onClick={() => { onClose(); onOpenProfile(); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '0.75rem', borderRadius: 8,
                border: `1px solid ${isLight ? 'rgba(0,112,200,0.2)' : 'rgba(0,176,255,0.22)'}`,
                background: isLight ? 'rgba(0,112,200,0.1)' : 'rgba(0,176,255,0.14)',
                color: isLight ? '#0d3a6e' : '#fff',
                fontFamily: 'Tajawal, sans-serif', fontWeight: 600, cursor: 'pointer', marginBottom: '0.5rem',
              }}
            >
              <User style={{ width: 18, height: 18 }} />
              الملف الشخصي
            </button>
            <button
              onClick={() => { onClose(); onOpenLogoutModal(); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '0.75rem', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                fontFamily: 'Tajawal, sans-serif', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <LogOut style={{ width: 18, height: 18 }} />
              تسجيل الخروج
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
