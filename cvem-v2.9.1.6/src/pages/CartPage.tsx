import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Trash2, Minus, Plus, ArrowLeft,
  ShoppingBag, MapPin, Truck, HeadphonesIcon, Home, ChevronDown,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { formatPrice, deliveryCompanies, MERCHANT_DELIVERY_MAP } from '../data/mockData';
import SafeImage from '../components/ui/image';

const CITIES = ['طرابلس', 'بنغازي', 'زليتن', 'مصراتة', 'سبها'];

const SHIPPING_RATES: Record<string, Record<string, number>> = {
  'طرابلس': { 'طرابلس': 8, 'بنغازي': 25, 'زليتن': 20, 'مصراتة': 15, 'سبها': 35 },
  'بنغازي': { 'طرابلس': 25, 'بنغازي': 8, 'زليتن': 30, 'مصراتة': 28, 'سبها': 40 },
  'زليتن': { 'طرابلس': 20, 'بنغازي': 30, 'زليتن': 6, 'مصراتة': 12, 'سبها': 38 },
  'مصراتة': { 'طرابلس': 15, 'بنغازي': 28, 'زليتن': 12, 'مصراتة': 6, 'سبها': 36 },
  'سبها': { 'طرابلس': 35, 'بنغازي': 40, 'زليتن': 38, 'مصراتة': 36, 'سبها': 8 },
};

function getStoreCity(address: string): string {
  for (const city of CITIES) {
    if (address?.includes(city)) return city;
  }
  return 'طرابلس';
}

