import { useState } from 'react';


export const PermataLogo = ({
  variant = 'full', // 'full' | 'icon' | 'image' | 'full-image' | 'full_image' | 'banner' | 'badge'
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'kop'
  className = '',
  textColor = 'dark', // 'dark' | 'light'
  alt = 'Koperasi SD IT Permata',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeMap = {
    xs: {
      icon: 'w-6 h-6',
      fullImage: 'h-6',
      textTitle: 'text-xs',
      textSub: 'text-[8px]',
      gap: 'gap-1.5',
    },
    sm: {
      icon: 'w-8 h-8',
      fullImage: 'h-8 sm:h-9',
      textTitle: 'text-sm',
      textSub: 'text-[9px]',
      gap: 'gap-2',
    },
    md: {
      icon: 'w-10 h-10',
      fullImage: 'h-10 sm:h-11',
      textTitle: 'text-base',
      textSub: 'text-[10px]',
      gap: 'gap-2.5',
    },
    lg: {
      icon: 'w-14 h-14',
      fullImage: 'h-14 sm:h-16',
      textTitle: 'text-xl',
      textSub: 'text-xs',
      gap: 'gap-3',
    },
    xl: {
      icon: 'w-18 h-18',
      fullImage: 'h-18 sm:h-20',
      textTitle: 'text-2xl',
      textSub: 'text-sm',
      gap: 'gap-3.5',
    },
    '2xl': {
      icon: 'w-24 h-24',
      fullImage: 'h-24 sm:h-28',
      textTitle: 'text-3xl',
      textSub: 'text-base',
      gap: 'gap-4',
    },
    kop: {
      icon: 'w-20 h-20',
      fullImage: 'h-16',
      textTitle: 'text-2xl',
      textSub: 'text-sm',
      gap: 'gap-4',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const FallbackEmblemSvg = (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full shrink-0"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <rect
        x="35"
        y="35"
        width="130"
        height="130"
        rx="10"
        stroke="url(#emeraldGrad)"
        strokeWidth="12"
        fill="#ffffff"
      />
      <rect
        x="35"
        y="35"
        width="130"
        height="130"
        rx="10"
        transform="rotate(45 100 100)"
        stroke="url(#emeraldGrad)"
        strokeWidth="12"
        fill="#ffffff"
      />
      <circle cx="100" cy="100" r="44" fill="#ffffff" stroke="#047857" strokeWidth="3" />
      <circle cx="100" cy="100" r="12" fill="#047857" />
    </svg>
  );

  // 1. Variant: Full Image Asli (/logo_full.png)
  if (variant === 'full-image' || variant === 'full_image' || variant === 'banner') {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <img
          src="/logo_full.png"
          alt={alt}
          onError={() => setImageError(true)}
          className={`${currentSize.fullImage} w-auto object-contain drop-shadow-2xs`}
        />
      </div>
    );
  }

  // 2. Variant: Icon / Image Only (/logo.png)
  if (variant === 'icon' || variant === 'image') {
    return (
      <div
        className={`inline-flex items-center justify-center ${currentSize.icon} shrink-0 select-none ${className}`}
      >
        {!imageError ? (
          <img
            src="/logo.png"
            alt={alt}
            onError={() => setImageError(true)}
            className="w-full h-full object-contain drop-shadow-2xs"
          />
        ) : (
          FallbackEmblemSvg
        )}
      </div>
    );
  }

  // 3. Variant: Badge (/logo.png dalam pill / card)
  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs select-none ${className}`}
      >
        <div className={`${currentSize.icon} shrink-0`}>
          <img
            src="/logo.png"
            alt={alt}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex flex-col text-left">
          <span className="font-extrabold text-xs text-slate-900 leading-tight">
            KOPERASI PERMATA KITA
          </span>
          <span className="text-[9px] font-bold text-emerald-700">
            SD IT Permata Kita
          </span>
        </div>
      </div>
    );
  }

  // 4. Default: Variant 'full' / 'horizontal' (Emblem /logo.png + Modern Responsive Typography)
  return (
    <div className={`inline-flex items-center ${currentSize.gap} select-none ${className}`}>
      {/* Emblem Icon */}
      <div
        className={`flex items-center justify-center ${currentSize.icon} shrink-0`}
      >
        {!imageError ? (
          <img
            src="/logo.png"
            alt={alt}
            onError={() => setImageError(true)}
            className="w-full h-full object-contain drop-shadow-2xs"
          />
        ) : (
          FallbackEmblemSvg
        )}
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col text-left justify-center">
        <div className="flex items-center space-x-1.5 leading-none">
          <span
            className={`font-black tracking-tight ${currentSize.textTitle} ${textColor === 'light' ? 'text-emerald-300' : 'text-slate-900'
              }`}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: '-0.03em',
            }}
          >
            KOPERASI PERMATA KITA
          </span>
        </div>

        <div className="mt-1 flex items-center space-x-1.5 leading-none">
          <span
            className={`font-extrabold tracking-wider uppercase text-[10px] sm:text-[11px] ${textColor === 'light' ? 'text-emerald-100' : 'text-emerald-700'
              }`}
            style={{ letterSpacing: '0.04em' }}
          >
            SD IT Permata
          </span>
          <span className="text-[9px] text-slate-300">•</span>
          <span
            className={`text-[9px] sm:text-[10px] font-medium ${textColor === 'light' ? 'text-slate-200' : 'text-slate-500'
              }`}
          >
            Full Day School
          </span>
        </div>
      </div>
    </div>
  );
};

export default PermataLogo;
