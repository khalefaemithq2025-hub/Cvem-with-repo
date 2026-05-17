import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Store, Lock, ArrowRight, User, Truck, Zap } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { normalizeArabicNumerals, sanitizeInput } from '../lib/normalizeInput';
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from '../lib/rateLimiter';

const RL_KEY = 'rl_unified_login';
const AUTH_ERR = 'اسم المستخدم أو كلمة المرور غير صحيحة، حاول مجدداً';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser, showToastMessage } = useStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const storeBtnRef = useRef<HTMLAnchorElement>(null);
  const deliveryBtnRef = useRef<HTMLAnchorElement>(null);

  const OWNER_IDENTIFIER = '123';
  const OWNER_PASSWORD = '123';

  useEffect(() => {
    const check = () => {
      const { blocked, remainingSeconds } = checkRateLimit(RL_KEY);
      if (blocked && remainingSeconds) setLockoutSeconds(remainingSeconds);
      else setLockoutSeconds(0);
    };
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, []);

  const DELIVERY_ACCOUNTS = [
    { username: 'السريع',  name: 'شركة السريع',    id: 'del-saree',  dcId: 'dc-001', phone: '0913111111' },
    { username: 'الأمانة', name: 'الأمانة للشحن', id: 'del-amanah', dcId: 'dc-002', phone: '0923222222' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const rl = checkRateLimit(RL_KEY);
    if (rl.blocked) {
      showToastMessage(`محظور مؤقتاً، انتظر ${rl.remainingSeconds} ثانية`, 'error');
      return;
    }
    const normId = sanitizeInput(normalizeArabicNumerals(identifier.trim()));
    const normPass = sanitizeInput(normalizeArabicNumerals(password));
    if (!normId || !normPass) {
      showToastMessage('يرجى ملء جميع الحقول', 'error');
      return;
    }
    setIsLoading(true);

    // ── Owner check ──────────────────────────────────────────────────────
    if (normId === OWNER_IDENTIFIER) {
      await new Promise((r) => setTimeout(r, 1000));
      if (normalizeArabicNumerals(normPass) === OWNER_PASSWORD) {
        clearRateLimit(RL_KEY);
        setUser({ id: 'owner-1', name: 'المالك', email: 'owner@cvem.ly', phone: '0500000000', role: 'owner', addresses: [], createdAt: new Date() });
        showToastMessage('مرحباً بك يا مالك المنصة!', 'success');
        navigate('/admin-cp/dashboard');
      } else {
        const res = recordFailedAttempt(RL_KEY);
        if (res.blocked) showToastMessage('تم تجاوز عدد المحاولات، محظور لمدة 5 دقائق', 'error');
        else showToastMessage(AUTH_ERR, 'error');
      }
      setIsLoading(false);
      return;
    }

    // ── Delivery company check ───────────────────────────────────────────
    const matchedDelivery = DELIVERY_ACCOUNTS.find(
      a => (normId === a.username || normId === a.name || normId === a.id) && normPass === '123'
    );
    if (matchedDelivery) {
      await new Promise((r) => setTimeout(r, 800));
      clearRateLimit(RL_KEY);
      setUser({
        id: matchedDelivery.id,
        name: matchedDelivery.name,
        email: `${matchedDelivery.username}@cvem.ly`,
        phone: matchedDelivery.phone,
        role: 'delivery',
        deliveryId: matchedDelivery.dcId,
        addresses: [],
        createdAt: new Date(),
      });
      showToastMessage(`تم تسجيل دخول ${matchedDelivery.name} بنجاح!`, 'success');
      navigate('/logistics/dashboard');
      setIsLoading(false);
      return;
    }

    // ── Customer / merchant via API ──────────────────────────────────────
    try {
      const { user, token } = await api.login(normId, normPass);
      clearRateLimit(RL_KEY);
      localStorage.setItem('token', token);
      setUser({ ...user, createdAt: new Date(user.createdAt) });
      sessionStorage.setItem('cvem_login_time', Date.now().toString());
      // مسح activeOrderId إذا لم يكن يخص هذا المستخدم (فحص orders + masterOrders)
      const savedActiveId = localStorage.getItem('activeOrderId');
      if (savedActiveId) {
        try {
          const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
          const allMasters = JSON.parse(localStorage.getItem('masterOrders') || '[]');
          const validInOrders = allOrders.some((o: any) => o.id === savedActiveId && o.customerId === user.id);
          const validInMasters = allMasters.some((mo: any) => mo.id === savedActiveId && mo.customerId === user.id);
          if (!validInOrders && !validInMasters) localStorage.removeItem('activeOrderId');
        } catch { localStorage.removeItem('activeOrderId'); }
      }
      showToastMessage('تم تسجيل الدخول بنجاح!', 'success');
      if (user.role === 'owner') navigate('/admin-cp/dashboard');
      else if (user.role === 'merchant') navigate('/store-portal/dashboard');
      else if (user.role === 'delivery' || user.role === 'logistics') navigate('/logistics/dashboard');
      else navigate('/');
    } catch {
      const res = recordFailedAttempt(RL_KEY);
      if (res.blocked) showToastMessage('تم تجاوز عدد المحاولات، محظور لمدة 5 دقائق', 'error');
      else showToastMessage(AUTH_ERR, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const bgStyle = isLight
    ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0f2fe 100%)'
    : 'linear-gradient(135deg, #020817, #0d3a6e, #0070c8)';

  const cardStyle: React.CSSProperties = {
    background: isLight ? '#ffffff' : '#0d1526',
    borderRadius: 24,
    padding: '2rem',
    boxShadow: isLight ? '0 8px 32px rgba(0,112,200,0.12)' : '0 8px 32px rgba(0,176,255,0.08)',
    border: `1px solid ${isLight ? '#dbeafe' : 'rgba(0,176,255,0.15)'}`,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.75rem',
    borderRadius: 12, border: `1.5px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.2)'}`,
    outline: 'none', fontFamily: 'Tajawal, sans-serif', fontSize: '0.95rem',
    background: isLight ? '#f8fafc' : '#080e1c',
    color: isLight ? '#0d2a4a' : '#e0f2fe',
    boxSizing: 'border-box' as const, direction: 'rtl' as const,
  };

  const quickBtnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.75rem 1rem', borderRadius: 12, textDecoration: 'none',
    fontSize: '0.875rem', fontWeight: 700, transition: 'all 0.2s',
    justifyContent: 'center', fontFamily: 'Tajawal, sans-serif',
  };

  const storeBtnStyle: React.CSSProperties = isLight
    ? { ...quickBtnBase, background: 'rgba(0,112,200,0.1)', border: '1.5px solid rgba(0,112,200,0.35)', color: '#0d3a6e' }
    : { ...quickBtnBase, background: 'rgba(0,176,255,0.18)', border: '1.5px solid rgba(0,176,255,0.55)', color: '#67e8f9', boxShadow: '0 0 10px rgba(0,176,255,0.15)' };

  const deliveryBtnStyle: React.CSSProperties = isLight
    ? { ...quickBtnBase, background: 'rgba(124,58,237,0.08)', border: '1.5px solid rgba(124,58,237,0.3)', color: '#4c1d95' }
    : { ...quickBtnBase, background: 'rgba(124,58,237,0.22)', border: '1.5px solid rgba(167,139,250,0.55)', color: '#c4b5fd', boxShadow: '0 0 10px rgba(124,58,237,0.2)' };

  return (
    <div style={{ minHeight: '100vh', background: bgStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: isLight ? 'rgba(0,112,200,0.12)' : 'linear-gradient(135deg,rgba(0,176,255,0.35),rgba(124,58,237,0.35))',
              border: `1px solid ${isLight ? 'rgba(0,112,200,0.25)' : 'rgba(0,176,255,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isLight ? '0 0 16px rgba(0,112,200,0.15)' : '0 0 20px rgba(0,176,255,0.4)',
            }}>
              <Zap style={{ width: 28, height: 28, color: isLight ? '#0070c8' : '#67e8f9' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: '1.3rem', color: isLight ? '#0d3a6e' : '#e0f2fe', lineHeight: 1.2 }}>مجمع سايبر فولت الإلكتروني</div>
              <div style={{ fontSize: '0.8rem', color: isLight ? '#3a7ab8' : 'rgba(224,242,254,0.6)' }}>بوابة الدخول الموحدة</div>
            </div>
          </Link>
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.35rem', color: isLight ? '#0d2a4a' : '#e0f2fe' }}>
            تسجيل الدخول
          </h2>
          <p style={{ textAlign: 'center', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.55)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
            مرحباً بعودتك! سجل دخولك للمتابعة
          </p>

          {lockoutSeconds > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '1.25rem', color: '#dc2626', fontSize: '0.875rem', fontWeight: 600, textAlign: 'center' }}>
              🔒 محظور مؤقتاً — {Math.floor(lockoutSeconds / 60)}:{String(lockoutSeconds % 60).padStart(2, '0')} دقيقة
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: isLight ? '#0d2a4a' : '#e0f2fe' }}>
                اسم المستخدم أو البريد الإلكتروني
              </label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)', zIndex: 1 }} />
                <input
                  ref={identifierRef}
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); passwordRef.current?.focus(); } }}
                  placeholder="اسم المستخدم أو البريد الإلكتروني"
                  style={{ ...inputStyle, paddingLeft: '2.75rem', paddingRight: '0.75rem' }}
                  onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                  onBlur={e => (e.target.style.borderColor = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.2)')}
                  autoComplete="username"
                  disabled={lockoutSeconds > 0}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: isLight ? '#0d2a4a' : '#e0f2fe' }}>
                كلمة المرور
              </label>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)', padding: 0, zIndex: 2 }}
                >
                  {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
                <Lock style={{ position: 'absolute', left: 40, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)', zIndex: 1 }} />
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'ArrowUp') { e.preventDefault(); identifierRef.current?.focus(); } }}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingLeft: '4.5rem' }}
                  onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                  onBlur={e => (e.target.style.borderColor = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.2)')}
                  autoComplete="current-password"
                  disabled={lockoutSeconds > 0}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || lockoutSeconds > 0}
              style={{
                width: '100%', padding: '0.85rem',
                background: (isLoading || lockoutSeconds > 0) ? '#93c5fd' : 'linear-gradient(135deg, #0070c8, #00B0FF)',
                color: '#fff', borderRadius: 12, border: 'none',
                cursor: (isLoading || lockoutSeconds > 0) ? 'not-allowed' : 'pointer',
                fontSize: '1rem', fontWeight: 700, fontFamily: 'Tajawal, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: (isLoading || lockoutSeconds > 0) ? 'none' : '0 4px 16px rgba(0,112,200,0.3)',
                transition: 'all 0.15s',
              }}
            >
              {isLoading
                ? <span style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                : <><span>تسجيل الدخول</span><ArrowRight style={{ width: 18, height: 18 }} /></>
              }
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ color: isLight ? '#6b7280' : 'rgba(224,242,254,0.5)', fontSize: '0.875rem' }}>ليس لديك حساب؟</span>
            <Link to="/auth/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.55rem 1rem', borderRadius: 12,
              background: isLight ? 'rgba(0,112,200,0.10)' : 'rgba(0,176,255,0.14)',
              border: `1.5px solid ${isLight ? 'rgba(0,112,200,0.35)' : 'rgba(0,176,255,0.4)'}`,
              color: isLight ? '#0d3a6e' : '#67e8f9', fontWeight: 700, fontSize: '0.875rem',
              textDecoration: 'none', transition: 'all 0.15s',
              boxShadow: isLight ? '0 2px 8px rgba(0,112,200,0.10)' : '0 2px 10px rgba(0,176,255,0.12)',
              fontFamily: 'Tajawal, sans-serif',
            }}>
              <Zap style={{ width: 15, height: 15, color: isLight ? '#0070c8' : '#67e8f9' }} />
              <span>سجل الآن</span>
            </Link>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Link
              ref={storeBtnRef}
              to="/store-portal/register"
              style={storeBtnStyle}
              onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); deliveryBtnRef.current?.focus(); } }}
            >
              <Store style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>تسجيل تاجر جديد</span>
            </Link>
            <Link
              ref={deliveryBtnRef}
              to="/logistics/register"
              style={deliveryBtnStyle}
              onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); storeBtnRef.current?.focus(); } }}
            >
              <Truck style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>تسجيل شركة توصيل جديدة</span>
            </Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.4rem', borderRadius: 14,
            background: isLight ? 'rgba(0,112,200,0.12)' : 'rgba(0,176,255,0.14)',
            border: `1px solid ${isLight ? 'rgba(0,112,200,0.3)' : 'rgba(0,176,255,0.3)'}`,
            color: isLight ? '#0d3a6e' : '#e0f2fe', fontWeight: 700, fontSize: '0.9rem',
            textDecoration: 'none', transition: 'all 0.2s',
            boxShadow: isLight ? '0 2px 8px rgba(0,112,200,0.12)' : '0 2px 10px rgba(0,176,255,0.15)',
          }}>
            <Zap style={{ width: 16, height: 16, color: isLight ? '#0070c8' : '#67e8f9' }} />
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
