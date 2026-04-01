import { Link } from 'react-router-dom';
import { Server as ServerType } from '@/lib/api';
import { StatusBadge } from './StatusBadge';
import { Server, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ServerCardProps {
  server: ServerType;
}

export function ServerCard({ server }: ServerCardProps) {
  const lastHeartbeat = server.lastHeartbeat
    ? formatDistanceToNow(new Date(server.lastHeartbeat), { addSuffix: true })
    : 'Never';

  // Compute a health score (0-100) based on status and active alerts
  const getHealthScore = (): number => {
    let score = 100;
    if (server.status === 'OFFLINE') score -= 60;
    else if (server.status === 'CRITICAL') score -= 50;
    else if (server.status === 'WARNING') score -= 25;
    else if (server.status === 'UNKNOWN') score -= 40;
    // Deduct for active alerts
    score -= Math.min(server.activeAlerts * 10, 30);
    return Math.max(0, Math.min(100, score));
  };

  const healthScore = getHealthScore();
  const healthColor = healthScore >= 80 ? 'text-green-500 bg-green-500/10' :
    healthScore >= 50 ? 'text-amber-500 bg-amber-500/10' : 'text-red-500 bg-red-500/10';

  const borderColor = {
    ONLINE: 'hover:border-green-500/50',
    OFFLINE: 'hover:border-red-500/50',
    WARNING: 'border-warning/30 hover:border-warning/50',
    CRITICAL: 'border-critical/30 hover:border-critical/50',
    UNKNOWN: 'hover:border-muted-foreground/50',
  };

  return (
    <Link
      to={`/servers/${server.id}`}
      className={cn(
        'group block rounded-xl border border-border bg-card p-4 sm:p-5 transition-all duration-300 hover:shadow-lg',
        borderColor[server.status]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
            <Server className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[160px] sm:max-w-none">
              {server.name}
            </h3>
            <p className="text-sm text-muted-foreground">{server.hostAddress}</p>
          </div>
        </div>
        <StatusBadge status={server.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{lastHeartbeat}</span>
        </div>
        <div className="flex items-center justify-end gap-2">
          {server.activeAlerts > 0 && (
            <span className="flex items-center gap-1 text-sm text-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              {server.activeAlerts}
            </span>
          )}
          <span className={cn(
            'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold',
            healthColor
          )}>
            {healthScore}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 flex-wrap border-t border-border pt-4">
        <span className="text-xs text-muted-foreground truncate">{server.operatingSystem}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </div>
    </Link>
  );
}
