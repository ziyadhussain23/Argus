import { cn } from '@/lib/utils';

const sizeMap = {
  xs: { box: 24, icon: 24, text: 'text-base', gap: 'gap-2' },
  sm: { box: 36, icon: 36, text: 'text-xl', gap: 'gap-2.5' },
  md: { box: 44, icon: 44, text: 'text-2xl', gap: 'gap-3' },
  lg: { box: 80, icon: 80, text: 'text-4xl', gap: 'gap-4' },
  xl: { box: 120, icon: 120, text: 'text-5xl', gap: 'gap-5' },
};

interface ArgusLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  animated?: boolean;
}

function LogoIcon({ size, animated }: { size: number; animated?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={animated ? 'drop-shadow-[0_0_12px_rgba(99,102,241,0.4)]' : undefined}
    >
      <defs>
        <linearGradient id="argus-bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="argus-pulse" x1="148" y1="160" x2="364" y2="252" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e0e7ff" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        <filter id="argus-glow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Rounded square background */}
      <rect width="512" height="512" rx="112" fill="url(#argus-bg)" />
      <rect x="2" y="2" width="508" height="508" rx="110" fill="none" stroke="#fff" strokeWidth="2" opacity="0.1" />
      {/* Monitor frame */}
      <rect x="116" y="108" width="280" height="196" rx="24" fill="#1e1b4b" stroke="#a5b4fc" strokeWidth="4" opacity="0.9" />
      {/* Screen area */}
      <rect x="132" y="124" width="248" height="164" rx="12" fill="#0f0a2e" />
      {/* Heartbeat / pulse line */}
      <polyline
        points="148,216 180,216 200,216 216,180 236,252 256,160 276,240 296,192 316,208 340,208 364,208"
        fill="none"
        stroke="url(#argus-pulse)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#argus-glow)"
      />
      {/* Live dot */}
      <circle cx="364" cy="208" r="10" fill="#34d399" />
      <circle cx="364" cy="208" r="16" fill="#34d399" opacity="0.25" />
      {/* Monitor stand */}
      <rect x="228" y="308" width="56" height="24" rx="4" fill="#1e1b4b" />
      <rect x="200" y="332" width="112" height="16" rx="8" fill="#1e1b4b" stroke="#a5b4fc" strokeWidth="2" opacity="0.6" />
      {/* Bottom metric dots */}
      <circle cx="196" cy="388" r="12" fill="#34d399" opacity="0.8" />
      <circle cx="236" cy="388" r="12" fill="#a78bfa" opacity="0.8" />
      <circle cx="276" cy="388" r="12" fill="#fbbf24" opacity="0.8" />
      <circle cx="316" cy="388" r="12" fill="#60a5fa" opacity="0.8" />
    </svg>
  );
}

export function ArgusLogo({ size = 'sm', showText = true, className, animated }: ArgusLogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn('flex items-center', s.gap, className)}>
      <div className="relative flex-shrink-0">
        <LogoIcon size={s.box} animated={animated} />
      </div>
      {showText && (
        <span className={cn('font-display font-bold text-foreground tracking-tight', s.text)}>
          Argus
        </span>
      )}
    </div>
  );
}

export function ArgusLogoGlow({ size = 'lg', showText = true, className }: ArgusLogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative">
        {/* Glow backdrop */}
        <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-3xl scale-150" />
        <div className="relative">
          <LogoIcon size={s.box} animated />
        </div>
      </div>
      {showText && (
        <span className={cn('font-display font-bold text-foreground tracking-tight mt-4', s.text)}>
          Argus
        </span>
      )}
    </div>
  );
}
