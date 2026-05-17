import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, ArrowRight, Zap, Store } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { normalizeArabicNumerals, sanitizeInput } from '../lib/normalizeInput';
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from '../lib/rateLimiter';

const RL_KEY = 'rl_merchant_login';
const AUTH_ERR = 'اسم المستخدم أو كلمة المرور غير صحيحة، حاول مجدداً';

export default function MerchantLoginPage() {
  const navigate = useNavigate();
  const { setUser, showToastMessage } = useStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const rl = checkRateLimit(RL_KEY);
    if (rl.blocked) {
      showToastMessage(`محظور مؤقتاً، انتظر ${rl.remainingSeconds} ثانية`, 'error');
      return;
    }
    const normEmail = sanitizeInput(normalizeArabicNumerals(email.trim()));
    const normPass = sanitizeInput(normalizeArabicNumerals(password));
    if (!normEmail || !normPass) { showToastMessage('يرجى ملء جميع الحقول', 'error'); return; }

    setIsLoading(true);
    try {
      const { user, token } = await api.login(normEmail, normPass);
      if (user.role !== 'merchant') {
        const res = recordFailedAttempt(RL_KEY);
        if (res.blocked) showToastMessage(`تم تجاوز عدد المحاولات، محظور لمدة 5 دقائق`, 'error');
        else showToastMessage(AUTH_ERR, 'error');
        return;
      }
      clearRateLimit(RL_KEY);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      showToastMessage('تم تسجيل دخول المحل بنجاح!', 'success');
      navigate('/store-portal/dashboard');
    } catch {
      const res = recordFailedAttempt(RL_KEY);
      if (res.blocked) showToastMessage(`تم تجاوز عدد المحاولات، محظور لمدة 5 دقائق`, 'error');
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
              <div style={{ fontWeight: 800, fontSize: '1.3rem', color: isLight ? '#0d3a6e' : '#e0f2fe', lineHeight: 1.2 }}>بوابة المحلات</div>
              <div style={{ fontSize: '0.8rem', color: isLight ? '#3a7ab8' : 'rgba(224,242,254,0.6)' }}>مجمع سايبر فولت الإلكتروني</div>
            </div>
          </Link>
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.35rem', color: isLight ? '#0d2a4a' : '#e0f2fe' }}>
            تسجيل دخول المحل
          </h2>
          <p style={{ textAlign: 'center', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.55)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
            إدارة متجرك وتتبع طلباتك
          </p>

          {lockoutSeconds > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '1.25rem', color: '#dc2626', fontSize: '0.875rem', fontWeight: 600, textAlign: 'center' }}>
              🔒 محظور مؤقتاً — {Math.floor(lockoutSeconds / 60)}:{String(lockoutSeconds % 60).padStart(2, '0')}
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
                  ref={emailRef}
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); passwordRef.current?.focus(); } }}
                  placeholder="اسم المستخدم أو البريد الإلكتروني"
                  style={{ ...inputStyle, paddingLeft: '2.75rem', paddingRight: '0.75rem' }}
                  onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                  onBlur={e => (e.target.style.borderColor = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.2)')}
                  autoCapitalize="none" autoCorrect="off" autoComplete="username" spellCheck={false}
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
                  onKeyDown={e => { if (e.key === 'ArrowUp') { e.preventDefault(); emailRef.current?.focus(); } }}
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
        </div>

        <Link
          to="/store-portal/register"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem',
            width: '100%', padding: '1rem 1.5rem', marginTop: '1rem',
            borderRadius: 16, textDecoration: 'none', fontFamily: 'Tajawal, sans-serif',
            fontWeight: 800, fontSize: '1.05rem', boxSizing: 'border-box',
            background: isLight
              ? 'linear-gradient(135deg, rgba(0,112,200,0.12), rgba(124,58,237,0.1))'
              : 'linear-gradient(135deg, rgba(0,176,255,0.18), rgba(124,58,237,0.18))',
            border: `1.5px solid ${isLight ? 'rgba(0,112,200,0.35)' : 'rgba(0,176,255,0.4)'}`,
            color: isLight ? '#0d3a6e' : '#e0f2fe',
            boxShadow: isLight ? '0 4px 16px rgba(0,112,200,0.12)' : '0 4px 20px rgba(0,176,255,0.15)',
            transition: 'all 0.2s',
          }}
        >
          <Store style={{ width: 22, height: 22, color: isLight ? '#0070c8' : '#67e8f9', flexShrink: 0 }} />
          <span>سجل متجرك الآن</span>
        </Link>

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
