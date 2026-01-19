import { useTheme } from '@/contexts/ThemeContext';

export function AnimatedBackground() {
  const { theme } = useTheme();

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
        {[...Array(50)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Small Water Bubbles */}
      <div className="bubbles-container">
        {[...Array(30)].map((_, i) => (
          <div
            key={`bubble-${i}`}
            className={`bubble ${theme === 'dark' ? 'bubble-dark' : 'bubble-light'}`}
            style={{
              left: `${Math.random() * 100}%`,
              width: `${4 + Math.random() * 10}px`,
              height: `${4 + Math.random() * 10}px`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${10 + Math.random() * 15}s`,
            }}
          />
        ))}
      </div>

      {/* Diamonds - bottom-left to top-right diagonal */}
      <div className="diamonds-container">
        {[...Array(25)].map((_, i) => {
          const size = 4 + Math.random() * 6;
          return (
            <div
              key={`diamond-${i}`}
              className={`diamond ${theme === 'dark' ? 'diamond-dark' : 'diamond-light'}`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                bottom: `${-5 + (i * 4)}%`,
                left: `${-5 + (i * 4)}%`,
                animationDelay: `${i * 1}s`,
                animationDuration: `${15 + Math.random() * 10}s`,
              }}
            />
          );
        })}
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
