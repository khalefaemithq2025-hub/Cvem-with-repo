import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2, Search, Star, ShoppingCart, CheckCircle,
  ChevronLeft, Package, Store, TrendingDown,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { formatPrice } from '../data/mockData';
import { api } from '../lib/api';
import { useStore } from '../context/StoreContext';

export default function PriceComparisonPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { addToCart, showToastMessage } = useStore();

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allMerchants, setAllMerchants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [comparisons, setComparisons] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([api.getProducts({}), api.getMerchants()])
      .then(([prods, merchants]) => {
        setAllProducts(prods);
        setAllMerchants(merchants);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const uniqueNames = Array.from(new Set(
    allProducts
      .filter(p => !p.isPending && p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(p => p.name)
  )).slice(0, 8);

  const handleSelect = (name: string) => {
    setSelectedName(name);
    setSearchQuery(name);
    const matches = allProducts.filter(p => p.name === name && !p.isPending);
    const results = matches.map(p => {
      const merchant = allMerchants.find(m => m.id === p.merchantId);
      return { ...p, merchant };
    }).filter(p => p.merchant);
    results.sort((a, b) => a.price - b.price);
    setComparisons(results);
  };

  const cheapest = comparisons[0];

  const panelBg = isLight ? '#fff' : '#0d1526';
  const panelBorder = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.15)';
  const textPrimary = isLight ? '#0d2a4a' : '#e0f2fe';
  const textMuted = isLight ? '#6b7280' : 'rgba(224,242,254,0.55)';
  const inputBg = isLight ? '#f0f7ff' : 'rgba(8,15,34,0.8)';
  const inputBorder = isLight ? 'rgba(0,120,200,0.2)' : 'rgba(0,176,255,0.25)';
  const bgPage = isLight ? '#f8fafc' : '#0a0f1f';

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: bgPage, fontFamily: 'Tajawal, sans-serif' }}>
      {/* Hero */}
      <div style={{ background: isLight ? 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0070c8 100%)' : 'linear-gradient(135deg, #020817 0%, #0a1628 50%, #0d2040 100%)', padding: '3rem 1rem 2rem', borderBottom: isLight ? 'none' : '1px solid rgba(0,176,255,0.1)' }}>
        <div className="container mx-auto">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', textDecoration: 'none' }}>الرئيسية</Link>
            <ChevronLeft style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.5)' }} />
            <span style={{ color: '#fff', fontSize: '0.875rem' }}>مقارنة الأسعار</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.25)' }}>
              <BarChart2 style={{ width: 28, height: 28, color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#fff', margin: 0 }}>مقارنة الأسعار</h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', margin: '0.2rem 0 0' }}>Price Comparison · قارن نفس المنتج من محلات مختلفة</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto" style={{ padding: '2rem 1rem' }}>

        {/* Search */}
        <div style={{ background: panelBg, borderRadius: 18, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: `1px solid ${panelBorder}`, marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontWeight: 700, color: textPrimary, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
            ابحث عن اسم المنتج لمقارنة أسعاره عبر المحلات
          </label>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, color: isLight ? '#0070c8' : '#67e8f9' }} />
            <input
              type="text"
              placeholder="مثال: آيفون 15 برو، سامسونج جالاكسي..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSelectedName(''); setComparisons([]); }}
              style={{
                width: '100%', paddingRight: 42, paddingLeft: 16, paddingTop: 12, paddingBottom: 12,
                borderRadius: 12, border: `1.5px solid ${inputBorder}`, background: inputBg,
                color: textPrimary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.95rem', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {searchQuery && !selectedName && uniqueNames.length > 0 && (
            <div style={{ marginTop: '0.5rem', background: panelBg, border: `1px solid ${panelBorder}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
              {uniqueNames.map(name => (
                <button
                  key={name}
                  onClick={() => handleSelect(name)}
                  style={{
                    width: '100%', textAlign: 'right', padding: '0.75rem 1rem',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: textPrimary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.9rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    borderBottom: `1px solid ${panelBorder}`,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = isLight ? '#f0f7ff' : 'rgba(0,176,255,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Package style={{ width: 16, height: 16, opacity: 0.6 }} />
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ width: 44, height: 44, border: '4px solid', borderColor: isLight ? '#2563eb' : '#00B0FF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
            <p style={{ color: textMuted }}>جارٍ تحميل المنتجات...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !selectedName && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: isLight ? '#eff6ff' : 'rgba(0,176,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <BarChart2 style={{ width: 40, height: 40, color: isLight ? '#2563eb' : '#00B0FF' }} />
            </div>
            <h3 style={{ fontWeight: 700, color: textPrimary, marginBottom: '0.5rem', fontSize: '1.2rem' }}>قارن أسعار أي منتج</h3>
            <p style={{ color: textMuted, maxWidth: 400, margin: '0 auto' }}>ابحث باسم المنتج أعلاه لترى أسعاره من مختلف المحلات الشريكة والأفضل سعراً.</p>
          </div>
        )}

        {/* Results */}
        {comparisons.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontWeight: 700, color: textPrimary, fontSize: '1.1rem', margin: 0 }}>
                نتائج المقارنة لـ "{selectedName}" — {comparisons.length} محل
              </h2>
              {cheapest && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', borderRadius: 99, background: '#dcfce7', color: '#15803d', fontSize: '0.8rem', fontWeight: 600 }}>
                  <TrendingDown style={{ width: 14, height: 14 }} />
                  أفضل سعر: {formatPrice(cheapest.price)}
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {comparisons.map((item, idx) => {
                const isBest = idx === 0;
                return (
                  <div key={item.id} style={{
                    background: panelBg, borderRadius: 18, border: `2px solid ${isBest ? '#16a34a' : panelBorder}`,
                    overflow: 'hidden', boxShadow: isBest ? '0 4px 20px rgba(22,163,74,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
                    position: 'relative',
                  }}>
                    {isBest && (
                      <div style={{ background: '#16a34a', color: '#fff', textAlign: 'center', padding: '0.35rem', fontSize: '0.78rem', fontWeight: 700 }}>
                        ✓ الأفضل سعراً
                      </div>
                    )}
                    {item.images?.[0] && (
                      <SafeImage src={item.images[0]} alt={item.name} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                    )}
                    <div style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        {item.merchant?.logo && (
                          <SafeImage src={item.merchant.logo} alt={item.merchant.storeName} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, color: textPrimary, margin: 0, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.merchant?.storeName}
                          </p>
                          {item.merchant?.isVerified && (
                            <p style={{ color: '#16a34a', margin: 0, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <CheckCircle style={{ width: 11, height: 11 }} /> موثق
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: isBest ? '#16a34a' : (isLight ? '#0D47A1' : '#67e8f9') }}>
                          {formatPrice(item.price)}
                        </span>
                        {item.oldPrice && (
                          <span style={{ fontSize: '0.9rem', textDecoration: 'line-through', color: textMuted }}>{formatPrice(item.oldPrice)}</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Star style={{ width: 14, height: 14, color: '#fbbf24', fill: '#fbbf24' }} />
                          <span style={{ fontSize: '0.8rem', color: textMuted }}>{item.rating?.toFixed(1)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Package style={{ width: 14, height: 14, color: textMuted }} />
                          <span style={{ fontSize: '0.8rem', color: textMuted }}>{item.stock} في المخزون</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => { addToCart(item, item.merchant, 1); showToastMessage('تمت الإضافة إلى السلة', 'success'); }}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                            padding: '0.6rem', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, #00B0FF, #7c3aed)', color: '#fff',
                            fontFamily: 'Tajawal, sans-serif', fontWeight: 600, fontSize: '0.85rem',
                          }}
                        >
                          <ShoppingCart style={{ width: 15, height: 15 }} />
                          أضف للسلة
                        </button>
                        <Link
                          to={`/products/${item.id}`}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '0.6rem 0.9rem', borderRadius: 10, border: `1px solid ${panelBorder}`,
                            color: textMuted, textDecoration: 'none', fontSize: '0.8rem',
                            background: 'transparent',
                          }}
                        >
                          <Store style={{ width: 15, height: 15 }} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Specs Comparison Table */}
        {comparisons.length > 1 && (() => {
          const specs = [
            { key: 'ram', label: 'RAM', icon: '💾' },
            { key: 'cpu', label: 'المعالج', icon: '⚡' },
            { key: 'storage', label: 'التخزين', icon: '🗄️' },
            { key: 'battery', label: 'البطارية', icon: '🔋' },
            { key: 'display', label: 'الشاشة', icon: '🖥️' },
          ];
          const hasAnySpec = specs.some(s => comparisons.some(c => c.specs?.[s.key] || c[s.key]));
          if (!hasAnySpec) return null;
          return (
            <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
              <h3 style={{ fontWeight: 700, color: isLight ? '#0d3a6e' : '#e0f2fe', marginBottom: '1rem', fontSize: '1rem' }}>
                مقارنة المواصفات
              </h3>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: panelBg, borderRadius: 16, overflow: 'hidden', border: `1px solid ${panelBorder}` }}>
                <thead>
                  <tr style={{ background: isLight ? '#eff6ff' : 'rgba(0,176,255,0.08)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'right', color: isLight ? '#0d3a6e' : '#67e8f9', fontWeight: 600, fontSize: '0.8rem', borderBottom: `1px solid ${panelBorder}` }}>المواصفة</th>
                    {comparisons.slice(0, 3).map((c, i) => (
                      <th key={i} style={{ padding: '10px 16px', textAlign: 'center', color: i === 0 ? '#16a34a' : (isLight ? '#0d3a6e' : '#e0f2fe'), fontWeight: 600, fontSize: '0.8rem', borderBottom: `1px solid ${panelBorder}` }}>
                        {c.merchant?.storeName || 'محل'}
                        {i === 0 && <span style={{ display: 'block', fontSize: '0.65rem', color: '#16a34a' }}>✓ أفضل سعر</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 16px', color: isLight ? '#4a7ab8' : '#67e8f9', fontSize: '0.82rem', borderBottom: `1px solid ${panelBorder}` }}>💰 السعر</td>
                    {comparisons.slice(0, 3).map((c, i) => (
                      <td key={i} style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', color: i === 0 ? '#16a34a' : (isLight ? '#0D47A1' : '#67e8f9'), borderBottom: `1px solid ${panelBorder}` }}>
                        {formatPrice(c.price)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 16px', color: isLight ? '#4a7ab8' : '#67e8f9', fontSize: '0.82rem', borderBottom: `1px solid ${panelBorder}` }}>⭐ التقييم</td>
                    {comparisons.slice(0, 3).map((c, i) => {
                      const best = Math.max(...comparisons.map(x => x.rating || 0));
                      return (
                        <td key={i} style={{ padding: '10px 16px', textAlign: 'center', fontWeight: c.rating === best ? 700 : 400, color: c.rating === best ? '#f59e0b' : (isLight ? '#0d3a6e' : '#e0f2fe'), fontSize: '0.85rem', borderBottom: `1px solid ${panelBorder}` }}>
                          {c.rating?.toFixed(1) || '—'}
                        </td>
                      );
                    })}
                  </tr>
                  {specs.map(s => {
                    const vals = comparisons.slice(0, 3).map(c => c.specs?.[s.key] || c[s.key] || null);
                    if (vals.every(v => !v)) return null;
                    return (
                      <tr key={s.key}>
                        <td style={{ padding: '10px 16px', color: isLight ? '#4a7ab8' : '#67e8f9', fontSize: '0.82rem', borderBottom: `1px solid ${panelBorder}` }}>{s.icon} {s.label}</td>
                        {vals.map((v, i) => (
                          <td key={i} style={{ padding: '10px 16px', textAlign: 'center', color: isLight ? '#0d3a6e' : '#e0f2fe', fontSize: '0.82rem', borderBottom: `1px solid ${panelBorder}` }}>{v || '—'}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}

        {selectedName && comparisons.length === 0 && !isLoading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: textMuted }}>لا توجد نتائج لـ "{selectedName}"</p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
