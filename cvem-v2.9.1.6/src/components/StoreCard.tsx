import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Package, MapPin, CheckCircle } from 'lucide-react';
import { Merchant } from '../data/mockData';
import SafeImage from './ui/image';
import { useTheme } from '../context/ThemeContext';

interface StoreCardProps {
  store: Merchant;
}

export default function StoreCard({ store }: StoreCardProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <Link
      to={`/stores/${store.id}`}
      className="group hover-elevate rounded-2xl overflow-hidden block"
      style={{
        background: isLight ? '#fff' : 'rgba(2,10,30,0.85)',
        border: `1px solid ${isLight ? '#e0ecff' : 'rgba(0,176,255,0.15)'}`,
        boxShadow: isLight ? '0 2px 12px rgba(0,80,180,0.07)' : '0 2px 12px rgba(0,176,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="relative h-24 bg-gradient-to-r from-primary to-primary-light">
        <div className="absolute -bottom-10 right-6">
          <SafeImage
            src={store.logo}
            alt={store.storeName}
            className="w-20 h-20 rounded-2xl border-4 object-cover"
            style={{ borderColor: isLight ? '#fff' : '#0d1e35' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="pt-12 pb-4 px-6">
        {/* Store Name + Verified */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-lg transition-colors" style={{ color: isLight ? '#0d3a6e' : '#e0f2fe' }}>
            {store.storeName}
          </h3>
          {store.isVerified && (
            <div className="verified-badge">
              <CheckCircle className="w-5 h-5 text-cyan-400" />
              <span className="verified-tooltip">متجر موثوق · تم التحقق من هذا المتجر</span>
            </div>
          )}
        </div>

        <p className="text-sm mb-3" style={{ color: isLight ? '#4a7eb2' : 'rgba(147,216,255,0.6)' }}>
          {store.ownerName}
        </p>

        <p className="text-sm line-clamp-2 mb-4" style={{ color: isLight ? '#64748b' : 'rgba(147,216,255,0.5)' }}>
          {store.description}
        </p>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-sm" style={{ color: isLight ? '#0d3a6e' : '#e0f2fe' }}>{store.rating}</span>
          </div>
          <div className="flex items-center gap-1" style={{ color: isLight ? '#4a7eb2' : 'rgba(147,216,255,0.55)' }}>
            <Package className="w-4 h-4" />
            <span className="text-sm">{store.productCount} منتج</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm" style={{ color: isLight ? '#4a7eb2' : 'rgba(147,216,255,0.5)' }}>
          <MapPin className="w-4 h-4" />
          <span>{store.address}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-4">
        <div className="flex flex-wrap gap-2">
          {store.categories.map((cat) => (
            <span key={cat} className="px-3 py-1 text-xs rounded-full"
              style={{ background: isLight ? '#eff6ff' : 'rgba(0,176,255,0.1)', color: isLight ? '#3a7ab8' : '#67e8f9' }}>
              {cat === 'phones' ? 'هواتف' : cat === 'laptops' ? 'حواسيب' : 'إكسسوارات'}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
