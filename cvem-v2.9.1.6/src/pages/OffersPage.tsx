import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Percent, Store, Truck, CheckCircle, Star, ArrowLeft,
  Gift, Clock, Shield, Users, TrendingUp, Package,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const MERCHANT_TIERS = [
  {
    rank: 'أول 10 محلات',
    startRate: '0%',
    color: 'from-cyan-500 to-cyan-400',
    badge: 'مميز',
    breakdown: [
      { sales: '0 – 10 مبيعات', rate: '0%' },
      { sales: '11 – 20 مبيعة', rate: '1%' },
      { sales: '21+ مبيعة', rate: '3%' },
    ],
    perks: ['شارة "شريك مؤسس" الدائمة', 'ظهور مميز في الصفحة الرئيسية'],
  },
  {
    rank: 'المحلات 11 – 50',
    startRate: '1%',
    color: 'from-blue-500 to-blue-400',
    badge: 'عادي',
    breakdown: [
      { sales: '0 – 10 مبيعات', rate: '1%' },
      { sales: '11+ مبيعة', rate: '3%' },
    ],
    perks: ['دعم فني متكامل', 'تقارير مبيعات تفصيلية'],
  },
  {
    rank: 'المحلات 51+',
    startRate: '3%',
    color: 'from-slate-500 to-slate-400',
    badge: 'موسع',
    breakdown: [
      { sales: 'جميع المبيعات', rate: '3%' },
    ],
    perks: ['دعم فني متكامل', 'وصول لجمهور واسع'],
  },
];

const DELIVERY_OFFERS = [
  {
    title: 'سريع للتوصيل',
    city: 'طرابلس وبنغازي',
    discount: '15%',
    fee: '12.75 د.ل',
    originalFee: '15 د.ل',
    days: '1-2 أيام',
    color: { light: 'bg-red-50 border-red-100', dark: 'border-red-900/30' },
    badge: 'الأكثر طلباً',
  },
  {
    title: 'الأمانة للشحن',
    city: 'جميع المدن',
    discount: '10%',
    fee: '10.8 د.ل',
    originalFee: '12 د.ل',
    days: '2-3 أيام',
    color: { light: 'bg-green-50 border-green-100', dark: 'border-green-900/30' },
    badge: 'موثوق',
  },
  {
    title: 'برق إكسبريس',
    city: 'المدن الكبرى',
    discount: '20%',
    fee: '16 د.ل',
    originalFee: '20 د.ل',
    days: '24 ساعة',
    color: { light: 'bg-yellow-50 border-yellow-100', dark: 'border-yellow-900/30' },
    badge: 'الأسرع',
  },
];

