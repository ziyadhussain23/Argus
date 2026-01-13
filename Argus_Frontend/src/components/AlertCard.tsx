import { Alert } from '@/lib/api';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Bell, Check, CheckCircle2, Server, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge?: (alertId: number) => void;
  onResolve?: (alertId: number) => void;
  isLoading?: boolean;
}

export function AlertCard({ alert, onAcknowledge, onResolve, isLoading }: AlertCardProps) {
  const triggeredTime = formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true });

  const severityStyles = {
    INFO: 'border-l-primary',
    WARNING: 'border-l-warning',
    CRITICAL: 'border-l-critical',
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-5 border-l-4 transition-all animate-fade-in',
        severityStyles[alert.severity]
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              alert.severity === 'CRITICAL' && 'bg-critical/10 text-critical',
              alert.severity === 'WARNING' && 'bg-warning/10 text-warning',
              alert.severity === 'INFO' && 'bg-primary/10 text-primary'
            )}
          >
            <Bell className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-medium text-foreground">{alert.title}</h4>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Server className="h-3.5 w-3.5" />
                {alert.serverName}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {triggeredTime}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={alert.status} size="sm" />
          <StatusBadge status={alert.severity} showDot={false} size="sm" />
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">
        {alert.message}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <div className="text-sm text-muted-foreground">
          Value: <span className="text-foreground font-medium">{alert.metricValue}</span>
          {' / Threshold: '}
          <span className="text-foreground font-medium">{alert.thresholdValue}</span>
        </div>
        
        {alert.status === 'ACTIVE' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAcknowledge?.(alert.id)}
              disabled={isLoading}
            >
              <Check className="mr-1 h-3.5 w-3.5" />
              Acknowledge
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onResolve?.(alert.id)}
              disabled={isLoading}
            >
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Resolve
            </Button>
          </div>
        )}
        
        {alert.status === 'ACKNOWLEDGED' && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onResolve?.(alert.id)}
            disabled={isLoading}
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Resolve
          </Button>
        )}
      </div>
    </div>
  );
}
