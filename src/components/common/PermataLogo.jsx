export const PermataLogo = ({
  variant = 'full', // 'full' | 'icon' | 'badge'
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  className = '',
  textColor = 'dark', // 'dark' | 'light'
}) => {
  const sizeMap = {
    xs: { icon: 'w-5 h-5', textTitle: 'text-xs', textSub: 'text-[8px]' },
    sm: { icon: 'w-6 h-6', textTitle: 'text-sm', textSub: 'text-[9px]' },
    md: { icon: 'w-9 h-9', textTitle: 'text-base', textSub: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', textTitle: 'text-xl', textSub: 'text-xs' },
    xl: { icon: 'w-16 h-16', textTitle: 'text-2xl', textSub: 'text-sm' },
    '2xl': { icon: 'w-20 h-20', textTitle: 'text-3xl', textSub: 'text-base' },
    kop: { icon: 'w-20 h-20', textTitle: 'text-2xl', textSub: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Islamic 8-Pointed Star Symbol with colorful community circle in center
  const IconSymbol = (
    <svg
      viewBox="0 0 100 100"
      className={`${currentSize.icon} shrink-0`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Square 1 */}
      <rect
        x="15"
        y="15"
        width="70"
        height="70"
        rx="4"
        stroke="#065f46"
        strokeWidth="7"
        fill="#ffffff"
      />
      {/* Rotated Square 2 (45 degrees) to form Rub el Hizb 8-pointed star */}
      <rect
        x="15"
        y="15"
        width="70"
        height="70"
        rx="4"
        transform="rotate(45 50 50)"
        stroke="#047857"
        strokeWidth="7"
        fill="#ffffff"
      />

      {/* Inner Green Overlapping Lines */}
      <polygon
        points="50,22 58,36 74,36 62,46 68,62 50,52 32,62 38,46 26,36 42,36"
        fill="#047857"
        opacity="0.2"
      />

      {/* Central Colorful Community Circle */}
      <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#065f46" strokeWidth="2.5" />
      {/* Colorful center dots representing people/growth */}
      <circle cx="50" cy="40" r="2.8" fill="#0284c7" />
      <circle cx="58" cy="44" r="2.8" fill="#e11d48" />
      <circle cx="60" cy="52" r="2.8" fill="#f59e0b" />
      <circle cx="56" cy="60" r="2.8" fill="#16a34a" />
      <circle cx="44" cy="60" r="2.8" fill="#9333ea" />
      <circle cx="40" cy="52" r="2.8" fill="#0d9488" />
      <circle cx="42" cy="44" r="2.8" fill="#ea580c" />
      <circle cx="50" cy="50" r="3.5" fill="#065f46" />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{IconSymbol}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Logo Emblem Symbol */}
      <div className="bg-white p-1 rounded-xl shadow-xs border border-emerald-200 flex items-center justify-center">
        {IconSymbol}
      </div>

      {/* Typography Brand Name */}
      <div className="flex flex-col text-left">
        <div className="flex items-center space-x-1.5 leading-none">
          <span
            className={`font-extrabold tracking-tight ${currentSize.textTitle} ${
              textColor === 'light' ? 'text-emerald-300' : 'text-emerald-800'
            }`}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: '-0.02em',
            }}
          >
            PERMATA KITA
          </span>
        </div>

        <div className="mt-0.5 border-t border-b border-emerald-300/40 py-0.5">
          <span
            className={`font-bold tracking-wider uppercase ${currentSize.textSub} ${
              textColor === 'light' ? 'text-white' : 'text-emerald-950'
            }`}
            style={{ letterSpacing: '0.08em' }}
          >
            Full Day School
          </span>
        </div>

        <span
          className={`text-[8px] font-medium leading-tight ${
            textColor === 'light' ? 'text-emerald-100' : 'text-emerald-700'
          }`}
        >
          Centre of Islamic Education Service
        </span>
      </div>
    </div>
  );
};

export default PermataLogo;
