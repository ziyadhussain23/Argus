import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export function AnimatedBackground() {
  const { theme } = useTheme();

  // Pre-compute all random values once so they're stable across re-renders
  const stars = useMemo(
    () =>
      Array.from({ length: 50 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${2 + Math.random() * 2}s`,
      })),
    []
  );

  const bubbles = useMemo(
    () =>
      Array.from({ length: 30 }, () => {
        const size = 4 + Math.random() * 10;
        return {
          left: `${Math.random() * 100}%`,
          width: `${size}px`,
          height: `${size}px`,
          animationDelay: `${Math.random() * 15}s`,
          animationDuration: `${10 + Math.random() * 15}s`,
        };
      }),
    []
  );

  const diamonds = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => {
        const size = 4 + Math.random() * 6;
        return {
          width: `${size}px`,
          height: `${size}px`,
          bottom: `${-5 + i * 4}%`,
          left: `${-5 + i * 4}%`,
          animationDelay: `${i * 1}s`,
          animationDuration: `${15 + Math.random() * 10}s`,
        };
      }),
    []
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient background */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
            : 'bg-gradient-to-br from-slate-100 via-white to-slate-200'
        }`}
      />

      {/* Stars - visible in both modes */}
      <div className={`stars-container ${theme === 'dark' ? 'opacity-100' : 'opacity-30'} transition-opacity duration-500`}>
        {stars.map((style, i) => (
          <div key={`star-${i}`} className="star" style={style} />
        ))}
      </div>

      {/* Small Water Bubbles */}
      <div className="bubbles-container">
        {bubbles.map((style, i) => (
          <div
            key={`bubble-${i}`}
            className={`bubble ${theme === 'dark' ? 'bubble-dark' : 'bubble-light'}`}
            style={style}
          />
        ))}
      </div>

      {/* Diamonds - bottom-left to top-right diagonal */}
      <div className="diamonds-container">
        {diamonds.map((style, i) => (
          <div
            key={`diamond-${i}`}
            className={`diamond ${theme === 'dark' ? 'diamond-dark' : 'diamond-light'}`}
            style={style}
          />
        ))}
      </div>

      {/* Subtle floating orbs */}
      <div
        className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl transition-colors duration-500 ${
          theme === 'dark'
            ? 'bg-primary/3'
            : 'bg-primary/5'
        }`}
        style={{ animation: 'float 25s ease-in-out infinite' }}
      />
      <div
        className={`absolute bottom-1/3 right-1/3 w-48 h-48 rounded-full blur-3xl transition-colors duration-500 ${
          theme === 'dark'
            ? 'bg-emerald-500/3'
            : 'bg-emerald-500/5'
        }`}
        style={{ animation: 'float 30s ease-in-out infinite reverse' }}
      />
    </div>
  );
}
