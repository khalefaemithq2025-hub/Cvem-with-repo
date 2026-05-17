import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, Filter, Grid3X3, List, X,
  Smartphone, Laptop, Headphones, Tablet, Store, ArrowRight,
} from 'lucide-react';
import { brands } from '../data/mockData';
import { api } from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import ProductCard from '../components/ProductCard';
import SafeImage from '../components/ui/image';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '../components/ui/empty';

const PLACEHOLDER_MERCHANT = {
  id: '', storeName: 'محل غير محدد', ownerName: '',
  email: '', phone: '', address: '', logo: '',
  description: '', categories: [], rating: 0,
  productCount: 0, joinedAt: '', isVerified: false,
};

export default function ProductsPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [searchParams] = useSearchParams();
  const merchantIdFilter = searchParams.get('merchantId') || '';

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allMerchants, setAllMerchants] = useState<any[]>([]);
  const [currentStore, setCurrentStore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 15000]);
  const [sortBy, setSortBy] = useState('featured');
  const [inStock, setInStock] = useState(false);
  const [showUsedOnly, setShowUsedOnly] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const params: Record<string, string> = {};
        if (merchantIdFilter) params.merchantId = merchantIdFilter;
        const [prods, usedProds, merchants] = await Promise.all([
          api.getProducts(params),
          api.getProducts({ ...params, used: 'true' }),
          api.getMerchants(),
        ]);
        const allProds = [...prods, ...usedProds];
        setAllProducts(allProds);
        setAllMerchants(merchants);
        if (merchantIdFilter) {
          const store = merchants.find((m: any) => m.id === merchantIdFilter);
          setCurrentStore(store || null);
        }
      } catch {
        console.error('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [merchantIdFilter]);

  const productCategories = [
    { id: 'phones',      name: 'الهواتف الذكية',       icon: Smartphone, count: allProducts.filter(p => p.category === 'phones').length },
    { id: 'tablets',     name: 'الأجهزة اللوحية',      icon: Tablet,      count: allProducts.filter(p => p.category === 'tablets').length },
    { id: 'laptops',     name: 'الحواسيب المحمولة',    icon: Laptop,      count: allProducts.filter(p => p.category === 'laptops').length },
    { id: 'accessories', name: 'الإكسسوارات',           icon: Headphones,  count: allProducts.filter(p => p.category === 'accessories').length },
  ];

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.merchantName?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) result = result.filter(p => p.category === selectedCategory);
    if (selectedBrands.length > 0) result = result.filter(p => selectedBrands.includes(p.brand));
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (inStock) result = result.filter(p => p.stock > 0);
    if (showUsedOnly) {
      result = result.filter(p => p.isUsed === true);
    } else {
      result = result.filter(p => !p.isUsed);
    }
    switch (sortBy) {
      case 'price-low':  result.sort((a, b) => a.price - b.price); break;
      case 'price-high': result.sort((a, b) => b.price - a.price); break;
      case 'rating':     result.sort((a, b) => b.rating - a.rating); break;
      case 'newest':     result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      default:           result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }
    return result;
  }, [allProducts, searchQuery, selectedCategory, selectedBrands, priceRange, sortBy, inStock, showUsedOnly]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };

  const clearFilters = () => {
    setSearchQuery(''); setSelectedCategory(''); setSelectedBrands([]);
    setPriceRange([0, 15000]); setSortBy('featured'); setInStock(false); setShowUsedOnly(false);
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedBrands.length > 0 || inStock || showUsedOnly;

  const panelBg = isLight ? '#fff' : 'rgba(10,18,38,0.97)';
  const panelBorder = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.13)';
  const textPrimary = isLight ? '#0d2a4a' : '#e0f2fe';
  const textMuted = isLight ? '#6b7280' : 'rgba(224,242,254,0.55)';
  const inputBg = isLight ? '#fff' : 'rgba(8,15,34,0.8)';
  const inputColor = isLight ? '#111827' : '#e0f2fe';

  return (
    <div className="min-h-screen bg-background">
      <div className="py-12" style={{ background: isLight ? 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0070c8 100%)' : 'linear-gradient(135deg, #020817 0%, #0a1628 50%, #0d2040 100%)', borderBottom: isLight ? 'none' : '1px solid rgba(0,176,255,0.1)' }}>
        <div className="container mx-auto px-4">
          {currentStore ? (
            <div className="flex items-center gap-4">
              {currentStore.logo && (
                <SafeImage src={currentStore.logo} alt={currentStore.storeName} className="w-14 h-14 rounded-2xl object-cover bg-white" />
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link to="/stores" className="text-white/60 text-sm hover:text-white flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" />المحلات
                  </Link>
                  <ArrowRight className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-white text-sm font-medium">{currentStore.storeName}</span>
                </div>
                <h1 className="text-3xl font-bold text-white">{currentStore.storeName}</h1>
                <p className="text-white/70 mt-0.5">{filteredProducts.length} منتج متوفر</p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">جميع المنتجات</h1>
              <p className="text-white/70">{filteredProducts.length} منتج متوفر</p>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div style={{ background: panelBg, border: `1px solid ${panelBorder}` }} className="rounded-2xl shadow-sm p-6 sticky top-28">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg" style={{ color: textPrimary }}>الفلاتر</h3>
                {hasActiveFilters && <button onClick={clearFilters} className="text-sm text-accent hover:underline">مسح الكل</button>}
              </div>
              <div className="mb-6">
                <h4 className="font-medium mb-3" style={{ color: textPrimary }}>الفئة</h4>
                <div className="space-y-2">
                  {productCategories.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${selectedCategory === cat.id ? 'bg-accent text-white' : 'hover:bg-gray-100'}`}
                      style={{ color: selectedCategory === cat.id ? '#fff' : textPrimary }}>
                      <div className="flex items-center gap-2"><cat.icon className="w-4 h-4" /><span className="text-sm">{cat.name}</span></div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <h4 className="font-medium mb-3" style={{ color: textPrimary }}>الماركة</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {brands.map(brand => (
                    <label key={brand} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() => toggleBrand(brand)} className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent" />
                      <span className="text-sm" style={{ color: textPrimary }}>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <h4 className="font-medium mb-3" style={{ color: textPrimary }}>السعر (د.ل)</h4>
                <input type="range" min="0" max="15000" step="100" value={priceRange[1]}
                  onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full accent-accent" />
                <div className="flex justify-between text-sm mt-1" style={{ color: textMuted }}>
                  <span>{priceRange[0].toLocaleString('ar')} د.ل</span>
                  <span>{priceRange[1].toLocaleString('ar')} د.ل</span>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
                <span className="text-sm" style={{ color: textPrimary }}>متوفر في المخزون فقط</span>
              </label>
              {(!selectedCategory || selectedCategory === 'phones' || selectedCategory === 'laptops') && (
                <label className="flex items-center gap-2 cursor-pointer mt-3">
                  <input type="checkbox" checked={showUsedOnly} onChange={e => setShowUsedOnly(e.target.checked)} className="w-4 h-4 rounded border-gray-300 accent-orange-500" />
                  <span className="text-sm font-medium" style={{ color: showUsedOnly ? '#f97316' : textPrimary }}>مستعمل فقط</span>
                  {showUsedOnly && <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full font-medium">نشط</span>}
                </label>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* ── Mobile Filters (lg:hidden) ── */}
            <div className="lg:hidden mb-4">
              <div style={{ background: panelBg, border: `1px solid ${panelBorder}` }} className="rounded-2xl p-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <span className="text-xs font-bold flex-shrink-0 flex items-center gap-1" style={{ color: textMuted }}>
                    <Filter className="w-3.5 h-3.5" />
                    الفئة:
                  </span>
                  {productCategories.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedCategory === cat.id ? 'bg-accent text-white' : 'border'}`}
                      style={{ borderColor: isLight ? '#e5e7eb' : 'rgba(0,176,255,0.25)', color: selectedCategory === cat.id ? '#fff' : textPrimary, background: selectedCategory === cat.id ? undefined : 'transparent', whiteSpace: 'nowrap' }}>
                      <cat.icon className="w-3 h-3" />
                      {cat.name}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto mt-2 pt-2 border-t pb-1 scrollbar-hide" style={{ borderColor: isLight ? '#f3f4f6' : 'rgba(0,176,255,0.08)' }}>
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: textMuted }}>الماركة:</span>
                  {brands.slice(0, 8).map(brand => (
                    <button key={brand} onClick={() => toggleBrand(brand)}
                      className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${selectedBrands.includes(brand) ? 'bg-primary text-white' : 'border'}`}
                      style={{ borderColor: isLight ? '#e5e7eb' : 'rgba(0,176,255,0.25)', color: selectedBrands.includes(brand) ? '#fff' : textMuted, background: selectedBrands.includes(brand) ? undefined : 'transparent', whiteSpace: 'nowrap' }}>
                      {selectedBrands.includes(brand) ? '✓ ' : ''}{brand}
                    </button>
                  ))}
                  <label className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer" style={{ borderColor: inStock ? '#00B0FF' : (isLight ? '#e5e7eb' : 'rgba(0,176,255,0.25)'), color: inStock ? '#00B0FF' : textMuted }}>
                    <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} className="w-3 h-3" />
                    متوفر
                  </label>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border border-red-200 text-red-500 bg-red-50" style={{ whiteSpace: 'nowrap' }}>
                      <X className="w-3 h-3 inline ml-0.5" />مسح
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Search + Sort Bar */}
            <div style={{ background: panelBg, border: `1px solid ${panelBorder}` }} className="rounded-2xl shadow-sm p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input type="text" placeholder="ابحث عن منتج، ماركة، أو محل..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    style={{ background: inputBg, color: inputColor, borderColor: isLight ? '#e5e7eb' : 'rgba(0,176,255,0.25)' }}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-muted" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    style={{ background: inputBg, color: inputColor, borderColor: isLight ? '#e5e7eb' : 'rgba(0,176,255,0.25)' }}
                    className="px-3 py-2.5 rounded-xl border focus:border-accent outline-none text-sm">
                    <option value="featured">المميزة أولاً</option>
                    <option value="newest">الأحدث</option>
                    <option value="price-low">السعر: الأقل للأعلى</option>
                    <option value="price-high">السعر: الأعلى للأقل</option>
                    <option value="rating">الأعلى تقييماً</option>
                  </select>
                  <div className="flex border rounded-xl overflow-hidden" style={{ borderColor: isLight ? '#e5e7eb' : 'rgba(0,176,255,0.25)' }}>
                    <button onClick={() => setViewMode('grid')} className={`p-2.5 ${viewMode === 'grid' ? 'bg-accent text-white' : 'hover:bg-gray-100'}`} style={{ color: viewMode === 'grid' ? '#fff' : textPrimary }}><Grid3X3 className="w-4 h-4" /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2.5 ${viewMode === 'list' ? 'bg-accent text-white' : 'hover:bg-gray-100'}`} style={{ color: viewMode === 'list' ? '#fff' : textPrimary }}><List className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm" style={{ color: textMuted }}>الفلاتر النشطة:</span>
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
                    {productCategories.find(c => c.id === selectedCategory)?.name}
                    <button onClick={() => setSelectedCategory('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedBrands.map(brand => (
                  <span key={brand} className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
                    {brand}<button onClick={() => toggleBrand(brand)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {inStock && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
                    متوفر فقط<button onClick={() => setInStock(false)}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}

            {/* Results */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-muted text-sm">جارٍ تحميل المنتجات...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-5'
                : 'flex flex-col gap-3'}>
                {filteredProducts.map(product => {
                  const merchant = allMerchants.find(m => m.id === product.merchantId)
                    || { ...PLACEHOLDER_MERCHANT, id: product.merchantId, storeName: product.merchantName || 'محل' };
                  if (viewMode === 'list') {
                    return <ProductCard key={product.id} product={product} merchant={merchant} listMode />;
                  }
                  return (
                    <React.Fragment key={product.id}>
                      <div className="block md:hidden"><ProductCard product={product} merchant={merchant} compact /></div>
                      <div className="hidden md:block"><ProductCard product={product} merchant={merchant} /></div>
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <Empty style={{ background: panelBg, border: `1px solid ${panelBorder}` }} className="py-16 rounded-2xl shadow-sm">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Search className="w-10 h-10" />
                  </EmptyMedia>
                  <EmptyTitle style={{ color: textPrimary }}>لا توجد نتائج</EmptyTitle>
                  <EmptyDescription style={{ color: textMuted }}>جرب تعديل كلمات البحث أو الفلاتر</EmptyDescription>
                </EmptyHeader>
                <button onClick={clearFilters} className="btn-primary">مسح الفلاتر</button>
              </Empty>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
