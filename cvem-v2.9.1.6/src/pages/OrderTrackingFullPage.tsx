import React, { useState, useCallback, useEffect } from 'react';
import {
  Car, ShoppingBag, MessageCircle, Star, CheckCircle,
  Clock, Truck, MapPin, Package, ChevronLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { formatPrice } from '../data/mockData';
import { SubOrder } from '../data/mockData';
import OrderTimeline from '../components/OrderTimeline';

// ─────────────────────────────────────────────
//  StarRating — يدعم أسهم لوحة المفاتيح ↑↓←→
// ─────────────────────────────────────────────
function StarRating({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        e.preventDefault();
        onChange(Math.min(5, value + 1));
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        e.preventDefault();
        onChange(Math.max(1, value - 1));
      }
    },
    [disabled, value, onChange],
  );

  return (
    <div
      tabIndex={disabled ? -1 : 0}
      role="slider"
      aria-valuenow={value}
      aria-valuemin={1}
      aria-valuemax={5}
      aria-label="تقييم بالنجوم"
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        gap: '0.4rem',
        direction: 'rtl',
        justifyContent: 'center',
        outline: 'none',
      }}
    >
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onMouseEnter={() => !disabled && setHovered(s)}
          onMouseLeave={() => !disabled && setHovered(0)}
          onClick={() => !disabled && onChange(s)}
          style={{
            background: 'none',
            border: 'none',
            cursor: disabled ? 'default' : 'pointer',
            fontSize: '2.2rem',
            lineHeight: 1,
            padding: '0.1rem',
            color:
              s <= (hovered || value)
                ? '#fbbf24'
                : 'rgba(156,163,175,0.3)',
            transition: 'color 0.1s, transform 0.1s',
            transform:
              !disabled && s <= hovered ? 'scale(1.2)' : 'scale(1)',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  الصفحة الرئيسية
// ─────────────────────────────────────────────
export default function OrderTrackingFullPage() {
  const {
    activeOrderId,
    orders,
    masterOrders,
    user,
    updateOrderStatus,
    showToastMessage,
    addCustomerFeedback,
    customerFeedbacks,
    setActiveOrderId,
    pushMerchantNotification,
    pushDeliveryNotification,
  } = useStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // State التقييم الجديد (Overlay)
  const [ratingSubId, setRatingSubId] = useState<string | null>(null);
  const [storeRating, setStoreRating] = useState(0);
  const [storeComment, setStoreComment] = useState('');
  const [logisticsRating, setLogisticsRating] = useState(0);
  const [logisticsComment, setLogisticsComment] = useState('');
  const [productRatings, setProductRatings] = useState<Record<string, { rating: number; comment: string }>>({});
  const [dismissedRatings, setDismissedRatings] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('cvem_dismissed_ratings');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  // ألوان الثيم
  const panelBg = isLight ? '#f0f7ff' : '#020817';
  const border = isLight ? 'rgba(0,112,200,0.18)' : 'rgba(0,176,255,0.15)';
  const textPrimary = isLight ? '#0d3a6e' : '#e0f2fe';
  const textMuted = isLight ? '#6b7280' : 'rgba(224,242,254,0.5)';
  const cardBg = isLight ? '#f8fcff' : '#0d1526';
  const cardBorder = isLight ? '#dbeafe' : 'rgba(0,176,255,0.12)';

  // ── تحديد الطلب النشط ──────────────────────
  const activeMaster = masterOrders.find(
    (mo) => mo.id === activeOrderId && mo.customerId === user?.id,
  );
  const activeSingleOrder = !activeMaster
    ? orders.find(
        (o) => o.id === activeOrderId && o.customerId === user?.id,
      )
    : null;

  const hasActiveOrder = !!(activeMaster || activeSingleOrder);

  // ── منطق التقييم التلقائي ──────────────────
  const alreadyRated = (id: string) => customerFeedbacks.some(f => f.orderId === id);

  useEffect(() => {
    if (!user || ratingSubId) return;

    // فقط الطلبيات المرتبطة بهذا المستخدم بشكل مؤكد
    if (activeMaster && activeMaster.customerId !== user.id) return;
    if (activeSingleOrder && activeSingleOrder.customerId !== user.id) return;

    if (activeMaster) {
      for (const sub of activeMaster.subOrders) {
        if (sub.status === 'delivered' && !alreadyRated(sub.id) && !dismissedRatings.has(sub.id)) {
          setRatingSubId(sub.id);
          return;
        }
      }
    }

    if (activeSingleOrder &&
        activeSingleOrder.status === 'delivered' &&
        !alreadyRated(activeSingleOrder.id) &&
        !dismissedRatings.has(activeSingleOrder.id)) {
      setRatingSubId(activeSingleOrder.id);
    }
  }, [activeMaster, activeSingleOrder, customerFeedbacks, dismissedRatings, user, ratingSubId]);

  // ── وظائف المساعدة ─────────────────────────
  const handleSimulateDelivery = (subId: string) => {
    if (activeMaster) {
      updateOrderStatus(activeMaster.id, 'delivered'); // لتبسيط المحاكاة
      // في الواقع نحتاج لتحديث subOrder محدد، لكن هنا للتجربة:
      const sub = activeMaster.subOrders.find((s) => s.id === subId);
      if (sub) {
        // نستخدم وظيفة تحديث حالة الطلبية الفرعية من الـ store
        // (بافتراض وجودها في الـ store context)
        (useStore as any).getState().updateSubOrderStatus(activeMaster.id, subId, 'delivered');
      }
    } else if (activeSingleOrder) {
      updateOrderStatus(activeSingleOrder.id, 'delivered');
    }
    showToastMessage('تمت محاكاة التوصيل بنجاح!', 'success');
  };

  const submitRating = () => {
    if (!user || !ratingSubId) return;
    if (!storeRating || !logisticsRating) {
      showToastMessage('يرجى تقييم المحل وشركة التوصيل', 'error');
      return;
    }

    // حدد merchantId و deliveryCompanyId من الـ sub أو الطلب الفردي
    const sub = activeMaster?.subOrders.find(s => s.id === ratingSubId);
    
    // التحقق من تقييم كل المنتجات
    const subItems = sub?.items || activeSingleOrder?.items || [];
    const missingProductRatings = subItems.filter((item: any) =>
      !productRatings[item.product.id] || !productRatings[item.product.id].rating
    );
    if (missingProductRatings.length > 0) {
      showToastMessage(`يرجى تقييم جميع المنتجات (${missingProductRatings.length} منتج بدون تقييم)`, 'error');
      return;
    }
    const productRatingsList = subItems.map((item: any) => ({
      productId: item.product.id,
      productName: item.product.name,
      rating: productRatings[item.product.id].rating,
      comment: productRatings[item.product.id].comment || '',
    }));

    const merchantId = sub?.merchantId ?? activeSingleOrder?.merchantId ?? '';
    const deliveryCompanyId = sub?.deliveryCompanyId ?? activeSingleOrder?.deliveryCompanyId ?? '';
    const merchantName = sub?.merchantName ?? activeSingleOrder?.merchantName ?? '';
    const deliveryName = sub?.deliveryCompanyName ?? activeSingleOrder?.deliveryCompanyName ?? '';

    const fb: CustomerFeedback = {
      id: `fb-${Date.now()}`,
      orderId: activeMaster?.id ?? ratingSubId,
      masterOrderId: activeMaster?.id ?? ratingSubId,
      subOrderId: sub?.id ?? ratingSubId,
      customerId: user.id,
      customerName: user.name,
      merchantId,
      merchantName,
      deliveryCompanyId,
      deliveryCompanyName: deliveryName,
      storeRating, storeComment,
      logisticsRating, logisticsComment,
      productRatings: productRatingsList,
      createdAt: new Date().toISOString(),
    };
    
    addCustomerFeedback(fb);
    
    if (merchantId) pushMerchantNotification('تقييم جديد 🔔', `${user.name} قيّم ${merchantName} بـ ${storeRating} نجوم`, merchantId);
    if (deliveryCompanyId) pushDeliveryNotification('تقييم توصيل جديد 🚚', `${user.name} قيّم ${deliveryName} بـ ${logisticsRating} نجوم`, deliveryCompanyId);

    showToastMessage('شكراً على تقييمك! 🌟', 'success');
    setRatingSubId(null);
    setStoreRating(0); setStoreComment('');
    setLogisticsRating(0); setLogisticsComment('');
    setProductRatings({});
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: panelBg,
        fontFamily: 'Tajawal, sans-serif',
        direction: 'rtl',
        padding: '2rem 1rem',
      }}
    >
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* ── Header ── */}
        <div
          style={{
            padding: '0 0 1.5rem',
            borderBottom: `1px solid ${border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: isLight
                ? 'rgba(0,112,200,0.1)'
                : 'rgba(0,176,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Car
              style={{
                width: 24,
                height: 24,
                color: isLight ? '#0070c8' : '#67e8f9',
              }}
            />
          </div>
          <div>
            <h1
              style={{
                fontWeight: 800,
                fontSize: '1.5rem',
                color: textPrimary,
                margin: 0,
              }}
            >
              تتبع طلبك
            </h1>
            <div style={{ fontSize: '0.85rem', color: textMuted }}>
              CyberVolt e-Mall
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div>
          {hasActiveOrder ? (
            <div>
              {/* ══ MasterOrder View ══ */}
              {activeMaster && (
                <div>
                  {/* بطاقة الطلب الكبيرة */}
                  <div
                    style={{
                      background:
                        'linear-gradient(135deg,#0070c8,#00B0FF)',
                      borderRadius: 16,
                      padding: '1.5rem',
                      marginBottom: '1.5rem',
                      color: '#fff',
                      boxShadow: '0 10px 25px -5px rgba(0,112,200,0.3)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <Car style={{ width: 20, height: 20 }} />
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>
                        الطلب النشط
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        marginBottom: '0.5rem',
                        letterSpacing: 1,
                      }}
                    >
                      {activeMaster.id}
                    </div>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        opacity: 0.9,
                        marginBottom: '0.75rem',
                      }}
                    >
                      {activeMaster.subOrders.length} طلبية من{' '}
                      {activeMaster.subOrders.length} متجر
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>
                      {formatPrice(activeMaster.grandTotal)}
                    </div>
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: textMuted,
                      marginBottom: '1rem',
                    }}
                  >
                    تفاصيل الطلبيات ({activeMaster.subOrders.length})
                  </div>

                  {/* كل طلبية على حدة */}
                  {activeMaster.subOrders.map((sub) => {
                    const isDelivered = sub.status === 'delivered';
                    return (
                      <div key={sub.id}>
                        <div
                          style={{
                            background: cardBg,
                            border: `1px solid ${cardBorder}`,
                            borderRadius: 14,
                            padding: '1rem',
                            marginBottom: '1rem',
                          }}
                        >
                          {/* رأس البطاقة */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '0.6rem',
                            }}
                          >
                            <div
                              style={{ fontWeight: 700, fontSize: '0.88rem', color: textPrimary }}
                            >
                              🏪 {sub.merchantName}
                            </div>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                background: isDelivered
                                  ? 'rgba(34,197,94,0.12)'
                                  : 'rgba(0,176,255,0.1)',
                                color: isDelivered ? '#16a34a' : '#0070c8',
                                padding: '0.15rem 0.5rem',
                                borderRadius: 8,
                                fontWeight: 700,
                              }}
                            >
                              {isDelivered
                                ? 'تم التوصيل'
                                : sub.status === 'shipped'
                                ? 'في الطريق'
                                : sub.status === 'ready_for_pickup' || sub.status === 'picked_up'
                                ? 'مع المندوب'
                                : 'قيد التجهيز'}
                            </span>
                          </div>

                          {/* التايملاين */}
                          <div style={{ padding: '0.5rem 0' }}>
                            <OrderTimeline status={sub.status} compact isLight={isLight} />
                          </div>

                          {/* تفاصيل شركة التوصيل */}
                          <div
                            style={{
                              marginTop: '0.75rem',
                              padding: '0.75rem',
                              borderRadius: 10,
                              background: isLight
                                ? 'rgba(0,112,200,0.05)'
                                : 'rgba(0,176,255,0.05)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Truck
                                style={{
                                  width: 16,
                                  height: 16,
                                  color: isLight ? '#0070c8' : '#67e8f9',
                                }}
                              />
                              <span style={{ fontSize: '0.75rem', color: textPrimary, fontWeight: 600 }}>
                                {sub.deliveryCompanyName}
                              </span>
                            </div>
                            {sub.driverName && (
                              <div style={{ fontSize: '0.7rem', color: textMuted }}>
                                المندوب: {sub.driverName}
                              </div>
                            )}
                          </div>
                          
                          {/* زر المحاكاة (للتجربة فقط) */}
                          {!isDelivered && (
                            <button
                              onClick={() => handleSimulateDelivery(sub.id)}
                              style={{
                                width: '100%', marginTop: '0.75rem', padding: '0.5rem',
                                borderRadius: 8, border: `1px dashed ${cardBorder}`,
                                background: 'transparent', color: textMuted,
                                fontSize: '0.7rem', cursor: 'pointer'
                              }}
                            >
                              محاكاة التوصيل (للمعاينة)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ══ Single Order View ══ */}
              {activeSingleOrder && (
                <div
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 16,
                    padding: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          color: textPrimary,
                          marginBottom: '0.25rem',
                        }}
                      >
                        طلب من {activeSingleOrder.merchantName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: textMuted }}>
                        #{activeSingleOrder.id}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: 10,
                        background: 'rgba(0,176,255,0.1)',
                        color: '#0070c8',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      {activeSingleOrder.status === 'delivered'
                        ? 'تم التوصيل'
                        : 'قيد التتبع'}
                    </div>
                  </div>

                  <OrderTimeline status={activeSingleOrder.status} isLight={isLight} />

                  <div
                    style={{
                      marginTop: '2rem',
                      padding: '1rem',
                      borderRadius: 12,
                      background: isLight
                        ? 'rgba(0,112,200,0.05)'
                        : 'rgba(0,176,255,0.05)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <Truck
                        style={{
                          width: 18,
                          height: 18,
                          color: isLight ? '#0070c8' : '#67e8f9',
                        }}
                      />
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: textPrimary,
                        }}
                      >
                        {activeSingleOrder.deliveryCompany || 'شركة التوصيل'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: textMuted, margin: 0 }}>
                      سيتم التواصل معك فور وصول المندوب إلى موقعك.
                    </p>
                  </div>
                  
                  {activeSingleOrder.status !== 'delivered' && (
                    <button
                      onClick={() => handleSimulateDelivery(activeSingleOrder.id)}
                      style={{
                        width: '100%', marginTop: '1rem', padding: '0.6rem',
                        borderRadius: 10, border: `1px dashed ${cardBorder}`,
                        background: 'transparent', color: textMuted,
                        fontSize: '0.75rem', cursor: 'pointer'
                      }}
                    >
                      محاكاة التوصيل (للمعاينة)
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: isLight
                    ? 'rgba(0,112,200,0.06)'
                    : 'rgba(0,176,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                }}
              >
                <ShoppingBag
                  style={{
                    width: 32,
                    height: 32,
                    color: isLight ? '#0070c8' : '#67e8f9',
                  }}
                />
              </div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: textPrimary,
                  marginBottom: '0.5rem',
                }}
              >
                لا يوجد طلب نشط حالياً
              </h2>
              <p style={{ color: textMuted, marginBottom: '2rem' }}>
                يمكنك متابعة طلباتك السابقة من صفحة "طلباتي"
              </p>
              <Link
                to="/products"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 2rem',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg,#0070c8,#00B0FF)',
                  color: '#fff',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                اذهب للتسوق
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── الطلبات السابقة ── */}
      {(() => {
        const myPastMasters = masterOrders
          .filter((mo: any) => mo.customerId === user?.id && mo.subOrders.every((s: any) => s.status === 'delivered'))
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const myPastSingles = orders
          .filter((o: any) => o.customerId === user?.id && o.status === 'delivered')
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const allPast = [
          ...myPastMasters.map((mo: any) => ({ id: mo.id, label: mo.subOrders.map((s: any) => s.merchantName).join('، '), total: mo.grandTotal, date: mo.createdAt, isMaster: true })),
          ...myPastSingles.map((o: any) => ({ id: o.id, label: o.merchantName || 'طلب', total: o.total, date: o.createdAt, isMaster: false })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const showAll = allPast.length > 5;
        const displayed = allPast.slice(0, 5);

        return (
          <div style={{ maxWidth: 700, margin: '1.5rem auto 0', padding: '0 1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: textPrimary, marginBottom: '0.85rem', paddingRight: '0.25rem' }}>
              طلباتي السابقة
            </h3>

            {displayed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <p style={{ color: textMuted, fontSize: '0.875rem', marginBottom: '1.25rem' }}>لا توجد طلبات سابقة بعد</p>
                <Link
                  to="/products"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.75rem', borderRadius: 12, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}
                >
                  <ShoppingBag style={{ width: 16, height: 16 }} />
                  تصفح المنتجات
                </Link>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {displayed.map((item, idx) => {
                    // معرفة إن كانت هذه آخر طلبية مُسلَّمة (للسماح بالاتصال بالدعم)
                    const isLastDelivered = idx === 0;
                    // معرفة إن كانت غير مقيمة
                    const masterOrder = masterOrders.find((mo: any) => mo.id === item.id);
                    const unratedSubs = masterOrder
                      ? masterOrder.subOrders.filter((s: any) =>
                          s.status === 'delivered' &&
                          !customerFeedbacks.some((f: any) => f.subOrderId === s.id || f.orderId === s.id)
                        )
                      : [];
                    const hasUnrated = unratedSubs.length > 0;

                    return (
                      <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: 12, background: cardBg, border: `1px solid ${cardBorder}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: textPrimary, margin: '0 0 0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</p>
                            <p style={{ fontSize: '0.75rem', color: textMuted, margin: 0 }}>{new Date(item.date).toLocaleDateString('ar-LY', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: isLight ? '#0070c8' : '#67e8f9', flexShrink: 0 }}>
                            {item.total.toLocaleString('ar-LY')} د.ل
                          </div>
                        </div>
                        {/* أزرار الإجراءات */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {hasUnrated && unratedSubs.map((sub: any) => (
                            <button
                              key={sub.id}
                              onClick={() => setRatingSubId(sub.id)}
                              style={{
                                padding: '0.3rem 0.7rem', borderRadius: 8,
                                background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
                                color: '#d97706', fontSize: '0.72rem', fontWeight: 700,
                                fontFamily: 'Tajawal, sans-serif', cursor: 'pointer',
                              }}
                            >
                              · قيّم {sub.merchantName}
                            </button>
                          ))}
                          {isLastDelivered && (
                            <Link
                              to={`/support?orderId=${item.id}`}
                              style={{
                                padding: '0.3rem 0.7rem', borderRadius: 8,
                                background: isLight ? 'rgba(0,112,200,0.08)' : 'rgba(0,176,255,0.08)',
                                border: `1px solid ${isLight ? 'rgba(0,112,200,0.25)' : 'rgba(0,176,255,0.25)'}`,
                                color: isLight ? '#0070c8' : '#67e8f9', fontSize: '0.72rem', fontWeight: 700,
                                fontFamily: 'Tajawal, sans-serif', textDecoration: 'none',
                              }}
                            >
                              💬 تواصل مع الدعم
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
                  {allPast.length < 5 && (
                    <Link
                      to="/products"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', borderRadius: 12, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}
                    >
                      <ShoppingBag style={{ width: 15, height: 15 }} />
                      تصفح المنتجات
                    </Link>
                  )}
                  {showAll && (
                    <Link
                      to="/my-orders"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', borderRadius: 12, border: `1.5px solid ${cardBorder}`, background: 'transparent', color: textPrimary, fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}
                    >
                      عرض الكل
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ── Auto-triggered rating overlay ── */}
      {ratingSubId && (() => {
        const sub = activeMaster?.subOrders.find(s => s.id === ratingSubId);
        const merchantName = sub?.merchantName ?? activeSingleOrder?.merchantName ?? '';
        const deliveryName = sub?.deliveryCompanyName ?? activeSingleOrder?.deliveryCompanyName ?? '';
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
            <div style={{ background: isLight ? '#fff' : '#0d1526', borderRadius: 22, padding: '2rem', maxWidth: 460, width: '100%', border: `1px solid ${cardBorder}`, boxShadow: '0 28px 64px rgba(0,0,0,0.3)', direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>
              
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem', lineHeight: 1, marginBottom: '0.5rem' }}>🌟</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: textPrimary, margin: '0 0 0.3rem' }}>
                  تم توصيل طلبية {merchantName}!
                </h3>
                <p style={{ color: textMuted, fontSize: '0.875rem', margin: 0 }}>
                  شاركنا رأيك لتحسين خدمتنا
                </p>
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: textPrimary, marginBottom: '0.4rem' }}>تقييم المتجر ({merchantName})</label>
                <StarRating value={storeRating} onChange={setStoreRating} />
                <textarea value={storeComment} onChange={e => setStoreComment(e.target.value)} placeholder="تعليق على المتجر (اختياري)" rows={2}
                  style={{ width: '100%', marginTop: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: 10, border: `1.5px solid ${cardBorder}`, background: isLight ? '#f8fafc' : '#080e1c', color: textPrimary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1.1rem', padding: '0.75rem', borderRadius: 10, background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.02)', border: `1px solid ${cardBorder}` }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: textPrimary, marginBottom: '0.6rem' }}>
                  تقييم المنتجات ({(sub?.items || activeSingleOrder?.items || []).length})
                </label>
                {((sub?.items || activeSingleOrder?.items || []).length === 0) ? (
                  <div style={{ padding: '0.85rem', textAlign: 'center', color: textMuted, fontSize: '0.8rem', fontStyle: 'italic' }}>
                    لا توجد منتجات لتقييمها في هذه الطلبية
                  </div>
                ) : (
                  (sub?.items || activeSingleOrder?.items || []).map((item: any) => {
                    const pid = item.product.id;
                    const current = productRatings[pid] || { rating: 0, comment: '' };
                    return (
                      <div key={pid} style={{ marginBottom: '0.85rem', paddingBottom: '0.85rem', borderBottom: `1px dashed ${cardBorder}` }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: textPrimary, marginBottom: '0.4rem', lineHeight: 1.3 }}>
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
                          style={{ width: '100%', marginTop: '0.4rem', padding: '0.5rem 0.7rem', borderRadius: 8, border: `1px solid ${cardBorder}`, background: isLight ? '#fff' : '#080e1c', color: textPrimary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.78rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: textPrimary, marginBottom: '0.4rem' }}>تقييم التوصيل ({deliveryName})</label>
                <StarRating value={logisticsRating} onChange={setLogisticsRating} />
                <textarea value={logisticsComment} onChange={e => setLogisticsComment(e.target.value)} placeholder="تعليق على التوصيل (اختياري)" rows={2}
                  style={{ width: '100%', marginTop: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: 10, border: `1.5px solid ${cardBorder}`, background: isLight ? '#f8fafc' : '#080e1c', color: textPrimary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={submitRating} style={{ flex: 2, padding: '0.85rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,112,200,0.3)' }}>
                  <Star style={{ width: 15, height: 15, display: 'inline', marginLeft: '0.3rem' }} />
                  إرسال التقييم
                </button>
                <button onClick={() => {
                  if (ratingSubId) {
                    const updated = new Set(dismissedRatings).add(ratingSubId);
                    setDismissedRatings(updated);
                    try { localStorage.setItem('cvem_dismissed_ratings', JSON.stringify([...updated])); } catch {}
                  }
                  setRatingSubId(null);
                  setStoreRating(0); setStoreComment('');
                  setLogisticsRating(0); setLogisticsComment('');
                  setProductRatings({});
                }} style={{ flex: 1, padding: '0.85rem', borderRadius: 12, border: `1.5px solid ${cardBorder}`, background: 'transparent', color: textMuted, fontWeight: 600, fontSize: '0.95rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>
                  لاحقاً
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
