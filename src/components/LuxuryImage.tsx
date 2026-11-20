import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface LuxuryImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
}

export function LuxuryImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackLabel = 'I.A FRAGRANCE',
  loading = 'lazy',
  fetchPriority = 'auto',
}: LuxuryImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FDF5F8] via-[#F7E8EE] to-[#EFE2E7] text-[#0B0B0D]/70 p-6 text-center select-none"
        role="img"
        aria-label={alt}
      >
        <div className="w-12 h-12 rounded-full border border-[#0B0B0D]/15 flex items-center justify-center mb-3 bg-white/60">
          <Sparkles className="w-5 h-5 text-[#0B0B0D]/60" strokeWidth={1.5} />
        </div>
        <span className="font-display text-lg tracking-wider text-[#0B0B0D]">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      referrerPolicy="no-referrer"
      onLoad={() => setIsLoaded(true)}
      onError={() => setHasError(true)}
      className={`${className} transition-opacity duration-300 ${
        isLoaded || loading === 'eager' ? 'opacity-100' : 'opacity-90'
      }`}
    />
  );
}
