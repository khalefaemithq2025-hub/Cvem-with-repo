import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, ArrowRight, User, Mail, Phone, MapPin, Tag, FileText, Zap } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { normalizeArabicNumerals, sanitizeInput } from '../lib/normalizeInput';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setUser, showToastMessage } = useStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [phone,           setPhone]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [location,        setLocation]        = useState('');
  const [locationCoords,  setLocationCoords]  = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus,  setLocationStatus]  = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [locationPlaceName, setLocationPlaceName] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [isLoading,       setIsLoading]       = useState(false);
  const [acceptTerms,     setAcceptTerms]     = useState(false);

  const nameRef     = useRef<HTMLInputElement>(null);
  const emailRef    = useRef<HTMLInputElement>(null);
  const phoneRef    = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef  = useRef<HTMLInputElement>(null);

  const handleLocation = () => {
    if (locationStatus === 'loading') return;
    setLocationStatus('loading');
    if (!navigator.geolocation) {
      setLocationStatus('error');
      showToastMessage('المتصفح لا يدعم تحديد الموقع', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationCoords({ lat: latitude, lng: longitude });
        setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setLocationStatus('success');
        showToastMessage('تم تحديد موقعك بنجاح', 'success');
      },
      (err) => {
        setLocationStatus('error');
        if (err.code === err.POSITION_UNAVAILABLE) {
          window.alert('خدمة الموقع (GPS) معطّلة على جهازك.\nيرجى تفعيل GPS من إعدادات الجهاز ثم المحاولة مجدداً.');
        } else {
          showToastMessage('لا يمكن الحصول على موقعك، فعل الموقع الجغرافي في جهازك أولا', 'error', 4000);
        }
      },
      { timeout: 10000 }
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const normName    = sanitizeInput(name.trim());
    const normEmail   = sanitizeInput(normalizeArabicNumerals(email.trim()));
    const normPhone   = sanitizeInput(normalizeArabicNumerals(phone.trim()));
    const normPass    = normalizeArabicNumerals(password);
    const normConfirm = normalizeArabicNumerals(confirmPassword);
    if (!normName || !normEmail || !normPhone || !normPass || !normConfirm) {
      showToastMessage('يرجى ملء جميع الحقول', 'error'); return;
    }
    if (!location) { showToastMessage('يرجى تحديد موقعك الجغرافي', 'error'); return; }
    if (locationStatus === 'success' && !locationPlaceName.trim()) {
      showToastMessage('يرجى إدخال اسم المكان', 'error'); return;
    }
    if (normPass !== normConfirm) { showToastMessage('كلمات المرور غير متطابقة', 'error'); return; }
    if (!acceptTerms) { showToastMessage('يرجى قبول الشروط والأحكام', 'error'); return; }
    setIsLoading(true);
    try {
      const { user, token } = await api.register(normName, normEmail, normPhone, normPass);
      localStorage.setItem('token', token);
      if (locationCoords) {
        localStorage.setItem(`user_location_${user.id}`, JSON.stringify({
          ...locationCoords,
          placeName: locationPlaceName,
          description: locationDescription,
        }));
      }
      setUser({ ...user, createdAt: new Date(user.createdAt) });
      showToastMessage('تم إنشاء الحساب بنجاح!', 'success');
      navigate('/');
    } catch (err: any) {
      showToastMessage(err.message || 'خطأ في إنشاء الحساب', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const bgStyle = isLight
    ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0f2fe 100%)'
    : 'linear-gradient(135deg, #020817, #0d3a6e, #0070c8)';

  const cardStyle: React.CSSProperties = {
    background: isLight ? '#ffffff' : '#0d1526',
    borderRadius: 24, padding: '2rem',
    boxShadow: isLight ? '0 8px 32px rgba(0,112,200,0.12)' : '0 8px 32px rgba(0,176,255,0.08)',
    border: `1px solid ${isLight ? '#dbeafe' : 'rgba(0,176,255,0.15)'}`,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.75rem',
    borderRadius: 12, border: `1.5px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.2)'}`,
    outline: 'none', fontFamily: 'Tajawal, sans-serif', fontSize: '0.95rem',
    background: isLight ? '#f8fafc' : '#080e1c', color: isLight ? '#0d2a4a' : '#e0f2fe',
    boxSizing: 'border-box' as const, direction: 'rtl' as const, transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.875rem', fontWeight: 600,
    marginBottom: '0.5rem', color: isLight ? '#0d2a4a' : '#e0f2fe',
  };

  const iconPos: React.CSSProperties = {
    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
    width: 18, height: 18, color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)', zIndex: 1,
  };

  const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = '#00B0FF');
  const blurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.2)');

  const nav = (up: React.RefObject<HTMLInputElement | null> | null, down: React.RefObject<HTMLInputElement | null> | null) =>
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown' && down) { e.preventDefault(); down.current?.focus(); }
      if (e.key === 'ArrowUp'   && up)   { e.preventDefault(); up.current?.focus();   }
    };

  return (
    <div style={{ minHeight: '100vh', background: bgStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: isLight ? 'rgba(0,112,200,0.12)' : 'linear-gradient(135deg,rgba(0,176,255,0.35),rgba(124,58,237,0.35))', border: `1px solid ${isLight ? 'rgba(0,112,200,0.25)' : 'rgba(0,176,255,0.35)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isLight ? '0 0 16px rgba(0,112,200,0.15)' : '0 0 20px rgba(0,176,255,0.4)' }}>
              <Zap style={{ width: 28, height: 28, color: isLight ? '#0070c8' : '#67e8f9' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: '1.3rem', color: isLight ? '#0d3a6e' : '#e0f2fe', lineHeight: 1.2 }}>مجمع سايبر فولت الإلكتروني</div>
              <div style={{ fontSize: '0.8rem', color: isLight ? '#3a7ab8' : 'rgba(224,242,254,0.6)' }}>إنشاء حساب عميل جديد</div>
            </div>
          </Link>
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.35rem', color: isLight ? '#0d2a4a' : '#e0f2fe' }}>إنشاء حساب جديد</h2>
          <p style={{ textAlign: 'center', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.55)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>انضم إلينا واستمتع بتجربة تسوق فريدة</p>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Name */}
            <div>
              <label style={labelStyle}>الاسم الكامل</label>
              <div style={{ position: 'relative' }}>
                <User style={iconPos} />
                <input ref={nameRef} type="text" value={name} onChange={e => setName(e.target.value)}
                  onKeyDown={nav(null, emailRef)} onFocus={focusBorder} onBlur={blurBorder}
                  placeholder="أحمد محمد" style={{ ...inputStyle, paddingLeft: '2.75rem', paddingRight: '0.75rem' }}
                  autoComplete="name" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>البريد الإلكتروني</label>
              <div style={{ position: 'relative' }}>
                <Mail style={iconPos} />
                <input ref={emailRef} type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={nav(nameRef, phoneRef)} onFocus={focusBorder} onBlur={blurBorder}
                  placeholder="example@email.com" style={{ ...inputStyle, paddingLeft: '2.75rem', paddingRight: '0.75rem' }}
                  autoComplete="email" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={labelStyle}>رقم الجوال</label>
              <div style={{ position: 'relative' }}>
                <Phone style={iconPos} />
                <input ref={phoneRef} type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  onKeyDown={nav(emailRef, passwordRef)} onFocus={focusBorder} onBlur={blurBorder}
                  placeholder="09xxxxxxxx" style={{ ...inputStyle, paddingLeft: '2.75rem', paddingRight: '0.75rem' }} />
              </div>
            </div>

            {/* Location — GPS button */}
            <div>
              <label style={labelStyle}>
                الموقع الجغرافي <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>*</span>
              </label>
              <button
                type="button" onClick={handleLocation}
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: 12,
                  cursor: locationStatus === 'loading' ? 'not-allowed' : 'pointer',
                  border: `1.5px solid ${locationStatus === 'success' ? '#22c55e' : locationStatus === 'error' ? '#ef4444' : isLight ? '#e5e7eb' : 'rgba(0,176,255,0.2)'}`,
                  background: locationStatus === 'success' ? (isLight ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.10)') : locationStatus === 'error' ? 'rgba(239,68,68,0.06)' : (isLight ? '#f8fafc' : '#080e1c'),
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  fontFamily: 'Tajawal, sans-serif', fontSize: '0.9rem',
                  color: locationStatus === 'success' ? '#16a34a' : locationStatus === 'error' ? '#ef4444' : (isLight ? '#6b7280' : 'rgba(224,242,254,0.45)'),
                  transition: 'all 0.15s', direction: 'rtl', boxSizing: 'border-box',
                }}
              >
                {locationStatus === 'loading' ? (
                  <><span style={{ width: 16, height: 16, border: '2px solid rgba(0,176,255,0.3)', borderTopColor: '#00B0FF', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} /><span>جارٍ تحديد الموقع...</span></>
                ) : locationStatus === 'success' ? (
                  <><MapPin style={{ width: 18, height: 18, flexShrink: 0 }} /><span>تم تحديد موقعك ✓</span><span style={{ fontSize: '0.75rem', opacity: 0.7, marginRight: 'auto' }}>{location}</span></>
                ) : (
                  <><MapPin style={{ width: 18, height: 18, flexShrink: 0 }} /><span>{locationStatus === 'error' ? 'فشل التحديد — اضغط للمحاولة مجدداً' : 'اضغط لتحديد موقعك الجغرافي'}</span></>
                )}
              </button>
            </div>

            {/* Place Name + Description — appear after GPS success */}
            {locationStatus === 'success' && (
              <>
                <div>
                  <label style={labelStyle}>
                    اسم المكان <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Tag style={iconPos} />
                    <input
                      type="text" value={locationPlaceName}
                      onChange={e => setLocationPlaceName(e.target.value)}
                      onFocus={focusBorder} onBlur={blurBorder}
                      placeholder="مثال: المنزل، مكتب، صيدلية..."
                      style={{ ...inputStyle, paddingLeft: '2.75rem', paddingRight: '0.75rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>وصف المكان</label>
                  <div style={{ position: 'relative' }}>
                    <FileText style={{ ...iconPos, top: 14, transform: 'none' }} />
                    <textarea
                      value={locationDescription}
                      onChange={e => setLocationDescription(e.target.value)}
                      onFocus={focusBorder as any} onBlur={blurBorder as any}
                      placeholder="مثال: يقع على اليمين من المدخل الرئيسي..."
                      rows={2}
                      style={{
                        ...inputStyle, paddingLeft: '2.75rem', paddingRight: '0.75rem',
                        paddingTop: '0.75rem', resize: 'vertical', lineHeight: 1.5,
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label style={labelStyle}>كلمة المرور</label>
              <div style={{ position: 'relative' }}>
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)', padding: 0, zIndex: 2 }}>
                  {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
                <Lock style={{ ...iconPos, left: 40 }} />
                <input ref={passwordRef} type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} onKeyDown={nav(phoneRef, confirmRef)}
                  onFocus={focusBorder} onBlur={blurBorder} placeholder="••••••••"
                  style={{ ...inputStyle, paddingLeft: '4.5rem', paddingRight: '0.75rem' }}
                  autoComplete="new-password" />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={labelStyle}>تأكيد كلمة المرور</label>
              <div style={{ position: 'relative' }}>
                <Lock style={iconPos} />
                <input ref={confirmRef} type={showPassword ? 'text' : 'password'} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} onKeyDown={nav(passwordRef, null)}
                  onFocus={focusBorder} onBlur={blurBorder} placeholder="••••••••"
                  style={{ ...inputStyle, paddingLeft: '2.75rem', paddingRight: '0.75rem' }} />
              </div>
            </div>

            {/* Terms */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)}
                style={{ width: 16, height: 16, marginTop: 2, accentColor: '#00B0FF', flexShrink: 0 }} />
              <span style={{ fontSize: '0.85rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.55)' }}>
                أوافق على{' '}<a href="#" style={{ color: isLight ? '#0070c8' : '#67e8f9', textDecoration: 'none' }}>الشروط والأحكام</a>{' '}و{' '}<a href="#" style={{ color: isLight ? '#0070c8' : '#67e8f9', textDecoration: 'none' }}>سياسة الخصوصية</a>
              </span>
            </label>

            {/* Submit */}
            <button type="submit" disabled={isLoading}
              style={{ width: '100%', padding: '0.85rem', background: isLoading ? '#93c5fd' : 'linear-gradient(135deg, #0070c8, #00B0FF)', color: '#fff', borderRadius: 12, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: 700, fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: isLoading ? 'none' : '0 4px 16px rgba(0,112,200,0.3)', transition: 'all 0.15s' }}>
              {isLoading
                ? <span style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                : <><span>إنشاء الحساب</span><ArrowRight style={{ width: 18, height: 18 }} /></>}
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <p style={{ color: isLight ? '#6b7280' : 'rgba(224,242,254,0.5)', fontSize: '0.875rem', margin: 0 }}>
              لديك حساب بالفعل؟{' '}
              <Link to="/auth/login" style={{ color: isLight ? '#0070c8' : '#67e8f9', fontWeight: 600, textDecoration: 'none' }}>سجل دخولك</Link>
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.4rem', borderRadius: 14, background: isLight ? 'rgba(0,112,200,0.12)' : 'rgba(0,176,255,0.14)', border: `1px solid ${isLight ? 'rgba(0,112,200,0.3)' : 'rgba(0,176,255,0.3)'}`, color: isLight ? '#0d3a6e' : '#e0f2fe', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
            <Zap style={{ width: 16, height: 16, color: isLight ? '#0070c8' : '#67e8f9' }} />
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
