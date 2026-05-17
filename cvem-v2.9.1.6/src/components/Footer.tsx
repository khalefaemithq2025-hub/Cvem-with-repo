import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, Phone, Mail, MapPin, Facebook, Instagram, Truck, Shield, HeadphonesIcon, CreditCard, Zap, X } from 'lucide-react';

function ContactModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '2rem', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,112,200,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Zap style={{ width: 28, height: 28, color: '#0070c8' }} />
        </div>
        <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0d3a6e', marginBottom: '0.5rem' }}>لم نضع رابطاً بعد</h3>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6 }}>
          هذا الرابط سيتوفر قريباً. الموقع في مرحلة الإعداد وسيتم إضافة معلومات التواصل الرسمية قريباً.
        </p>
        <button onClick={onClose} style={{ marginTop: '1.25rem', padding: '0.65rem 2rem', borderRadius: 12, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>
          حسناً
        </button>
      </div>
    </div>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [showContactModal, setShowContactModal] = useState(false);

  const quickLinks = [
    { name: 'الرئيسية', path: '/' },
    { name: 'المنتجات', path: '/products' },
    { name: 'المحلات', path: '/stores' },
    { name: 'عروض خاصة', path: '/offers' },
    { name: 'تتبع طلبك', path: '/tracking' },
  ];

  const categories = [
    { name: 'الهواتف الذكية', path: '/products?category=phones' },
    { name: 'الحواسيب المحمولة', path: '/products?category=laptops' },
    { name: 'الإكسسوارات', path: '/products?category=accessories' },
  ];

  const features = [
    { icon: Shield, title: 'دفع آمن', description: 'حماية كاملة لبياناتك' },
    { icon: Truck, title: 'توصيل سريع', description: 'خلال 1-5 أيام عمل' },
    { icon: HeadphonesIcon, title: 'دعم فني', description: 'خدمة عملاء 24/7' },
    { icon: CreditCard, title: 'طرق دفع متعددة', description: 'بطاقات، تحويل، دفع عند الاستلام' },
  ];

  return (
    <footer className="footer-shell" style={{ color: 'inherit' }}>
      {showContactModal && <ContactModal onClose={() => setShowContactModal(false)} />}

      {/* Contact Support Bar */}
      <div style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)', padding: '0.85rem 1rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>هل تحتاج مساعدة؟ فريق الدعم متاح 24/7</span>
        <a href="/support" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1rem', borderRadius: 8, background: '#fff', color: '#1e40af', fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem', transition: 'opacity 0.2s' }}>
          <HeadphonesIcon style={{ width: 15, height: 15 }} />
          تواصل مع الدعم
        </a>
      </div>
      <div className="footer-features-shell">
        <div className="container" style={{ padding: '1.5rem 1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }} className="footer-features-grid">
            {features.map((feature, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="footer-feature-icon" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <feature.icon style={{ width: 20, height: 20, color: 'currentColor' }} />
                </div>
                <div>
                  <h4 className="footer-text-primary" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{feature.title}</h4>
                  <p className="footer-text-muted" style={{ fontSize: '0.75rem' }}>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '3rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '2rem' }} className="footer-main-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="footer-brand-mark" style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap style={{ width: 24, height: 24, color: 'currentColor' }} />
              </div>
              <div>
                <div className="footer-brand-name" style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                  CyberVolt e-Mall
                </div>
                <div className="footer-text-muted" style={{ fontSize: '0.72rem' }}>مجمع سايبر فولت الإلكتروني</div>
              </div>
            </div>
            <p className="footer-text-muted" style={{ fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1rem' }}>
              منصتك الموثوقة لشراء وبيع الأجهزة الإلكترونية بأفضل الأسعار من محلات معتمدة.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowContactModal(true)} className="footer-social-btn" style={{ background: 'none', cursor: 'pointer' }}>
                <Facebook style={{ width: 18, height: 18 }} />
              </button>
              <button onClick={() => setShowContactModal(true)} className="footer-social-btn" style={{ background: 'none', cursor: 'pointer' }}>
                <svg style={{ width: 16, height: 16, fill: 'currentColor' }} viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </button>
              <button onClick={() => setShowContactModal(true)} className="footer-social-btn" style={{ background: 'none', cursor: 'pointer' }}>
                <Instagram style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>

          <div>
            <h3 className="footer-title">روابط سريعة</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="footer-link">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="footer-title">الفئات</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {categories.map((cat) => (
                <li key={cat.path}>
                  <Link to={cat.path} className="footer-link">{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="footer-title">تواصل معنا</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <MapPin style={{ width: 18, height: 18, color: 'currentColor', marginTop: 2, flexShrink: 0 }} />
                <span className="footer-text-muted" style={{ fontSize: '0.875rem' }}>زليتن، ليبيا</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Phone style={{ width: 18, height: 18, color: 'currentColor', flexShrink: 0 }} />
                <button onClick={() => setShowContactModal(true)} className="footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', padding: 0, textAlign: 'right' }}>
                  لم نضع رابطاً بعد
                </button>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail style={{ width: 18, height: 18, color: 'currentColor', flexShrink: 0 }} />
                <button onClick={() => setShowContactModal(true)} className="footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', padding: 0, textAlign: 'right' }}>
                  لم نضع رابطاً بعد
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(0,176,255,0.12)', textAlign: 'center' }}>
          <p className="footer-text-primary" style={{ fontWeight: 700, marginBottom: '0.25rem' }}>الموقع في مرحلة الإعداد</p>
          <p className="footer-text-muted" style={{ fontSize: '0.875rem' }}>شركاء التوصيل سيتم إضافتهم قريباً</p>
        </div>
      </div>

      <div className="footer-bottom-shell">
        <div className="container" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <p className="footer-text-muted" style={{ fontSize: '0.8rem', textAlign: 'center' }}>
            © {currentYear} CyberVolt e-Mall | مجمع سايبر فولت الإلكتروني. جميع الحقوق محفوظة.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/privacy" className="footer-link">سياسة الخصوصية</Link>
            <Link to="/terms" className="footer-link">الشروط والأحكام</Link>
          </div>
        </div>
      </div>

      <style>{`
        .footer-shell { transition: background 0.3s, color 0.3s, border-color 0.3s; }
        .footer-features-shell { border-bottom: 1px solid var(--footer-border); }
        .footer-brand-mark { background: var(--footer-mark-bg); border: 1px solid var(--footer-mark-border); box-shadow: var(--footer-mark-shadow); color: var(--footer-accent); }
        .footer-brand-name { color: var(--footer-brand); text-shadow: var(--footer-brand-shadow); }
        .footer-title { font-weight: 700; font-size: 1rem; margin-bottom: 1rem; color: var(--footer-accent); }
        .footer-link { color: var(--footer-muted); text-decoration: none; font-size: 0.875rem; transition: color 0.2s; }
        .footer-link:hover { color: var(--footer-accent); }
        .footer-text-primary { color: var(--footer-primary); }
        .footer-text-muted { color: var(--footer-muted); }
        .footer-feature-icon { background: var(--footer-mark-bg); border: 1px solid var(--footer-mark-border); color: var(--footer-accent); }
        .footer-social-btn { width: 38px; height: 38px; border-radius: 10px; background: var(--footer-mark-bg); border: 1px solid var(--footer-mark-border); display: flex; align-items: center; justify-content: center; color: var(--footer-accent); text-decoration: none; transition: all 0.2s; }
        .footer-social-btn:hover { transform: translateY(-1px); }
        .footer-bottom-shell { border-top: 1px solid var(--footer-border); background: var(--footer-bottom-bg); }
        html[data-theme='dark'] .footer-shell { --footer-primary: #e0f2fe; --footer-muted: rgba(224,242,254,0.6); --footer-accent: #67e8f9; --footer-brand: #e0f2fe; --footer-border: rgba(0,176,255,0.18); --footer-mark-bg: rgba(0,176,255,0.12); --footer-mark-border: rgba(0,176,255,0.22); --footer-mark-shadow: 0 0 18px rgba(0,176,255,0.2); --footer-brand-shadow: 0 0 12px rgba(0,176,255,0.4); --footer-bottom-bg: rgba(0,0,0,0.3); background: linear-gradient(180deg, #030b1a 0%, #050e22 100%); }
        html[data-theme='light'] .footer-shell { --footer-primary: #0d3a6e; --footer-muted: #3a7ab8; --footer-accent: #0070c8; --footer-brand: #0d3a6e; --footer-border: rgba(0,120,200,0.16); --footer-mark-bg: rgba(0,112,200,0.12); --footer-mark-border: rgba(0,112,200,0.2); --footer-mark-shadow: 0 0 12px rgba(0,112,200,0.12); --footer-brand-shadow: none; --footer-bottom-bg: rgba(224,242,254,0.8); background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 45%, #a5c8ff 100%); }
        @media (min-width: 768px) { .footer-features-grid { grid-template-columns: repeat(4, 1fr) !important; } .footer-main-grid { grid-template-columns: repeat(4, 1fr) !important; } }
        @media (min-width: 480px) and (max-width: 767px) { .footer-main-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </footer>
  );
}
