import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  status?: 'normal' | 'warning' | 'critical';
  className?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  status = 'normal',
  className,
}: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  const statusGlow = {
    normal: '',
    warning: 'ring-1 ring-warning/30 glow-warning',
    critical: 'ring-1 ring-critical/30 glow-critical',
  };

  return (
    <div className={cn('metric-card', statusGlow[status], className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-3xl font-bold text-foreground">
              {value}
            </span>
            {unit && (
              <span className="text-lg text-muted-foreground">{unit}</span>
            )}
          </div>
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      
      {trend && trendValue && (
        <div className="mt-4 flex items-center gap-1.5">
          <TrendIcon
            className={cn(
              'h-4 w-4',
              trend === 'up' && 'text-success',
              trend === 'down' && 'text-critical',
              trend === 'stable' && 'text-muted-foreground'
            )}
          />
          <span
            className={cn(
              'text-sm font-medium',
              trend === 'up' && 'text-success',
              trend === 'down' && 'text-critical',
              trend === 'stable' && 'text-muted-foreground'
            )}
          >
            {trendValue}
          </span>
          <span className="text-sm text-muted-foreground">vs last hour</span>
        </div>
      )}
      
      {/* Decorative gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </div>
  );
}
