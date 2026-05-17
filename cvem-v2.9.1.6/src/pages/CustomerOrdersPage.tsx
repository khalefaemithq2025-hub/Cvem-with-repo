import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Package, Truck, CheckCircle, Clock, MapPin,
  Star, ArrowRight, Zap, Phone, User,
} from 'lucide-react';
import { useStore, CustomerFeedback } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { formatPrice, MERCHANT_DELIVERY_MAP, MasterOrder, SubOrder } from '../data/mockData';
import OrderTimeline from '../components/OrderTimeline';

const COMPANY_PHONES: Record<string, string> = {
  'شركة السريع':    '0913111111',
  'الأمانة للشحن': '0923222222',
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:    { label: 'تم الاستلام',     color: '#60a5fa', bg: 'rgba(37,99,235,0.12)',   icon: Package },
  processing: { label: 'قيد التحضير',     color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  icon: Clock },
  preparing:  { label: 'يُجهَّز',          color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  icon: Clock },
  ready:      { label: 'جاهز للتوصيل',   color: '#a78bfa', bg: 'rgba(124,58,237,0.12)',  icon: Package },
  shipped:    { label: 'في الطريق',       color: '#22d3ee', bg: 'rgba(6,182,212,0.12)',   icon: Truck },
  in_transit: { label: 'جاري التوصيل',   color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   icon: Truck },
  delivered:  { label: 'سلمناه إليك ✓',  color: '#4ade80', bg: 'rgba(22,163,74,0.12)',   icon: CheckCircle },
  cancelled:  { label: 'ملغي',            color: '#f87171', bg: 'rgba(239,68,68,0.12)',   icon: Package },
};

