import React from 'react';

interface DhruvyanLogoProps {
  className?: string;
  theme?: 'dark' | 'light';
  collapsed?: boolean;
}

export const DhruvyanLogo: React.FC<DhruvyanLogoProps> = ({
  className = '',
  theme = 'light',
  collapsed = false,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Compass Star Mountain Crest */}
      <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer circle */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke={isDark ? '#38bdf8' : '#0f294a'}
            strokeWidth="3.5"
            strokeDasharray="4 2"
            opacity="0.8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke={isDark ? '#94a3b8' : '#1e3a5f'}
            strokeWidth="1.5"
          />

          {/* Compass Star Points */}
          {/* North */}
          <polygon points="50,6 55,42 50,38" fill="#ef4444" />
          <polygon points="50,6 45,42 50,38" fill="#b91c1c" />
          {/* South */}
          <polygon points="50,94 55,58 50,62" fill={isDark ? '#e2e8f0' : '#0f294a'} />
          <polygon points="50,94 45,58 50,62" fill={isDark ? '#94a3b8' : '#1e3a5f'} />
          {/* East */}
          <polygon points="94,50 58,55 62,50" fill={isDark ? '#e2e8f0' : '#0f294a'} />
          <polygon points="94,50 58,45 62,50" fill={isDark ? '#94a3b8' : '#1e3a5f'} />
          {/* West */}
          <polygon points="6,50 42,55 38,50" fill={isDark ? '#e2e8f0' : '#0f294a'} />
          <polygon points="6,50 42,45 38,50" fill={isDark ? '#94a3b8' : '#1e3a5f'} />

          {/* Diagonal small points */}
          <polygon points="78,22 55,45 52,48" fill={isDark ? '#38bdf8' : '#2563eb'} opacity="0.7" />
          <polygon points="22,78 45,55 48,52" fill={isDark ? '#38bdf8' : '#2563eb'} opacity="0.7" />
          <polygon points="22,22 45,45 48,48" fill={isDark ? '#38bdf8' : '#2563eb'} opacity="0.7" />
          <polygon points="78,78 55,55 52,52" fill={isDark ? '#38bdf8' : '#2563eb'} opacity="0.7" />

          {/* Snowy Mountain Silhouette in lower half of compass */}
          <path
            d="M24 64 L42 42 L52 52 L68 36 L80 64 Z"
            fill={isDark ? '#0f294a' : '#ffffff'}
            stroke={isDark ? '#38bdf8' : '#0f294a'}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Snow peaks highlight */}
          <path
            d="M42 42 L46 48 L40 50 Z"
            fill={isDark ? '#e2e8f0' : '#0284c7'}
          />
          <path
            d="M68 36 L72 44 L64 45 Z"
            fill={isDark ? '#e2e8f0' : '#0284c7'}
          />

          {/* Center compass pivot */}
          <circle cx="50" cy="50" r="3.5" fill="#ef4444" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-widest text-lg md:text-xl font-serif ${
                isDark ? 'text-white' : 'text-[#0f294a]'
              }`}
            >
              DHRUVYAN
            </span>
          </div>
          <span
            className={`text-[9.5px] font-medium tracking-tight mt-0.5 leading-tight ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Intelligent Polar Expedition Command System
          </span>
        </div>
      )}
    </div>
  );
};
