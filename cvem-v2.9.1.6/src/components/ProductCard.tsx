import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import { Product, Merchant, formatPrice } from '../data/mockData';
import { useStore } from '../context/StoreContext';
import SafeImage from './ui/image';

interface ProductCardProps {
  product: Product;
  merchant: Merchant;
  compact?: boolean;
  listMode?: boolean;
}

export default function ProductCard({ product, merchant, compact = false, listMode = false }: ProductCardProps) {
  const { addToCart, user, isLoggedIn, showToastMessage } = useStore();

  // v2.9.1.6: المفضلة — حالة القلب
  const [isFav, setIsFav] = React.useState(() => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem('customer_favorites') || '[]');
      return ids.includes(product.id);
    } catch { return false; }
  });

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn || user?.role !== 'customer') {
      showToastMessage('سجل الدخول كزبون لإضافة المنتجات للمفضلة', 'info', 3000);
      return;
    }
    const ids: string[] = JSON.parse(localStorage.getItem('customer_favorites') || '[]');
    let updated: string[];
    if (ids.includes(product.id)) {
      updated = ids.filter(id => id !== product.id);
      setIsFav(false);
      showToastMessage('تم الحذف من المفضلة', 'info');
    } else {
      updated = [...ids, product.id];
      setIsFav(true);
      showToastMessage('تمت الإضافة للمفضلة', 'success');
    }
    localStorage.setItem('customer_favorites', JSON.stringify(updated));
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      showToastMessage('لإتمام عملية الشراء سجل الدخول أولاً', 'info', 4000);
      return;
    }

    // منع غير الزبائن من الشراء
    if (isLoggedIn && user?.role !== 'customer') {
      showToastMessage('لا يمكنك اضافته للسلة, يجب عليك الدخول كزبون لشراء المنتجات', 'error', 4000);
      return;
    }
    addToCart(product, merchant);
  };

  /* ── List-mode: horizontal card for ALL screen sizes ── */
  if (listMode) {
    return (
      <Link
        to={`/products/${product.id}`}
        className="group flex flex-row-reverse rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
        style={{
          background: 'var(--list-card-bg, #fff)',
          border: '1px solid rgba(0,176,255,0.18)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        }}
      >
        {/* Image — right side (RTL) */}
        <div className="relative flex-shrink-0 w-28 sm:w-36 overflow-hidden bg-gray-100">
          <SafeImage
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            style={{ minHeight: 112 }}
          />
          {product.oldPrice && (
            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-md">
              خصم
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-xs">نفذت</span>
            </div>
          )}
        </div>

        {/* Content — left side */}
        <div className="flex flex-col flex-1 p-3 sm:p-4 gap-1">
          <span className="text-xs text-accent font-medium">{product.brand}</span>
          <h3 className="font-bold text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors" style={{ color: 'inherit' }}>
            {product.name}
          </h3>

          {/* Store */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <SafeImage src={merchant.logo} alt={merchant.storeName} className="w-4 h-4 rounded-full object-cover" />
            <span className="text-xs text-muted">{merchant.storeName}</span>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-1 mt-0.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="text-[11px] text-muted">({product.reviewCount})</span>
          </div>

          {/* Price + Cart */}
          <div className="flex items-center justify-between mt-auto pt-2">
            <div>
              {product.oldPrice && (
                <span className="text-xs text-muted line-through ml-1">{formatPrice(product.oldPrice)}</span>
              )}
              <span className="text-base font-bold text-primary">{formatPrice(product.price)}</span>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-9 h-9 bg-accent text-white rounded-lg flex items-center justify-center hover:bg-accent-light transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>
    );
  }

  /* ── Compact: small grid card ── */
  if (compact) {
    return (
      <Link
        to={`/products/${product.id}`}
        className="product-card group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200/60 hover:border-accent/30 flex flex-col"
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <SafeImage
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {product.oldPrice && (
            <span className="absolute top-1 right-1 px-1 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded">
              خصم
            </span>
          )}
          {(!isLoggedIn || user?.role === 'customer') && (
            <button onClick={toggleFavorite} className="absolute top-1 left-1 w-6 h-6 bg-white/80 backdrop-blur rounded-md flex items-center justify-center shadow-sm" style={{ zIndex: 2 }}>
              <Heart className="w-3 h-3" style={{ fill: isFav ? '#ef4444' : 'none', color: isFav ? '#ef4444' : '#6b7280' }} />
            </button>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-xs">نفذت</span>
            </div>
          )}
        </div>
        <div className="p-1.5 flex flex-col flex-1">
          <h3 className="font-semibold text-[11px] leading-tight line-clamp-2 text-gray-800 mb-1 group-hover:text-primary transition-colors flex-1">
            {product.name}
          </h3>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-[11px] font-bold text-primary leading-none">
              {formatPrice(product.price)}
            </span>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-6 h-6 bg-accent text-white rounded-md flex items-center justify-center hover:bg-accent-light transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <ShoppingCart className="w-3 h-3" />
            </button>
          </div>
        </div>
      </Link>
    );
  }

  /* ── Default: full grid card ── */
  return (
    <Link
      to={`/products/${product.id}`}
      className="product-card group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200/60 hover:border-accent/30"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <SafeImage
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {product.oldPrice && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">
              خصم
            </span>
          )}
          {product.isFeatured && (
            <span className="px-2 py-1 bg-accent text-white text-xs font-bold rounded-lg">
              مميز
            </span>
          )}
        </div>
        {(!isLoggedIn || user?.role === 'customer') && (
          <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={toggleFavorite} className="w-9 h-9 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center hover:bg-accent hover:text-white transition-all shadow-lg">
              <Heart className="w-4 h-4" style={{ fill: isFav ? '#ef4444' : 'none', color: isFav ? '#ef4444' : 'currentColor' }} />
            </button>
            <button className="w-9 h-9 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg">
              <Eye className="w-4 h-4" />
            </button>
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">نفذت الكمية</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <span className="text-xs text-accent font-medium">{product.brand}</span>
        <h3 className="font-bold text-foreground mt-1 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <SafeImage
            src={merchant.logo}
            alt={merchant.storeName}
            className="w-5 h-5 rounded-full object-cover"
          />
          <span className="text-xs text-muted">{merchant.storeName}</span>
          {merchant.isVerified && (
            <span className="text-accent">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted">({product.reviewCount})</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            {product.oldPrice && (
              <span className="text-sm text-muted line-through ml-2">
                {formatPrice(product.oldPrice)}
              </span>
            )}
            <span className="text-lg font-bold text-primary">
              {formatPrice(product.price)}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-10 h-10 bg-accent text-white rounded-lg flex items-center justify-center hover:bg-accent-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Link>
  );
}
