import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, MapPin, Truck, CreditCard, CheckCircle, Lock, Clock, UserX, Zap, Home } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { formatPrice, calculatePlatformFee, MERCHANT_DELIVERY_MAP, deliveryCompanies as allDeliveryCompanies } from '../data/mockData';
import { Order, OrderItem, Address, MasterOrder, SubOrder } from '../data/mockData';
import { api } from '../lib/api';
import OrderTimeline from '../components/OrderTimeline';
import SafeImage from '../components/ui/image';

const LIBYAN_CITIES = ['طرابلس', 'بنغازي', 'مصراتة', 'الزاوية', 'طبرق', 'زليتن', 'البيضاء', 'سبها', 'الخمس', 'الجبل الأخضر'];

const SHIPPING_CITIES = ['طرابلس', 'بنغازي', 'زليتن', 'مصراتة', 'سبها'];

const SHIPPING_RATES: Record<string, Record<string, number>> = {
  'طرابلس': { 'طرابلس': 8, 'بنغازي': 25, 'زليتن': 20, 'مصراتة': 15, 'سبها': 35 },
  'بنغازي': { 'طرابلس': 25, 'بنغازي': 8, 'زليتن': 30, 'مصراتة': 28, 'سبها': 40 },
  'زليتن': { 'طرابلس': 20, 'بنغازي': 30, 'زليتن': 6, 'مصراتة': 12, 'سبها': 38 },
  'مصراتة': { 'طرابلس': 15, 'بنغازي': 28, 'زليتن': 12, 'مصراتة': 6, 'سبها': 36 },
  'سبها': { 'طرابلس': 35, 'بنغازي': 40, 'زليتن': 38, 'مصراتة': 36, 'سبها': 8 },
};

function getStoreCity(address: string): string {
  for (const city of SHIPPING_CITIES) {
    if (address?.includes(city)) return city;
  }
  return 'طرابلس';
}


