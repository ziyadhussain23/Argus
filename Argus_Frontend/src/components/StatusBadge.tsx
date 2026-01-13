import { cn } from '@/lib/utils';

type Status = 'ONLINE' | 'OFFLINE' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
type Severity = 'INFO' | 'WARNING' | 'CRITICAL';
type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

interface StatusBadgeProps {
  status: Status | Severity | AlertStatus;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

const statusStyles: Record<string, string> = {
  ONLINE: 'bg-success/10 text-success border-success/30',
  OFFLINE: 'bg-muted text-muted-foreground border-muted-foreground/30',
  WARNING: 'bg-warning/10 text-warning border-warning/30',
  CRITICAL: 'bg-critical/10 text-critical border-critical/30',
  UNKNOWN: 'bg-muted text-muted-foreground border-muted-foreground/30',
  INFO: 'bg-primary/10 text-primary border-primary/30',
  ACTIVE: 'bg-critical/10 text-critical border-critical/30',
  ACKNOWLEDGED: 'bg-warning/10 text-warning border-warning/30',
  RESOLVED: 'bg-success/10 text-success border-success/30',
};

const dotStyles: Record<string, string> = {
  ONLINE: 'status-online',
  OFFLINE: 'status-offline',
  WARNING: 'status-warning',
  CRITICAL: 'status-critical',
  UNKNOWN: 'status-unknown',
  INFO: 'bg-primary',
  ACTIVE: 'status-critical',
  ACKNOWLEDGED: 'status-warning',
  RESOLVED: 'status-online',
};

export function StatusBadge({ status, showDot = true, size = 'md' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        statusStyles[status],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      {showDot && (
        <span className={cn('status-indicator', dotStyles[status])} />
      )}
      {status}
    </span>
  );
}
