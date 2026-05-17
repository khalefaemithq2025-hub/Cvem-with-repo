import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Package, CheckCircle, Truck, Home, ArrowRight,
  Clock, MapPin, Phone, Zap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const MOCK_ORDERS: Record<string, {
  id: string; customerName: string; status: 'received' | 'processing' | 'shipped' | 'delivered';
  createdAt: string; updatedAt: string; items: { name: string; qty: number; price: number }[];
  deliveryCompany: { name: string; phone: string; driver?: string };
  fromCity: string; toCity: string; total: number;
}> = {
  'ORD-1001': {
    id: 'ORD-1001', customerName: 'أحمد الورفلي', status: 'delivered',
    createdAt: '2026-05-01T09:00:00', updatedAt: '2026-05-04T14:30:00',
    items: [{ name: 'آيفون 15 Pro Max', qty: 1, price: 7500 }],
    deliveryCompany: { name: 'برق للتوصيل', phone: '0912345678', driver: 'محمد علي' },
    fromCity: 'طرابلس', toCity: 'بنغازي', total: 7525,
  },
  'ORD-1002': {
    id: 'ORD-1002', customerName: 'فاطمة المنفي', status: 'shipped',
    createdAt: '2026-05-03T11:00:00', updatedAt: '2026-05-05T08:00:00',
    items: [{ name: 'سامسونج Galaxy S24 Ultra', qty: 1, price: 6800 }],
    deliveryCompany: { name: 'نسيم التوصيل', phone: '0923456789', driver: 'علي حسن' },
    fromCity: 'مصراتة', toCity: 'طرابلس', total: 6815,
  },
  'ORD-1003': {
    id: 'ORD-1003', customerName: 'خالد الزروق', status: 'processing',
    createdAt: '2026-05-05T10:00:00', updatedAt: '2026-05-05T12:00:00',
    items: [{ name: 'شاومي Pad 6 Pro', qty: 1, price: 3200 }, { name: 'سماعة JBL', qty: 1, price: 320 }],
    deliveryCompany: { name: 'سريع للشحن', phone: '0934567890' },
    fromCity: 'بنغازي', toCity: 'طرابلس', total: 3545,
  },
  'ORD-1004': {
    id: 'ORD-1004', customerName: 'منى الطاهر', status: 'received',
    createdAt: '2026-05-06T09:30:00', updatedAt: '2026-05-06T09:30:00',
    items: [{ name: 'لابتوب Dell Inspiron 15', qty: 1, price: 4200 }],
    deliveryCompany: { name: 'الأمين للتوصيل', phone: '0945678901' },
    fromCity: 'طرابلس', toCity: 'زليتن', total: 4220,
  },
};

const STEPS = [
  { key: 'received',   label: 'تم الاستلام',     icon: Package,       desc: 'تم استلام طلبك وهو بانتظار التأكيد' },
  { key: 'processing', label: 'قيد التحضير',     icon: Clock,          desc: 'يتم تحضير طلبك من قِبل التاجر' },
  { key: 'shipped',    label: 'في الطريق إليك',  icon: Truck,          desc: 'طلبك في طريقه إليك مع شركة التوصيل' },
  { key: 'delivered',  label: 'تم التوصيل',      icon: CheckCircle,    desc: 'تم توصيل طلبك بنجاح' },
];

const STATUS_ORDER = ['received', 'processing', 'shipped', 'delivered'];