function CityDropdown({ value, onChange, isLight }: { value: string; onChange: (v: string) => void; isLight?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const dropdownBg = isLight ? '#ffffff' : '#0d1526';
  const dropdownColor = isLight ? '#1e293b' : '#e0f2fe';
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="input-field"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', width: '100%', textAlign: 'right', gap: '0.5rem' }}>
        <span style={{ flex: 1 }}>{value || 'اختر المدينة'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, left: 0, zIndex: 50, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid rgba(0,112,200,0.2)', maxHeight: 240, overflowY: 'auto', background: dropdownBg, color: dropdownColor }}>
          {LIBYAN_CITIES.map(city => (
            <button key={city} type="button" onClick={() => { onChange(city); setOpen(false); }}
              style={{ display: 'block', width: '100%', padding: '0.65rem 1rem', background: value === city ? 'rgba(0,112,200,0.15)' : 'transparent', color: value === city ? '#00B0FF' : dropdownColor, border: 'none', cursor: 'pointer', textAlign: 'right', fontFamily: 'Tajawal, sans-serif', fontSize: '0.9rem', fontWeight: value === city ? 700 : 400, transition: 'background 0.1s' }}
              onMouseEnter={e => { if (value !== city) e.currentTarget.style.background = isLight ? 'rgba(0,112,200,0.06)' : 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (value !== city) e.currentTarget.style.background = 'transparent'; }}>
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const COOLDOWN_MS = 30 * 60 * 1000;

function canPlaceOrder(userId: string): { ok: boolean; remainingMins: number } {
  const last = localStorage.getItem(`last_order_${userId}`);
  if (!last) return { ok: true, remainingMins: 0 };
  const elapsed = Date.now() - parseInt(last);
  if (elapsed >= COOLDOWN_MS) return { ok: true, remainingMins: 0 };
  return { ok: false, remainingMins: Math.ceil((COOLDOWN_MS - elapsed) / 60000) };
}

function recordOrder(userId: string) {
  localStorage.setItem(`last_order_${userId}`, Date.now().toString());
}

export default function CheckoutPage() {
  const { cart, getCartTotal, clearCart, addOrder, addMasterOrder, user, showToastMessage, pushMerchantNotification, pushDeliveryNotification, masterOrders, orders } = useStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [deliveryCompanies, setDeliveryCompanies] = useState<any[]>([]);
  const [address, setAddress] = useState<Address>({ id: '1', label: 'المنزل', city: '', district: '', street: '', building: '', floor: '', isDefault: true });
  const [selectedDelivery, setSelectedDelivery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  useEffect(() => {
    api.getDeliveryCompanies().then(companies => {
      setDeliveryCompanies(companies);
      const primaryMerchantId = cart[0]?.selectedStore?.id || cart[0]?.product?.merchantId;
      let assignedCompanyId: string | null = null;
      if (primaryMerchantId) {
        try { const saved = localStorage.getItem(`delivery_rates_${primaryMerchantId}`); if (saved) { assignedCompanyId = JSON.parse(saved).companyId || null; } } catch {}
        if (!assignedCompanyId) { assignedCompanyId = MERCHANT_DELIVERY_MAP[primaryMerchantId] || null; }
      }
      if (assignedCompanyId && companies.find((c: any) => c.id === assignedCompanyId)) {
        setSelectedDelivery(assignedCompanyId);
      }
    }).catch(() => {});
  }, []);

  const subtotal = getCartTotal();

  // شركة التوصيل المختارة للخطوة 2
  const deliveryCompany = deliveryCompanies.find(c => c.id === selectedDelivery);

  // حساب رسوم الشحن لكل متجر على حدة
  const shippingBreakdown = useMemo(() => {
    const storeMap = new Map<string, { storeName: string; storeCity: string; fee: number; companyId: string | null; companyName: string | null }>();
    for (const item of cart) {
      const storeId = item.selectedStore.id;
      if (!storeMap.has(storeId)) {
        const storeCity = getStoreCity(item.selectedStore.address || '');
        const rates = SHIPPING_RATES[storeCity] || SHIPPING_RATES['طرابلس'];
        const fee = rates[address.city] ?? rates['طرابلس'] ?? 20;
        // شركة التوصيل المخصصة لهذا المتجر
        let dcId: string | null = null;
        try { const saved = localStorage.getItem(`delivery_rates_${storeId}`); if (saved) { dcId = JSON.parse(saved).companyId || null; } } catch {}
        if (!dcId) { dcId = MERCHANT_DELIVERY_MAP[storeId] || null; }
        const dc = dcId ? allDeliveryCompanies.find(c => c.id === dcId) ?? null : null;
        storeMap.set(storeId, { storeName: item.selectedStore.storeName, storeCity, fee, companyId: dcId, companyName: dc?.name ?? null });
      }
    }
    return Array.from(storeMap.values());
  }, [cart, address.city]);

  const totalShipping = shippingBreakdown.reduce((s, b) => s + b.fee, 0);
  const deliveryFee = totalShipping;
  const total = subtotal + deliveryFee;
  const [priceAnimKey, setPriceAnimKey] = React.useState(0);
  React.useEffect(() => { setPriceAnimKey(k => k + 1); }, [selectedDelivery, deliveryFee]);

  const handlePlaceOrder = async () => {
    if (!address.city || !address.district || !address.street) {
      showToastMessage('يرجى ملء جميع حقول العنوان', 'error');
      return;
    }
    if (!selectedDelivery || !deliveryCompany) {
      showToastMessage('هذا المتجر لم يحدد شركة توصيل — لا يمكن إتمام الطلب', 'error');
      return;
    }
    if (!user) return;
    // ── منع الدفع عند وجود طلبية جارية ──────────────────────────────────
    if (user.role === 'customer') {
      const hasActiveMaster = masterOrders.some((mo: any) =>
        mo.customerId === user.id &&
        mo.subOrders.some((sub: any) =>
          sub.status !== 'delivered' && sub.status !== 'cancelled'
        )
      );
      const hasActiveSingle = orders.some((o: any) =>
        o.customerId === user.id &&
        o.status !== 'delivered' &&
        o.status !== 'cancelled'
      );
      if (hasActiveMaster || hasActiveSingle) {
        showToastMessage(
          'لا يمكنك تقديم طلب جديد — لديك طلبية جارية لم يتم استلامها بعد. يمكنك الشراء مجدداً بعد استلام طلبيتك الحالية.',
          'error',
          6000
        );
        return;
      }
    }
    // حماية الحد الأقصى 3 مجموعات (آخر خط دفاع — المجموعة = متجر + شركة توصيل)
    const merchantGroups = new Map<string, boolean>();
    cart.forEach(item => {
      const dcId = MERCHANT_DELIVERY_MAP[item.selectedStore.id] || 'unknown';
      merchantGroups.set(`${item.selectedStore.id}|${dcId}`, true);
    });
    if (merchantGroups.size > 3) {
      showToastMessage('⚠️ الحد الأقصى 3 محلات مختلفة في الطلب الواحد', 'error', 5000);
      return;
    }
    const cooldown = canPlaceOrder(user.id);
    if (!cooldown.ok) {
      showToastMessage(`يرجى الانتظار ${cooldown.remainingMins} دقيقة قبل تقديم طلب جديد`, 'error');
      return;
    }
    setIsProcessing(true);
    const masterOrderId = `ORD-${Date.now()}`;

    // تجميع عناصر السلة حسب المتجر + شركة التوصيل (مفتاح مركّب)
    const merchantMap = new Map<string, { merchant: any; items: OrderItem[]; shippingFee: number; companyId: string; companyName: string }>();
    for (const item of cart) {
      const storeId = item.selectedStore.id;
      const breakdown = shippingBreakdown.find(b => b.storeName === item.selectedStore.storeName);
      const fee = breakdown?.fee ?? deliveryFee;
      const dcId = breakdown?.companyId || selectedDelivery || MERCHANT_DELIVERY_MAP[storeId] || '';
      const dcName = breakdown?.companyName || deliveryCompany?.name || '';
      const groupKey = `${storeId}|${dcId}`;
      if (!merchantMap.has(groupKey)) {
        merchantMap.set(groupKey, {
          merchant: item.selectedStore,
          items: [],
          shippingFee: fee,
          companyId: dcId,
          companyName: dcName,
        });
      }
      merchantMap.get(groupKey)!.items.push({
        product: item.product,
        quantity: item.quantity,
        store: item.selectedStore,
        price: item.product.price,
        deliveryType: item.deliveryType || 'home',
      });
    }

    // إنشاء SubOrder لكل متجر
    const subOrders: SubOrder[] = Array.from(merchantMap.values()).map((group, idx) => {
      const subSubtotal = group.items.reduce((s, i) => s + i.price * i.quantity, 0);
      return {
        id: `${masterOrderId}-S${idx + 1}`,
        merchantId: group.merchant.id,
        merchantName: group.merchant.storeName,
        deliveryCompanyId: group.companyId,
        deliveryCompanyName: group.companyName,
        items: group.items,
        subtotal: subSubtotal,
        deliveryFee: group.shippingFee,
        total: subSubtotal + group.shippingFee,
        status: 'pending' as const,
      };
    });

    const masterOrder: MasterOrder = {
      id: masterOrderId,
      customerId: user.id,
      customerName: user.name,
      subOrders,
      shippingAddress: address,
      totalSubtotal: subtotal,
      totalDeliveryFee: deliveryFee,
      grandTotal: total,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const orderItems: OrderItem[] = cart.map(item => ({ product: item.product, quantity: item.quantity, store: item.selectedStore, price: item.product.price }));
    const order: Order = {
      id: masterOrderId,
      customerId: user.id,
      customerName: user.name,
      items: orderItems,
      subtotal,
      platformFee: 0,
      deliveryFee,
      deliveryCompanyFee: 0,
      merchantRevenue: subtotal,
      total,
      status: 'pending',
      deliveryCompany: deliveryCompany?.name,
      deliveryCompanyId: deliveryCompany?.id,
      merchantId: cart[0]?.selectedStore?.id || cart[0]?.product?.merchantId || '',
      shippingAddress: address,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    try {
      await api.createOrder(order);
      addMasterOrder(masterOrder);
      addOrder(order);
      recordOrder(user.id);
      // إرسال إشعار لكل متجر وشركة توصيل
      const notifiedDelivery = new Set<string>();
      for (const sub of subOrders) {
        pushMerchantNotification('طلب جديد 🔔', `تم استلام طلب ${sub.id} بقيمة ${formatPrice(sub.total)}`, sub.merchantId);
        if (sub.deliveryCompanyId && !notifiedDelivery.has(sub.deliveryCompanyId)) {
          notifiedDelivery.add(sub.deliveryCompanyId);
          pushDeliveryNotification('طلب توصيل جديد 🚚', `طلب ${sub.id} جاهز للاستلام — ${address.city}، ${address.district}`, sub.deliveryCompanyId);
        }
      }
      clearCart();
      setPlacedOrder(order);
      showToastMessage('أرسلنا طلبك بنجاح', 'success');
    } catch {
      showToastMessage('حدث خطأ، حاول مجدداً', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div style={{ textAlign: 'center', maxWidth: 420, padding: '2rem' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid #dbeafe' }}>
            <Lock style={{ width: 38, height: 38, color: '#2563eb' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0d2a4a', marginBottom: '0.75rem' }}>سجل الدخول لإتمام الطلب</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.7 }}>يجب تسجيل الدخول كعميل لإتمام عملية الشراء والتتبع.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: 12, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
              <Zap style={{ width: 16, height: 16 }} />
              تسجيل الدخول
            </Link>
            <Link to="/cart" style={{ padding: '0.75rem 1.25rem', borderRadius: 12, border: '1px solid #e5e7eb', color: '#6b7280', fontWeight: 600, textDecoration: 'none' }}>
              العودة للسلة
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== 'customer') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div style={{ textAlign: 'center', maxWidth: 420, padding: '2rem' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid #fde68a' }}>
            <UserX style={{ width: 38, height: 38, color: '#d97706' }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0d2a4a', marginBottom: '0.75rem' }}>خدمة الطلب للعملاء فقط</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.7 }}>هذه الخدمة متاحة للعملاء المسجلين فقط. حسابك الحالي لا يملك صلاحية الشراء.</p>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: 12, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
            <Zap style={{ width: 16, height: 16 }} />
            الصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && !placedOrder) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">سلتك فارغة</h2>
        <Link to="/products" className="btn-primary">تصفح المنتجات</Link>
      </div>
    </div>
  );

  if (placedOrder) return (
    <div className="min-h-screen bg-background py-12" dir="rtl">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">أرسلنا طلبك بنجاح</h1>
          <p className="text-muted">رقم الطلب: <span className="font-mono font-bold text-primary">{placedOrder.id}</span></p>
        </div>

        <OrderTimeline status={placedOrder.status as any} orderId={placedOrder.id} createdAt={placedOrder.createdAt} isLight={isLight} />

        <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
          <h3 className="font-bold text-lg mb-4">ملخص الطلب</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">المجموع الفرعي</span><span className="font-medium">{formatPrice(placedOrder.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted">رسوم التوصيل</span><span className="font-medium">{formatPrice(placedOrder.deliveryFee)}</span></div>
{(() => {
              let savedMasters: any[] = [];
              try { savedMasters = JSON.parse(localStorage.getItem('masterOrders') || '[]'); } catch {}
              const master = savedMasters.find((mo: any) => mo.id === placedOrder.id);
              const subs = master?.subOrders || [];
              if (subs.length === 0) {
                if (!placedOrder.deliveryCompany) return null;
                return (
                  <div style={{ borderRadius: 8, background: '#f0f7ff', border: '1px solid #bfdbfe', padding: '0.5rem 0.75rem', marginTop: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#1d4ed8', fontWeight: 700 }}>
                      <span>{'🚚'}</span> <span>{placedOrder.deliveryCompany}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#15803d', fontWeight: 700, marginTop: '0.25rem' }}>
                      <span>{'🏠'}</span> <span>نوع التوصيل: للمنزل</span>
                    </div>
                  </div>
                );
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.3rem' }}>
                  {subs.map((sub: any, i: number) => {
                    const firstItem = sub.items?.[0];
                    const cartItem = cart.find((c: any) => c.selectedStore.id === sub.merchantId);
                    const deliveryType = cartItem?.deliveryType || firstItem?.deliveryType || 'home';
                    const typeLabel = deliveryType === 'office' ? 'للمكتب' : 'للمنزل';
                    const typeIcon = deliveryType === 'office' ? '🏢' : '🏠';
                    return (
                      <div key={i} style={{ borderRadius: 8, background: '#f0f7ff', border: '1px solid #bfdbfe', padding: '0.5rem 0.75rem' }}>
                        {subs.length > 1 && (
                          <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, marginBottom: '0.2rem' }}>
                            <span>{'🏪'}</span> {sub.merchantName}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#1d4ed8', fontWeight: 700 }}>
                          <span>{'🚚'}</span> <span>{sub.deliveryCompanyName || 'غير محدد'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#15803d', fontWeight: 700, marginTop: '0.25rem' }}>
                          <span>{typeIcon}</span> <span>نوع التوصيل: {typeLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <div className="border-t pt-2 flex justify-between font-bold text-base"><span>الإجمالي</span><span className="text-primary">{formatPrice(placedOrder.total)}</span></div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link to="/tracking" className="w-full btn-primary text-center flex items-center justify-center gap-2">
            <Car className="w-5 h-5" />
            تتبع طلبك الآن
          </Link>
          <div className="flex gap-3">
            <Link to="/products" className="flex-1 btn-outline text-center">متابعة التسوق</Link>
            <Link to="/" className="flex-1 btn-outline text-center">الصفحة الرئيسية</Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-4 mb-8">
          {[{ num: 1, label: 'العنوان' }, { num: 2, label: 'التوصيل' }, { num: 3, label: 'الدفع' }].map((s, i) => (
            <React.Fragment key={s.num}>
              <div className={`flex items-center gap-2 ${step >= s.num ? 'text-primary' : 'text-muted'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= s.num ? 'bg-primary text-white' : 'bg-gray-200 text-muted'}`}>
                  {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                </div>
                <span className="hidden sm:inline font-medium">{s.label}</span>
              </div>
              {i < 2 && <div className={`w-12 h-0.5 ${step > s.num ? 'bg-primary' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><MapPin className="w-6 h-6 text-primary" />بيانات الشحن</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">المدينة *</label>
                    <CityDropdown value={address.city} onChange={city => setAddress({ ...address, city })} isLight={isLight} />
                  </div>
                  <div><label className="block text-sm font-medium mb-2">الحي *</label><input type="text" value={address.district} onChange={e => setAddress({ ...address, district: e.target.value })} className="input-field" placeholder="الحي" /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium mb-2">الشارع *</label><input type="text" value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} className="input-field" placeholder="اسم الشارع" /></div>
                  <div><label className="block text-sm font-medium mb-2">المبنى</label><input type="text" value={address.building} onChange={e => setAddress({ ...address, building: e.target.value })} className="input-field" placeholder="رقم المبنى" /></div>
                  <div><label className="block text-sm font-medium mb-2">الطابق</label><input type="text" value={address.floor} onChange={e => setAddress({ ...address, floor: e.target.value })} className="input-field" placeholder="رقم الطابق" /></div>
                </div>
                <button onClick={() => setStep(2)} className="w-full btn-secondary mt-6" disabled={!address.city || !address.district || !address.street}>التالي</button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Truck className="w-6 h-6 text-primary" />اختيار شركة التوصيل</h2>
                <div className="space-y-3">
                  {deliveryCompanies.map(company => (
                    <button key={company.id} onClick={() => setSelectedDelivery(company.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedDelivery === company.id ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-accent/50'}`}>
                      <div className="flex items-center gap-4">
                        <SafeImage src={company.logo} alt={company.name} className="w-12 h-12 rounded-xl object-cover" />
                        <div className="text-right"><p className="font-bold">{company.name}</p><p className="text-sm text-muted">{company.estimatedDays}</p></div>
                      </div>
                      <div className="text-left"><p className="font-bold">{formatPrice(deliveryFee)}</p><p className="text-xs text-green-600">بدون عمولة إضافية</p></div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(1)} className="btn-outline">السابق</button>
                  <button onClick={() => { if (!selectedDelivery) { showToastMessage('هذا المتجر لم يحدد شركة توصيل بعد، يُرجى التواصل مع الدعم', 'error'); return; } setStep(3); }} className="flex-1 btn-secondary">التالي</button>                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><CreditCard className="w-6 h-6 text-primary" />طريقة الدفع</h2>
                <div className="space-y-3 mb-6">
                  <div className="p-4 border-2 border-accent bg-accent/5 rounded-xl">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="payment" defaultChecked className="w-5 h-5 text-accent" />
                      <div><p className="font-bold">الدفع عند الاستلام</p><p className="text-sm text-muted">ادفع نقداً عند استلام طلبك</p></div>
                    </label>
                  </div>
                </div>

                {/* Cooldown notice */}
                {(() => {
                  const check = canPlaceOrder(user.id);
                  return !check.ok ? (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: 10, background: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <Clock style={{ width: 16, height: 16, color: '#d97706', flexShrink: 0 }} />
                      <p style={{ color: '#92400e', fontSize: '0.875rem', margin: 0 }}>يرجى الانتظار <strong>{check.remainingMins} دقيقة</strong> قبل تقديم طلب جديد (حد 1 طلب كل 30 دقيقة)</p>
                    </div>
                  ) : null;
                })()}

                <div className="p-4 bg-green-50 rounded-xl mb-6">
                  <p className="text-sm text-green-800"><strong>ملاحظة:</strong> تسوق بثقة — لا توجد رسوم أو عمولات إضافية على طلبك.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="btn-outline">السابق</button>
                  <button onClick={handlePlaceOrder} disabled={isProcessing || !canPlaceOrder(user.id).ok || !selectedDelivery} className="flex-1 btn-secondary flex items-center justify-center gap-2">
                    {isProcessing ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span><span>جاري المعالجة...</span></> : <><span>تأكيد الطلب</span><CheckCircle className="w-5 h-5" /></>}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-28">
              <h3 className="font-bold text-lg mb-4">ملخص الطلب</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {cart.map(item => (
                  <div key={`${item.product.id}-${item.selectedStore.id}`} className="flex gap-3">
                    <SafeImage src={item.product.images[0]} alt={item.product.name} className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted">x{item.quantity}</span>
                        <span className="font-medium text-sm">{formatPrice(item.product.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted">المجموع الفرعي</span><span>{formatPrice(subtotal)}</span></div>
                {/* رسوم الشحن لكل متجر */}
                {shippingBreakdown.length > 1 ? (
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span className="text-muted">رسوم الشحن (حسب المحل)</span></div>
                    {shippingBreakdown.map((b, i) => (
                      <div key={i} className="flex justify-between text-xs px-2 py-1 rounded-lg mb-1" style={{ background: 'rgba(0,176,255,0.05)' }}>
                        <span className="text-muted">{b.storeName}</span>
                        <span style={{ fontWeight: 600, color: '#2563eb' }}>{formatPrice(b.fee)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm"><span className="text-muted">إجمالي الشحن</span><span key={priceAnimKey} className="price-animate">{formatPrice(deliveryFee)}</span></div>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm"><span className="text-muted">رسوم الشحن</span><span key={priceAnimKey} className="price-animate">{formatPrice(deliveryFee)}</span></div>
                )}
                {/* شركة/شركات التوصيل */}
                {shippingBreakdown.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem' }}>
                    {shippingBreakdown.map((b, i) => {
                      const dcId = b.companyId || selectedDelivery || MERCHANT_DELIVERY_MAP[b.storeName] || '';
                      const dcName = b.companyName || (dcId ? allDeliveryCompanies.find((c: any) => c.id === dcId)?.name : null) || 'غير محددة';
                      return (
                        <div key={i} style={{ borderRadius: 8, background: isLight ? '#f0f7ff' : 'rgba(0,176,255,0.07)', border: `1px solid ${isLight ? '#bfdbfe' : 'rgba(0,176,255,0.15)'}`, padding: '0.4rem 0.6rem' }}>
                          {shippingBreakdown.length > 1 && (
                            <div style={{ fontSize: '0.7rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.5)', fontWeight: 600, marginBottom: '0.15rem' }}>
                              🏪 {b.storeName}
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: isLight ? '#1d4ed8' : '#60a5fa', fontWeight: 700 }}>
                            🚚 <span>{dcName}</span>
                          </div>
                          {(() => { const storeItem = cart.find((c: any) => c.selectedStore.storeName === b.storeName); const dt = storeItem?.deliveryType || 'home'; const typeLabel = dt === 'office' ? 'للمكتب' : 'للمنزل'; const typeIcon = dt === 'office' ? '🏢' : '🏠'; return ( <span style={{ fontSize: '0.78rem', color: isLight ? '#15803d' : '#4ade80', fontWeight: 700 }}> {typeIcon} <span>نوع التوصيل: {typeLabel}</span> </span> ); })()}
                        </div>
                      );
                    })}
                  </div>
                ) : deliveryCompany ? (
                  <div style={{ borderRadius: 8, background: isLight ? '#f0f7ff' : 'rgba(0,176,255,0.07)', border: `1px solid ${isLight ? '#bfdbfe' : 'rgba(0,176,255,0.15)'}`, padding: '0.4rem 0.6rem', marginTop: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: isLight ? '#1d4ed8' : '#60a5fa', fontWeight: 700 }}>
                      🚚 <span>{deliveryCompany.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: isLight ? '#15803d' : '#4ade80', fontWeight: 700, marginTop: '0.2rem' }}>
                      🏠 <span>نوع التوصيل: للمنزل</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, marginTop: '-0.15rem' }}>
                    ⚠️ لا توجد شركة توصيل لهذا المتجر
                  </div>
                )}


                <div className="border-t pt-2 flex justify-between font-bold"><span>الإجمالي</span><span key={`total-${priceAnimKey}`} className="text-xl text-primary price-animate">{formatPrice(total)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
