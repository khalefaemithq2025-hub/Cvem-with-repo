import React from 'react';
import { CheckCircle, Clock, Package, Truck, Star } from 'lucide-react';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

interface TimelineStep {
  id: OrderStatus;
  label: string;
  labelEn: string;
  icon: React.ElementType;
  description: string;
}

const STEPS: TimelineStep[] = [
  { id: 'pending',   label: 'تم تقديم الطلب', labelEn: 'Order Placed', icon: CheckCircle, description: 'تم استلام طلبك بنجاح' },
  { id: 'confirmed', label: 'قيد المعالجة',    labelEn: 'Processing',   icon: Clock,       description: 'يتم مراجعة الطلب والتحضير' },
  { id: 'preparing', label: 'جاهز للشحن',      labelEn: 'Ready',        icon: Package,     description: 'تم تجهيز طلبك للشحن' },
  { id: 'shipped',   label: 'في الطريق إليك',  labelEn: 'Shipped',      icon: Truck,       description: 'طلبك في الطريق إليك' },
  { id: 'delivered', label: 'تم التوصيل',       labelEn: 'Delivered',    icon: Star,        description: 'تم توصيل طلبك بنجاح 🎉' },
];

const STATUS_ORDER: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];

function getStepIndex(status: string): number {
  if (status === 'cancelled')   return -1;
  if (status === 'in_transit')  return 3; // shipped
  if (status === 'processing')  return 1; // confirmed
  if (status === 'ready')       return 2; // preparing
  if (status === 'pending')     return 0;
  if (status === 'confirmed')   return 1;
  if (status === 'preparing')   return 2;
  if (status === 'shipped')     return 3;
  if (status === 'delivered')   return 4;
  
  const idx = STATUS_ORDER.indexOf(status as OrderStatus);
  return idx >= 0 ? idx : 0;
}

interface OrderTimelineProps {
  status: string;
  orderId?: string;
  createdAt?: Date | string;
  compact?: boolean;
  isLight?: boolean;
  perspective?: 'customer' | 'merchant' | 'delivery';
}