export default function OrderTrackingPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [orderId, setOrderId] = useState('');
  const [result, setResult] = useState<typeof MOCK_ORDERS[string] | null | 'not_found'>(null);

  const bg = isLight ? '#f0f7ff' : '#020817';
  const cardBg = isLight ? '#fff' : '#0d1526';
  const textPrimary = isLight ? '#0d2a4a' : '#e0f2fe';
  const textMuted = isLight ? '#6b7280' : 'rgba(224,242,254,0.5)';
  const border = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)';

  const handleSearch = () => {
    const key = orderId.trim().toUpperCase();
    if (!key) return;
    const found = MOCK_ORDERS[key];
    setResult(found ?? 'not_found');
  };

  const currentStepIdx = result && result !== 'not_found'
    ? STATUS_ORDER.indexOf(result.status)
    : -1;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('ar-LY', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div style={{ minHeight: '100vh', background: bg, direction: 'rtl', fontFamily: 'Tajawal, sans-serif', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0070c8', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            <Home style={{ width: 16, height: 16 }} />
            <span>الرئيسية</span>
          </Link>
          <ArrowRight style={{ width: 14, height: 14, color: textMuted, transform: 'rotate(180deg)' }} />
          <span style={{ color: textMuted, fontSize: '0.85rem' }}>تتبع الطلب</span>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg, #0070c8, #00B0FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 8px 24px rgba(0,112,200,0.3)' }}>
            <Truck style={{ width: 28, height: 28, color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: textPrimary, margin: '0 0 0.4rem' }}>تتبع طلبك</h1>
          <p style={{ color: textMuted, margin: 0, fontSize: '0.9rem' }}>أدخل رقم الطلب لمعرفة حالته الحالية</p>
        </div>

        {/* Search */}
        <div style={{ background: cardBg, borderRadius: 20, padding: '1.5rem', border: `1px solid ${border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: textPrimary, marginBottom: '0.6rem' }}>رقم الطلب</label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="مثال: ORD-1001"
              style={{
                flex: 1, padding: '0.75rem 1rem', borderRadius: 12,
                border: `1.5px solid ${isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)'}`,
                background: isLight ? '#f8fafc' : '#080e1c',
                color: textPrimary, fontFamily: 'Tajawal, sans-serif',
                fontSize: '1rem', outline: 'none', direction: 'ltr', textAlign: 'center',
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                padding: '0.75rem 1.25rem', borderRadius: 12,
                background: 'linear-gradient(135deg, #0070c8, #00B0FF)',
                color: '#fff', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: '0.9rem',
                boxShadow: '0 4px 16px rgba(0,112,200,0.3)',
              }}
            >
              <Search style={{ width: 18, height: 18 }} />
              <span>تتبع</span>
            </button>
          </div>
          <p style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: textMuted }}>جرب: ORD-1001 / ORD-1002 / ORD-1003 / ORD-1004</p>
        </div>

        {/* Not found */}
        {result === 'not_found' && (
          <div style={{ background: cardBg, borderRadius: 20, padding: '2rem', border: `1px solid ${border}`, textAlign: 'center' }}>
            <Package style={{ width: 52, height: 52, color: isLight ? '#e2e8f0' : 'rgba(0,176,255,0.2)', margin: '0 auto 1rem' }} />
            <p style={{ fontWeight: 700, fontSize: '1rem', color: textPrimary, marginBottom: '0.4rem' }}>لم يتم العثور على الطلب</p>
            <p style={{ color: textMuted, fontSize: '0.875rem', margin: 0 }}>تحقق من رقم الطلب وحاول مجدداً</p>
          </div>
        )}

        {/* Order result */}
        {result && result !== 'not_found' && (
          <>
            {/* Order info */}
            <div style={{ background: cardBg, borderRadius: 20, padding: '1.5rem', border: `1px solid ${border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: textPrimary, margin: '0 0 0.2rem' }}>{result.id}</h2>
                  <p style={{ color: textMuted, margin: 0, fontSize: '0.8rem' }}>بتاريخ {formatDate(result.createdAt)}</p>
                </div>
                <span style={{
                  padding: '0.35rem 0.9rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
                  background: result.status === 'delivered' ? 'rgba(34,197,94,0.12)' : result.status === 'shipped' ? 'rgba(168,85,247,0.12)' : result.status === 'processing' ? 'rgba(234,179,8,0.12)' : 'rgba(59,130,246,0.12)',
                  color: result.status === 'delivered' ? '#16a34a' : result.status === 'shipped' ? '#9333ea' : result.status === 'processing' ? '#ca8a04' : '#2563eb',
                }}>
                  {STEPS.find(s => s.key === result.status)?.label}
                </span>
              </div>

              {/* Items */}
              <div style={{ borderTop: `1px solid ${border}`, paddingTop: '1rem', marginBottom: '1rem' }}>
                {result.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: i < result.items.length - 1 ? `1px dashed ${border}` : 'none' }}>
                    <span style={{ fontSize: '0.875rem', color: textPrimary, fontWeight: 600 }}>{item.name} × {item.qty}</span>
                    <span style={{ fontSize: '0.875rem', color: '#0070c8', fontWeight: 700 }}>{item.price.toLocaleString()} د.ل</span>
                  </div>
                ))}
              </div>

              {/* Route + delivery */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ background: isLight ? '#f0f9ff' : 'rgba(0,176,255,0.06)', borderRadius: 12, padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', color: textMuted, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin style={{ width: 12, height: 12 }} /> المسار
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: textPrimary }}>{result.fromCity} ← {result.toCity}</div>
                </div>
                <div style={{ background: isLight ? '#f0f9ff' : 'rgba(0,176,255,0.06)', borderRadius: 12, padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', color: textMuted, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Truck style={{ width: 12, height: 12 }} /> شركة التوصيل
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: textPrimary }}>{result.deliveryCompany.name}</div>
                  <div style={{ fontSize: '0.72rem', color: textMuted, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                    <Phone style={{ width: 11, height: 11 }} /> {result.deliveryCompany.phone}
                  </div>
                  {result.deliveryCompany.driver && (
                    <div style={{ fontSize: '0.72rem', color: textMuted, marginTop: '0.15rem' }}>السائق: {result.deliveryCompany.driver}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div style={{ background: cardBg, borderRadius: 20, padding: '1.5rem', border: `1px solid ${border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1rem', color: textPrimary, margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap style={{ width: 18, height: 18, color: '#00B0FF' }} />
                مراحل الطلب
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {STEPS.map((step, idx) => {
                  const done = idx <= currentStepIdx;
                  const current = idx === currentStepIdx;
                  const isLast = idx === STEPS.length - 1;
                  const StepIcon = step.icon;
                  return (
                    <div key={step.key} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: done
                            ? (current ? 'linear-gradient(135deg, #0070c8, #00B0FF)' : (isLight ? '#dbeafe' : 'rgba(0,176,255,0.15)'))
                            : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.04)'),
                          border: done
                            ? (current ? 'none' : `2px solid ${isLight ? '#93c5fd' : 'rgba(0,176,255,0.3)'}`)
                            : `2px solid ${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: current ? '0 0 0 4px rgba(0,176,255,0.2)' : 'none',
                          transition: 'all 0.2s',
                        }}>
                          <StepIcon style={{
                            width: 20, height: 20,
                            color: done ? (current ? '#fff' : '#0070c8') : (isLight ? '#d1d5db' : 'rgba(255,255,255,0.15)'),
                          }} />
                        </div>
                        {!isLast && (
                          <div style={{
                            width: 2, height: 36, marginTop: 2,
                            background: idx < currentStepIdx
                              ? 'linear-gradient(180deg, #0070c8, #00B0FF)'
                              : (isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)'),
                          }} />
                        )}
                      </div>
                      <div style={{ paddingTop: '0.65rem', paddingBottom: isLast ? 0 : '1.5rem', flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: done ? textPrimary : textMuted, marginBottom: '0.2rem' }}>
                          {step.label}
                          {current && <span style={{ marginRight: '0.5rem', fontSize: '0.72rem', background: 'rgba(0,176,255,0.12)', color: '#0070c8', padding: '0.15rem 0.5rem', borderRadius: 10, fontWeight: 700 }}>الحالة الحالية</span>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: textMuted }}>
                          {done ? step.desc : 'في انتظار اكتمال المرحلة السابقة'}
                        </div>
                        {current && (
                          <div style={{ marginTop: '0.3rem', fontSize: '0.72rem', color: '#0070c8', fontWeight: 600 }}>
                            آخر تحديث: {formatDate(result.updatedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
