import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Store, Truck, Users, Smartphone, Laptop, Headphones,
  Shield, CreditCard, Star, ChevronLeft, UserPlus, CheckCircle, Award,
  ThumbsUp, MapPin,
} from 'lucide-react';
import { categories, formatPrice } from '../data/mockData';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';
import { useTheme } from '../context/ThemeContext';
import { useStore } from '../context/StoreContext';
import SafeImage from '../components/ui/image';

export default function LandingPage() {
  const { theme } = useTheme();
  const { user, orders, masterOrders, customerFeedbacks, addCustomerFeedback, showToastMessage } = useStore();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [allMerchants, setAllMerchants] = useState<any[]>([]);
  const [ownerStats, setOwnerStats] = useState({ totalMerchants: 0, totalProducts: 0, deliveryCount: 4, totalCustomers: 0 });
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [ratingMerchantName, setRatingMerchantName] = useState('');
  const [ratingDeliveryName, setRatingDeliveryName] = useState('');
  const [storeRating, setStoreRating] = useState(0);
  const [storeComment, setStoreComment] = useState('');
  const [logisticsRating, setLogisticsRating] = useState(0);
  const [logisticsComment, setLogisticsComment] = useState('');
  const alreadyRated = (orderId: string) => customerFeedbacks.some((f: any) => f.orderId === orderId);

  useEffect(() => {
    if (user?.role === 'support' && !sessionStorage.getItem('supportDashboardVisited')) {
      navigate('/helpdesk/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const [dismissedRatings] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('cvem_dismissed_ratings'); return s ? new Set(JSON.parse(s)) : new Set(); } catch { return new Set(); }
  });

  useEffect(() => {
    if (!user || user.role !== 'customer') return;
    if (ratingOrderId) return;

    // فحص SubOrders من MasterOrders
    const myMasters = masterOrders.filter((mo: any) => mo.customerId === user.id);
    for (const mo of myMasters) {
      for (const sub of mo.subOrders) {
        if (sub.status === 'delivered' && !alreadyRated(sub.id) && !dismissedRatings.has(sub.id)) {
          setRatingOrderId(sub.id);
          setRatingMerchantName(sub.merchantName || '');
          setRatingDeliveryName(sub.deliveryCompanyName || '');
          return;
        }
      }
    }

    // فحص الطلبات الفردية
    const myOrders = orders.filter((o: any) => o.customerId === user.id);
    for (const o of myOrders) {
      if (o.status === 'delivered' && !alreadyRated(o.id) && !dismissedRatings.has(o.id)) {
        setRatingOrderId(o.id);
        setRatingMerchantName((o as any).merchantName || '');
        setRatingDeliveryName((o as any).deliveryCompanyName || '');
        return;
      }
    }
  }, [orders, masterOrders, user, customerFeedbacks, dismissedRatings, ratingOrderId]);

  const submitRating = () => {
    if (!ratingOrderId) return;
    if (!storeRating && !logisticsRating) {
      showToastMessage('يرجى إضافة تقييم واحد على الأقل', 'error');
      return;
    }
    addCustomerFeedback({
      id: `fb-${Date.now()}`,
      orderId: ratingOrderId,
      customerId: user?.id || '',
      customerName: user?.name || 'عميل',
      storeRating: storeRating || 0,
      storeComment,
      logisticsRating: logisticsRating || 0,
      logisticsComment,
      createdAt: new Date(),
    });
    showToastMessage('شكراً على تقييمك!', 'success');
    setRatingOrderId(null);
    setRatingMerchantName('');
    setRatingDeliveryName('');
    setStoreRating(0);
    setStoreComment('');
    setLogisticsRating(0);
    setLogisticsComment('');
  };

  useEffect(() => {
    api.getProducts({ featured: 'true' }).then(setFeaturedProducts).catch(() => {});
    api.getMerchants().then(setAllMerchants).catch(() => {});
    api.getPublicStats().then(s => setOwnerStats(prev => ({
      ...prev, totalMerchants: s.totalMerchants, totalProducts: s.totalProducts, deliveryCount: s.deliveryCount,
    }))).catch(() => {});
  }, []);

  const stats = [
    { icon: Store, value: String(ownerStats.totalMerchants), label: 'محل مسجل' },
    { icon: ShoppingBag, value: String(ownerStats.totalProducts), label: 'منتج متوفر' },
    { icon: Users, value: String(ownerStats.totalCustomers || '∞'), label: 'عميل' },
    { icon: Truck, value: String(ownerStats.deliveryCount), label: 'شركة توصيل' },
  ];

  const trustItems = [
    { icon: CreditCard, label: 'دفع آمن', sub: 'Secure Payment', color: '#10b981' },
    { icon: Store, label: String(ownerStats.totalMerchants || '+') + ' متجر نشط', sub: 'Active Stores', color: '#00b0ff' },
    { icon: Star, label: 'تقييمات موثقة', sub: 'Verified Reviews', color: '#f59e0b' },
    { icon: MapPin, label: 'توصيل لكل ليبيا', sub: 'Delivery Coverage', color: '#8b5cf6' },
    { icon: ThumbsUp, label: 'رضا العملاء', sub: 'Customer Satisfaction', color: '#ef4444' },
  ];

  return (
    <div className="overflow-hidden cvem-grid-bg cvem-glow-overlay" dir="rtl">

      {/* ══ HERO ══ */}
      <section
        className="relative"
        style={{
          minHeight: '92vh', display: 'flex', flexDirection: 'column',
          background: isLight
            ? 'linear-gradient(180deg, #dbeafe 0%, #f0f7ff 40%, #f8fafc 100%)'
            : undefined,
        }}
      >
        <div className="absolute inset-0" style={{
          backgroundImage: isLight
            ? 'radial-gradient(circle at top right, rgba(0,112,200,0.18), transparent 38%), radial-gradient(circle at left, rgba(124,58,237,0.10), transparent 32%), linear-gradient(135deg, rgba(219,234,254,0.98), rgba(240,247,255,0.96))'
            : 'radial-gradient(circle at top right, rgba(0,176,255,0.28), transparent 38%), radial-gradient(circle at left, rgba(124,58,237,0.2), transparent 32%), linear-gradient(135deg, rgba(3,7,18,0.98), rgba(7,12,30,0.96))',
        }} />
        <div className="absolute inset-0 cyber-grid" />
        <div className="absolute inset-0" style={{
          background: isLight
            ? 'linear-gradient(to left, rgba(219,234,254,0.08) 0%, rgba(240,247,255,0.42) 55%, rgba(240,247,255,0.84) 100%)'
            : 'linear-gradient(to left, rgba(3,7,18,0.04) 0%, rgba(3,7,18,0.56) 55%, rgba(3,7,18,0.88) 100%)',
        }} />

        <div className="relative z-10" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '4rem 0' }}>
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">

              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-2 backdrop-blur rounded-full text-sm mb-8 border shadow-[0_0_24px_rgba(0,176,255,0.12)]"
                style={{
                  background: isLight ? 'rgba(224,242,254,0.96)' : 'rgba(0,176,255,0.10)',
                  color: isLight ? '#0d3a6e' : '#e0f2fe',
                  borderColor: isLight ? 'rgba(0,120,200,0.18)' : 'rgba(103,232,249,0.2)',
                }}
              >
                <Star className="w-4 h-4" style={{ color: isLight ? '#00c7ff' : '#67e8f9', fill: isLight ? '#00c7ff' : '#67e8f9' }} />
                <span>CyberVolt e-Mall v2.8.8.9 | منصة تجارة ذكية</span>
              </div>

              {/* Main Title */}
              <h1 className="font-bold mb-6 leading-tight" style={{ color: isLight ? '#0d3a6e' : '#fff' }}>
                <span
                  className="cyber-title-glow block mb-3"
                  style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', color: isLight ? '#0070c8' : '#67e8f9', fontWeight: 700 }}
                >
                  أول مجمع إلكتروني يجمع المتاجر الليبية في مكان واحد
                </span>
                <span
                  className="cyber-title-glow"
                  style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', lineHeight: 1.05, display: 'block' }}
                >
                  CyberVolt e-Mall
                </span>
              </h1>

              {/* Description */}
              <p
                className="text-xl mb-10 leading-relaxed max-w-2xl"
                style={{ color: isLight ? '#154b86' : 'rgba(255,255,255,0.75)' }}
              >
                تصفح منتجات متعددة، واطلب بسهولة من متاجر موثوقة
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4">
                {/* Primary CTA */}
                <Link
                  to={user ? '/products' : '/auth/register'}
                  className="inline-flex items-center gap-2 rounded-xl px-8 py-4 font-bold transition-all hover:scale-105"
                  style={{
                    background: isLight
                      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                      : 'linear-gradient(135deg, #00e4ff 0%, #0058ff 100%)',
                    color: '#ffffff',
                    boxShadow: isLight
                      ? '0 6px 24px rgba(59,130,246,0.4)'
                      : '0 22px 48px rgba(0,228,255,0.35), 0 0 18px rgba(0,116,255,0.25)',
                    border: isLight ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(0,228,255,0.45)',
                    fontSize: '1.05rem',
                  }}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>{user ? 'تصفح المنتجات' : 'ابدأ التسوق'}</span>
                </Link>

                {/* Secondary CTA */}
                {!user && (
                  <Link
                    to="/store-portal/register"
                    className="inline-flex items-center gap-2 px-6 py-4 rounded-xl font-medium transition-all hover:opacity-90"
                    style={{
                      background: 'transparent',
                      border: `1.5px solid ${isLight ? 'rgba(2,132,199,0.5)' : 'rgba(0,176,255,0.35)'}`,
                      color: isLight ? '#0070c8' : 'rgba(147,216,255,0.85)',
                      fontSize: '0.95rem',
                    }}
                  >
                    <Store className="w-5 h-5" />
                    <span>سجل كمحل</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="relative z-10"
          style={{
            background: isLight ? 'rgba(224,242,254,0.96)' : 'rgba(2,6,23,0.55)',
            borderTop: `1px solid ${isLight ? 'rgba(0,120,200,0.18)' : 'rgba(0,176,255,0.14)'}`,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-400/15 flex items-center justify-center flex-shrink-0 border border-cyan-300/15">
                    <stat.icon className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold" style={{ color: isLight ? '#0d3a6e' : '#fff' }}>{stat.value}</h3>
                    <p className="text-sm" style={{ color: isLight ? '#4a7eb2' : 'rgba(255,255,255,0.7)' }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FAVORITES SHORTCUT ══ */}
      {user?.role === 'customer' && (
        <section style={{ padding: '2.5rem 0', background: isLight ? 'linear-gradient(135deg, #eff6ff, #dbeafe)' : 'linear-gradient(135deg, #071327, #0b1e38)' }}>
          <div className="container mx-auto px-4">
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
              background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(0,176,255,0.07)',
              borderRadius: 20, padding: '1.5rem 2rem',
              border: `1px solid ${isLight ? 'rgba(0,112,200,0.2)' : 'rgba(0,176,255,0.2)'}`,
              boxShadow: isLight ? '0 4px 24px rgba(0,112,200,0.1)' : '0 4px 24px rgba(0,176,255,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.5rem' }}>♥</span>
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: isLight ? '#0d3a6e' : '#e0f2fe', margin: '0 0 0.2rem' }}>قائمة المفضلة</h3>
                  <p style={{ fontSize: '0.85rem', color: isLight ? '#4a7eb2' : 'rgba(224,242,254,0.6)', margin: 0 }}>احفظ المنتجات التي تعجبك وارجع إليها في أي وقت</p>
                </div>
              </div>
              <Link to="/favorites" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', borderRadius: 12, background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', boxShadow: '0 4px 14px rgba(239,68,68,0.3)', whiteSpace: 'nowrap' }}>
                <span>♥</span><span>المفضلة</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══ TRUST INDICATORS ══ */}
      <section style={{ padding: '4rem 0', background: isLight ? '#f8faff' : '#060d1e' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: isLight ? '#0d3a6e' : '#e0f2fe', marginBottom: '0.4rem' }}>
              لماذا تثق بنا؟
            </h2>
            <p style={{ color: isLight ? '#4a7eb2' : 'rgba(103,232,249,0.6)', fontSize: '0.9rem' }}>Why Trust CyberVolt</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {trustItems.map((item, i) => (
              <div
                key={i}
                className="trust-card flex flex-col items-center gap-3 rounded-2xl p-5 text-center"
                style={{
                  background: isLight ? '#fff' : 'rgba(2,10,30,0.7)',
                  border: `1px solid ${isLight ? '#dbeafe' : 'rgba(0,176,255,0.12)'}`,
                  boxShadow: isLight ? '0 2px 12px rgba(0,80,180,0.07)' : '0 2px 12px rgba(0,176,255,0.06)',
                }}
              >
                <div style={{ width: 46, height: 46, borderRadius: 14, background: item.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon style={{ width: 22, height: 22, color: item.color }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.85rem', color: isLight ? '#0d3a6e' : '#e0f2fe', marginBottom: 2 }}>{item.label}</p>
                  <p style={{ fontSize: '0.7rem', color: isLight ? '#4a7eb2' : 'rgba(147,216,255,0.55)' }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CATEGORIES ══ */}
      <section style={{ padding: '5rem 0', backgroundColor: isLight ? '#f0f6ff' : '#ffffff' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0d3a6e', marginBottom: '0.5rem' }}>تسوق حسب الفئة</h2>
            <p style={{ fontSize: '1rem', color: '#3a7ab8' }}>Shop by Category</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/products?category=${cat.id}`} className="group relative h-72 rounded-2xl overflow-hidden hover-elevate" style={{ boxShadow: '0 4px 20px rgba(0,80,180,0.10)' }}>
                <SafeImage src={cat.image} alt={cat.name} className="w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-6 right-6 left-6">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                    {cat.icon === 'Smartphone' && <Smartphone className="w-6 h-6 text-white" />}
                    {cat.icon === 'Laptop' && <Laptop className="w-6 h-6 text-white" />}
                    {cat.icon === 'Headphones' && <Headphones className="w-6 h-6 text-white" />}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">{cat.name}</h3>
                  <p className="text-white/70 text-sm">اكتشف المنتجات · Discover Products</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURED PRODUCTS (floating) ══ */}
      <section style={{ padding: '5rem 0', backgroundColor: '#ffffff' }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0d3a6e', marginBottom: '0.25rem' }}>المنتجات المميزة</h2>
              <p style={{ color: '#3a7ab8', fontSize: '0.95rem' }}>Featured Products · أحدث المنتجات بأفضل الأسعار</p>
            </div>
            <Link to="/products" className="flex items-center gap-2 text-primary hover:text-accent transition-colors font-medium">
              <span>عرض الكل</span>
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-6">
            {featuredProducts.slice(0, 8).map((product, idx) => {
              const merchant = allMerchants.find(m => m.id === product.merchantId);
              if (!merchant) return null;
              return (
                <React.Fragment key={product.id}>
                  <div className={`block md:hidden float-card`} style={{ animationDelay: `${idx * 0.2}s` }}>
                    <ProductCard product={product} merchant={merchant} compact />
                  </div>
                  <div className={`hidden md:block float-card`} style={{ animationDelay: `${idx * 0.2}s` }}>
                    <ProductCard product={product} merchant={merchant} />
                  </div>
                </React.Fragment>
              );
            })}
            {featuredProducts.length === 0 && (
              <div className="col-span-3 md:col-span-4 grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden">
                    <div className="skeleton-shimmer h-48 w-full" />
                    <div className="p-3 space-y-2">
                      <div className="skeleton-shimmer h-4 w-3/4 rounded" />
                      <div className="skeleton-shimmer h-3 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ WHY US ══ */}
      <section className="gradient-bg" style={{ padding: '5rem 0' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-2">لماذا CyberVolt e-Mall؟</h2>
            <p className="text-white/60 text-base">Why CyberVolt e-Mall?</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'محلات موثوقة', subtitle: 'Trusted Stores', description: 'جميع المحلات مفحوصة ومختارة بعناية' },
              { icon: Truck, title: 'توصيل سريع', subtitle: 'Fast Delivery', description: 'توصيل خلال 1-5 أيام عمل' },
              { icon: CreditCard, title: 'دفع آمن', subtitle: 'Secure Payment', description: 'دفع آمن ومتنوع مع حماية كاملة' },
              { icon: ShoppingBag, title: 'مقارنة الأسعار', subtitle: 'Price Comparison', description: 'قارن أسعار المنتج من أكثر من محل' },
            ].map((feature, index) => (
              <div key={index} className="bg-white/10 backdrop-blur rounded-2xl p-6 hover:bg-white/20 transition-all hover-elevate" style={{ border: '1px solid rgba(0,176,255,0.15)' }}>
                <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{feature.title}</h3>
                <p className="text-cyan-300/70 text-xs mb-2">{feature.subtitle}</p>
                <p className="text-white/60 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PARTNER STORES ══ */}
      <section style={{ padding: '5rem 0', backgroundColor: isLight ? '#f0f6ff' : '#030712', transition: 'background 0.3s' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: isLight ? '#0d3a6e' : '#e0f2fe', marginBottom: '0.25rem' }}>المحلات الشريكة</h2>
            <p style={{ color: isLight ? '#3a7ab8' : 'rgba(103,232,249,0.75)', fontSize: '0.95rem' }}>Partner Stores · محلات موثوقة تقدم أفضل المنتجات</p>
          </div>
          {allMerchants.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allMerchants.filter(m => m.isVerified).slice(0, 8).map(merchant => (
                <Link key={merchant.id} to={`/products?merchantId=${merchant.id}`}
                  className="hover-elevate rounded-2xl p-6 text-center block"
                  style={{
                    background: isLight ? '#fff' : 'rgba(2,10,30,0.85)',
                    border: `1px solid ${isLight ? '#dbeafe' : 'rgba(0,176,255,0.18)'}`,
                    boxShadow: isLight ? '0 2px 8px rgba(0,80,180,0.07)' : '0 2px 12px rgba(0,176,255,0.08)',
                    transition: 'transform 0.22s, box-shadow 0.22s',
                  }}>
                  <SafeImage src={merchant.logo} alt={merchant.storeName} className="w-16 h-16 rounded-xl mx-auto mb-4" />
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h3 style={{ fontWeight: 700, fontSize: '0.875rem', color: isLight ? '#0d3a6e' : '#e0f2fe' }}>{merchant.storeName}</h3>
                    {merchant.isVerified && (
                      <div className="verified-badge">
                        <CheckCircle className="w-4 h-4 text-cyan-400" />
                        <span className="verified-tooltip">متجر موثوق · Verified Store</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span style={{ fontSize: '0.75rem', color: isLight ? '#3a7ab8' : 'rgba(224,242,254,0.6)' }}>{merchant.rating}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: isLight ? '#3a7ab8' : 'rgba(224,242,254,0.5)' }}>{merchant.productCount} منتج</p>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ background: isLight ? '#e0f0ff' : 'rgba(2,10,30,0.7)', borderRadius: '1rem', padding: '3rem', textAlign: 'center', border: `1px solid ${isLight ? 'transparent' : 'rgba(0,176,255,0.15)'}` }}>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Store className="w-10 h-10 text-blue-500" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: isLight ? '#0d3a6e' : '#e0f2fe', marginBottom: '1rem' }}>محلاتكم قريباً</h3>
              <p style={{ color: isLight ? '#3a7ab8' : 'rgba(224,242,254,0.65)', fontSize: '1rem', maxWidth: '28rem', margin: '0 auto 1.5rem' }}>سجّل محلك الآن واحصل على مكان مميز في أول منصة تجارية في ليبيا</p>
              <Link to="/store-portal/register" className="inline-flex items-center gap-2 btn-primary"><Store className="w-5 h-5" /><span>سجل محلك الآن</span></Link>
            </div>
          )}
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section style={{ padding: '5rem 0', background: isLight ? 'linear-gradient(180deg, #dbeafe 0%, #f0f7ff 100%)' : 'linear-gradient(135deg, #030b1a 0%, #061528 50%, #0a0f3a 100%)', borderTop: `1px solid ${isLight ? 'rgba(0,120,200,0.18)' : 'rgba(0,176,255,0.14)'}` }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-2 cyber-title-glow" style={{ color: isLight ? '#0d3a6e' : '#fff' }}>
            انضم إلى عائلة سايبر فولت
          </h2>
          <p className="text-base mb-2" style={{ color: isLight ? '#3a7ab8' : 'rgba(103,232,249,0.6)' }}>Join the CyberVolt family</p>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: isLight ? '#4a7eb2' : 'rgba(255,255,255,0.7)' }}>سواء كنت محلاً يبحث عن عملاء جدد أو زبون يبحث عن أفضل العروض، نحن هنا لنخدمك</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/store-portal/register" className="px-8 py-4 rounded-xl font-bold transition-all inline-flex items-center gap-2 hover:opacity-90" style={{ background: '#ffffff', color: '#0d3a6e' }}>
              <Store className="w-5 h-5" /><span>سجل كمحل</span>
            </Link>
            <Link to="/auth/register" className="px-8 py-4 rounded-xl font-bold transition-all inline-flex items-center gap-2 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #00b0ff 0%, #1d4ed8 100%)', color: '#fff', boxShadow: '0 18px 40px rgba(0,112,255,0.28)', border: '1px solid rgba(255,255,255,0.18)' }}>
              <Users className="w-5 h-5" /><span>ابدأ التسوق</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Rating Modal */}
      {ratingOrderId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} dir="rtl">
          <div style={{ background: isLight ? '#fff' : 'linear-gradient(135deg,#020817,#0d1f40)', borderRadius: 20, padding: '2rem', maxWidth: 420, width: '100%', border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.3)'}`, boxShadow: '0 16px 48px rgba(0,0,0,0.4)', fontFamily: 'Tajawal, sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.15)', border: '1.5px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star style={{ width: 22, height: 22, color: '#fbbf24' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: isLight ? '#0d3a6e' : '#e0f2fe', margin: 0 }}>قيّم تجربتك</h3>
                <p style={{ fontSize: '0.78rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.55)', margin: 0 }}>طلب #{ratingOrderId}</p>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: isLight ? '#374151' : '#bae6fd', marginBottom: '0.4rem' }}>تقييم المتجر{ratingMerchantName ? ` (${ratingMerchantName})` : ''}</p>
              <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem' }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" onClick={() => setStoreRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                    <Star style={{ width: 28, height: 28, color: s <= storeRating ? '#f59e0b' : '#d1d5db', fill: s <= storeRating ? '#f59e0b' : 'none' }} />
                  </button>
                ))}
              </div>
              <input value={storeComment} onChange={e => setStoreComment(e.target.value)} placeholder="تعليق على المتجر (اختياري)" style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 10, border: `1.5px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.25)'}`, background: isLight ? '#f8fafc' : '#080e1c', color: isLight ? '#1e293b' : '#e0f2fe', fontFamily: 'Tajawal, sans-serif', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: isLight ? '#374151' : '#bae6fd', marginBottom: '0.4rem' }}>تقييم التوصيل{ratingDeliveryName ? ` (${ratingDeliveryName})` : ''}</p>
              <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem' }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" onClick={() => setLogisticsRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                    <Star style={{ width: 28, height: 28, color: s <= logisticsRating ? '#f59e0b' : '#d1d5db', fill: s <= logisticsRating ? '#f59e0b' : 'none' }} />
                  </button>
                ))}
              </div>
              <input value={logisticsComment} onChange={e => setLogisticsComment(e.target.value)} placeholder="تعليق على التوصيل (اختياري)" style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 10, border: `1.5px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.25)'}`, background: isLight ? '#f8fafc' : '#080e1c', color: isLight ? '#1e293b' : '#e0f2fe', fontFamily: 'Tajawal, sans-serif', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={submitRating} style={{ flex: 1, padding: '0.7rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#000', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>إرسال التقييم</button>
              <button onClick={() => { setRatingOrderId(null); setRatingMerchantName(''); setRatingDeliveryName(''); setStoreRating(0); setStoreComment(''); setLogisticsRating(0); setLogisticsComment(''); }} style={{ flex: 1, padding: '0.7rem', borderRadius: 12, border: `1.5px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.3)'}`, background: isLight ? '#f8fafc' : 'rgba(0,176,255,0.08)', color: isLight ? '#374151' : '#e0f2fe', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>لاحقاً</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
