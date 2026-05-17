import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Zap, ShoppingBag, Store } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { formatPrice } from '../data/mockData';
import { api } from '../lib/api';
import SafeImage from '../components/ui/image';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '../components/ui/empty';

export default function FavoritesPage() {
  const { user, addToCart, showToastMessage } = useStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const [favProducts, setFavProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favStores, setFavStores] = useState<any[]>([]);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const ids: string[] = JSON.parse(localStorage.getItem('customer_favorites') || '[]');
      if (!ids.length) { setFavProducts([]); } else {
        const all = await api.getProducts();
        setFavProducts(all.filter((p: any) => ids.includes(p.id)));
      }
    } catch {
      setFavProducts([]);
    }
    try {
      const storeIds: string[] = JSON.parse(localStorage.getItem('customer_store_favorites') || '[]');
      if (storeIds.length) {
        const allMerchants = await api.getMerchants();
        setFavStores(allMerchants.filter((m: any) => storeIds.includes(m.id)));
      } else {
        setFavStores([]);
      }
    } catch {
      setFavStores([]);
    }
    setIsLoading(false);
  };

  useEffect(() => { loadFavorites(); }, []);

  const removeFav = (id: string) => {
    const ids: string[] = JSON.parse(localStorage.getItem('customer_favorites') || '[]');
    const updated = ids.filter((i: string) => i !== id);
    localStorage.setItem('customer_favorites', JSON.stringify(updated));
    setFavProducts(prev => prev.filter(p => p.id !== id));
    showToastMessage('تم الحذف من المفضلة', 'info');
  };

  const handleAddToCart = async (product: any) => {
    let merchant = null;
    try {
      const allMerchants = await api.getMerchants();
      merchant = allMerchants.find((m: any) => m.id === product.merchantId);
    } catch {}
    if (!merchant) {
      showToastMessage('لم نتمكن من تحميل بيانات المتجر', 'error');
      return;
    }
    addToCart(product, merchant, 1);
  };

  const bg = isLight ? '#f8fafc' : '#080e1c';
  const cardBg = isLight ? '#fff' : 'rgba(13,21,38,0.95)';
  const cardBorder = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)';
  const textPrimary = isLight ? '#0d2a4a' : '#e0f2fe';
  const textMuted = isLight ? '#6b7280' : 'rgba(224,242,254,0.55)';

  if (!user || user.role !== 'customer') {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Tajawal, sans-serif', direction: 'rtl', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: isLight ? '#dbeafe' : 'rgba(0,176,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: `1px solid ${cardBorder}` }}>
            <Heart style={{ width: 38, height: 38, color: isLight ? '#0070c8' : '#67e8f9' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: textPrimary, marginBottom: '0.75rem' }}>سجل الدخول لعرض مفضلتك</h2>
          <p style={{ color: textMuted, marginBottom: '1.5rem' }}>يجب تسجيل الدخول كعميل لعرض المنتجات المحفوظة في المفضلة</p>
          <Link to="/auth/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', borderRadius: 12, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
            <Zap style={{ width: 16, height: 16 }} />
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'Tajawal, sans-serif', direction: 'rtl', padding: '6rem 1rem 3rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 10, background: cardBg, border: `1px solid ${cardBorder}`, color: textMuted, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem' }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
            رجوع
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: textPrimary, margin: 0 }}>المفضلة</h1>
            <p style={{ color: textMuted, fontSize: '0.875rem', marginTop: 2 }}>{favProducts.length} منتج محفوظ</p>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
            <div style={{ width: 40, height: 40, border: '4px solid rgba(0,176,255,0.2)', borderTopColor: '#00B0FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : favProducts.length === 0 ? (
          <Empty style={{ background: cardBg, border: `1px solid ${cardBorder}` }} className="p-16 rounded-2xl">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Heart className="w-10 h-10" />
              </EmptyMedia>
              <EmptyTitle style={{ color: textPrimary }}>مفضلتك فارغة</EmptyTitle>
              <EmptyDescription style={{ color: textMuted }}>ابدأ بحفظ المنتجات التي تعجبك بالضغط على أيقونة القلب</EmptyDescription>
            </EmptyHeader>
            <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', borderRadius: 12, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
              <ShoppingBag style={{ width: 16, height: 16 }} />
              تصفح المنتجات
            </Link>
          </Empty>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {favProducts.map(product => (
              <div key={product.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
                <div style={{ position: 'relative' }}>
                  <Link to={`/products/${product.id}`}>
                    <SafeImage src={product.images?.[0]} alt={product.name} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                  </Link>
                  <button onClick={() => removeFav(product.id)}
                    style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    <Trash2 style={{ width: 16, height: 16, color: '#fff' }} />
                  </button>
                </div>
                <div style={{ padding: '0.9rem' }}>
                  <Link to={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: textPrimary, marginBottom: '0.3rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</h3>
                  </Link>
                  <p style={{ fontSize: '0.78rem', color: textMuted, marginBottom: '0.5rem' }}>{product.brand}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {product.stores?.[0]?.logo && <SafeImage src={product.stores[0].logo} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />}
                    {product.stores?.[0] && <span style={{ fontSize: '0.75rem', color: textMuted }}>{product.stores[0].storeName}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0070c8' }}>{formatPrice(product.price)}</span>
                    <button onClick={() => handleAddToCart(product)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', borderRadius: 8, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.8rem', fontWeight: 600 }}>
                      <ShoppingCart style={{ width: 14, height: 14 }} />
                      أضف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Favorite Stores */}
        {favStores.length > 0 && (
          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: isLight ? '#fef2f2' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Store style={{ width: 20, height: 20, color: '#ef4444' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: textPrimary, margin: 0 }}>محلاتي المفضلة</h2>
                <p style={{ color: textMuted, fontSize: '0.8rem', margin: 0 }}>{favStores.length} محل محفوظ</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1rem' }}>
              {favStores.map((store: any) => (
                <div key={store.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '1rem', borderBottom: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: isLight ? '#f0f7ff' : 'rgba(0,176,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      {store.logo ? <SafeImage src={store.logo} alt={store.storeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Store style={{ width: 22, height: 22, color: '#0070c8' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{store.storeName}</div>
                      <div style={{ fontSize: '0.75rem', color: textMuted, marginTop: 2 }}>{store.address || ''}</div>
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/products?merchantId=${store.id}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.5rem', borderRadius: 9, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}>
                      <ShoppingBag style={{ width: 14, height: 14 }} />
                      تصفح
                    </Link>
                    <button
                      onClick={() => {
                        const ids: string[] = JSON.parse(localStorage.getItem('customer_store_favorites') || '[]');
                        const updated = ids.filter((id: string) => id !== store.id);
                        localStorage.setItem('customer_store_favorites', JSON.stringify(updated));
                        setFavStores(prev => prev.filter(s => s.id !== store.id));
                        showToastMessage('تم الحذف من المفضلة', 'info');
                      }}
                      style={{ padding: '0.5rem 0.75rem', borderRadius: 9, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
