import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Store, Star, MapPin, ShoppingBag, CheckCircle, Filter, X, Smartphone, Laptop, MessageSquare, Send, Heart } from 'lucide-react';
import { api } from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { useStore } from '../context/StoreContext';
import SafeImage from '../components/ui/image';

const CITIES = ['الكل', 'طرابلس', 'بنغازي', 'زليتن'];
const CATS = [
  { id: '', label: 'الكل', icon: null },
  { id: 'phones', label: 'هواتف', icon: Smartphone },
  { id: 'laptops', label: 'حواسيب', icon: Laptop },
];

function StarRating({ rating, onRate }: { rating: number; onRate: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          onClick={() => onRate(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '1px' }}
          title={`تقييم ${i} نجوم`}
        >
          <Star
            className="w-4 h-4"
            style={{
              color: i <= (hovered || rating) ? '#fbbf24' : '#d1d5db',
              fill: i <= (hovered || rating) ? '#fbbf24' : 'none',
              transition: 'color 0.1s, fill 0.1s',
            }}
          />
        </button>
      ))}
    </div>
  );
}

export default function StoresPage() {
  const { theme } = useTheme();
  const { isLoggedIn, user, showToastMessage, orders } = useStore();
  const navigate = useNavigate();
  const isLight = theme === 'light';
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [selectedCat, setSelectedCat] = useState('');
  const [userRatings, setUserRatings] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('storeRatings') || '{}'); } catch { return {}; }
  });
  const [msgStoreId, setMsgStoreId] = useState<string | null>(null);
  const [msgText, setMsgText] = useState('');
  const [storeFavs, setStoreFavs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('customer_store_favorites') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'customer') {
      setStoreFavs([]);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    api.getMerchants()
      .then(setStores)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const hasPurchasedFromStore = (storeId: string): boolean => {
    return orders.some(order =>
      (order.status === 'delivered' || order.status === 'completed') &&
      order.items?.some((item: any) => item.store?.id === storeId || item.selectedStore?.id === storeId)
    );
  };

  const handleRate = (storeId: string, rating: number) => {
    if (!isLoggedIn) { showToastMessage('سجل الدخول أولاً لتقييم المحل', 'info'); return; }
    if (!hasPurchasedFromStore(storeId)) {
      showToastMessage('يمكنك التقييم فقط بعد إتمام عملية شراء من هذا المحل', 'info');
      return;
    }
    const updated = { ...userRatings, [storeId]: rating };
    setUserRatings(updated);
    localStorage.setItem('storeRatings', JSON.stringify(updated));
    showToastMessage('تم تسجيل تقييمك، شكراً!', 'success');
  };

  const toggleStoreFav = (storeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || user.role !== 'customer') { showToastMessage('سجل الدخول أولاً', 'info'); return; }
    const current: string[] = JSON.parse(localStorage.getItem('customer_store_favorites') || '[]');
    const isFav = current.includes(storeId);
    const updated = isFav ? current.filter((id: string) => id !== storeId) : [...current, storeId];
    localStorage.setItem('customer_store_favorites', JSON.stringify(updated));
    setStoreFavs(updated);
    showToastMessage(isFav ? 'تم الحذف من المفضلة' : 'تمت الإضافة للمفضلة', 'success');
  };

  const handleSendMsg = (store: any) => {
    if (!msgText.trim()) { showToastMessage('يرجى كتابة رسالتك', 'error'); return; }
    // ── منع التاجر من مراسلة نفسه أو متاجر أخرى ──────────────────────────
    if (user?.role === 'merchant') {
      const myMerchantId = (user as any).merchantId;
      if (myMerchantId && myMerchantId === store.id) {
        showToastMessage('لا يمكنك مراسلة نفسك', 'error', 3000);
        setMsgStoreId(null);
        return;
      }
      showToastMessage('لا يمكنك مراسلة متجر آخر — هذه الخدمة للزبائن فقط', 'error', 3000);
      setMsgStoreId(null);
      return;
    }
    // منع التوصيل والمالك والدعم
    if (user?.role && user.role !== 'customer') {
      showToastMessage('المراسلة متاحة للزبائن فقط', 'error', 3000);
      setMsgStoreId(null);
      return;
    }
    const customerId = user?.id || 'guest';
    const customerName = user?.name || 'زائر';
    const now = new Date().toISOString();
    const newMsg = {
      id: `msg-${Date.now()}`,
      customerName,
      customerId,
      merchantId: store.id,
      merchantName: store.storeName,
      text: msgText,
      createdAt: now,
    };
    // 1) Legacy one-way messages (backward compat)
    const key = `shop_messages_${store.id}`;
    let msgs: any[] = [];
    try { msgs = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    msgs.unshift(newMsg);
    localStorage.setItem(key, JSON.stringify(msgs));
    // 2) Bidirectional chat thread — هذا ما تقرأه لوحة التاجر
    const chatKey = `customer_merchant_chat_${store.id}`;
    let threads: any[] = [];
    try { threads = JSON.parse(localStorage.getItem(chatKey) || '[]'); } catch {}
    const threadId = `thread-${customerId}`;
    let thread = threads.find((t: any) => t.id === threadId);
    if (!thread) {
      thread = {
        id: threadId,
        customerId,
        customerName,
        merchantId: store.id,
        merchantName: store.storeName,
        messages: [],
        lastAt: now,
      };
      threads.unshift(thread);
    } else {
      thread.customerName = customerName;
    }
    thread.messages.push({ id: newMsg.id, from: 'customer', text: msgText, at: now });
    thread.lastAt = now;
    localStorage.setItem(chatKey, JSON.stringify(threads));
    setMsgText('');
    setMsgStoreId(null);
    showToastMessage('تم إرسال رسالتك إلى المحل بنجاح', 'success');
  };

  const filtered = useMemo(() => {
    let r = [...stores];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      r = r.filter(s =>
        s.storeName?.toLowerCase().includes(q) ||
        s.ownerName?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q)
      );
    }
    if (selectedCity !== 'الكل') r = r.filter(s => s.address?.includes(selectedCity));
    if (selectedCat) r = r.filter(s => Array.isArray(s.categories) && s.categories.includes(selectedCat));
    return r;
  }, [stores, searchQuery, selectedCity, selectedCat]);

  const verifiedCount = stores.filter(s => s.isVerified).length;
  const cardBg = isLight ? '#fff' : 'rgba(13,21,38,0.95)';
  const cardBorder = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)';
  const textPrimary = isLight ? '#0d2a4a' : '#e0f2fe';
  const textMuted = isLight ? '#6b7280' : 'rgba(224,242,254,0.55)';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="py-14" style={{ background: isLight ? 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0070c8 100%)' : 'linear-gradient(135deg, #020817 0%, #0a1628 50%, #0d2040 100%)', borderBottom: isLight ? 'none' : '1px solid rgba(0,176,255,0.1)' }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">المحلات الشريكة</h1>
              <p className="text-white/70 text-sm mt-0.5">Partner Stores · تصفح وابحث في محلات ليبيا الإلكترونية</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 mt-6">
            {[
              { label: 'محل مسجل', value: stores.length },
              { label: 'محل موثق', value: verifiedCount },
              { label: 'مدينة مغطاة', value: 3 },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-xl px-5 py-3 border border-white/15">
                <span className="text-2xl font-bold text-white">{s.value}</span>
                <span className="text-white/70 text-sm mr-2">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}` }} className="rounded-2xl shadow-sm p-5 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="text"
                placeholder="ابحث باسم المحل أو المالك أو المدينة..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm"
                style={{ color: isLight ? '#111827' : '#e0f2fe', background: isLight ? '#fff' : '#0d1526', borderColor: isLight ? '#e5e7eb' : 'rgba(0,176,255,0.25)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-muted" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted flex-shrink-0" />
              {CITIES.map(city => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedCity === city ? 'bg-accent text-white' : ''}`}
                  style={selectedCity !== city ? { background: isLight ? '#f3f4f6' : 'rgba(0,176,255,0.1)', color: isLight ? '#4b5563' : 'rgba(224,242,254,0.7)' } : undefined}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-sm text-muted ml-2">الفئة:</span>
            {CATS.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedCat === cat.id ? 'bg-primary text-white' : ''}`}
                style={selectedCat !== cat.id ? { background: isLight ? '#f3f4f6' : 'rgba(0,176,255,0.1)', color: isLight ? '#4b5563' : 'rgba(224,242,254,0.7)' } : undefined}
              >
                {cat.icon && <cat.icon className="w-3.5 h-3.5" />}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-5">
          <p className="text-muted text-sm">
            عرض <span className="font-bold" style={{ color: textPrimary }}>{filtered.length}</span> من أصل {stores.length} محل
          </p>
        </div>

        {/* Stores Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}` }} className="text-center py-20 rounded-2xl shadow-sm">
            <Store className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2" style={{ color: textPrimary }}>لا توجد محلات</h3>
            <p className="text-muted mb-4">جرب تعديل كلمات البحث أو الفلاتر</p>
            <button onClick={() => { setSearchQuery(''); setSelectedCity('الكل'); setSelectedCat(''); }} className="btn-primary">
              إعادة تعيين الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filtered.map(store => {
              const displayRating = userRatings[store.id] ?? Math.round(store.rating || 0);
              const canRate = hasPurchasedFromStore(store.id);
              return (
                <div key={store.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, cursor: 'pointer' }} className="rounded-2xl shadow-sm hover:shadow-lg hover:border-accent/20 transition-all group overflow-hidden" onClick={() => navigate(`/products?merchantId=${store.id}`)}>
                  <div className="p-4 md:p-6 border-b" style={{ background: isLight ? 'linear-gradient(135deg, rgba(13,71,161,0.04), rgba(0,176,255,0.04))' : 'rgba(0,176,255,0.04)', borderColor: cardBorder }}>
                    {/* RTL horizontal layout: image on right, text on left */}
                    <div className="flex flex-row items-center gap-4">
                      <div className="w-16 h-16 rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden order-last" style={{ background: isLight ? '#fff' : 'rgba(0,176,255,0.08)', border: `1px solid ${isLight ? '#f3f4f6' : 'rgba(0,176,255,0.15)'}` }}>
                        {store.logo
                          ? <SafeImage src={store.logo} alt={store.storeName} className="w-full h-full object-cover" />
                          : <Store className="w-7 h-7 text-primary" />
                        }
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <div className="flex items-center justify-start gap-1.5 flex-wrap">
                          <h3 className="font-bold leading-tight" style={{ color: textPrimary, fontSize: "1rem" }}>{store.storeName}</h3>
                          {store.isVerified && <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                        </div>
                        <p className="text-xs mt-0.5 truncate" style={{ color: textMuted }}>{store.ownerName}</p>
                        {store.address && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: textMuted }} />
                            <span className="truncate text-xs" style={{ color: textMuted }}>{store.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    {store.description && (
                      <p className="text-sm leading-relaxed mb-4 line-clamp-2" style={{ color: textMuted }}>{store.description}</p>
                    )}

                    <div className="flex items-center gap-4 mb-3 text-sm flex-wrap">
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <StarRating rating={displayRating} onRate={r => handleRate(store.id, r)} />
                        <span className="font-bold" style={{ color: textPrimary }}>{Number(displayRating).toFixed(1)}</span>
                        {!canRate && isLoggedIn && <span style={{ fontSize: '0.65rem', color: textMuted, fontStyle: 'italic' }}>(يشترط شراء)</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-primary" />
                        <span style={{ color: textMuted }}>{store.productCount} منتج</span>
                      </div>
                      {store.isVerified && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: isLight ? '#f0fdf4' : 'rgba(34,197,94,0.1)', color: isLight ? '#15803d' : '#4ade80', border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(34,197,94,0.25)'}` }}>موثق</span>
                      )}
                    </div>

                    {Array.isArray(store.categories) && store.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {store.categories.map((cat: string) => (
                          <span key={cat} className="px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs font-medium">
                            {cat === 'phones' ? 'هواتف' : cat === 'laptops' ? 'حواسيب' : cat === 'accessories' ? 'إكسسوارات' : cat}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <Link
                        to={`/products?merchantId=${store.id}`}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent-light text-white rounded-xl font-medium text-sm transition-all group-hover:shadow-md"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        تصفح المنتجات
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLoggedIn) {
                            showToastMessage('سجّل الدخول أولاً لمراسلة المحلات', 'info', 3000);
                            return;
                          }
                          if (user?.role === 'merchant') {
                            const myMerchantId = (user as any).merchantId;
                            if (myMerchantId && myMerchantId === store.id) {
                              showToastMessage('لا يمكنك مراسلة نفسك', 'error', 3000);
                              return;
                            }
                            showToastMessage('لا يمكنك مراسلة متجر آخر — هذه الخدمة للزبائن فقط', 'error', 3000);
                            return;
                          }
                          if (user?.role && user.role !== 'customer') {
                            showToastMessage('المراسلة متاحة للزبائن فقط', 'error', 3000);
                            return;
                          }
                          setMsgStoreId(store.id);
                          setMsgText('');
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all"
                        style={{ borderColor: '#0070c8', color: '#0070c8', background: 'rgba(0,112,200,0.05)' }}
                        title="مراسلة المحل"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">مراسلة</span>
                      </button>
                      {(!isLoggedIn || user?.role === 'customer') && (
                        <button
                          onClick={(e) => toggleStoreFav(store.id, e)}
                          className="flex items-center justify-center px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all"
                          style={{ borderColor: storeFavs.includes(store.id) ? '#ef4444' : cardBorder, color: storeFavs.includes(store.id) ? '#ef4444' : textMuted, background: storeFavs.includes(store.id) ? 'rgba(239,68,68,0.06)' : 'transparent' }}
                          title={storeFavs.includes(store.id) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                        >
                          <Heart className="w-4 h-4" style={{ fill: storeFavs.includes(store.id) ? '#ef4444' : 'none' }} />
                        </button>
                      )}
                    </div>
                    {msgStoreId === store.id && (
                      <div className="mt-3 p-3 rounded-xl" style={{ border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.2)'}`, background: isLight ? '#f9fafb' : 'rgba(0,176,255,0.05)' }} onClick={e => e.stopPropagation()}>
                        <textarea
                          value={msgText}
                          onChange={e => setMsgText(e.target.value)}
                          placeholder="اكتب رسالتك للمحل..."
                          rows={3}
                          className="w-full p-2.5 rounded-lg border border-gray-200 outline-none resize-none text-sm mb-2"
                          style={{ fontFamily: 'Tajawal, sans-serif', color: isLight ? '#111827' : '#e0f2fe', background: isLight ? '#fff' : '#0d1526', borderColor: isLight ? '#e5e7eb' : 'rgba(0,176,255,0.25)' }}
                          onFocus={e => (e.target.style.borderColor = '#0070c8')}
                          onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleSendMsg(store)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-accent text-white rounded-lg text-sm font-medium">
                            <Send className="w-3.5 h-3.5" /><span>إرسال</span>
                          </button>
                          <button onClick={() => setMsgStoreId(null)} className="px-3 py-2 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-white">إلغاء</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-primary to-primary-light rounded-2xl p-8 text-center text-white">
          <Store className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-2">هل تمتلك محلاً إلكترونياً؟</h2>
          <p className="text-white/80 mb-6">انضم إلى منصة CyberVolt واوصل منتجاتك لآلاف العملاء في ليبيا</p>
          <Link to="/store-portal/register" className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all">
            <Store className="w-5 h-5" />
            سجل محلك الآن — مجاناً
          </Link>
        </div>
      </div>
    </div>
  );
}
