import React, { useState } from 'react';
import { X, Car, ShoppingBag, MessageCircle, Star, CheckCircle, Package, Clock, Truck, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { useTheme } from '../../context/ThemeContext';
import { formatPrice, MERCHANT_DELIVERY_MAP } from '../../data/mockData';
import { SubOrder } from '../../data/mockData';
import OrderTimeline from '../OrderTimeline';

function StarRating({ value, onChange, disabled = false }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '0.25rem', direction: 'rtl' }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s} type="button"
          disabled={disabled}
          onMouseEnter={() => !disabled && setHovered(s)}
          onMouseLeave={() => !disabled && setHovered(0)}
          onClick={() => !disabled && onChange(s)}
          style={{
            background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer',
            fontSize: '1.5rem', lineHeight: 1, padding: '0.1rem',
            color: s <= (hovered || value) ? '#fbbf24' : 'rgba(255,255,255,0.2)',
            transition: 'color 0.1s, transform 0.1s',
            transform: !disabled && s <= hovered ? 'scale(1.2)' : 'scale(1)',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

const STATUS_IDX: Record<string, number> = {
  pending: 0, processing: 1, shipped: 2, delivered: 3,
};

function SubOrderCard({
  sub,
  isLight,
  textPrimary,
  textMuted,
  cardBg,
  cardBorder,
}: {
  sub: SubOrder;
  isLight: boolean;
  textPrimary: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
}) {
  const isDelivered = sub.status === 'delivered';

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      borderRadius: 14,
      padding: '1rem',
      marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: textPrimary }}>
          🏪 {sub.merchantName}
        </div>
        <span style={{
          fontSize: '0.7rem',
          background: isDelivered ? 'rgba(34,197,94,0.12)' : 'rgba(0,176,255,0.1)',
          color: isDelivered ? '#16a34a' : '#0070c8',
          padding: '0.15rem 0.5rem',
          borderRadius: 8,
          fontWeight: 700,
        }}>
          {isDelivered ? 'تم التوصيل' : sub.status === 'shipped' ? 'في الطريق' : sub.status === 'processing' ? 'قيد التحضير' : 'تم الاستلام'}
        </span>
      </div>

      <div style={{ fontSize: '0.75rem', color: textMuted, marginBottom: '0.5rem' }}>
        🚚 {sub.deliveryCompanyName}
      </div>

      <div style={{ fontSize: '0.78rem', color: textMuted, marginBottom: '0.6rem' }}>
        {sub.items.slice(0, 2).map((item: any, i: number) => (
          <span key={i}>{item.product?.name}{i < Math.min(sub.items.length, 2) - 1 ? '، ' : ''}</span>
        ))}
        {sub.items.length > 2 && ` +${sub.items.length - 2}`}
      </div>

      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#00B0FF', marginBottom: '0.75rem' }}>
        {formatPrice(sub.total)}
      </div>

      {sub.driverName && (
        <div style={{
          fontSize: '0.75rem', color: textMuted,
          background: isLight ? 'rgba(0,112,200,0.06)' : 'rgba(0,176,255,0.06)',
          borderRadius: 8, padding: '0.4rem 0.6rem', marginBottom: '0.6rem',
          display: 'flex', gap: '0.4rem', alignItems: 'center',
        }}>
          <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} />
          السائق: {sub.driverName}{sub.driverPhone ? ` — ${sub.driverPhone}` : ''}
        </div>
      )}

      <OrderTimeline
        status={sub.status as any}
        compact={true}
        isLight={isLight}
      />
    </div>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CarTrackingPanel({ isOpen, onClose }: Props) {
  const {
    activeOrderId,
    orders,
    masterOrders,
    user,
    setActiveOrderId,
    updateOrderStatus,
    showToastMessage,
    pushMerchantNotification,
    pushDeliveryNotification,
  } = useStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const panelBg     = isLight ? '#ffffff' : '#0a1628';
  const border      = isLight ? 'rgba(0,112,200,0.2)' : 'rgba(0,176,255,0.18)';
  const textPrimary = isLight ? '#0d3a6e' : '#e0f2fe';
  const textMuted   = isLight ? '#6b7280' : 'rgba(224,242,254,0.5)';
  const cardBg      = isLight ? '#f8fcff' : '#0d1526';
  const cardBorder  = isLight ? '#dbeafe' : 'rgba(0,176,255,0.12)';

  const activeMaster = masterOrders.find(
    mo => mo.id === activeOrderId && mo.customerId === user?.id
  );
  const activeSingleOrder = !activeMaster
    ? orders.find(o => o.id === activeOrderId && o.customerId === user?.id)
    : null;

  const hasActiveOrder = !!(activeMaster || activeSingleOrder);

  const legacyIsDelivered = activeSingleOrder?.status === 'delivered';

  const masterAllDelivered = activeMaster
    ? activeMaster.subOrders.every(so => so.status === 'delivered')
    : false;

  const previousMasters = masterOrders.filter(
    mo => mo.id !== activeOrderId && mo.customerId === user?.id
  );
  const masterOrderIds = new Set(masterOrders.map(mo => mo.id));
  const previousOrders = orders.filter(
    o => o.id !== activeOrderId && o.customerId === user?.id && !masterOrderIds.has(o.id)
  );

  const handleSimulateDelivery = () => {
    if (!activeSingleOrder) return;
    updateOrderStatus(activeSingleOrder.id, 'delivered');
    showToastMessage('تم تحديث حالة الطلب إلى: تم التوصيل', 'success');
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }}
      />

      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 9001,
        width: '100%', maxWidth: 420,
        background: panelBg, boxShadow: '4px 0 32px rgba(0,0,0,0.3)',
        borderLeft: `1px solid ${border}`,
        display: 'flex', flexDirection: 'column',
        animation: 'slideFromLeft 0.3s ease forwards',
        fontFamily: 'Tajawal, sans-serif', direction: 'rtl',
      }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: isLight ? 'rgba(0,112,200,0.1)' : 'rgba(0,176,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Car style={{ width: 20, height: 20, color: isLight ? '#0070c8' : '#67e8f9' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: textPrimary }}>تتبع طلبك</div>
            <div style={{ fontSize: '0.75rem', color: textMuted }}>CyberVolt e-Mall</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 20, height: 20, color: textMuted }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>

          {hasActiveOrder ? (
            <div>
              {/* ── MasterOrder view ── */}
              {activeMaster && (
                <div>
                  <div style={{ background: 'linear-gradient(135deg,#0070c8,#00B0FF)', borderRadius: 16, padding: '1.25rem', marginBottom: '1rem', color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Car style={{ width: 18, height: 18 }} />
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>الطلب النشط</span>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.3rem', letterSpacing: 1 }}>
                      {activeMaster.id}
                    </div>
                    <div style={{ fontSize: '0.78rem', opacity: 0.85, marginBottom: '0.5rem' }}>
                      {activeMaster.subOrders.length} طلبية من {activeMaster.subOrders.length} متجر
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {formatPrice(activeMaster.grandTotal)}
                    </div>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: textMuted, marginBottom: '0.65rem' }}>
                    تفاصيل الطلبيات ({activeMaster.subOrders.length})
                  </div>

                  {activeMaster.subOrders.map(sub => (
                    <SubOrderCard
                      key={sub.id}
                      sub={sub}
                      isLight={isLight}
                      textPrimary={textPrimary}
                      textMuted={textMuted}
                      cardBg={cardBg}
                      cardBorder={cardBorder}
                    />
                  ))}

                  {masterAllDelivered && (
                    <div style={{ background: isLight ? '#f0fdf4' : 'rgba(34,197,94,0.08)', border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(34,197,94,0.2)'}`, borderRadius: 14, padding: '1rem', marginBottom: '1rem', textAlign: 'center' }}>
                      <CheckCircle style={{ width: 32, height: 32, color: '#22c55e', margin: '0 auto 0.75rem' }} />
                      <div style={{ fontWeight: 800, color: '#22c55e', marginBottom: '0.5rem', fontSize: '0.9rem' }}>تم توصيل جميع طلبياتك ✓</div>
                      <Link to="/my-orders" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', borderRadius: 10, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', fontFamily: 'Tajawal, sans-serif' }}>
                        <Star style={{ width: 14, height: 14 }} />
                        قيّم طلباتك
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* ── Legacy single order fallback ── */}
              {activeSingleOrder && (
                <div>
                  <div style={{ background: 'linear-gradient(135deg,#0070c8,#00B0FF)', borderRadius: 16, padding: '1.25rem', marginBottom: '1.25rem', color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Car style={{ width: 18, height: 18 }} />
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>الطلب النشط</span>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem', letterSpacing: 1 }}>{activeSingleOrder.id}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: '0.75rem' }}>
                      {activeSingleOrder.items.slice(0, 2).map((item: any, i: number) => (
                        <span key={i}>{item.product?.name}{i < Math.min(activeSingleOrder.items.length, 2) - 1 ? '، ' : ''}</span>
                      ))}
                      {activeSingleOrder.items.length > 2 && ` و${activeSingleOrder.items.length - 2} منتجات أخرى`}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{formatPrice(activeSingleOrder.total)}</div>
                  </div>

                  <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: '1rem', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: textPrimary, marginBottom: '0.85rem' }}>مراحل الطلب</div>
                    <OrderTimeline
                      status={activeSingleOrder.status as any}
                      orderId={activeSingleOrder.id}
                      createdAt={activeSingleOrder.createdAt}
                      isLight={isLight}
                    />
                  </div>

                  {legacyIsDelivered && (
                    <div style={{ background: isLight ? '#f0fdf4' : 'rgba(34,197,94,0.08)', border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(34,197,94,0.2)'}`, borderRadius: 14, padding: '1rem', marginBottom: '1rem', textAlign: 'center' }}>
                      <CheckCircle style={{ width: 32, height: 32, color: '#22c55e', margin: '0 auto 0.75rem' }} />
                      <div style={{ fontWeight: 800, color: '#22c55e', marginBottom: '0.5rem', fontSize: '0.9rem' }}>تم توصيل طلبك بنجاح ✓</div>
                      <Link to="/my-orders" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', borderRadius: 10, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', fontFamily: 'Tajawal, sans-serif' }}>
                        <Star style={{ width: 14, height: 14 }} />
                        قيّم طلبك
                      </Link>
                    </div>
                  )}

                  {!legacyIsDelivered && (
                    <button
                      onClick={handleSimulateDelivery}
                      style={{ width: '100%', padding: '0.85rem', borderRadius: 12, background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)', border: `1px solid ${cardBorder}`, color: textMuted, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', marginBottom: '1rem', fontFamily: 'Tajawal, sans-serif' }}
                    >
                      محاكاة: تم التوصيل (للتجربة)
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: cardBg, borderRadius: 20, border: `1px dashed ${cardBorder}` }}>
              <ShoppingBag style={{ width: 40, height: 40, color: textMuted, margin: '0 auto 1.25rem', opacity: 0.5 }} />
              <div style={{ fontWeight: 700, color: textPrimary, fontSize: '1rem', marginBottom: '0.4rem' }}>لا يوجد طلب نشط حالياً</div>
              <div style={{ color: textMuted, fontSize: '0.82rem', marginBottom: '1.5rem' }}>يمكنك متابعة طلباتك السابقة من صفحة طلباتي</div>
              <Link to="/products" onClick={onClose} style={{ display: 'inline-flex', padding: '0.65rem 1.75rem', borderRadius: 11, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
                تسوق الآن
              </Link>
            </div>
          )}

          {/* Previous Orders */}
          {(previousMasters.length > 0 || previousOrders.length > 0) && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: textPrimary, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock style={{ width: 18, height: 18, color: '#00B0FF' }} />
                طلبات سابقة
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {previousMasters.map(mo => (
                  <Link key={mo.id} to={`/order-tracking?id=${mo.id}`} onClick={onClose} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: textPrimary, marginBottom: '0.2rem' }}>{mo.id}</div>
                        <div style={{ fontSize: '0.72rem', color: textMuted }}>{mo.subOrders.length} طلبية • {formatPrice(mo.grandTotal)}</div>
                      </div>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Truck style={{ width: 14, height: 14, color: textMuted }} />
                      </div>
                    </div>
                  </Link>
                ))}
                {previousOrders.map(o => (
                  <Link key={o.id} to={`/order-tracking?id=${o.id}`} onClick={onClose} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: textPrimary, marginBottom: '0.2rem' }}>{o.id}</div>
                        <div style={{ fontSize: '0.72rem', color: textMuted }}>{o.items.length} منتجات • {formatPrice(o.total)}</div>
                      </div>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Truck style={{ width: 14, height: 14, color: textMuted }} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Link */}
        <div style={{ padding: '1.25rem', borderTop: `1px solid ${border}`, textAlign: 'center', flexShrink: 0 }}>
          <Link to="/support" onClick={onClose} style={{ color: '#00B0FF', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <MessageCircle style={{ width: 14, height: 14 }} />
            هل تواجه مشكلة؟ تواصل مع الدعم
          </Link>
        </div>
      </div>
    </>
  );
}