function CityDropdown({ value, onChange, isLight }: { value: string; onChange: (v: string) => void; isLight: boolean }) {
  const [open, setOpen] = React.useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const bg      = isLight ? '#f0f7ff' : 'rgba(8,15,34,0.9)';
  const border  = isLight ? 'rgba(0,112,200,0.25)' : 'rgba(0,176,255,0.3)';
  const txtMain = isLight ? '#0d2a4a' : '#e0f2fe';
  const optBg   = isLight ? '#ffffff' : '#0a1628';
  const optHov  = isLight ? '#f0f7ff' : 'rgba(0,176,255,0.08)';
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 10, border: `1.5px solid ${open ? '#00b0ff' : border}`, background: bg, color: txtMain, fontFamily: 'Tajawal, sans-serif', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', outline: 'none', transition: 'border-color 0.2s' }}
      >
        <span>{value}</span>
        <ChevronDown style={{ width: 16, height: 16, color: '#00b0ff', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, left: 0, background: optBg, border: `1.5px solid ${border}`, borderRadius: 10, zIndex: 50, boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.12)' : '0 8px 24px rgba(0,176,255,0.15)', overflow: 'hidden' }}>
          {CITIES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => { onChange(c); setOpen(false); }}
              style={{ width: '100%', padding: '0.6rem 1rem', textAlign: 'right', background: c === value ? optHov : 'transparent', color: c === value ? '#00b0ff' : txtMain, fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', fontWeight: c === value ? 700 : 400, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = optHov; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = c === value ? optHov : 'transparent'; }}
            >{c}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, getCartTotal } = useStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const [deliveryCity, setDeliveryCity] = useState('طرابلس');
  const [pulsingShipping, setPulsingShipping] = useState(false);

  useEffect(() => {
    setPulsingShipping(true);
    const timer = setTimeout(() => setPulsingShipping(false), 1000);
    return () => clearTimeout(timer);
  }, [deliveryCity]);

  const subtotal = getCartTotal();
  const uniqueStoreCount = new Set(cart.map(item => {
    const dcId = MERCHANT_DELIVERY_MAP[item.selectedStore.id] || 'unknown';
    return `${item.selectedStore.id}|${dcId}`;
  })).size;

  const shippingBreakdown = useMemo(() => {
    const storeMap = new Map<string, { storeId: string; storeName: string; storeCity: string; fee: number; companyName: string | null }>();
    for (const item of cart) {
      const storeId = item.selectedStore.id;
      if (!storeMap.has(storeId)) {
        const storeCity = getStoreCity(item.selectedStore.address || '');
        const rates = SHIPPING_RATES[storeCity] || SHIPPING_RATES['طرابلس'];
        const fee = rates[deliveryCity] ?? 20;
        let dcId: string | null = null;
        try { const saved = localStorage.getItem(`delivery_rates_${storeId}`); if (saved) { dcId = JSON.parse(saved).companyId || null; } } catch {}
        if (!dcId) { dcId = MERCHANT_DELIVERY_MAP[storeId] || null; }
        const dc = dcId ? deliveryCompanies.find(c => c.id === dcId) ?? null : null;
        storeMap.set(storeId, { storeId, storeName: item.selectedStore.storeName, storeCity, fee, companyName: dc?.name ?? null });
      }
    }
    return Array.from(storeMap.values());
  }, [cart, deliveryCity]);

  const totalShipping = shippingBreakdown.reduce((s, b) => s + b.fee, 0);
  const total = subtotal + totalShipping;

  // show per-store delivery companies instead of just primary
  const storeDeliveryCompanies = shippingBreakdown.filter(b => b.companyName);

  const bgPage = isLight ? '#f8fafc' : 'transparent';
  const cardBg = isLight ? '#fff' : 'rgba(13,21,38,0.95)';
  const cardBorder = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)';
  const textPrimary = isLight ? '#0d2a4a' : '#e0f2fe';
  const textMuted = isLight ? '#6b7280' : 'rgba(224,242,254,0.55)';

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: bgPage }}>
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-16 h-16 text-muted" />
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: textPrimary }}>سلتك فارغة</h2>
          <p className="text-muted mb-8">يبدو أنك لم تضف أي منتجات إلى سلتك بعد. تصفح منتجاتنا وابدأ التسوق!</p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            <span>تصفح المنتجات</span>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" style={{ background: bgPage }}>
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8" style={{ color: textPrimary }}>سلة التسوق</h1>

        {/* تحذير الحد الأقصى للمتاجر */}
        {uniqueStoreCount >= 3 && (
          <div style={{
            background: '#fef9c3', border: '1px solid #fde047', borderRadius: 12,
            padding: '0.75rem 1rem', marginBottom: '1.25rem',
            fontSize: '0.875rem', color: '#854d0e', fontFamily: 'Tajawal, sans-serif',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
            <span>وصلت للحد الأقصى (3 محلات). لا يمكن إضافة منتجات من محل رابع في هذا الطلب.</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={`${item.product.id}-${item.selectedStore.id}`}
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
                className="rounded-2xl p-4 shadow-sm">
                <div className="flex gap-4">
                  <Link to={`/products/${item.product.id}`}>
                    <SafeImage src={item.product.images[0]} alt={item.product.name} className="w-24 h-24 rounded-xl object-cover" />
                  </Link>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <Link to={`/products/${item.product.id}`} className="font-bold hover:text-primary transition-colors" style={{ color: textPrimary }}>
                          {item.product.name}
                        </Link>
                        <p className="text-sm mt-1" style={{ color: textMuted }}>{item.product.brand}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      {item.selectedStore.logo && (
                        <SafeImage src={item.selectedStore.logo} alt={item.selectedStore.storeName} className="w-6 h-6 rounded-full object-cover" />
                      )}
                      <span className="text-sm" style={{ color: textMuted }}>{item.selectedStore.storeName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {getStoreCity(item.selectedStore.address || '')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border rounded-lg" style={{ borderColor: cardBorder }}>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-2 hover:bg-gray-100 transition-colors">
                          <Minus className="w-4 h-4" style={{ color: textPrimary }} />
                        </button>
                        <span className="px-4 font-medium" style={{ color: textPrimary }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-2 hover:bg-gray-100 transition-colors">
                          <Plus className="w-4 h-4" style={{ color: textPrimary }} />
                        </button>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-primary">{formatPrice(item.product.price * item.quantity)}</p>
                        {item.quantity > 1 && <p className="text-sm" style={{ color: textMuted }}>{formatPrice(item.product.price)} للقطعة</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Contact Support Button */}
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <HeadphonesIcon style={{ width: 20, height: 20, color: '#2563eb' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: textPrimary }}>هل لديك سؤال عن طلبك؟</span>
              </div>
              <Link to="/support" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', borderRadius: 10, background: '#2563eb',
                color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem',
              }}>
                <HeadphonesIcon style={{ width: 16, height: 16 }} />
                تواصل مع الدعم
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}` }} className="rounded-2xl p-6 shadow-sm sticky top-28">
              <h3 className="font-bold text-lg mb-4" style={{ color: textPrimary }}>ملخص الطلب</h3>

              {/* City Selector */}
              <div className="mb-5">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600, color: textPrimary, marginBottom: '0.5rem' }}>
                  <MapPin style={{ width: 16, height: 16, color: '#2563eb' }} />
                  مدينة التوصيل
                </label>
                <CityDropdown value={deliveryCity} onChange={setDeliveryCity} isLight={isLight} />
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between">
                  <span style={{ color: textMuted }}>المجموع الفرعي</span>
                  <span className="font-medium" style={{ color: textPrimary }}>{formatPrice(subtotal)}</span>
                </div>

                {/* Per-store shipping */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Truck style={{ width: 14, height: 14, color: '#2563eb' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: textMuted }}>رسوم الشحن (حسب المحل)</span>
                  </div>
                  {shippingBreakdown.map((b, i) => (
                    <div key={i} className="flex justify-between text-sm px-2 py-1 rounded-lg mb-1" style={{ background: isLight ? '#f0f7ff' : 'rgba(0,176,255,0.05)' }}>
                      <span style={{ color: textMuted, fontSize: '0.8rem' }}>{b.storeName} ({b.storeCity} ← {deliveryCity})</span>
                      <span style={{ fontWeight: 600, color: '#2563eb', fontSize: '0.8rem' }}>{formatPrice(b.fee)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between mt-1">
                    <span style={{ color: textMuted, fontSize: '0.875rem' }}>إجمالي الشحن</span>
                    <span className={`font-medium ${pulsingShipping ? 'animate-pulse' : ''}`} style={{ color: textPrimary }}>{formatPrice(totalShipping)}</span>
                  </div>
                  {/* شركات التوصيل — تحت إجمالي الشحن مباشرة */}
                  {storeDeliveryCompanies.length > 0 && (
                    <div style={{ marginTop: '0.4rem' }}>
                      {storeDeliveryCompanies.map((b, i) => {
                        const storeItem = cart.find((c: any) => c.selectedStore.id === b.storeId);
                        const currentType = storeItem?.deliveryType || 'home';
                        const typeLabel = currentType === 'office' ? 'للمكتب' : 'للمنزل';
                        const typeIcon = currentType === 'office' ? '🏢' : '🏠';
                        const typeColor = currentType === 'office' ? '#3b82f6' : '#22c55e';
                        return (
                          <div key={i} style={{ marginBottom: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', borderRadius: 8, background: isLight ? 'rgba(0,176,255,0.06)' : 'rgba(0,176,255,0.08)', border: `1px solid ${isLight ? 'rgba(0,176,255,0.2)' : 'rgba(0,176,255,0.25)'}`, marginBottom: '0.3rem' }}>
                              <Truck style={{ width: 14, height: 14, color: '#00b0ff', flexShrink: 0 }} />
                              <span style={{ fontSize: '0.78rem', color: '#00b0ff', fontWeight: 700 }}>
                                {storeDeliveryCompanies.length > 1 ? `${b.storeName}: ${b.companyName}` : `شركة التوصيل: ${b.companyName}`}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', borderRadius: 8, background: isLight ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.08)', border: `1px solid ${isLight ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                              <span style={{ fontSize: '0.78rem', color: typeColor, fontWeight: 700 }}>
                                {typeIcon} نوع التوصيل: {typeLabel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t pt-3 flex justify-between" style={{ borderColor: cardBorder }}>
                  <span className="font-bold" style={{ color: textPrimary }}>الإجمالي</span>
                  <span className="text-xl font-bold text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              <button onClick={() => navigate('/shipping-address')} className="w-full btn-secondary mb-3">
                إتمام الطلب
              </button>
              <Link to="/products" className="w-full btn-outline text-center block">
                متابعة التسوق
              </Link>

              <div className="mt-5 p-4 rounded-xl" style={{ background: isLight ? '#eff6ff' : 'rgba(37,99,235,0.08)', border: `1px solid ${isLight ? '#bfdbfe' : 'rgba(37,99,235,0.2)'}` }}>
                <h4 className="font-medium mb-2 text-primary" style={{ fontSize: '0.875rem' }}>معلومات التوصيل</h4>
                <ul className="text-sm space-y-1" style={{ color: textMuted }}>
                  <li>• الشحن يُحسب لكل محل على حدة</li>
                  <li>• التوصيل خلال 1-5 أيام عمل</li>
                  <li>• الدفع عند الاستلام متاح</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
