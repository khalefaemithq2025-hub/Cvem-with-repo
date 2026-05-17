import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Home, Briefcase, Plus, CheckCircle, Lock, UserX,
  Zap, Navigation, FileText, Tag, ChevronDown, ChevronUp, X,
  CreditCard, ShoppingBag,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { formatPrice, MERCHANT_DELIVERY_MAP, deliveryCompanies as allDeliveryCompanies } from '../data/mockData';
import { Order, OrderItem, Address, MasterOrder, SubOrder } from '../data/mockData';
import { supabaseConfigured } from '../lib/supabase';
import { api } from '../lib/api';


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

const COOLDOWN_MS = 30 * 60 * 1000;
function canPlaceOrder(userId: string) {
  const last = localStorage.getItem(`last_order_${userId}`);
  if (!last) return { ok: true, remainingMins: 0 };
  const elapsed = Date.now() - parseInt(last);
  if (elapsed >= COOLDOWN_MS) return { ok: true, remainingMins: 0 };
  return { ok: false, remainingMins: Math.ceil((COOLDOWN_MS - elapsed) / 60000) };
}
function recordOrder(userId: string) {
  localStorage.setItem(`last_order_${userId}`, Date.now().toString());
}

const MOCK_SAVED_LOCATIONS = [
  { id: 'home', icon: 'home', label: 'المنزل',  location: '32.8872° N, 13.1913° E', placeName: 'المنزل', description: 'منزل عائلة المختار يقع على اليمين من المدخل الرئيسي' },
  { id: 'work', icon: 'work', label: 'العمل',   location: '32.9022° N, 13.1802° E', placeName: 'مكتب',   description: 'مكتب الشركة الطابق الثالث — مبنى الإدارة' },
];

const MOCK_CUSTOMER = {
  location:    '32.8872° N, 13.1913° E',
  placeName:   'المنزل',
  description: 'منزل عائلة المختار يقع على اليمين من المدخل الرئيسي',
};

interface LocationEntry {
  id: string; icon: string; label: string;
  location: string; placeName: string; description: string;
}

