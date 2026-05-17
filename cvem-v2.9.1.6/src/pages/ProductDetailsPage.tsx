import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, ShoppingCart, Heart, Truck, Shield, CheckCircle, Minus, Plus, ChevronLeft, MessageSquare, X, Send, LogIn,
} from 'lucide-react';
import { formatPrice } from '../data/mockData';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import SafeImage from '../components/ui/image';
import { api } from '../lib/api';

const FALLBACK_MERCHANT = null;

function getFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem('customer_favorites') || '[]'); } catch { return []; }
}
function setFavorites(ids: string[]) {
  localStorage.setItem('customer_favorites', JSON.stringify(ids));
}

function pushCustomerSentMessage(msg: any) {
  try {
    const key = 'customer_sent_messages';
    const existing: any[] = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift(msg);
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 100)));
  } catch {}
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const { addToCart, showToastMessage, isLoggedIn, user } = useStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [allMerchants, setAllMerchants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgText, setMsgText] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const [prod, merchants] = await Promise.all([api.getProduct(id), api.getMerchants()]);
        setProduct(prod);
        setAllMerchants(merchants);
        const m = merchants.find((x: any) => x.id === prod.merchantId);
        setMerchant(m || null);
        const similar = await api.getProducts({ category: prod.category });
        setSimilarProducts(similar.filter((p: any) => p.id !== prod.id).slice(0, 4));
        setIsFavorite(getFavorites().includes(prod.id));
      } catch {
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const toggleFavorite = () => {
    if (!product) return;
    if (!isLoggedIn) { showToastMessage('سجل الدخول أولاً للإضافة إلى المفضلة', 'info'); return; }
    const favs = getFavorites();
    let updated: string[];
    if (favs.includes(product.id)) {
      updated = favs.filter(f => f !== product.id);
      setIsFavorite(false);
      showToastMessage('تم إزالة المنتج من المفضلة', 'info');
    } else {
      updated = [...favs, product.id];
      setIsFavorite(true);
      showToastMessage('تمت الإضافة إلى المفضلة ♥', 'success');
    }
    setFavorites(updated);
  };

  const handleSendMessage = () => {
    // ── منع غير الزبائن من المراسلة ──────────────────────────────────────
    if (user?.role === 'merchant') {
      const myMerchantId = (user as any).merchantId;
      const targetId = merchant?.id || product?.merchantId;
      if (myMerchantId && targetId && myMerchantId === targetId) {
        showToastMessage('لا يمكنك مراسلة نفسك', 'error', 3000);
        setShowMsgModal(false);
        return;
      }
      showToastMessage('لا يمكنك مراسلة متجر آخر — هذه الخدمة للزبائن فقط', 'error', 3000);
      setShowMsgModal(false);
      return;
    }
    if (user?.role && user.role !== 'customer') {
      showToastMessage('المراسلة متاحة للزبائن فقط', 'error', 3000);
      setShowMsgModal(false);
      return;
    }
    // ── الكود الأصلي يبقى من هنا ─────────────────────────────────────────
    if (!msgText.trim()) { showToastMessage('يرجى كتابة رسالتك', 'error'); return; }
    const effectiveMerchantId = merchant?.id || product?.merchantId;
    if (!effectiveMerchantId) return;
    const customerId = user?.id || 'guest';
    const customerName = user?.name || 'زائر';
    const now = new Date().toISOString();
    const newMsg = {
      id: `msg-${Date.now()}`,
      customerName,
      customerId,
      productName: product?.name,
      merchantId: effectiveMerchantId,
      merchantName: merchant?.storeName || 'المحل',
      text: msgText,
      createdAt: now,
    };
    // Legacy one-way messages (backward compat)
    const key = `shop_messages_${effectiveMerchantId}`;
    let msgs: any[] = [];
    try { msgs = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    msgs.unshift(newMsg);
    localStorage.setItem(key, JSON.stringify(msgs));
    // Bidirectional chat thread
    const chatKey = `customer_merchant_chat_${effectiveMerchantId}`;
    let threads: any[] = [];
    try { threads = JSON.parse(localStorage.getItem(chatKey) || '[]'); } catch {}
    const threadId = `thread-${customerId}`;
    let thread = threads.find((t: any) => t.id === threadId);
    if (!thread) {
      thread = { id: threadId, customerId, customerName, merchantId: effectiveMerchantId, merchantName: merchant?.storeName || 'المحل', messages: [], lastAt: now };
      threads.unshift(thread);
    } else {
      thread.customerName = customerName;
    }
    thread.messages.push({ id: newMsg.id, from: 'customer', text: msgText, at: now });
    thread.lastAt = now;
    localStorage.setItem(chatKey, JSON.stringify(threads));
    pushCustomerSentMessage(newMsg);
    setMsgText('');
    setShowMsgModal(false);
    showToastMessage('تم إرسال رسالتك إلى المحل بنجاح', 'success');
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center"><h2 className="text-2xl font-bold mb-4">المنتج غير موجود</h2><Link to="/products" className="btn-primary">العودة للمنتجات</Link></div>
    </div>
  );

  const effectiveMerchant = merchant;

  const handleAddToCart = () => {
    if (!merchant) {
      showToastMessage('جاري تحميل بيانات المتجر، حاول مجدداً', 'error');
      return;
    }

    if (!isLoggedIn) {
      showToastMessage('لإتمام عملية الشراء سجل الدخول أولاً', 'info', 4000);
      return;
    }

    // منع غير الزبائن من الشراء
    if (isLoggedIn && user?.role !== 'customer') {
      showToastMessage('لا يمكنك اضافته للسلة, يجب عليك الدخول كزبون لشراء المنتجات', 'error', 4000);
      return;
    }
    addToCart(product, merchant, quantity);
  };

  const descColor = isLight ? '#374151' : '#e0f2fe';
  const specKeyColor = isLight ? '#6b7280' : 'rgba(224,242,254,0.6)';
  const specValColor = isLight ? '#111827' : '#e0f2fe';
  const specBg = isLight ? '#f9fafb' : 'rgba(255,255,255,0.06)';

  return (
    <div className="min-h-screen" style={{ background: isLight ? '#f8fafc' : '#0a0f1f' }}>
      <div style={{ background: isLight ? '#fff' : '#0d1526', borderBottom: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)'}` }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" style={{ color: isLight ? '#6b7280' : 'rgba(224,242,254,0.55)' }} className="hover:text-primary">الرئيسية</Link>
            <ChevronLeft className="w-4 h-4" style={{ color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.3)' }} />
            <Link to="/products" style={{ color: isLight ? '#6b7280' : 'rgba(224,242,254,0.55)' }} className="hover:text-primary">المنتجات</Link>
            <ChevronLeft className="w-4 h-4" style={{ color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.3)' }} />
            <span style={{ color: isLight ? '#111827' : '#e0f2fe', fontWeight: 600 }}>{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <div className="bg-white rounded-2xl overflow-hidden mb-4">
              <SafeImage src={product.images[selectedImage]} alt={product.name} className="w-full aspect-square object-cover" />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img: string, index: number) => (
                  <button key={index} onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-accent' : 'border-transparent hover:border-gray-300'}`}>
                    <SafeImage src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="text-accent font-medium">{product.brand}</span>
            <h1 className="text-3xl font-bold mt-2 mb-4" style={{ color: isLight ? '#111827' : '#e0f2fe' }}>{product.name}</h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="font-medium" style={{ color: isLight ? '#111827' : '#e0f2fe' }}>{product.rating}</span>
              <span style={{ color: isLight ? '#6b7280' : 'rgba(224,242,254,0.5)' }}>({product.reviewCount} تقييم)</span>
            </div>

            <p className="mb-6 leading-relaxed" style={{ color: descColor, fontSize: '1rem', lineHeight: '1.75' }}>
              {product.description}
            </p>

            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold mb-3" style={{ color: isLight ? '#111827' : '#e0f2fe' }}>المواصفات</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between p-2 rounded-lg" style={{ background: specBg }}>
                      <span style={{ color: specKeyColor, fontSize: '0.875rem' }}>{key}</span>
                      <span className="font-medium text-sm" style={{ color: specValColor }}>{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl p-6 mb-6 shadow-sm" style={{ background: isLight ? '#fff' : '#0d1526', border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.15)'}` }}>
              <div className="flex items-center gap-4 mb-4">
                {product.oldPrice && <span className="text-xl line-through" style={{ color: '#9ca3af' }}>{formatPrice(product.oldPrice)}</span>}
                <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
                {product.oldPrice && <span className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm font-medium">خصم {Math.round((1 - product.price / product.oldPrice) * 100)}%</span>}
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-3" style={{ color: isLight ? '#111827' : '#e0f2fe' }}>المحل</h4>
                <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-accent bg-accent/5">
                  {effectiveMerchant.logo && <SafeImage src={effectiveMerchant.logo} alt={effectiveMerchant.storeName} className="w-10 h-10 rounded-lg object-cover" />}
                  <div>
                    <p className="font-medium" style={{ color: isLight ? '#111827' : '#e0f2fe' }}>{effectiveMerchant.storeName}</p>
                    <p className="text-sm" style={{ color: isLight ? '#6b7280' : 'rgba(224,242,254,0.55)' }}>{product.stock} متوفر</p>
                  </div>
                  {effectiveMerchant.isVerified && <CheckCircle className="w-5 h-5 text-green-500 mr-auto" />}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <span className="font-medium" style={{ color: isLight ? '#111827' : '#e0f2fe' }}>الكمية:</span>
                <div className="flex items-center border rounded-lg" style={{ borderColor: isLight ? '#e5e7eb' : 'rgba(0,176,255,0.2)' }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-gray-100 transition-colors"><Minus className="w-5 h-5" style={{ color: isLight ? '#111827' : '#e0f2fe' }} /></button>
                  <span className="px-4 font-medium" style={{ color: isLight ? '#111827' : '#e0f2fe' }}>{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))} className="p-2 hover:bg-gray-100 transition-colors"><Plus className="w-5 h-5" style={{ color: isLight ? '#111827' : '#e0f2fe' }} /></button>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button onClick={handleAddToCart} disabled={product.stock === 0} className="flex-1 btn-secondary flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5" /><span>إضافة للسلة</span>
                </button>
                {(isLoggedIn && user?.role === 'customer') ? (
                  <button
                    onClick={toggleFavorite}
                    className="p-3 rounded-xl border-2 transition-all"
                    style={{ borderColor: isFavorite ? '#ef4444' : (isLight ? '#e5e7eb' : 'rgba(0,176,255,0.2)'), background: isFavorite ? '#fee2e2' : 'transparent', color: isFavorite ? '#ef4444' : (isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)') }}
                    title={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                  >
                    <Heart className="w-6 h-6" style={{ fill: isFavorite ? '#ef4444' : 'none' }} />
                  </button>
                ) : !isLoggedIn ? (
                  <button
                    onClick={() => showToastMessage('سجل الدخول أولاً للحفظ في المفضلة', 'info')}
                    className="p-3 rounded-xl border-2 transition-all"
                    style={{ borderColor: isLight ? '#e5e7eb' : 'rgba(0,176,255,0.2)', background: 'transparent', color: isLight ? '#d1d5db' : 'rgba(224,242,254,0.3)', cursor: 'pointer' }}
                    title="سجل الدخول للمفضلة"
                  >
                    <Heart className="w-6 h-6" />
                  </button>
                ) : null}
                <button
                  onClick={() => {
                    if (!isLoggedIn) {
                      showToastMessage('سجّل الدخول أولاً لمراسلة المحلات', 'info', 3000);
                      return;
                    }
                    if (user?.role === 'merchant') {
                      const myMerchantId = (user as any).merchantId;
                      const targetId = (merchant as any)?.id || (product as any)?.merchantId;
                      if (myMerchantId && targetId && myMerchantId === targetId) {
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
                    setShowMsgModal(true);
                  }}
                  className="p-3 rounded-xl border-2 transition-all flex items-center gap-2 px-4"
                  style={{ borderColor: '#0070c8', background: 'rgba(0,112,200,0.06)', color: '#0070c8', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
                  title="مراسلة المحل"
                >
                  <MessageSquare className="w-5 h-5" /><span>مراسلة المحل</span>
                </button>
              </div>

              {showMsgModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ direction: 'rtl' }}>
                  <div className="rounded-2xl p-6 shadow-2xl w-full max-w-md" style={{ background: isLight ? '#fff' : '#0d1526', border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.2)'}` }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg" style={{ color: isLight ? '#0d3a6e' : '#e0f2fe' }}>مراسلة {(merchant || { storeName: 'المحل' }).storeName}</h3>
                      <button onClick={() => setShowMsgModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">بخصوص: <span className="font-medium text-gray-700">{product.name}</span></p>
                    <textarea
                      value={msgText}
                      onChange={e => setMsgText(e.target.value)}
                      placeholder="اكتب رسالتك للمحل هنا..."
                      rows={4}
                      className="w-full p-3 rounded-xl border border-gray-200 outline-none resize-none text-sm mb-4"
                      style={{ fontFamily: 'Tajawal, sans-serif', color: isLight ? '#111827' : '#e0f2fe', background: isLight ? '#fff' : '#0d1526', borderColor: isLight ? '#e5e7eb' : 'rgba(0,176,255,0.25)' }}
                      onFocus={e => (e.target.style.borderColor = '#0070c8')}
                      onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                    />
                    <div className="flex gap-3">
                      <button onClick={handleSendMessage} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-xl font-medium text-sm transition-all">
                        <Send className="w-4 h-4" /><span>إرسال الرسالة</span>
                      </button>
                      <button onClick={() => setShowMsgModal(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50">إلغاء</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Features — without Free Returns */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Truck, title: 'توصيل سريع', sub: '1-5 أيام عمل' },
                { icon: Shield, title: 'ضمان المحل', sub: 'على جميع المنتجات' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl p-4 shadow-sm" style={{ background: isLight ? '#fff' : '#0d1526', border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)'}` }}>
                  <f.icon className="w-8 h-8 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm" style={{ color: isLight ? '#111827' : '#e0f2fe' }}>{f.title}</p>
                    <p className="text-xs" style={{ color: isLight ? '#6b7280' : 'rgba(224,242,254,0.5)' }}>{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {similarProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="section-title mb-6">منتجات مشابهة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((p) => {
                const m = allMerchants.find((mer: any) => mer.id === p.merchantId);
                if (!m) return null;
                return (
                  <Link key={p.id} to={`/products/${p.id}`} className="rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all" style={{ background: isLight ? '#fff' : '#0d1526', border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.1)'}` }}>
                    <SafeImage src={p.images[0]} alt={p.name} className="w-full aspect-square object-cover" />
                    <div className="p-4">
                      <span className="text-xs text-accent">{p.brand}</span>
                      <h3 className="font-medium line-clamp-1 mt-1 mb-2" style={{ color: isLight ? '#111827' : '#e0f2fe' }}>{p.name}</h3>
                      <p className="text-lg font-bold text-primary">{formatPrice(p.price)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