export default function OffersPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const bg = isLight ? '#f8fafc' : '#030712';
  const cardBg = isLight ? '#fff' : 'rgba(10,20,45,0.9)';
  const cardBorder = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.14)';
  const textPrimary = isLight ? '#0d2a4a' : '#e0f2fe';
  const textMuted = isLight ? '#4b6e9a' : '#94a3b8';
  const sectionBgAlt = isLight ? '#f0f7ff' : '#04091c';
  const sectionBgWhite = isLight ? '#fff' : '#070e20';

  return (
    <div style={{ minHeight: '100vh', background: bg, transition: 'background 0.3s' }} dir="rtl">

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: isLight ? 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0070c8 100%)' : 'linear-gradient(135deg, #030712 0%, #0c1a3a 50%, #0a0f3a 100%)', padding: '5rem 0 4rem' }}>
        <div className="absolute inset-0" style={{ backgroundImage: isLight ? 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.12), transparent 50%)' : 'radial-gradient(circle at 20% 50%, rgba(0,176,255,0.15), transparent 50%), radial-gradient(circle at 80% 20%, rgba(124,58,237,0.12), transparent 40%)' }} />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6 border" style={{ background: 'rgba(255,255,255,0.12)', color: isLight ? '#fff' : '#67e8f9', borderColor: 'rgba(255,255,255,0.25)' }}>
            <Zap className="w-4 h-4 fill-current" />
            <span>عروض حصرية لتأسيس المنصة · Founding Offers</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="block text-2xl mb-2" style={{ color: isLight ? 'rgba(255,255,255,0.85)' : '#67e8f9' }}>عروض خاصة</span>
            انضم مبكراً واستفد أكثر
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
            أول 10 محلات تنضم لـ CyberVolt e-Mall تحصل على <strong className="text-white">عمولة 0%</strong> على أول 100 عملية بيع — فرصة لا تُعوَّض لتكون من المؤسسين.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/store-portal/register" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-slate-900 transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #00e5ff, #67e8f9)' }}>
              <Store className="w-5 h-5" />
              سجّل محلك الآن
            </Link>
            <Link to="/products" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white border border-white/30 hover:bg-white/10 transition-all">
              <Package className="w-5 h-5" />
              تصفح المنتجات
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Counter Banner */}
      <div className="bg-amber-500 py-3 text-center">
        <p className="font-bold text-white text-sm flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" />
          العرض محدود · أول 10 محلات فقط تستفيد من عمولة 0% · سارع قبل امتلاء الأماكن
        </p>
      </div>

      {/* Merchant Tiers */}
      <section style={{ padding: '5rem 0', background: sectionBgWhite }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2" style={{ color: textPrimary }}>هيكل العمولات</h2>
            <p style={{ color: textMuted }}>Commission Structure · سلّم العمولات حسب ترتيب التسجيل</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {MERCHANT_TIERS.map((tier, i) => (
              <div key={i} style={{ background: cardBg, border: `2px solid ${i === 0 ? '#22d3ee' : cardBorder}`, boxShadow: i === 0 ? '0 8px 32px rgba(0,176,255,0.12)' : 'none' }} className="relative rounded-2xl overflow-hidden transition-all hover:shadow-xl">
                {i === 0 && (
                  <div className="absolute top-0 left-0 right-0 bg-cyan-400 text-slate-900 text-xs font-bold text-center py-1.5">
                    ⚡ العرض التأسيسي — جميع المقاعد متاحة (10)
                  </div>
                )}
                <div className={`bg-gradient-to-br ${tier.color} p-6 text-white ${i === 0 ? 'pt-10' : ''}`}>
                  <div className="text-sm font-medium opacity-80 mb-1">{tier.rank}</div>
                  <div className="text-6xl font-black mb-1">{tier.startRate}</div>
                  <div className="text-sm opacity-80 mb-3">البداية بهذه النسبة</div>
                  <div className="space-y-1.5">
                    {tier.breakdown.map((b, k) => (
                      <div key={k} className="flex items-center justify-between text-xs bg-white/15 rounded-lg px-2.5 py-1.5">
                        <span className="opacity-80">{b.sales}</span>
                        <span className="font-bold">{b.rate}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    {tier.perks.map((perk, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm" style={{ color: textPrimary }}>
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                  {i === 0 && (
                    <Link to="/store-portal/register" className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #00B0FF, #7c3aed)' }}>
                      احجز مكانك الآن
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Join Early */}
      <section style={{ padding: '5rem 0', background: sectionBgAlt }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2" style={{ color: textPrimary }}>لماذا تنضم مبكراً؟</h2>
            <p style={{ color: textMuted }}>Why Join Early?</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Percent, title: 'صفر عمولة', desc: 'أول 100 بيعة بدون أي رسوم للمنصة', color: isLight ? 'bg-cyan-50 text-cyan-600' : 'bg-cyan-900/30 text-cyan-400' },
              { icon: Star,    title: 'ظهور مميز', desc: 'محلك في الصفحة الرئيسية وأعلى نتائج البحث', color: isLight ? 'bg-yellow-50 text-yellow-600' : 'bg-yellow-900/30 text-yellow-400' },
              { icon: Shield,  title: 'شارة مؤسس', desc: 'شارة "شريك مؤسس" دائمة على صفحة محلك', color: isLight ? 'bg-purple-50 text-purple-600' : 'bg-purple-900/30 text-purple-400' },
              { icon: Users,   title: 'أولوية الدعم', desc: 'فريق دعم مخصص يساعدك في الإعداد والنمو', color: isLight ? 'bg-green-50 text-green-600' : 'bg-green-900/30 text-green-400' },
            ].map((f, i) => (
              <div key={i} style={{ background: cardBg, border: `1px solid ${cardBorder}` }} className="rounded-2xl p-6 shadow-sm text-center hover:shadow-md transition-all">
                <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center mx-auto mb-4`}>
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold mb-2" style={{ color: textPrimary }}>{f.title}</h3>
                <p className="text-sm" style={{ color: textMuted }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Partner Offers */}
      <section style={{ padding: '5rem 0', background: sectionBgWhite }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-full text-sm font-medium" style={{ background: isLight ? '#eff6ff' : 'rgba(0,176,255,0.1)', color: isLight ? '#1d4ed8' : '#67e8f9' }}>
              <Truck className="w-4 h-4" />
              عروض شركاء التوصيل
            </div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: textPrimary }}>خصومات خاصة على التوصيل</h2>
            <p style={{ color: textMuted }}>Exclusive Delivery Discounts · لمستخدمي CyberVolt e-Mall فقط</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DELIVERY_OFFERS.map((d, i) => (
              <div key={i} style={{ background: cardBg, border: `2px solid ${cardBorder}` }} className="rounded-2xl p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: isLight ? '#fff' : 'rgba(0,176,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                    <Truck className="w-5 h-5" style={{ color: isLight ? '#0D47A1' : '#67e8f9' }} />
                  </div>
                  <span style={{ background: isLight ? '#fff' : 'rgba(0,176,255,0.12)', color: isLight ? '#0D47A1' : '#67e8f9', border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.2)'}` }} className="px-2 py-0.5 rounded-full text-xs font-bold">{d.badge}</span>
                </div>
                <h3 className="font-bold mb-1" style={{ color: textPrimary }}>{d.title}</h3>
                <p className="text-xs mb-3 flex items-center gap-1" style={{ color: textMuted }}>
                  <MapPinIcon className="w-3 h-3" />{d.city}
                </p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-black" style={{ color: isLight ? '#0D47A1' : '#67e8f9' }}>{d.fee}</span>
                  <span className="text-sm line-through" style={{ color: textMuted }}>{d.originalFee}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1" style={{ color: textMuted }}><Clock className="w-3 h-3" />{d.days}</span>
                  <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">خصم {d.discount}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm mt-6" style={{ color: textMuted }}>* الأسعار المخفضة مطبقة تلقائياً على جميع الطلبات عبر المنصة</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gradient-to-r from-primary to-primary-light">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {[
              { value: '10', label: 'مقاعد مؤسسة متبقية', icon: Gift },
              { value: '0%', label: 'عمولة للمؤسسين', icon: Percent },
              { value: '4', label: 'شركات توصيل شريكة', icon: Truck },
              { value: '3', label: 'مدن ليبية مغطاة', icon: TrendingUp },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                  <s.icon className="w-6 h-6" />
                </div>
                <span className="text-3xl font-black">{s.value}</span>
                <span className="text-white/70 text-sm">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem 0', background: sectionBgWhite, textAlign: 'center' }}>
        <div className="container mx-auto px-4 max-w-2xl">
          <Zap className="w-14 h-14 mx-auto mb-4" style={{ color: '#00B0FF' }} />
          <h2 className="text-3xl font-bold mb-3" style={{ color: textPrimary }}>لا تفوّت الفرصة</h2>
          <p className="mb-8" style={{ color: textMuted }}>سجّل محلك الآن واستفد من عمولة 0% وكن من أوائل المؤسسين لمنصة CyberVolt e-Mall في ليبيا</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/store-portal/register" className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold">
              <Store className="w-5 h-5" />
              سجّل محلك مجاناً
            </Link>
            <Link to="/stores" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border-2 font-bold hover:bg-primary/5 transition-all" style={{ borderColor: isLight ? '#0D47A1' : '#67e8f9', color: isLight ? '#0D47A1' : '#67e8f9' }}>
              <Store className="w-5 h-5" />
              تصفح المحلات
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