function StarRating({ value, onChange, disabled = false }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '0.2rem', direction: 'rtl' }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" disabled={disabled}
          onMouseEnter={() => !disabled && setHovered(s)}
          onMouseLeave={() => !disabled && setHovered(0)}
          onClick={() => !disabled && onChange(s)}
          style={{ background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer', fontSize: '1.7rem', lineHeight: 1, padding: '0.05rem', color: s <= (hovered || value) ? '#fbbf24' : 'rgba(148,163,184,0.3)', transition: 'color 0.1s, transform 0.1s', transform: !disabled && s <= hovered ? 'scale(1.2)' : 'scale(1)' }}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function CustomerOrdersPage() {
  const { orders, masterOrders, user, activeOrderId, setActiveOrderId, addCustomerFeedback, customerFeedbacks, showToastMessage, pushMerchantNotification, pushDeliveryNotification } = useStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [currentRatingSub, setCurrentRatingSub] = useState<{ sub: any; masterOrderId: string } | null>(null);
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const [storeRating, setStoreRating]               = useState(0);
  const [storeComment, setStoreComment]             = useState('');
  const [logisticsRating, setLogisticsRating]       = useState(0);
  const [logisticsComment, setLogisticsComment]     = useState('');
  const [productRatings, setProductRatings] = useState<Record<string, { rating: number; comment: string }>>({});

  const bg      = isLight ? '#f0f7ff' : '#080e1c';
  const card    = isLight ? '#ffffff' : '#0d1526';
  const border  = isLight ? '#dbeafe' : 'rgba(0,176,255,0.12)';
  const primary = isLight ? '#0d3a6e' : '#e0f2fe';
  const muted   = isLight ? '#6b7280' : 'rgba(224,242,254,0.5)';

  const [dismissedRatings, setDismissedRatings] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('cvem_dismissed_ratings');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const myOrders = orders.filter(o => o.customerId === user?.id);
  const myMasterOrders = masterOrders.filter(mo => mo.customerId === user?.id);

  const alreadyRated = (orderId: string) =>
    customerFeedbacks.some(f => f.orderId === orderId || f.masterOrderId === orderId);

  const alreadyRatedSub = (subOrderId: string) =>
    customerFeedbacks.some(f => f.subOrderId === subOrderId || f.orderId === subOrderId);

  useEffect(() => {
    if (!user || user.role !== 'customer') return;
    if (sessionDismissed) { setCurrentRatingSub(null); return; }

    // فقط الطلبيات التي تخص هذا المستخدم بشكل مؤكد (customerId مطابق)
    const myConfirmedOrders = masterOrders.filter(
      (mo: any) => mo.customerId && mo.customerId === user.id
    );
    if (myConfirmedOrders.length === 0) { setCurrentRatingSub(null); return; }

    // راجع آخر 5 طلبيات فقط (الأحدث أولاً)
    const sorted = [...myConfirmedOrders].sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 5);

    for (const mo of sorted) {
      for (const sub of mo.subOrders) {
        if (
          sub.status === 'delivered' &&
          !alreadyRatedSub(sub.id) &&
          !dismissedRatings.has(sub.id)
        ) {
          // حد زمني: 7 أيام فقط بعد التسليم
          const deliveredAt = sub.updatedAt
            ? new Date(sub.updatedAt).getTime()
            : (mo.updatedAt ? new Date(mo.updatedAt).getTime() : 0);
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          if (deliveredAt > 0 && Date.now() - deliveredAt > sevenDays) continue;

          setCurrentRatingSub({ sub, masterOrderId: mo.id });
          return;
        }
      }
    }
    setCurrentRatingSub(null);
  }, [masterOrders, customerFeedbacks, user, dismissedRatings, sessionDismissed]);

  if (!user || user.role !== 'customer') {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: bg, direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: isLight ? '#eff6ff' : 'rgba(0,176,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: `1px solid ${border}` }}>
            <ShoppingBag style={{ width: 38, height: 38, color: isLight ? '#2563eb' : '#67e8f9' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: primary, marginBottom: '0.75rem' }}>سجّل الدخول لعرض طلباتك</h2>
          <p style={{ color: muted, marginBottom: '1.5rem', lineHeight: 1.7 }}>يجب تسجيل الدخول كعميل لمتابعة الطلبات.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: 12, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, textDecoration: 'none', fontFamily: 'Tajawal, sans-serif' }}>
              <Zap style={{ width: 16, height: 16 }} />تسجيل الدخول
            </Link>
            <Link to="/products" style={{ padding: '0.75rem 1.25rem', borderRadius: 12, border: `1px solid ${border}`, color: muted, fontWeight: 600, textDecoration: 'none', fontFamily: 'Tajawal, sans-serif' }}>
              تصفح المنتجات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeOrder = myOrders.find(o => o.id === activeOrderId);
  const previousOrders = myOrders.filter(o => o.id !== activeOrderId);
  const hasOrders = myOrders.length > 0;

  const submitRatingForSubOrder = () => {
    if (!user || !currentRatingSub) return;
    if (!storeRating || !logisticsRating) { showToastMessage('يرجى تقييم المحل وشركة التوصيل', 'error'); return; }
    const { sub, masterOrderId } = currentRatingSub;
    // fallback: إذا sub.items فارغة، حاول جلبها من الطلب الأصلي
    let subItems = sub.items || [];
    if (subItems.length === 0) {
      const originalOrder = orders.find((o: any) => o.id === masterOrderId);
      if (originalOrder?.items) {
        subItems = originalOrder.items.filter((item: any) =>
          item.store?.id === sub.merchantId || item.selectedStore?.id === sub.merchantId
        );
      }
    }
    // إذا لا توجد منتجات (طلبية قديمة جداً) — السماح بالإرسال بدون تقييم منتجات
    const hasValidProducts = subItems.length > 0 && subItems[0]?.product?.id;
    if (hasValidProducts) {
      const missingProductRatings = subItems.filter((item: any) =>
        !productRatings[item.product?.id] || !productRatings[item.product?.id].rating
      );
      if (missingProductRatings.length > 0) {
        showToastMessage(`يرجى تقييم جميع المنتجات (${missingProductRatings.length} منتج بدون تقييم)`, 'error');
        return;
      }
    }
    const productRatingsList = hasValidProducts
      ? subItems.map((item: any) => ({
          productId: item.product.id,
          productName: item.product.name,
          rating: productRatings[item.product.id]?.rating || 0,
          comment: productRatings[item.product.id]?.comment || '',
        }))
      : [];
    const fb: CustomerFeedback = {
      id: `fb-${Date.now()}-${sub.id}`,
      masterOrderId,
      subOrderId: sub.id,
      orderId: masterOrderId,
      customerId: user.id,
      customerName: user.name,
      merchantId: sub.merchantId,
      merchantName: sub.merchantName,
      deliveryCompanyId: sub.deliveryCompanyId,
      deliveryCompanyName: sub.deliveryCompanyName,
      storeRating,
      storeComment,
      logisticsRating,
      logisticsComment,
      productRatings: productRatingsList,
      createdAt: new Date().toISOString(),
    };
    addCustomerFeedback(fb);
    if (sub.merchantId) pushMerchantNotification('تقييم جديد 🔔', `${user.name} قيّم طلبية ${sub.id} من ${sub.merchantName} بـ ${storeRating} نجوم`, sub.merchantId);
    if (sub.deliveryCompanyId) pushDeliveryNotification('تقييم توصيل جديد 🚚', `${user.name} قيّم التوصيل بـ ${logisticsRating} نجوم — طلبية ${sub.id}`, sub.deliveryCompanyId);
    setStoreRating(0); setStoreComment('');
    setLogisticsRating(0); setLogisticsComment('');
    setProductRatings({});
    setCurrentRatingSub(null);
    showToastMessage('شكراً على تقييمك! 🌟', 'success');
  };

  const renderDriverInfo = (order: any) => {
    if (order.status !== 'shipped' && order.status !== 'in_transit' && order.status !== 'delivered') return null;
    const companyName = order.deliveryCompany || 'شركة التوصيل';
    const hasDriver = (
      order.status === 'in_transit' ||
      order.status === 'shipped' ||
      order.status === 'delivered'
    ) && order.driverName;
    return (
      <div style={{ margin: '0.75rem 1.25rem', padding: '0.85rem 1rem', borderRadius: 12, background: isLight ? 'rgba(6,182,212,0.06)' : 'rgba(34,211,238,0.07)', border: `1px solid ${isLight ? 'rgba(6,182,212,0.2)' : 'rgba(34,211,238,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        {/* الطرف الأول (يمين في RTL): شركة التوصيل */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 auto', minWidth: 140 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,211,238,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Truck style={{ width: 18, height: 18, color: '#22d3ee' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: muted, marginBottom: 1 }}>شركة التوصيل</div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: primary }}>{companyName}</div>
          </div>
        </div>
        {hasDriver ? (
          <>
            {/* الوسط: اسم المندوب */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 auto', minWidth: 140, justifyContent: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User style={{ width: 16, height: 16, color: '#22d3ee' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: muted, marginBottom: 1 }}>المندوب</div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: primary }}>{order.driverName}</div>
              </div>
            </div>
            {/* الطرف المقابل (يسار في RTL): رقم المندوب */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 auto', minWidth: 140, justifyContent: 'flex-end' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Phone style={{ width: 16, height: 16, color: '#06b6d4' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: muted, marginBottom: 1 }}>هاتف المندوب</div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: primary, direction: 'ltr' }}>{order.driverPhone}</div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ fontSize: '0.8rem', color: muted, fontStyle: 'italic', flex: '1 1 auto', textAlign: 'center' }}>
            سيتم تعيين مندوب التوصيل قريباً
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem 4rem' }}>

        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: isLight ? 'rgba(0,112,200,0.12)' : 'rgba(0,176,255,0.15)', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShoppingBag style={{ width: 24, height: 24, color: isLight ? '#0070c8' : '#67e8f9' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: primary, margin: 0 }}>طلباتي</h1>
            <p style={{ color: muted, margin: '0.1rem 0 0', fontSize: '0.875rem' }}>{myOrders.length + myMasterOrders.length} طلب مسجل</p>
          </div>
        </div>

        {!hasOrders ? (
          <div style={{ background: card, borderRadius: 20, padding: '4rem 2rem', textAlign: 'center', border: `1px solid ${border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <ShoppingBag style={{ width: 64, height: 64, color: isLight ? '#e2e8f0' : 'rgba(0,176,255,0.2)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: primary, marginBottom: '0.5rem' }}>لا توجد طلبات بعد</h3>
            <p style={{ color: muted, marginBottom: '1.5rem', lineHeight: 1.7 }}>ابدأ تسوقك الآن واستمتع بتوصيل سريع إلى باب منزلك!</p>
            <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: 12, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, textDecoration: 'none', fontFamily: 'Tajawal, sans-serif' }}>
              <Zap style={{ width: 16, height: 16 }} />تصفح المنتجات
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Active order */}
            {activeOrder && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 8px #22d3ee', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#22d3ee' }}>الطلب النشط</span>
                </div>
                <div style={{ background: card, borderRadius: 20, border: `2px solid ${isLight ? 'rgba(0,112,200,0.3)' : 'rgba(0,176,255,0.3)'}`, boxShadow: isLight ? '0 4px 20px rgba(0,112,200,0.1)' : '0 4px 20px rgba(0,176,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: primary }}>{activeOrder.id}</span>
                        {(() => {
                          const s = STATUS_LABELS[activeOrder.status] || STATUS_LABELS.pending;
                          const SIcon = s.icon;
                          return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.7rem', borderRadius: 20, background: s.bg, color: s.color, fontSize: '0.75rem', fontWeight: 700, border: `1px solid ${s.color}40` }}><SIcon style={{ width: 12, height: 12 }} />{s.label}</span>;
                        })()}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: muted, margin: '0 0 0.4rem' }}>
                        {new Date(activeOrder.createdAt).toLocaleDateString('ar-LY', { dateStyle: 'medium' })}
                      </p>
                      {activeOrder.shippingAddress && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin style={{ width: 12, height: 12, color: muted, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.8rem', color: muted }}>{activeOrder.shippingAddress.city}، {activeOrder.shippingAddress.district}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'left', flexShrink: 0 }}>
                      <p style={{ fontWeight: 800, color: '#0070c8', margin: '0 0 0.1rem', fontSize: '1.1rem' }}>{formatPrice(activeOrder.total)}</p>
                      <p style={{ fontSize: '0.72rem', color: muted, margin: 0 }}>إجمالي الطلب</p>
                    </div>
                  </div>
                  {renderDriverInfo(activeOrder)}
                  <div style={{ padding: '0 1.25rem 1.25rem' }}>
                    <OrderTimeline status={activeOrder.status as any} orderId={activeOrder.id} createdAt={activeOrder.createdAt} isLight={isLight} />
                  </div>
                </div>
              </div>
            )}

            {/* Previous orders */}
            {previousOrders.length > 0 && (
              <div>
                {activeOrder && <h3 style={{ fontSize: '1rem', fontWeight: 700, color: primary, margin: '0.5rem 0 0.75rem' }}>الطلبات السابقة</h3>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {previousOrders.map(order => {
                    const s = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                    const SIcon = s.icon;
                    return (
                      <div key={order.id} style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, boxShadow: '0 1px 6px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <SIcon style={{ width: 20, height: 20, color: s.color }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: primary }}>{order.id}</span>
                              <span style={{ padding: '0.15rem 0.6rem', borderRadius: 20, background: s.bg, color: s.color, fontSize: '0.72rem', fontWeight: 700 }}>{s.label}</span>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: muted, margin: 0 }}>
                              {new Date(order.createdAt).toLocaleDateString('ar-LY', { dateStyle: 'medium' })}
                              {order.shippingAddress && ` · ${order.shippingAddress.city}`}
                            </p>
                          </div>
                          <div style={{ textAlign: 'left', flexShrink: 0 }}>
                            <p style={{ fontWeight: 800, color: '#0070c8', margin: '0 0 0.1rem', fontSize: '0.95rem' }}>{formatPrice(order.total)}</p>
                            {alreadyRated(order.id) && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', color: muted }}>
                                <CheckCircle style={{ width: 11, height: 11, color: '#4ade80' }} />تم التقييم
                              </span>
                            )}
                          </div>
                        </div>
                        {renderDriverInfo(order)}
                        <div style={{ padding: '0 1.25rem 0.85rem' }}>
                          <OrderTimeline status={order.status as any} compact isLight={isLight} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Master Orders (multi-merchant) */}
            {myMasterOrders.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: primary, margin: '0.5rem 0 0.75rem' }}>طلبات متعددة المحلات</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {myMasterOrders.map(mo => (
                    <div key={mo.id} style={{ background: card, borderRadius: 18, border: `1.5px solid ${isLight ? 'rgba(0,112,200,0.25)' : 'rgba(0,176,255,0.25)'}`, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                      <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: primary }}>{mo.id}</span>
                          <p style={{ fontSize: '0.78rem', color: muted, margin: '0.15rem 0 0' }}>
                            {new Date(mo.createdAt).toLocaleDateString('ar-LY', { dateStyle: 'medium' })}
                            {mo.shippingAddress && ` · ${mo.shippingAddress.city}`}
                          </p>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontWeight: 800, color: '#0070c8', margin: 0, fontSize: '1rem' }}>{formatPrice(mo.grandTotal)}</p>
                          <p style={{ fontSize: '0.7rem', color: muted, margin: 0 }}>{mo.subOrders.length} محل</p>
                        </div>
                      </div>
                      {mo.subOrders.map((sub, idx) => {
                        const s = STATUS_LABELS[sub.status] || STATUS_LABELS.pending;
                        const SIcon = s.icon;
                        return (
                          <div key={sub.id} style={{ padding: '0.85rem 1.25rem', borderBottom: idx < mo.subOrders.length - 1 ? `1px solid ${border}` : 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <SIcon style={{ width: 17, height: 17, color: s.color }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: primary }}>{sub.merchantName}</div>
                              <div style={{ fontSize: '0.75rem', color: muted, marginTop: 2 }}>
                                {sub.deliveryCompanyName && <span>🚚 {sub.deliveryCompanyName} · </span>}
                                {sub.items.length} منتج
                              </div>
                            </div>
                            <div style={{ textAlign: 'left', flexShrink: 0 }}>
                              <span style={{ padding: '0.15rem 0.6rem', borderRadius: 20, background: s.bg, color: s.color, fontSize: '0.72rem', fontWeight: 700 }}>{s.label}</span>
                              <p style={{ fontWeight: 700, color: '#0070c8', margin: '0.2rem 0 0', fontSize: '0.85rem' }}>{formatPrice(sub.total)}</p>
                              {sub.status === 'delivered' && !alreadyRatedSub(sub.id) && (
                                <button
                                  onClick={() => {
                                    setSessionDismissed(false);
                                    setCurrentRatingSub({ sub, masterOrderId: mo.id });
                                  }}
                                  style={{
                                    marginTop: '0.3rem', padding: '0.25rem 0.6rem', borderRadius: 8,
                                    background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
                                    color: '#d97706', fontSize: '0.72rem', fontWeight: 700,
                                    fontFamily: 'Tajawal, sans-serif', cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                  }}
                                >
                                  · قيّم الآن
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!activeOrder && (
              <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.4rem', borderRadius: 12, background: isLight ? 'rgba(0,112,200,0.1)' : 'rgba(0,176,255,0.1)', border: `1px solid ${border}`, color: isLight ? '#0070c8' : '#67e8f9', fontWeight: 600, textDecoration: 'none', fontFamily: 'Tajawal, sans-serif', fontSize: '0.9rem' }}>
                  <Zap style={{ width: 15, height: 15 }} />طلب جديد
                  <ArrowRight style={{ width: 15, height: 15, transform: 'rotate(180deg)' }} />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auto-triggered rating overlay — نافذة منفصلة لكل SubOrder */}
      {currentRatingSub && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
          <div style={{ background: isLight ? '#fff' : '#0d1526', borderRadius: 22, padding: '2rem', maxWidth: 460, width: '100%', border: `1px solid ${border}`, boxShadow: '0 28px 64px rgba(0,0,0,0.3)', direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>

            {/* رأس النافذة المحسّن */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌟</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: primary, marginBottom: '0.25rem' }}>
                🏪 {currentRatingSub.sub.merchantName}
              </div>
              {/* عرض أسماء المنتجات */}
              {(currentRatingSub.sub.items || []).length > 0 && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 10, background: isLight ? '#f0f9ff' : 'rgba(0,176,255,0.07)', border: `1px solid ${border}` }}>
                  {currentRatingSub.sub.items.map((item: any) => (
                    <div key={item.product.id} style={{ fontSize: '0.78rem', color: muted, marginBottom: '0.2rem' }}>
                      📦 {item.product.name} × {item.quantity}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: '0.8rem', color: muted, marginTop: '0.4rem' }}>
                🚚 {currentRatingSub.sub.deliveryCompanyName}
              </div>
            </div>

            <div style={{ marginBottom: '1.1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: primary, marginBottom: '0.4rem' }}>تقييم المتجر</label>
              <StarRating value={storeRating} onChange={setStoreRating} />
              <textarea value={storeComment} onChange={e => setStoreComment(e.target.value)} placeholder="تعليق على المتجر (اختياري)" rows={2}
                style={{ width: '100%', marginTop: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: 10, border: `1.5px solid ${border}`, background: isLight ? '#f8fafc' : '#080e1c', color: primary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '1.1rem', padding: '0.75rem', borderRadius: 10, background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.02)', border: `1px solid ${border}` }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: primary, marginBottom: '0.6rem' }}>
                تقييم المنتجات
              </label>
              {(() => {
                // fallback: محاولة جلب items من الطلب الأصلي إذا فارغة
                let displayItems = currentRatingSub.sub.items || [];
                if (displayItems.length === 0) {
                  const originalOrder = orders.find((o: any) => o.id === currentRatingSub.masterOrderId);
                  if (originalOrder?.items) {
                    displayItems = originalOrder.items.filter((item: any) =>
                      item.store?.id === currentRatingSub.sub.merchantId ||
                      item.selectedStore?.id === currentRatingSub.sub.merchantId
                    );
                  }
                }
                const hasProducts = displayItems.length > 0 && displayItems[0]?.product?.id;
                if (!hasProducts) {
                  return (
                    <div style={{ padding: '0.85rem', textAlign: 'center', color: muted, fontSize: '0.8rem', fontStyle: 'italic' }}>
                      لا توجد بيانات منتجات لهذه الطلبية — يمكنك تقييم المتجر والتوصيل فقط
                    </div>
                  );
                }
                return displayItems.map((item: any) => {
                  const pid = item.product.id;
                  const current = productRatings[pid] || { rating: 0, comment: '' };
                  return (
                    <div key={pid} style={{ marginBottom: '0.85rem', paddingBottom: '0.85rem', borderBottom: `1px dashed ${border}` }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: primary, marginBottom: '0.4rem', lineHeight: 1.3 }}>
                        📱 {item.product.name}
                      </div>
                      <StarRating
                        value={current.rating}
                        onChange={(r) => setProductRatings(prev => ({ ...prev, [pid]: { rating: r, comment: prev[pid]?.comment || '' } }))}
                      />
                      <textarea
                        value={current.comment}
                        onChange={(e) => setProductRatings(prev => ({ ...prev, [pid]: { rating: prev[pid]?.rating || 0, comment: e.target.value } }))}
                        placeholder="تعليق على المنتج (اختياري)"
                        rows={1}
                        style={{ width: '100%', marginTop: '0.4rem', padding: '0.5rem 0.7rem', borderRadius: 8, border: `1px solid ${border}`, background: isLight ? '#fff' : '#080e1c', color: primary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.78rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  );
                });
              })()}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: primary, marginBottom: '0.4rem' }}>تقييم شركة التوصيل</label>
              <StarRating value={logisticsRating} onChange={setLogisticsRating} />
              <textarea value={logisticsComment} onChange={e => setLogisticsComment(e.target.value)} placeholder="تعليق على التوصيل (اختياري)" rows={2}
                style={{ width: '100%', marginTop: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: 10, border: `1.5px solid ${border}`, background: isLight ? '#f8fafc' : '#080e1c', color: primary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={submitRatingForSubOrder} style={{ flex: 2, padding: '0.85rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,112,200,0.3)' }}>
                <Star style={{ width: 15, height: 15, display: 'inline', marginLeft: '0.3rem' }} />
                إرسال التقييم ✓
              </button>
              <button onClick={() => {
                const dismissed = new Set(dismissedRatings).add(currentRatingSub.sub.id);
                setDismissedRatings(dismissed);
                try { localStorage.setItem('cvem_dismissed_ratings', JSON.stringify([...dismissed])); } catch {}
                setStoreRating(0); setStoreComment('');
                setLogisticsRating(0); setLogisticsComment('');
                setProductRatings({});
                setCurrentRatingSub(null);
                setSessionDismissed(true);
              }} style={{ flex: 1, padding: '0.85rem', borderRadius: 12, border: `1.5px solid ${border}`, background: 'transparent', color: muted, fontWeight: 600, fontSize: '0.95rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>
                لاحقاً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
