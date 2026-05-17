import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Phone, Mail, CheckCircle, Zap, Headphones, ArrowRight, Clock, Wrench } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useStore } from '../context/StoreContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SupportApplyPage() {
  const { theme } = useTheme();
  const { showToastMessage } = useStore();
  const isLight = theme === 'light';
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', skills: '', dailyHours: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.skills || !form.dailyHours) {
      showToastMessage('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    if (!EMAIL_REGEX.test(form.email.trim())) {
      showToastMessage('يرجى إدخال بريد إلكتروني صحيح', 'error');
      return;
    }
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1300));
    const application = {
      id: `sup-job-${Date.now()}`,
      name: form.name,
      email: form.email,
      phone: form.phone,
      skills: form.skills,
      dailyHours: form.dailyHours,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    try {
      const existing = JSON.parse(localStorage.getItem('support_job_applications') || '[]');
      existing.unshift(application);
      localStorage.setItem('support_job_applications', JSON.stringify(existing));
    } catch {}
    setIsLoading(false);
    setSent(true);
  };

  const bg = isLight
    ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0f2fe 100%)'
    : 'linear-gradient(135deg, #020817 0%, #061828 50%, #0d2040 100%)';
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

  return (
    <div style={{ minHeight: '100vh', background: bg, direction: 'rtl', fontFamily: 'Tajawal, sans-serif', padding: '2rem 1rem 4rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 580, marginTop: '2rem' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: isLight ? 'rgba(0,112,200,0.12)' : 'linear-gradient(135deg,rgba(0,176,255,0.35),rgba(124,58,237,0.35))', border: `1px solid ${isLight ? 'rgba(0,112,200,0.25)' : 'rgba(0,176,255,0.35)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isLight ? '0 0 16px rgba(0,112,200,0.15)' : '0 0 20px rgba(0,176,255,0.4)' }}>
              <Zap style={{ width: 28, height: 28, color: isLight ? '#0070c8' : '#67e8f9' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: isLight ? '#0d3a6e' : '#e0f2fe', lineHeight: 1.2 }}>طلب توظيف — الدعم الفني</div>
              <div style={{ fontSize: '0.78rem', color: isLight ? '#3a7ab8' : 'rgba(224,242,254,0.6)' }}>CyberVolt e-Mall</div>
            </div>
          </Link>
        </div>

        {!sent ? (
          <div style={{ background: cardBg, borderRadius: 24, overflow: 'hidden', boxShadow: isLight ? '0 8px 32px rgba(0,112,200,0.12)' : '0 8px 32px rgba(0,176,255,0.08)', border: `1px solid ${border}` }}>
            <div style={{ background: 'linear-gradient(135deg,#0070c8,#00B0FF)', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.3)' }}>
                <Headphones style={{ width: 26, height: 26, color: '#fff' }} />
              </div>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', margin: 0 }}>طلب الانضمام كموظف دعم</h2>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', margin: '0.2rem 0 0' }}>ساعدنا في تقديم أفضل تجربة لعملائنا</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: textPrimary }}>
                  <User style={{ width: 14, height: 14, color: isLight ? '#0070c8' : '#67e8f9' }} />
                  الاسم *
                </label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)' }} />
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسمك الكامل" style={{ ...inputStyle }}
                    onFocus={e => (e.target.style.borderColor = '#00B0FF')} onBlur={e => (e.target.style.borderColor = inputBorder)} />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: textPrimary }}>
                  <Mail style={{ width: 14, height: 14, color: isLight ? '#0070c8' : '#67e8f9' }} />
                  البريد الإلكتروني *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)' }} />
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="example@email.com" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
                    onFocus={e => (e.target.style.borderColor = '#00B0FF')} onBlur={e => (e.target.style.borderColor = inputBorder)} />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: textPrimary }}>
                  <Phone style={{ width: 14, height: 14, color: isLight ? '#0070c8' : '#67e8f9' }} />
                  الرقم *
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)' }} />
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="09xxxxxxxx" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
                    onFocus={e => (e.target.style.borderColor = '#00B0FF')} onBlur={e => (e.target.style.borderColor = inputBorder)} />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: textPrimary }}>
                  <Wrench style={{ width: 14, height: 14, color: isLight ? '#0070c8' : '#67e8f9' }} />
                  المهارات *
                </label>
                <textarea value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })}
                  placeholder="اذكر مهاراتك في خدمة العملاء، الأجهزة، البرامج..."
                  rows={3}
                  style={{ ...inputStyle, paddingLeft: '0.75rem', resize: 'vertical', lineHeight: 1.7 }}
                  onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                  onBlur={e => (e.target.style.borderColor = inputBorder)} />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: textPrimary }}>
                  <Clock style={{ width: 14, height: 14, color: isLight ? '#0070c8' : '#67e8f9' }} />
                  عدد ساعات التفرغ يومياً *
                </label>
                <div style={{ position: 'relative' }}>
                  <Clock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)' }} />
                  <input type="number" min="1" max="24" value={form.dailyHours} onChange={e => setForm({ ...form, dailyHours: e.target.value })} placeholder="مثال: 6" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
                    onFocus={e => (e.target.style.borderColor = '#00B0FF')} onBlur={e => (e.target.style.borderColor = inputBorder)} />
                </div>
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
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: textPrimary, marginBottom: '0.75rem' }}>تم إرسال طلبك!</h2>
            <p style={{ color: textMuted, fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              شكراً لاهتمامك بالانضمام لفريق سايبر فولت. سنتواصل معك قريباً على البريد الإلكتروني بعد مراجعة طلبك.
            </p>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', borderRadius: 12, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
              <Zap style={{ width: 16, height: 16 }} />
              العودة للرئيسية
            </Link>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <Link to="/helpdesk/login" style={{ fontSize: '0.82rem', color: textMuted, textDecoration: 'none' }}>
            موظف دعم؟ <span style={{ color: isLight ? '#0070c8' : '#67e8f9', fontWeight: 600 }}>سجل الدخول هنا</span>
          </Link>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