export default function OrderTimeline({
  status,
  orderId,
  createdAt,
  compact = false,
  isLight = false,
  perspective = 'customer',
}: OrderTimelineProps) {
  const currentIndex = getStepIndex(status);

  const steps = STEPS.map(step => {
    if (step.id === 'shipped' && perspective === 'merchant') {
      return { ...step, label: 'في الطريق إلى الزبون', description: 'الطلب في طريقه للزبون' };
    }
    return step;
  });

  const bg         = isLight ? '#ffffff' : '#0d1526';
  const border     = isLight ? '#d1d5db' : 'rgba(0,176,255,0.15)';
  const textMain   = isLight ? '#1e293b' : '#e0f2fe';
  const textMut    = isLight ? '#374151' : 'rgba(224,242,254,0.5)';
  const accent     = '#00B0FF';
  const done       = '#22c55e';
  const undone         = isLight ? 'rgba(0,112,200,0.35)' : 'rgba(255,255,255,0.1)';
  const undoneIcon     = isLight ? '#0d47a1'              : 'rgba(224,242,254,0.3)';
  const undoneCircleBg = isLight ? '#dbeafe'              : bg;

  // ── حالة الإلغاء ──────────────────────────────────────────────────────────
  if (status === 'cancelled') {
    return (
      <div style={{
        background: isLight ? '#fef2f2' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${isLight ? '#fecaca' : 'rgba(239,68,68,0.25)'}`,
        borderRadius: 16, padding: '1.5rem', textAlign: 'center',
      }} dir="rtl">
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: isLight ? '#fee2e2' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>❌</span>
        </div>
        <p style={{ fontWeight: 700, color: '#ef4444', fontSize: '1.1rem', margin: 0 }}>تم إلغاء الطلب</p>
        {orderId && <p style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.25rem' }}>رقم الطلب: {orderId}</p>}
      </div>
    );
  }

  // ── النسخة المدمجة compact (أفقية بسيطة بدون نصوص) ──────────────────────
  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: '0.75rem' }} dir="rtl">
        {steps.map((step, index) => {
          const isDone    = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <React.Fragment key={step.id}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.2s',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isDone ? (isCurrent ? accent : done) : undoneCircleBg,
                  boxShadow: isCurrent ? `0 0 10px ${accent}60` : 'none',
                  transition: 'background 0.4s',
                }}>
                  <step.icon style={{ width: 14, height: 14, color: isDone ? '#fff' : undoneIcon }} />
                </div>
                <span style={{
                  fontSize: '0.58rem', color: isCurrent ? accent : isDone ? done : textMut,
                  fontWeight: isCurrent ? 700 : 500, textAlign: 'center', lineHeight: 1.2,
                }}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div style={{
                  flex: 1, height: 2, borderRadius: 9999,
                  background: index < currentIndex ? done : undone,
                  transition: 'background 0.5s',
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // ── النسخة الكاملة (أفقية مع نصوص) ──────────────────────────────────────
  return (
    <div style={{
      background: bg, borderRadius: 16, padding: '1.5rem',
      border: `1px solid ${border}`,
      boxShadow: isLight ? '0 2px 16px rgba(0,0,0,0.06)' : '0 2px 16px rgba(0,176,255,0.06)',
    }} dir="rtl">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: textMain, margin: 0 }}>تتبع طلبك</h3>
          {orderId && <p style={{ fontSize: '0.8rem', color: textMut, margin: '0.1rem 0 0' }}>رقم الطلب: {orderId}</p>}
        </div>
        {createdAt && (
          <p style={{ fontSize: '0.75rem', color: textMut, margin: 0 }}>
            {new Date(createdAt).toLocaleDateString('ar-LY', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>

      {/* Horizontal Timeline */}
      <div style={{ position: 'relative' }}>
        {/* خط الخلفية الرمادي */}
        <div style={{
          position: 'absolute', top: 22, right: 22, left: 22, height: 3,
          background: undone, borderRadius: 9999, zIndex: 0,
        }} />
        {/* خط التقدم الملون */}
        <div style={{
          position: 'absolute', top: 22, right: 22, height: 3,
          background: `linear-gradient(to left, ${accent}, ${done})`,
          borderRadius: 9999, zIndex: 0,
          transition: 'width 0.7s ease',
          width: currentIndex <= 0 ? '0%' : `${(currentIndex / (steps.length - 1)) * 90}%`,
        }} />

        {/* الخطوات */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          {steps.map((step, index) => {
            const isDone    = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const Icon      = step.icon;
            return (
              <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${isDone ? (isCurrent ? accent : done) : undone}`,
                  background: isDone ? (isCurrent ? accent : done) : undoneCircleBg,
                  boxShadow: isCurrent ? `0 0 18px ${accent}50, 0 0 6px ${accent}40` : 'none',
                  transition: 'all 0.5s',
                }}>
                  {index < currentIndex
                    ? <CheckCircle style={{ width: 20, height: 20, color: '#fff' }} />
                    : <Icon style={{ width: 20, height: 20, color: isDone ? '#fff' : undoneIcon }} />
                  }
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, margin: 0, color: isCurrent ? accent : isDone ? done : textMut }}>
                    {step.label}
                  </p>
                  <p style={{ fontSize: '0.65rem', margin: '0.15rem 0 0', color: textMut }}>
                    {step.labelEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status banner */}
      <div style={{
        marginTop: '1.25rem', padding: '0.75rem 1rem', borderRadius: 12,
        fontSize: '0.875rem', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 8,
        background: status === 'delivered'
          ? (isLight ? '#f0fdf4' : 'rgba(34,197,94,0.1)')
          : (isLight ? '#eff6ff' : `${accent}18`),
        color: status === 'delivered' ? '#22c55e' : accent,
      }}>
        <span>
          {status === 'delivered' ? '🎉' : (status === 'shipped' || status === 'in_transit') ? '🚚' : status === 'preparing' ? '📦' : '⏳'}
        </span>
        <span>{steps[currentIndex]?.description}</span>
      </div>
    </div>
  );
}
