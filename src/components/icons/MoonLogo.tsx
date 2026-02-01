/**
 * MoonLogo - Meoluna SVG Logo
 */

interface MoonLogoProps {
  className?: string;
  size?: number;
}

export function MoonLogo({ className = '', size = 32 }: MoonLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer glow */}
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(45 100% 85%)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="hsl(45 100% 75%)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(45 100% 85%)" />
          <stop offset="50%" stopColor="hsl(45 100% 75%)" />
          <stop offset="100%" stopColor="hsl(40 90% 65%)" />
        </linearGradient>
        <filter id="moonShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="hsl(45 100% 75%)" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Glow circle */}
      <circle cx="24" cy="24" r="22" fill="url(#moonGlow)" />

      {/* Moon crescent */}
      <path
        d="M32 24C32 28.4183 28.4183 32 24 32C19.5817 32 16 28.4183 16 24C16 19.5817 19.5817 16 24 16C20.6863 16 18 19.5817 18 24C18 28.4183 20.6863 32 24 32C28.4183 32 32 28.4183 32 24Z"
        fill="url(#moonGradient)"
        filter="url(#moonShadow)"
      />

      {/* Full moon with crescent shadow */}
      <circle
        cx="24"
        cy="24"
        r="12"
        fill="url(#moonGradient)"
        filter="url(#moonShadow)"
      />

      {/* Crescent overlay to create moon shape */}
      <circle
        cx="28"
        cy="22"
        r="9"
        fill="hsl(240 50% 8%)"
      />

      {/* Small stars around */}
      <circle cx="10" cy="12" r="1" fill="hsl(45 100% 80%)" opacity="0.8" />
      <circle cx="38" cy="10" r="1.2" fill="hsl(45 100% 80%)" opacity="0.9" />
      <circle cx="40" cy="36" r="0.8" fill="hsl(45 100% 80%)" opacity="0.7" />
      <circle cx="8" cy="32" r="1" fill="hsl(45 100% 80%)" opacity="0.6" />
    </svg>
  );
}
