import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AlertCard } from '@/components/AlertCard';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Loader2, 
  Filter,
  Shield
} from 'lucide-react';
import { alertsApi, Alert } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchAlerts = async () => {
    try {
      const response = await alertsApi.getActive();
      if (response.success) {
        setAlerts(response.data);
      }
    } catch (error) {
      toast({
        title: 'Failed to fetch alerts',
        description: error instanceof Error ? error.message : 'Could not load alerts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAcknowledge = async (alertId: number) => {
    try {
      await alertsApi.acknowledge(alertId);
      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' as const } : a
      ));
      toast({ title: 'Alert acknowledged' });
    } catch (error) {
      toast({ title: 'Failed to acknowledge alert', variant: 'destructive' });
    }
  };

  const handleResolve = async (alertId: number) => {
    try {
      await alertsApi.resolve(alertId);
      setAlerts(alerts.filter(a => a.id !== alertId));
      toast({ title: 'Alert resolved' });
    } catch (error) {
      toast({ title: 'Failed to resolve alert', variant: 'destructive' });
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    return matchesSeverity && matchesStatus;
  });

  const counts = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'CRITICAL').length,
    warning: alerts.filter(a => a.severity === 'WARNING').length,
    active: alerts.filter(a => a.status === 'ACTIVE').length,
    acknowledged: alerts.filter(a => a.status === 'ACKNOWLEDGED').length,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Alerts</h1>
          <p className="mt-1 text-muted-foreground">
            Monitor and manage system alerts
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Active</p>
            <p className="font-display text-2xl font-bold text-foreground">{counts.total}</p>
          </div>
          <div className="rounded-lg border border-critical/30 bg-critical/5 p-4">
            <p className="text-sm text-muted-foreground">Critical</p>
            <p className="font-display text-2xl font-bold text-critical">{counts.critical}</p>
          </div>
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
            <p className="text-sm text-muted-foreground">Warning</p>
            <p className="font-display text-2xl font-bold text-warning">{counts.warning}</p>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground">Acknowledged</p>
            <p className="font-display text-2xl font-bold text-primary">{counts.acknowledged}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter by:</span>
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="WARNING">Warning</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Alerts List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
            <Shield className="mx-auto h-12 w-12 text-success" />
            <h3 className="mt-4 font-display text-lg font-medium text-foreground">
              {alerts.length === 0 ? 'All clear!' : 'No matching alerts'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {alerts.length === 0
                ? 'No active alerts at the moment'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={handleAcknowledge}
                onResolve={handleResolve}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
