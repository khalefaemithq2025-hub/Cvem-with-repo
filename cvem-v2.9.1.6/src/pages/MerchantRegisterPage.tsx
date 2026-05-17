import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store, MapPin, Phone, CreditCard, ArrowRight, Globe, Lock,
  Eye, EyeOff, Mail, User, Zap, CheckCircle, Tag, ChevronDown,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

const CATEGORY_OPTIONS = [
  { id: 'phones', label: 'هواتف ذكية' },
  { id: 'laptops', label: 'حواسيب' },
  { id: 'accessories', label: 'إكسسوارات' },
  { id: 'tablets', label: 'أجهزة لوحية' },
  { id: 'other', label: 'أخرى' },
];

interface FieldProps {
  label: string;
  required?: boolean;
  icon: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, required, icon, hint, children, isLight }: FieldProps & { isLight?: boolean }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: isLight !== false ? '#0d3a6e' : '#e0f2fe' }}>
        <span style={{ color: '#00B0FF' }}>{icon}</span>
        {label}
        {required && <span className="text-red-500 text-xs">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs mt-1.5" style={{ color: isLight !== false ? '#6b7280' : 'rgba(224,242,254,0.5)' }}>{hint}</p>}
    </div>
  );
}

export default function MerchantRegisterPage() {
  const navigate = useNavigate();
  const { showToastMessage, setUser } = useStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [isLoading, setIsLoading] = useState(false);
  const [isOnlineOnly, setIsOnlineOnly] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [form, setForm] = useState({
    storeName: '',
    ownerName: '',
    email: '',
    location: '',
    phone: '',
    bankAccount: '',
    password: '',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const HOUR_MS = 60 * 60 * 1000;
  const [submitted, setSubmitted] = useState(false);

  const cardBg = isLight ? '#fff' : '#0d1526';
  const sectionBorder = isLight ? '#f0f6ff' : 'rgba(0,176,255,0.12)';
  const sectionIconBg = isLight ? '#dbeafe' : 'rgba(0,176,255,0.12)';
  const sectionTitleColor = isLight ? '#0d3a6e' : '#e0f2fe';
  const mrInput: React.CSSProperties = {
    width: '100%', borderRadius: 10, outline: 'none', fontFamily: 'Tajawal, sans-serif', fontSize: '0.95rem',
    color: isLight ? '#0d3a6e' : '#e0f2fe', background: isLight ? '#f8fcff' : '#080e1c', boxSizing: 'border-box',
    border: `1.5px solid ${isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)'}`,
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

  const canSubmit = () => {
    const last = sessionStorage.getItem('merchant_last_apply');
    if (!last) return true;
    return Date.now() - parseInt(last) > HOUR_MS;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.storeName || !form.ownerName || !form.email || !form.phone || !form.password) {
      showToastMessage('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    if (form.password.length < 8) {
      showToastMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'error');
      return;
    }
    if (!isOnlineOnly && !form.location.trim()) {
      showToastMessage('يرجى إدخال موقع المحل أو تحديد أنك متجر إلكتروني', 'error');
      return;
    }
    if (!canSubmit()) {
      const last = parseInt(sessionStorage.getItem('merchant_last_apply') || '0');
      const remaining = Math.ceil((HOUR_MS - (Date.now() - last)) / 60000);
      showToastMessage(`يرجى الانتظار ${remaining} دقيقة قبل تقديم طلب جديد`, 'error');
      return;
    }

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    const application = {
      id: `mer-app-${Date.now()}`,
      type: 'merchant',
      storeName: form.storeName,
      ownerName: form.ownerName,
      email: form.email,
      phone: form.phone,
      password: form.password,
      address: isOnlineOnly ? 'متجر إلكتروني' : form.location,
      description: form.description || `متجر ${form.storeName}`,
      bankAccount: form.bankAccount,
      categories: selectedCategories,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    try {
      const existing = JSON.parse(localStorage.getItem('pending_merchant_applications') || '[]');
      existing.unshift(application);
      localStorage.setItem('pending_merchant_applications', JSON.stringify(existing));
      sessionStorage.setItem('merchant_last_apply', Date.now().toString());
    } catch {}

    // Browser notification + ping sound for owner
    try {
      if ('Notification' in window && Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification('طلب انضمام جديد — CyberVolt', {
            body: `محل "${application.storeName}" أرسل طلب انضمام وينتظر المراجعة`,
            icon: '/favicon.ico',
          });
        }
      }
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch {}

    setIsLoading(false);
    setSubmitted(true);
    showToastMessage('تم إرسال طلبك بنجاح!', 'success');
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: isLight
          ? 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 45%, #f0f9ff 100%)'
          : 'linear-gradient(135deg, #020617 0%, #071327 45%, #0b2a4f 100%)',
        direction: 'rtl',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          borderBottom: isLight ? '1px solid rgba(0,112,200,0.15)' : '1px solid rgba(0,176,255,0.15)',
          background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(2,6,23,0.7)',
          backdropFilter: 'blur(12px)',
          padding: '0.875rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: isLight ? 'rgba(0,112,200,0.12)' : 'rgba(0,176,255,0.15)',
            border: isLight ? '1px solid rgba(0,112,200,0.25)' : '1px solid rgba(0,176,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isLight ? '0 0 12px rgba(0,112,200,0.12)' : '0 0 16px rgba(0,176,255,0.2)',
          }}>
            <Zap style={{ width: 22, height: 22, color: isLight ? '#0070c8' : '#67e8f9' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isLight ? '#0d3a6e' : '#e0f2fe', lineHeight: 1.2 }}>CyberVolt e-Mall</div>
            <div style={{ fontSize: '0.7rem', color: isLight ? '#5b88ba' : 'rgba(224,242,254,0.6)' }}>بوابة تسجيل المحلات</div>
          </div>
        </Link>
        <Link to="/store-portal/login" style={{
          fontSize: '0.85rem', color: isLight ? '#0070c8' : '#67e8f9', textDecoration: 'none',
          padding: '0.4rem 1rem', borderRadius: 8,
          border: `1px solid ${isLight ? 'rgba(0,112,200,0.25)' : 'rgba(103,232,249,0.25)'}`,
          background: isLight ? 'rgba(0,112,200,0.08)' : 'rgba(0,176,255,0.08)',
        }}>
          تسجيل الدخول
        </Link>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1rem 4rem' }}>

        {/* Page title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: isLight ? 'rgba(0,112,200,0.1)' : 'rgba(0,176,255,0.1)',
            border: `1px solid ${isLight ? 'rgba(0,112,200,0.25)' : 'rgba(0,176,255,0.2)'}`,
            borderRadius: 24, padding: '0.4rem 1.2rem', marginBottom: '1rem',
            fontSize: '0.8rem', color: isLight ? '#0070c8' : '#67e8f9',
          }}>
            <Store style={{ width: 14, height: 14 }} />
            <span>تسجيل محل جديد</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: isLight ? '#0d2a4a' : '#fff', marginBottom: '0.5rem' }}>
            انضم إلى عائلة سايبر فولت
          </h1>
          <p style={{ color: isLight ? '#5b7fa0' : 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
            سجّل محلك وابدأ البيع لآلاف العملاء في ليبيا
          </p>
        </div>

        {/* Success screen */}
        {submitted && (
          <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.4)', padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '2px solid #bbf7d0' }}>
              <CheckCircle style={{ width: 42, height: 42, color: '#16a34a' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0d2a4a', marginBottom: '1rem' }}>تم إرسال طلبك بنجاح!</h2>
            <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.9, maxWidth: 440, margin: '0 auto 2rem' }}>
              لقد أرسلنا طلبك بنجاح وستصلك رسالة على البريد بعد الموافقة وتسجيلك كفرد في عائلة سايبر فولت.
            </p>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 2rem', borderRadius: 12, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: '1rem', boxShadow: '0 4px 16px rgba(0,112,200,0.3)' }}>
              <Zap style={{ width: 18, height: 18 }} />
              العودة للرئيسية
            </Link>
          </div>
        )}

        {/* Main card */}
        {!submitted && <div style={{
          background: cardBg,
          borderRadius: 24,
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}>

          {/* Card header accent */}
          <div style={{
            background: 'linear-gradient(135deg, #0D47A1 0%, #00B0FF 100%)',
            padding: '1.5rem 2rem',
            display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid rgba(255,255,255,0.3)',
            }}>
              <Store style={{ width: 28, height: 28, color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff', margin: 0 }}>بيانات تسجيل المحل</h2>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', margin: '0.2rem 0 0' }}>
                جميع البيانات محفوظة ومشفرة بالكامل
              </p>
            </div>
            <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '0.3rem 0.8rem' }}>
              <CheckCircle style={{ width: 14, height: 14, color: '#fff' }} />
              <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>آمن 100%</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} style={{ padding: '2rem' }}>

            {/* Section: بيانات المحل */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                marginBottom: '1.25rem', paddingBottom: '0.75rem',
                borderBottom: `2px solid ${sectionBorder}`,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: sectionIconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Store style={{ width: 16, height: 16, color: '#0070c8' }} />
                </div>
                <h3 style={{ fontWeight: 700, color: sectionTitleColor, fontSize: '1rem', margin: 0 }}>بيانات المحل</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <Field label="اسم المحل" required icon={<Store style={{ width: 15, height: 15 }} />} isLight={isLight}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text" name="storeName" value={form.storeName}
                      onChange={handleChange}
                      style={{ ...mrInput, padding: '0.75rem 2.5rem 0.75rem 1rem' }}
                      placeholder="مثال: متجر الأجهزة الحديثة"
                      onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                      onBlur={e => (e.target.style.borderColor = isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)')}
                    />
                    <Store style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#93c5fd' }} />
                  </div>
                </Field>

                <Field label="اسم صاحب المحل" required icon={<User style={{ width: 15, height: 15 }} />} isLight={isLight}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text" name="ownerName" value={form.ownerName}
                      onChange={handleChange}
                      style={{ ...mrInput, padding: '0.75rem 2.5rem 0.75rem 1rem' }}
                      placeholder="اسمك الكامل"
                      onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                      onBlur={e => (e.target.style.borderColor = isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)')}
                    />
                    <User style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#93c5fd' }} />
                  </div>
                </Field>
              </div>

              {/* Description */}
              <div style={{ marginTop: '1rem' }}>
                <Field label="وصف المحل" icon={<Tag style={{ width: 15, height: 15 }} />} hint="سيظهر هذا الوصف للعملاء عند تصفح محلك" isLight={isLight}>
                  <textarea
                    name="description" value={form.description}
                    onChange={handleChange}
                    rows={2}
                    style={{ ...mrInput, padding: '0.75rem 1rem', resize: 'none' }}
                    placeholder="صف محلك ونوع المنتجات التي تبيعها..."
                    onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                    onBlur={e => (e.target.style.borderColor = isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)')}
                  />
                </Field>
              </div>

              {/* Categories */}
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 700, color: '#0d3a6e', marginBottom: '0.6rem' }}>
                  <ChevronDown style={{ width: 15, height: 15, color: '#00B0FF' }} />
                  فئات المنتجات
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {CATEGORY_OPTIONS.map(cat => (
                    <button
                      key={cat.id} type="button"
                      onClick={() => toggleCategory(cat.id)}
                      style={{
                        padding: '0.4rem 1rem', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600,
                        border: selectedCategories.includes(cat.id) ? '1.5px solid #00B0FF' : '1.5px solid #dbeafe',
                        background: selectedCategories.includes(cat.id) ? 'rgba(0,176,255,0.1)' : '#f8fafc',
                        color: selectedCategories.includes(cat.id) ? '#0070c8' : '#64748b',
                        cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Tajawal, sans-serif',
                      }}
                    >
                      {selectedCategories.includes(cat.id) && '✓ '}{cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section: بيانات التواصل */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                marginBottom: '1.25rem', paddingBottom: '0.75rem',
                borderBottom: `2px solid ${sectionBorder}`,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: sectionIconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone style={{ width: 16, height: 16, color: '#0070c8' }} />
                </div>
                <h3 style={{ fontWeight: 700, color: sectionTitleColor, fontSize: '1rem', margin: 0 }}>بيانات التواصل</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <Field label="البريد الإلكتروني" required icon={<Mail style={{ width: 15, height: 15 }} />} isLight={isLight}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email" name="email" value={form.email}
                      onChange={handleChange} dir="ltr"
                      style={{ ...mrInput, padding: '0.75rem 2.5rem 0.75rem 1rem' }}
                      placeholder="store@example.com"
                      onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                      onBlur={e => (e.target.style.borderColor = isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)')}
                    />
                    <Mail style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#93c5fd' }} />
                  </div>
                </Field>

                <Field label="رقم التواصل" required icon={<Phone style={{ width: 15, height: 15 }} />} isLight={isLight}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel" name="phone" value={form.phone}
                      onChange={handleChange} dir="ltr"
                      style={{ ...mrInput, padding: '0.75rem 2.5rem 0.75rem 1rem' }}
                      placeholder="0912345678"
                      onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                      onBlur={e => (e.target.style.borderColor = isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)')}
                    />
                    <Phone style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#93c5fd' }} />
                  </div>
                </Field>
              </div>

              {/* Location */}
              <div style={{ marginTop: '1rem' }}>
                <Field label="موقع المحل" required={!isOnlineOnly} icon={<MapPin style={{ width: 15, height: 15 }} />} isLight={isLight}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text" name="location"
                      value={isOnlineOnly ? '' : form.location}
                      onChange={handleChange}
                      disabled={isOnlineOnly}
                      style={{
                        ...mrInput, padding: '0.75rem 2.5rem 0.75rem 1rem',
                        background: isOnlineOnly ? (isLight ? '#f1f5f9' : '#0a1020') : (isLight ? '#f8fcff' : '#080e1c'),
                        cursor: isOnlineOnly ? 'not-allowed' : 'text',
                      }}
                      placeholder={isOnlineOnly ? 'متجر إلكتروني' : 'مثال: زليتن، شارع الجمهورية'}
                      onFocus={e => { if (!isOnlineOnly) e.target.style.borderColor = '#00B0FF'; }}
                      onBlur={e => (e.target.style.borderColor = isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)')}
                    />
                    <MapPin style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#93c5fd' }} />
                  </div>

                  <label
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.6rem', cursor: 'pointer' }}
                    onClick={() => { setIsOnlineOnly(!isOnlineOnly); if (!isOnlineOnly) setForm({ ...form, location: '' }); }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, border: `2px solid ${isOnlineOnly ? '#00B0FF' : '#cbd5e1'}`,
                      background: isOnlineOnly ? '#00B0FF' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s', flexShrink: 0,
                    }}>
                      {isOnlineOnly && <CheckCircle style={{ width: 13, height: 13, color: '#fff' }} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Globe style={{ width: 15, height: 15, color: '#00B0FF' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: sectionTitleColor }}>أنا متجر إلكتروني — ليس لديّ موقع فعلي</span>
                    </div>
                  </label>
                </Field>
              </div>
            </div>

            {/* Section: الأمان */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                marginBottom: '1.25rem', paddingBottom: '0.75rem',
                borderBottom: `2px solid ${sectionBorder}`,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: sectionIconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock style={{ width: 16, height: 16, color: '#0070c8' }} />
                </div>
                <h3 style={{ fontWeight: 700, color: sectionTitleColor, fontSize: '1rem', margin: 0 }}>الأمان والمدفوعات</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <Field label="كلمة المرور" required icon={<Lock style={{ width: 15, height: 15 }} />} hint="8 أحرف على الأقل — حروف وأرقام" isLight={isLight}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password" value={form.password}
                      onChange={handleChange}
                      style={{ ...mrInput, padding: '0.75rem 2.5rem 0.75rem 2.5rem' }}
                      placeholder="••••••••"
                      onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                      onBlur={e => (e.target.style.borderColor = isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)')}
                    />
                    <Lock style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#93c5fd' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8' }}>
                      {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                    </button>
                  </div>
                </Field>

                <Field label="الحساب المصرفي" icon={<CreditCard style={{ width: 15, height: 15 }} />} hint="🔒 مشفر بالكامل — اختياري" isLight={isLight}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text" name="bankAccount" value={form.bankAccount}
                      onChange={handleChange} dir="ltr"
                      style={{ ...mrInput, padding: '0.75rem 2.5rem 0.75rem 1rem' }}
                      placeholder="رقم الحساب (اختياري)"
                      onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                      onBlur={e => (e.target.style.borderColor = isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)')}
                    />
                    <CreditCard style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#93c5fd' }} />
                  </div>
                </Field>
              </div>
            </div>

            {/* Terms notice */}
            <div style={{
              background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
              border: '1px solid rgba(0,176,255,0.2)',
              borderRadius: 12, padding: '1rem', marginBottom: '1.5rem',
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
            }}>
              <CheckCircle style={{ width: 18, height: 18, color: '#0070c8', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '0.82rem', color: '#0d3a6e', margin: 0, lineHeight: 1.7 }}>
                بالتسجيل، أنت توافق على أن بياناتك ستُحفظ بشكل دائم في منصة CyberVolt e-Mall. لن تُحذف إلا بطلب صريح من المالك.
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '1rem', borderRadius: 12, border: 'none',
                background: isLoading ? '#93c5fd' : 'linear-gradient(135deg, #0070c8, #00B0FF)',
                color: '#fff', fontSize: '1.05rem', fontWeight: 700,
                fontFamily: 'Tajawal, sans-serif', cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                boxShadow: isLoading ? 'none' : '0 4px 20px rgba(0,112,200,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {isLoading ? (
                <span style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <>
                  <span>تسجيل المحل الآن</span>
                  <ArrowRight style={{ width: 20, height: 20 }} />
                </>
              )}
            </button>

            <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#64748b' }}>
              لديك حساب بالفعل؟{' '}
              <Link to="/store-portal/login" style={{ color: '#0070c8', fontWeight: 600, textDecoration: 'none' }}>
                تسجيل الدخول
              </Link>
            </p>
          </form>
        </div>}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
