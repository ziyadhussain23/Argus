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
        'group block rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-lg',
        borderColor[server.status]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
            <Server className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
              {server.name}
            </h3>
            <p className="text-sm text-muted-foreground">{server.hostAddress}</p>
          </div>
        </div>
        <StatusBadge status={server.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{lastHeartbeat}</span>
        </div>
        {server.activeAlerts > 0 && (
          <div className="flex items-center gap-2 text-sm text-warning">
            <AlertTriangle className="h-4 w-4" />
            <span>{server.activeAlerts} active alert{server.activeAlerts !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">{server.operatingSystem}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </div>
    </Link>
  );
}