export default function ShippingAddressPage() {
  const {
    cart, getCartTotal, clearCart, addOrder, addMasterOrder, user,
    showToastMessage, pushMerchantNotification, pushDeliveryNotification,
    setActiveOrderId,
  } = useStore();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLight = theme === 'light';

  const [placeName,  setPlaceName]  = useState(MOCK_CUSTOMER.placeName);
  const [location,   setLocation]   = useState(MOCK_CUSTOMER.location);
  const [description, setDescription] = useState(MOCK_CUSTOMER.description);
  const [isProcessing, setIsProcessing] = useState(false);


  const [showChangeLocation, setShowChangeLocation] = useState(false);
  const [savedLocations,     setSavedLocations]     = useState<LocationEntry[]>(MOCK_SAVED_LOCATIONS);
  const [showAddForm,        setShowAddForm]         = useState(false);
  const [newLoc,             setNewLoc]             = useState({ location: '', placeName: '', description: '' });
  const [newGeoLoading,      setNewGeoLoading]      = useState(false);

  const subtotal    = getCartTotal();

  // حساب رسوم الشحن لكل متجر على حدة (المدينة الافتراضية: طرابلس)
  const shippingBreakdown = useMemo(() => {
    const deliveryCity = 'طرابلس';
    const storeMap = new Map<string, { storeName: string; storeCity: string; fee: number; companyName: string | null }>();
    for (const item of cart) {
      const storeId = item.selectedStore.id;
      if (!storeMap.has(storeId)) {
        const storeCity = getStoreCity(item.selectedStore.address || '');
        const rates = SHIPPING_RATES[storeCity] || SHIPPING_RATES['طرابلس'];
        const fee = rates[deliveryCity] ?? 20;
        let dcId: string | null = null;
        try { const saved = localStorage.getItem(`delivery_rates_${storeId}`); if (saved) { dcId = JSON.parse(saved).companyId || null; } } catch {}
        if (!dcId) { dcId = MERCHANT_DELIVERY_MAP[storeId] || null; }
        const dc = dcId ? allDeliveryCompanies.find(c => c.id === dcId) ?? null : null;
        storeMap.set(storeId, { storeName: item.selectedStore.storeName, storeCity, fee, companyName: dc?.name ?? null });
      }
    }
    return Array.from(storeMap.values());
  }, [cart]);

  const deliveryFee = shippingBreakdown.reduce((s, b) => s + b.fee, 0);
  const total       = subtotal + deliveryFee;

  const bgPage     = isLight ? '#f0f7ff' : 'linear-gradient(135deg,#020817 0%,#0d2a4a 100%)';
  const cardBg     = isLight ? '#fff'    : 'rgba(13,21,38,0.97)';
  const cardBorder = isLight ? '#dbeafe' : 'rgba(0,176,255,0.18)';
  const textPrimary = isLight ? '#0d3a6e' : '#e0f2fe';
  const textMuted   = isLight ? '#6b7280' : 'rgba(224,242,254,0.55)';

  const inputStyle: React.CSSProperties = {
    width: '100%', borderRadius: 10, outline: 'none', fontFamily: 'Tajawal, sans-serif',
    fontSize: '0.95rem', padding: '0.7rem 0.9rem', boxSizing: 'border-box',
    color: textPrimary, background: isLight ? '#f8fcff' : '#080e1c',
    border: `1.5px solid ${isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)'}`,
    transition: 'border-color 0.2s',
  };

  const selectStyleLocked: React.CSSProperties = {
    borderRadius: 8, outline: 'none', fontFamily: 'Tajawal, sans-serif',
    fontSize: '0.82rem', padding: '0.35rem 0.6rem', cursor: 'not-allowed',
    color: textMuted, background: isLight ? '#f0f7ff' : '#080e1c',
    border: `1px solid ${isLight ? '#bfdbfe' : 'rgba(0,176,255,0.15)'}`,
    opacity: 0.75,
  };

  // ── Geolocation for add-location form ────────────────────────────────────
  const triggerGeolocation = (onSuccess: (coords: string) => void, onEnd: () => void) => {
    if (!navigator.geolocation) {
      showToastMessage('المتصفح لا يدعم تحديد الموقع', 'error');
      onEnd(); return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSuccess(`${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`);
        onEnd();
      },
      (err) => {
        if (err.code === err.POSITION_UNAVAILABLE) {
          window.alert('خدمة الموقع (GPS) معطّلة على جهازك.\nيرجى تفعيل GPS من إعدادات الجهاز ثم المحاولة مجدداً.');
        } else {
          showToastMessage('لا يمكن الحصول على موقعك، فعل الموقع الجغرافي في جهازك أولا', 'error', 4000);
        }
        onEnd();
      },
      { timeout: 10000 }
    );
  };

  const handleNewLocGeo = () => {
    setNewGeoLoading(true);
    triggerGeolocation((coords) => setNewLoc(p => ({ ...p, location: coords })), () => setNewGeoLoading(false));
  };

  const handleSelectSaved = (loc: LocationEntry) => {
    setPlaceName(loc.placeName);
    setLocation(loc.location);
    setDescription(loc.description);
    setShowChangeLocation(false);
    showToastMessage(`تم اختيار الموقع: ${loc.label}`, 'success');
  };

  const handleSaveNewLocation = () => {
    if (!newLoc.location || !newLoc.placeName) {
      showToastMessage('يرجى ملء الموقع واسم المكان', 'error'); return;
    }
    const entry: LocationEntry = { id: `loc-${Date.now()}`, icon: 'home', label: newLoc.placeName, ...newLoc };
    setSavedLocations(prev => [...prev, entry]);
    setPlaceName(entry.placeName);
    setLocation(entry.location);
    setDescription(entry.description);
    setShowAddForm(false);
    setNewLoc({ location: '', placeName: '', description: '' });
    setShowChangeLocation(false);
    showToastMessage('تم حفظ الموقع بنجاح', 'success');
  };

  // ── Order placement ───────────────────────────────────────────────────────
  const handleConfirmOrder = async () => {
    if (!placeName) { showToastMessage('يرجى تعبئة اسم المكان', 'error'); return; }
    if (!user) return;
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
    if (!cooldown.ok) { showToastMessage(`انتظر ${cooldown.remainingMins} دقيقة قبل طلب جديد`, 'error'); return; }
    setIsProcessing(true);
    try {
      const masterOrderId = `ORD-${Date.now()}`;
      const address: Address = {
        id: '1', label: placeName, city: 'طرابلس', district: placeName,
        street: description, building: '', floor: '', isDefault: true,
      };

      // تجميع عناصر السلة حسب المتجر + شركة التوصيل (مفتاح مركّب)
      const merchantMap = new Map<string, { merchant: any; items: OrderItem[]; shippingFee: number }>();
      for (const item of cart) {
        const storeId = item.selectedStore.id;
        let dcId = MERCHANT_DELIVERY_MAP[storeId] || '';
        try {
          const saved = localStorage.getItem(`delivery_rates_${storeId}`);
          if (saved) dcId = JSON.parse(saved).companyId || dcId;
        } catch {}
        const groupKey = `${storeId}|${dcId}`;
        const breakdown = shippingBreakdown.find(b => b.storeName === item.selectedStore.storeName);
        const fee = breakdown?.fee ?? 20;
        if (!merchantMap.has(groupKey)) {
          merchantMap.set(groupKey, {
            merchant: item.selectedStore,
            items: [],
            shippingFee: fee,
          });
        }
        merchantMap.get(groupKey)!.items.push({
          product: item.product,
          quantity: item.quantity,
          store: item.selectedStore,
          price: item.product.price,
        });
      }

      // إنشاء SubOrder لكل متجر
      const subOrders: SubOrder[] = Array.from(merchantMap.values()).map((group, idx) => {
        const merchantId = group.merchant.id;
        let dcId = MERCHANT_DELIVERY_MAP[merchantId] || '';
        try {
          const saved = localStorage.getItem(`delivery_rates_${merchantId}`);
          if (saved) { dcId = JSON.parse(saved).companyId || dcId; }
        } catch {}
        const dc = allDeliveryCompanies.find(c => c.id === dcId);
        const subSubtotal = group.items.reduce((s, i) => s + i.price * i.quantity, 0);
        return {
          id: `${masterOrderId}-S${idx + 1}`,
          merchantId,
          merchantName: group.merchant.storeName,
          deliveryCompanyId: dcId,
          deliveryCompanyName: dc?.name ?? '',
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

      // أيضاً إنشاء Order عادي للتوافق مع الكود القديم
      const primaryMerchantId = cart[0]?.selectedStore?.id || cart[0]?.product?.merchantId;
      let assignedDeliveryId: string | undefined;
      if (primaryMerchantId) {
        assignedDeliveryId = MERCHANT_DELIVERY_MAP[primaryMerchantId] || undefined;
      }
      const order: Order = {
        id: masterOrderId, customerId: user.id, customerName: user.name,
        items: cart.map(item => ({ product: item.product, quantity: item.quantity, store: item.selectedStore, price: item.product.price })),
        subtotal, platformFee: 0, deliveryFee,
        deliveryCompanyFee: 0, merchantRevenue: subtotal, total,
        status: 'pending', shippingAddress: address,
        deliveryCompanyId: assignedDeliveryId,
        merchantId: primaryMerchantId || '',
        createdAt: new Date(), updatedAt: new Date(),
      };

      if (supabaseConfigured) await api.createOrder(order);

      addMasterOrder(masterOrder);
      addOrder(order);
      recordOrder(user.id);
      setActiveOrderId(masterOrderId);

      // إرسال إشعار لكل متجر وشركة توصيل
      const notifiedDelivery = new Set<string>();
      for (const sub of subOrders) {
        pushMerchantNotification(
          'طلب جديد',
          `طلب ${sub.id} من ${user.name} — ${formatPrice(sub.total)}`,
          sub.merchantId
        );
        if (sub.deliveryCompanyId && !notifiedDelivery.has(sub.deliveryCompanyId)) {
          notifiedDelivery.add(sub.deliveryCompanyId);
          pushDeliveryNotification(
            'طلب توصيل جديد',
            `طلب ${sub.id} جاهز — ${placeName}: ${description || location}`,
            sub.deliveryCompanyId
          );
        }
      }

      clearCart();
      navigate('/tracking');
      showToastMessage('أرسلنا طلبك بنجاح', 'success');
    } catch (err: any) {
      showToastMessage(err?.message || 'حدث خطأ، حاول مجدداً', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: bgPage }} dir="rtl">
        <div style={{ textAlign: 'center', maxWidth: 420, padding: '2rem' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid #dbeafe' }}>
            <Lock style={{ width: 38, height: 38, color: '#2563eb' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: isLight ? '#0d2a4a' : '#e0f2fe', marginBottom: '0.75rem' }}>سجل الدخول لإتمام الطلب</h2>
          <p style={{ color: textMuted, marginBottom: '1.5rem', lineHeight: 1.7 }}>يجب تسجيل الدخول كعميل لتحديد عنوان التوصيل وإتمام عملية الشراء.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: 12, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
              <Zap style={{ width: 16, height: 16 }} /> تسجيل الدخول
            </Link>
            <Link to="/cart" style={{ padding: '0.75rem 1.25rem', borderRadius: 12, border: '1px solid #e5e7eb', color: textMuted, fontWeight: 600, textDecoration: 'none' }}>العودة للسلة</Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== 'customer') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: bgPage }} dir="rtl">
        <div style={{ textAlign: 'center', maxWidth: 420, padding: '2rem' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <UserX style={{ width: 38, height: 38, color: '#d97706' }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: textPrimary, marginBottom: '0.75rem' }}>هذه الخدمة للعملاء فقط</h2>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: 12, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
            <Zap style={{ width: 16, height: 16 }} /> الصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: bgPage }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: textPrimary }}>سلتك فارغة</h2>
          <Link to="/products" className="btn-primary">تصفح المنتجات</Link>
        </div>
      </div>
    );
  }



  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-10" style={{ background: bgPage }} dir="rtl">
      <div className="container mx-auto px-4 max-w-2xl">

        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: isLight ? 'rgba(0,112,200,0.12)' : 'linear-gradient(135deg,rgba(0,176,255,0.25),rgba(124,58,237,0.25))', border: `1px solid ${isLight ? 'rgba(0,112,200,0.25)' : 'rgba(0,176,255,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag style={{ width: 22, height: 22, color: '#00B0FF' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: textPrimary }}>إتمام عملية الدفع</h1>
            <p className="text-sm" style={{ color: textMuted }}>مراجعة طلبك وتأكيد الشحن</p>
          </div>
        </div>

        {/* Main Card */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 18, padding: '1.75rem', boxShadow: isLight ? '0 4px 24px rgba(0,112,200,0.10)' : '0 4px 32px rgba(0,176,255,0.10)', marginBottom: '1.25rem' }}>

          {/* Change Location toggle */}
          <div className="flex items-center justify-between mb-6">
            <span className="font-semibold" style={{ color: textPrimary, fontSize: '0.95rem' }}>موقع التوصيل</span>
            <button
              onClick={() => { setShowChangeLocation(!showChangeLocation); setShowAddForm(false); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', borderRadius: 9, border: `1.5px solid ${isLight ? 'rgba(0,112,200,0.3)' : 'rgba(0,176,255,0.35)'}`, background: isLight ? 'rgba(0,112,200,0.07)' : 'rgba(0,176,255,0.10)', color: isLight ? '#0d3a6e' : '#e0f2fe', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}
            >
              <MapPin style={{ width: 15, height: 15 }} />
              تغيير الموقع
              {showChangeLocation ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
            </button>
          </div>

          {/* Change Location panel */}
          {showChangeLocation && (
            <div style={{ marginBottom: '1.5rem', borderRadius: 14, border: `1px solid ${cardBorder}`, background: isLight ? '#f8fcff' : 'rgba(0,176,255,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${cardBorder}` }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: textPrimary }}>المواقع المحفوظة</span>
              </div>

              {savedLocations.map(loc => (
                <button
                  key={loc.id} onClick={() => handleSelectSaved(loc)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1.25rem', borderBottom: `1px solid ${cardBorder}`, background: 'transparent', cursor: 'pointer', textAlign: 'right', fontFamily: 'Tajawal, sans-serif', transition: 'background 0.15s', border: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = isLight ? 'rgba(0,112,200,0.06)' : 'rgba(0,176,255,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: isLight ? '#dbeafe' : 'rgba(0,176,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {loc.icon === 'work' ? <Briefcase style={{ width: 18, height: 18, color: '#00B0FF' }} /> : <Home style={{ width: 18, height: 18, color: '#00B0FF' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: textPrimary }}>{loc.label}</div>
                    <div style={{ fontSize: '0.78rem', color: textMuted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loc.description}</div>
                  </div>
                  <CheckCircle style={{ width: 16, height: 16, color: '#22c55e', flexShrink: 0 }} />
                </button>
              ))}

              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.9rem 1.25rem', background: 'transparent', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = isLight ? 'rgba(0,176,255,0.06)' : 'rgba(0,176,255,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: isLight ? '#f0fdf4' : 'rgba(34,197,94,0.12)', border: `1px dashed ${isLight ? '#86efac' : 'rgba(34,197,94,0.35)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Plus style={{ width: 18, height: 18, color: '#22c55e' }} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#22c55e' }}>إضافة موقع جديد</div>
                    <div style={{ fontSize: '0.78rem', color: textMuted }}>احفظ موقعاً باستخدام GPS</div>
                  </div>
                </button>
              ) : (
                <div style={{ padding: '1.25rem', borderTop: `1px solid ${cardBorder}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: textPrimary }}>إضافة موقع جديد</span>
                    <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}>
                      <X style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: textPrimary, marginBottom: '0.35rem' }}>
                        <Navigation style={{ width: 13, height: 13, color: '#00B0FF' }} /> الموقع الجغرافي
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          style={{ ...inputStyle, flex: 1, fontSize: '0.85rem', padding: '0.6rem 0.75rem' }}
                          placeholder="اضغط للحصول على موقعك"
                          value={newLoc.location}
                          onChange={e => setNewLoc(p => ({ ...p, location: e.target.value }))}
                          onClick={handleNewLocGeo}
                        />
                        <button onClick={handleNewLocGeo} disabled={newGeoLoading}
                          style={{ padding: '0.6rem 0.75rem', borderRadius: 9, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                          {newGeoLoading ? '...' : <Navigation style={{ width: 14, height: 14 }} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: textPrimary, marginBottom: '0.35rem' }}>
                        <Tag style={{ width: 13, height: 13, color: '#00B0FF' }} /> اسم المكان
                      </label>
                      <input style={{ ...inputStyle, fontSize: '0.85rem', padding: '0.6rem 0.75rem' }} placeholder="المنزل، مكتب، صيدلية..." value={newLoc.placeName} onChange={e => setNewLoc(p => ({ ...p, placeName: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: textPrimary, marginBottom: '0.35rem' }}>
                        <FileText style={{ width: 13, height: 13, color: '#00B0FF' }} /> وصف المكان
                      </label>
                      <input style={{ ...inputStyle, fontSize: '0.85rem', padding: '0.6rem 0.75rem' }} placeholder="يقع على اليمين من..." value={newLoc.description} onChange={e => setNewLoc(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <button onClick={handleSaveNewLocation}
                      style={{ padding: '0.65rem', borderRadius: 10, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'Tajawal, sans-serif', fontSize: '0.9rem' }}>
                      حفظ الموقع
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Current place display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', padding: '0.75rem 1rem', borderRadius: 10, background: isLight ? '#f0f9ff' : 'rgba(0,176,255,0.06)', border: `1px solid ${isLight ? '#bfdbfe' : 'rgba(0,176,255,0.18)'}` }}>
            <MapPin style={{ width: 18, height: 18, color: '#00B0FF', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: textPrimary }}>{placeName}</div>
              <div style={{ fontSize: '0.75rem', color: textMuted, marginTop: 2 }}>{description}</div>
            </div>
          </div>

          {/* Place Name field (only field shown) */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: textPrimary, marginBottom: '0.5rem' }}>
              <Tag style={{ width: 15, height: 15, color: '#00B0FF' }} />
              اسم المكان <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>*</span>
            </label>
            <input
              style={inputStyle}
              placeholder="مثال: المنزل، محل، صيدلية، مكتب"
              value={placeName}
              onChange={e => setPlaceName(e.target.value)}
            />
          </div>

          {/* Billing / Order Summary */}
          <div style={{ padding: '1rem 1.25rem', borderRadius: 12, background: isLight ? '#f0f7ff' : 'rgba(0,176,255,0.06)', border: `1px solid ${isLight ? '#bfdbfe' : 'rgba(0,176,255,0.18)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.4rem' }}>
              <span style={{ color: textMuted }}>المجموع الفرعي</span>
              <span style={{ fontWeight: 600, color: textPrimary }}>{formatPrice(subtotal)}</span>
            </div>
            {/* رسوم الشحن لكل متجر */}
            {shippingBreakdown.length > 1 ? (
              <div style={{ marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: textMuted }}>رسوم الشحن (حسب المحل)</span>
                </div>
                {shippingBreakdown.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '0.2rem 0.5rem', borderRadius: 6, marginBottom: '0.2rem', background: isLight ? 'rgba(0,176,255,0.05)' : 'rgba(0,176,255,0.04)' }}>
                    <span style={{ color: textMuted }}>{b.storeName}</span>
                    <span style={{ fontWeight: 600, color: '#2563eb' }}>{formatPrice(b.fee)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: textMuted }}>إجمالي الشحن</span>
                  <span style={{ fontWeight: 600, color: textPrimary }}>{formatPrice(deliveryFee)}</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <span style={{ color: textMuted }}>رسوم التوصيل</span>
                <span style={{ fontWeight: 600, color: textPrimary }}>{formatPrice(deliveryFee)}</span>
              </div>
            )}
            {/* شركات التوصيل */}
            {shippingBreakdown.some(b => b.companyName) && (
              <div style={{ marginBottom: '0.5rem' }}>
                {shippingBreakdown.filter(b => b.companyName).map((b, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#0070c8', fontWeight: 600, marginBottom: '0.2rem' }}>
                      🚚 <span>{shippingBreakdown.length > 1 ? `${b.storeName}: ${b.companyName}` : b.companyName}</span>
                    </div>
                    {i === 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#15803d', fontWeight: 600, marginBottom: '0.2rem' }}>
                        🏠 <span>نوع التوصيل: للمنزل</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Payment Method — locked */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', paddingTop: '0.5rem', marginTop: '0.25rem', borderTop: `1px dashed ${isLight ? '#bfdbfe' : 'rgba(0,176,255,0.15)'}`, marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CreditCard style={{ width: 14, height: 14, color: textMuted }} />
                <span style={{ color: textMuted, fontWeight: 600 }}>نوع وسيلة الدفع</span>
              </div>
              <select disabled style={selectStyleLocked}>
                <option value="none">لا توجد وسيلة دفع حاليا</option>
                <option value="cash" disabled>نقدي</option>
                <option value="card" disabled>البطاقة المصرفية</option>
                <option value="saddad" disabled>سداد</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, borderTop: `1px solid ${isLight ? '#bfdbfe' : 'rgba(0,176,255,0.18)'}`, paddingTop: '0.5rem' }}>
              <span style={{ color: textPrimary }}>الإجمالي</span>
              <span style={{ color: '#00B0FF' }}>{formatPrice(total)}</span>
            </div>
          </div>

          {/* Confirm Order button */}
          <button
            onClick={handleConfirmOrder}
            disabled={isProcessing || !placeName || !canPlaceOrder(user.id).ok}
            style={{
              width: '100%', marginTop: '1.25rem', padding: '0.9rem',
              borderRadius: 12, border: 'none',
              cursor: (isProcessing || !placeName) ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg,#0070c8,#00B0FF)',
              color: '#fff', fontWeight: 800, fontSize: '1.05rem',
              fontFamily: 'Tajawal, sans-serif',
              opacity: (isProcessing || !placeName) ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              boxShadow: '0 4px 16px rgba(0,176,255,0.3)',
            }}
          >
            {isProcessing
              ? <><span style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /><span>جارٍ المعالجة...</span></>
              : <><CheckCircle style={{ width: 20, height: 20 }} /><span>تأكيد الطلب</span></>}
          </button>

          <Link to="/cart" style={{ display: 'block', textAlign: 'center', marginTop: '0.85rem', color: textMuted, fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
            العودة إلى السلة
          </Link>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
