/**
 * MoonLogo - Meoluna SVG Logo (Original Design)
 */

import { cn } from "@/lib/utils";

interface MoonLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-20 h-20",
  xl: "w-32 h-32",
};

export function MoonLogo({ className, size = "md", animate = true }: MoonLogoProps) {
  return (
    <div
      className={cn(
        "relative",
        sizeClasses[size],
        animate && "animate-float",
        className
      )}
    >
      {/* Moon glow effect */}
      <div className="absolute inset-0 rounded-full bg-moon opacity-30 blur-xl" />

      {/* Main moon */}
      <svg
        viewBox="0 0 100 100"
        className="relative w-full h-full drop-shadow-lg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Moon gradient */}
        <defs>
          <radialGradient id="moonGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="hsl(45 100% 90%)" />
            <stop offset="50%" stopColor="hsl(45 100% 80%)" />
            <stop offset="100%" stopColor="hsl(45 80% 65%)" />
          </radialGradient>
          <radialGradient id="craterGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(45 60% 70%)" />
            <stop offset="100%" stopColor="hsl(45 40% 60%)" />
          </radialGradient>
        </defs>

        {/* Moon body */}
        <circle cx="50" cy="50" r="45" fill="url(#moonGradient)" />

        {/* Craters */}
        <circle cx="35" cy="35" r="8" fill="url(#craterGradient)" opacity="0.5" />
        <circle cx="60" cy="25" r="5" fill="url(#craterGradient)" opacity="0.4" />
        <circle cx="70" cy="55" r="10" fill="url(#craterGradient)" opacity="0.45" />
        <circle cx="40" cy="65" r="6" fill="url(#craterGradient)" opacity="0.35" />
        <circle cx="55" cy="70" r="4" fill="url(#craterGradient)" opacity="0.3" />

        {/* Highlight */}
        <ellipse cx="35" cy="30" rx="15" ry="12" fill="hsl(45 100% 95%)" opacity="0.3" />
      </svg>

      {/* Sparkles */}
      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-stars animate-twinkle" />
      <div
        className="absolute top-2 -left-2 w-1.5 h-1.5 rounded-full bg-stars animate-twinkle"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="absolute -bottom-1 right-3 w-1 h-1 rounded-full bg-stars animate-twinkle"
        style={{ animationDelay: "1s" }}
      />
    </div>
  );
}

export default MoonLogo;
