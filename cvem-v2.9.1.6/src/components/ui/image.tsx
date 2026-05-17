import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const DEFAULT_FALLBACK = '/cvem-placeholder.svg';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  showSkeleton?: boolean;
}

export default function SafeImage({
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  onError,
  className,
  showSkeleton = true,
  ...props
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallbackSrc);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
    setLoaded(false);
    setErrored(false);
  }, [src, fallbackSrc]);

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (!errored) {
      setErrored(true);
      setCurrentSrc(fallbackSrc);
    }
    if (typeof onError === 'function') onError(event);
  };

  const handleLoad = () => setLoaded(true);

  return (
    <span className={cn('relative inline-block overflow-hidden', className)} style={{ display: 'block' }}>
      {/* Skeleton */}
      {showSkeleton && !loaded && (
        <span
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"
          style={{ backgroundSize: '200% 100%' }}
        />
      )}
      <img
        {...props}
        src={currentSrc}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        className={cn(
          'w-full h-full object-cover transition-opacity duration-500',
          loaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        style={{ display: 'block' }}
      />
    </span>
  );
}
