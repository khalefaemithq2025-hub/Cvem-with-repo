import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, User, Mail, Phone, MapPin, CheckCircle, Zap, ArrowRight, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useStore } from '../context/StoreContext';

const CITIES = ['طرابلس', 'بنغازي', 'مصراتة', 'زليتن', 'سبها', 'المرج', 'الزاوية', 'الخمس'];
const FLEET_OPTIONS = ['1-5 مركبات', '6-15 مركبة', '16-30 مركبة', '31-50 مركبة', 'أكثر من 50 مركبة'];
const HOUR_MS = 60 * 60 * 1000;

export default function DeliveryRegisterPage() {
  const { theme } = useTheme();
  const { showToastMessage } = useStore();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [coveredCities, setCoveredCities] = useState<string[]>([]);
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', fleetSize: '', description: '' });

  const canSubmit = () => {
    const last = sessionStorage.getItem('delivery_last_apply');
    if (!last) return true;
    return Date.now() - parseInt(last) > HOUR_MS;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.contactName || !form.email || !form.phone) {
      showToastMessage('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    if (!coveredCities.length) {
      showToastMessage('يرجى تحديد المدن التي تغطيها', 'error');
      return;
    }
    if (!canSubmit()) {
      const last = parseInt(sessionStorage.getItem('delivery_last_apply') || '0');
      const remaining = Math.ceil((HOUR_MS - (Date.now() - last)) / 60000);
      showToastMessage(`يرجى الانتظار ${remaining} دقيقة قبل تقديم طلب جديد`, 'error');
      return;
    }
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    const application = {
      id: `del-app-${Date.now()}`,
      type: 'delivery',
      companyName: form.companyName,
      contactName: form.contactName,
      email: form.email,
      phone: form.phone,
      fleetSize: form.fleetSize,
      coveredCities,
      description: form.description,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    try {
      const existing = JSON.parse(localStorage.getItem('pending_delivery_applications') || '[]');
      existing.unshift(application);
      localStorage.setItem('pending_delivery_applications', JSON.stringify(existing));
      sessionStorage.setItem('delivery_last_apply', Date.now().toString());
    } catch {}
    setIsLoading(false);
    setSent(true);
  };

  const toggleCity = (city: string) => {
    setCoveredCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]);
  };

  const bg = isLight
    ? 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 50%, #f0f9ff 100%)'
    : 'linear-gradient(135deg, #020817 0%, #0a1628 50%, #061030 100%)';
  const cardBg = isLight ? '#fff' : '#0d1526';
  const border = isLight ? '#dbeafe' : 'rgba(0,176,255,0.15)';
  const textPrimary = isLight ? '#0d2a4a' : '#e0f2fe';
  const textMuted = isLight ? '#6b7280' : 'rgba(224,242,254,0.5)';
  const inputBorder = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.2)';
  const inputBg = isLight ? '#f8fafc' : '#080e1c';

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.75rem',
    borderRadius: 12, border: `1.5px solid ${inputBorder}`,
    outline: 'none', fontFamily: 'Tajawal, sans-serif', fontSize: '0.95rem',
    background: inputBg, color: textPrimary, boxSizing: 'border-box', direction: 'rtl',
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const arrowKeys = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];
    if (!arrowKeys.includes(e.key)) return;
    const inputs = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('input:not([disabled]), textarea:not([disabled])'));
    const idx = inputs.indexOf(document.activeElement as HTMLElement);
    if (idx === -1) return;
    e.preventDefault();
    let next: HTMLElement | undefined;
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = inputs[idx + 1];
    else if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = inputs[idx - 1];
    if (next) next.focus();
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, direction: 'rtl', fontFamily: 'Tajawal, sans-serif', padding: '2rem 1rem 4rem' }}>
      {/* Header bar */}
      <div style={{ borderBottom: `1px solid ${border}`, background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(2,6,23,0.7)', backdropFilter: 'blur(12px)', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: isLight ? 'rgba(0,112,200,0.12)' : 'rgba(0,176,255,0.15)', border: isLight ? '1px solid rgba(0,112,200,0.25)' : '1px solid rgba(0,176,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isLight ? '0 0 12px rgba(0,112,200,0.12)' : 'none' }}>
            <Zap style={{ width: 22, height: 22, color: isLight ? '#0070c8' : '#67e8f9' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isLight ? '#0d3a6e' : '#e0f2fe' }}>CyberVolt e-Mall</div>
            <div style={{ fontSize: '0.7rem', color: textMuted }}>بوابة تسجيل شركات التوصيل</div>
          </div>
        </Link>
        <Link to="/logistics/login" style={{ fontSize: '0.85rem', color: isLight ? '#0070c8' : '#67e8f9', textDecoration: 'none', padding: '0.4rem 1rem', borderRadius: 8, border: `1px solid ${isLight ? 'rgba(0,112,200,0.25)' : 'rgba(103,232,249,0.25)'}`, background: isLight ? 'rgba(0,112,200,0.08)' : 'rgba(0,176,255,0.08)' }}>
          تسجيل الدخول
        </Link>
      </div>

      <div style={{ maxWidth: 640, margin: '5rem auto 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: isLight ? 'rgba(0,112,200,0.1)' : 'rgba(0,176,255,0.1)', border: `1px solid ${isLight ? 'rgba(0,112,200,0.25)' : 'rgba(0,176,255,0.2)'}`, borderRadius: 24, padding: '0.4rem 1.2rem', marginBottom: '1rem', fontSize: '0.8rem', color: isLight ? '#0070c8' : '#67e8f9' }}>
            <Truck style={{ width: 14, height: 14 }} />
            <span>تسجيل شركة توصيل</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: isLight ? '#0d3a6e' : '#fff', marginBottom: '0.5rem' }}>انضم كشركة توصيل</h1>
          <p style={{ color: textMuted, fontSize: '0.95rem' }}>وسّع نطاق عملك وخدّم آلاف التجار والعملاء في ليبيا</p>
        </div>

        {!sent ? (
          <div style={{ background: cardBg, borderRadius: 24, overflow: 'hidden', boxShadow: isLight ? '0 8px 32px rgba(0,112,200,0.12)' : '0 8px 32px rgba(0,176,255,0.08)' }}>
            <div style={{ background: 'linear-gradient(135deg,#0a2d62,#1565c0)', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.3)' }}>
                <Truck style={{ width: 28, height: 28, color: '#fff' }} />
              </div>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', margin: 0 }}>بيانات الشركة</h2>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', margin: '0.2rem 0 0' }}>جميع الطلبات تراجع من قبل فريق CyberVolt</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: textPrimary }}>اسم الشركة *</label>
                  <div style={{ position: 'relative' }}>
                    <Truck style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)' }} />
                    <input type="text" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="شركة التوصيل السريع" style={{ ...inputStyle }}
                      onFocus={e => (e.target.style.borderColor = '#00B0FF')} onBlur={e => (e.target.style.borderColor = inputBorder)} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: textPrimary }}>اسم المسؤول *</label>
                  <div style={{ position: 'relative' }}>
                    <User style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)' }} />
                    <input type="text" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} placeholder="الاسم الكامل" style={{ ...inputStyle }}
                      onFocus={e => (e.target.style.borderColor = '#00B0FF')} onBlur={e => (e.target.style.borderColor = inputBorder)} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: textPrimary }}>البريد الإلكتروني *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)' }} />
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="company@mail.com" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
                      onFocus={e => (e.target.style.borderColor = '#00B0FF')} onBlur={e => (e.target.style.borderColor = inputBorder)} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: textPrimary }}>رقم الهاتف *</label>
                  <div style={{ position: 'relative' }}>
                    <Phone style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)' }} />
                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="09xxxxxxxx" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
                      onFocus={e => (e.target.style.borderColor = '#00B0FF')} onBlur={e => (e.target.style.borderColor = inputBorder)} />
                  </div>
                </div>
              </div>

              {/* Fleet size */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: textPrimary }}>حجم الأسطول</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {FLEET_OPTIONS.map(opt => (
                    <button key={opt} type="button" onClick={() => setForm({ ...form, fleetSize: opt })}
                      style={{ padding: '0.45rem 0.9rem', borderRadius: 20, border: `1.5px solid ${form.fleetSize === opt ? '#00B0FF' : inputBorder}`, background: form.fleetSize === opt ? 'rgba(0,176,255,0.12)' : 'transparent', color: form.fleetSize === opt ? '#00B0FF' : textMuted, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Covered cities */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.6rem', color: textPrimary }}>
                  <MapPin style={{ width: 15, height: 15, color: isLight ? '#0070c8' : '#67e8f9' }} />
                  المدن التي تغطيها *
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {CITIES.map(city => (
                    <button key={city} type="button" onClick={() => toggleCity(city)}
                      style={{ padding: '0.45rem 0.9rem', borderRadius: 20, border: `1.5px solid ${coveredCities.includes(city) ? '#00B0FF' : inputBorder}`, background: coveredCities.includes(city) ? 'rgba(0,176,255,0.14)' : 'transparent', color: coveredCities.includes(city) ? '#00B0FF' : textMuted, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s' }}>
                      {coveredCities.includes(city) ? '✓ ' : ''}{city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: textPrimary }}>نبذة عن الشركة <span style={{ color: textMuted, fontWeight: 400 }}>(اختياري)</span></label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="اشرح خبرة شركتك في التوصيل..."
                  rows={3}
                  style={{ ...inputStyle, paddingLeft: '0.75rem', resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                  onBlur={e => (e.target.style.borderColor = inputBorder)} />
              </div>

              <div style={{ padding: '0.75rem 1rem', borderRadius: 10, background: isLight ? '#eff6ff' : 'rgba(0,176,255,0.06)', border: `1px solid ${isLight ? '#bfdbfe' : 'rgba(0,176,255,0.15)'}`, display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <AlertCircle style={{ width: 16, height: 16, color: '#2563eb', flexShrink: 0, marginTop: 2 }} />
                <p style={{ color: isLight ? '#1e40af' : '#93c5fd', fontSize: '0.82rem', margin: 0, lineHeight: 1.6 }}>
                  سيتم مراجعة طلبك من قبل فريق سايبر فولت خلال 24-48 ساعة. يمنع تقديم أكثر من طلب في الساعة الواحدة.
                </p>
              </div>

              <button type="submit" disabled={isLoading}
                style={{ width: '100%', padding: '0.9rem', background: isLoading ? '#93c5fd' : 'linear-gradient(135deg, #0070c8, #00B0FF)', color: '#fff', borderRadius: 12, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: 700, fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: isLoading ? 'none' : '0 4px 16px rgba(0,112,200,0.3)', transition: 'all 0.15s' }}>
                {isLoading
                  ? <span style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  : <><ArrowRight style={{ width: 18, height: 18 }} /><span>تقديم الطلب</span></>
                }
              </button>
            </form>
          </div>
        ) : (
          <div style={{ background: cardBg, borderRadius: 24, padding: '3rem 2rem', textAlign: 'center', border: `1px solid ${border}`, boxShadow: isLight ? '0 8px 32px rgba(0,112,200,0.12)' : '0 8px 32px rgba(0,176,255,0.08)' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: isLight ? '#dcfce7' : 'rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <CheckCircle style={{ width: 40, height: 40, color: '#16a34a' }} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: textPrimary, marginBottom: '1rem' }}>تم إرسال الطلب!</h2>
            <p style={{ color: textMuted, fontSize: '0.95rem', lineHeight: 1.9, marginBottom: '2rem', maxWidth: 420, margin: '0 auto 2rem' }}>
              لقد أرسلنا طلبك بنجاح وستصلك رسالة على البريد بعد الموافقة وتسجيلك كفرد في عائلة سايبر فولت.
            </p>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', borderRadius: 12, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
              <Zap style={{ width: 16, height: 16 }} />
              العودة للرئيسية
            </Link>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
