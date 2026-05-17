import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Headphones, Send, CheckCircle, MessageSquare, Zap, User, Phone, ChevronDown } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';

const INQUIRY_TYPES = [
  'استفسار عن منتج',
  'مشكلة في طلبية',
  'ضمان وإرجاع',
  'مشكلة في الدفع',
  'استفسار عن التوصيل',
  'شكوى عن محل',
  'اقتراح أو ملاحظة',
  'أخرى',
];

function InquiryDropdown({ value, onChange, inputBg, inputBorder, textPrimary, isLight }: {
  value: string; onChange: (v: string) => void;
  inputBg: string; inputBorder: string; textPrimary: string; isLight: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: 12, border: `1.5px solid ${open ? '#00B0FF' : inputBorder}`, background: inputBg, color: value ? textPrimary : (isLight ? '#9ca3af' : 'rgba(224,242,254,0.35)'), fontFamily: 'Tajawal, sans-serif', fontSize: '0.95rem', cursor: 'pointer', textAlign: 'right', transition: 'border-color 0.15s' }}>
        <span style={{ flex: 1 }}>{value || 'اختر نوع الاستفسار...'}</span>
        <ChevronDown style={{ width: 18, height: 18, opacity: 0.5, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, left: 0, zIndex: 50, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.22)', border: `1px solid ${inputBorder}`, background: isLight ? '#fff' : '#0d1526', maxHeight: 280, overflowY: 'auto' }}>
          {INQUIRY_TYPES.map(t => (
            <button key={t} type="button" onClick={() => { onChange(t); setOpen(false); }}
              style={{ display: 'block', width: '100%', padding: '0.7rem 1rem', background: value === t ? (isLight ? 'rgba(0,112,200,0.08)' : 'rgba(0,176,255,0.1)') : 'transparent', color: value === t ? '#00B0FF' : textPrimary, border: 'none', cursor: 'pointer', textAlign: 'right', fontFamily: 'Tajawal, sans-serif', fontSize: '0.9rem', fontWeight: value === t ? 700 : 400, transition: 'background 0.1s' }}
              onMouseEnter={e => { if (value !== t) e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (value !== t) e.currentTarget.style.background = 'transparent'; }}>
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const { user, showToastMessage } = useStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: '',
    inquiryType: '',
    message: '',
  });

  if (user?.role === 'support') {
    navigate('/helpdesk/dashboard', { replace: true });
    return null;
  }

  const bg = isLight
    ? 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 50%, #f0f9ff 100%)'
    : 'linear-gradient(135deg, #020817 0%, #0a1628 50%, #061030 100%)';
  const cardBg = isLight ? '#fff' : '#0d1526';
  const border = isLight ? '#dbeafe' : 'rgba(0,176,255,0.15)';
  const textPrimary = isLight ? '#0d2a4a' : '#e0f2fe';
  const textMuted = isLight ? '#6b7280' : 'rgba(224,242,254,0.5)';
  const inputBg = isLight ? '#f8fafc' : '#080e1c';
  const inputBorder = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.2)';

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.75rem',
    borderRadius: 12, border: `1.5px solid ${inputBorder}`,
    outline: 'none', fontFamily: 'Tajawal, sans-serif', fontSize: '0.95rem',
    background: inputBg, color: textPrimary, boxSizing: 'border-box', direction: 'rtl',
    transition: 'border-color 0.15s',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.inquiryType || !form.message.trim()) {
      showToastMessage('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const inquiry = {
      id: `inq-${Date.now()}`,
      customerName: form.name,
      subject: form.inquiryType,
      message: form.message,
      phone: form.phone,
      customerId: user?.id || 'guest',
      createdAt: new Date().toISOString(),
      status: 'open',
    };
    try {
      const existing = JSON.parse(localStorage.getItem('support_inquiries') || '[]');
      existing.unshift(inquiry);
      localStorage.setItem('support_inquiries', JSON.stringify(existing));
    } catch {}
    setIsLoading(false);
    setSent(true);
    showToastMessage('تم إرسال استفسارك بنجاح!', 'success');
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, direction: 'rtl', fontFamily: 'Tajawal, sans-serif', padding: '4rem 1rem 3rem' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* Logo */}
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
              <div style={{ fontWeight: 800, fontSize: '1.3rem', color: isLight ? '#0d3a6e' : '#e0f2fe', lineHeight: 1.2 }}>بوابة الدعم</div>
              <div style={{ fontSize: '0.8rem', color: isLight ? '#3a7ab8' : 'rgba(224,242,254,0.6)' }}>CyberVolt e-Mall</div>
            </div>
          </Link>
        </div>

        {!sent ? (
          <div style={{ background: cardBg, borderRadius: 24, padding: '2rem', boxShadow: isLight ? '0 8px 32px rgba(0,112,200,0.12)' : '0 8px 32px rgba(0,176,255,0.08)', border: `1px solid ${border}` }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: isLight ? '#dbeafe' : 'rgba(0,176,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Headphones style={{ width: 22, height: 22, color: isLight ? '#0070c8' : '#67e8f9' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: textPrimary, margin: 0 }}>تواصل مع الدعم</h2>
                <p style={{ fontSize: '0.82rem', color: textMuted, margin: 0 }}>فريق الدعم متاح 24/7 للمساعدة</p>
              </div>
            </div>
            <div style={{ height: 1, background: isLight ? '#e5e7eb' : 'rgba(0,176,255,0.1)', margin: '1.25rem 0' }} />

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: textPrimary }}>الاسم الكامل *</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)' }} />
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="اسمك" style={{ ...inputStyle }}
                    onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                    onBlur={e => (e.target.style.borderColor = inputBorder)} />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: textPrimary }}>رقم الهاتف <span style={{ color: textMuted, fontWeight: 400 }}>(اختياري)</span></label>
                <div style={{ position: 'relative' }}>
                  <Phone style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)' }} />
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="09xxxxxxxx" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
                    onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                    onBlur={e => (e.target.style.borderColor = inputBorder)} />
                </div>
              </div>

              {/* Inquiry Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: textPrimary }}>نوع الاستفسار *</label>
                <InquiryDropdown
                  value={form.inquiryType}
                  onChange={v => setForm({ ...form, inquiryType: v })}
                  inputBg={inputBg}
                  inputBorder={inputBorder}
                  textPrimary={textPrimary}
                  isLight={isLight}
                />
              </div>

              {/* Message */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: textPrimary }}>رسالتك *</label>
                <div style={{ position: 'relative' }}>
                  <MessageSquare style={{ position: 'absolute', left: 12, top: 14, width: 18, height: 18, color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)' }} />
                  <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder="اشرح استفسارك أو مشكلتك بالتفصيل..."
                    rows={5}
                    style={{ ...inputStyle, paddingTop: '0.75rem', paddingBottom: '0.75rem', resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                    onBlur={e => (e.target.style.borderColor = inputBorder)} />
                </div>
              </div>

              <button type="submit" disabled={isLoading}
                style={{
                  width: '100%', padding: '0.9rem',
                  background: isLoading ? '#93c5fd' : 'linear-gradient(135deg, #0070c8, #00B0FF)',
                  color: '#fff', borderRadius: 12, border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem', fontWeight: 700, fontFamily: 'Tajawal, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: isLoading ? 'none' : '0 4px 16px rgba(0,112,200,0.3)',
                  transition: 'all 0.15s',
                }}>
                {isLoading
                  ? <span style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  : <><Send style={{ width: 18, height: 18 }} /><span>إرسال الاستفسار</span></>
                }
              </button>
            </form>
          </div>
        ) : (
          <div style={{ background: cardBg, borderRadius: 24, padding: '2.5rem 2rem', textAlign: 'center', border: `1px solid ${border}`, boxShadow: isLight ? '0 8px 32px rgba(0,112,200,0.12)' : '0 8px 32px rgba(0,176,255,0.08)' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: isLight ? '#dcfce7' : 'rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <CheckCircle style={{ width: 40, height: 40, color: '#16a34a' }} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: textPrimary, marginBottom: '0.75rem' }}>تم إرسال استفسارك!</h2>
            <p style={{ color: textMuted, fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              شكراً لتواصلك معنا. سيقوم فريق الدعم بمراجعة استفسارك والرد عليك في أقرب وقت ممكن.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { setSent(false); setForm({ name: user?.name || '', phone: '', inquiryType: '', message: '' }); }}
                style={{ padding: '0.6rem 1.25rem', borderRadius: 10, background: isLight ? '#dbeafe' : 'rgba(0,176,255,0.12)', border: `1px solid ${border}`, color: isLight ? '#0070c8' : '#67e8f9', fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.9rem' }}>
                إرسال استفسار آخر
              </button>
              <Link to="/" style={{ padding: '0.6rem 1.25rem', borderRadius: 10, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap style={{ width: 15, height: 15 }} />
                العودة للرئيسية
              </Link>
            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
