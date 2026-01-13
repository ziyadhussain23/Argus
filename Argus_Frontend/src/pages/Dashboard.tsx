import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/MetricCard';
import { ServerCard } from '@/components/ServerCard';
import { AlertCard } from '@/components/AlertCard';
import { Button } from '@/components/ui/button';
import { 
  Server, 
  AlertTriangle, 
  Activity, 
  Shield, 
  Plus,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { serversApi, alertsApi, Server as ServerType, Alert } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [servers, setServers] = useState<ServerType[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [serversRes, alertsRes] = await Promise.all([
        serversApi.getAll(),
        alertsApi.getActive(),
      ]);
      
      if (serversRes.success) setServers(serversRes.data);
      if (alertsRes.success) setAlerts(alertsRes.data);
    } catch (error) {
      toast({
        title: 'Failed to fetch data',
        description: error instanceof Error ? error.message : 'Could not load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
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

  const stats = {
    totalServers: servers.length,
    onlineServers: servers.filter(s => s.status === 'ONLINE').length,
    activeAlerts: alerts.length,
    criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length,
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Monitor your infrastructure at a glance
            </p>
          </div>
          <Link to="/servers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Server
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Servers"
            value={stats.totalServers}
            icon={<Server className="h-5 w-5" />}
          />
          <MetricCard
            title="Online Servers"
            value={stats.onlineServers}
            unit={`/ ${stats.totalServers}`}
            icon={<Activity className="h-5 w-5" />}
            status={stats.onlineServers === stats.totalServers ? 'normal' : 'warning'}
          />
          <MetricCard
            title="Active Alerts"
            value={stats.activeAlerts}
            icon={<AlertTriangle className="h-5 w-5" />}
            status={stats.criticalAlerts > 0 ? 'critical' : stats.activeAlerts > 0 ? 'warning' : 'normal'}
          />
          <MetricCard
            title="Critical Alerts"
            value={stats.criticalAlerts}
            icon={<Shield className="h-5 w-5" />}
            status={stats.criticalAlerts > 0 ? 'critical' : 'normal'}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Servers Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground">Servers</h2>
              <Link to="/servers" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            {servers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                <Server className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 font-medium text-foreground">No servers yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your first server to start monitoring
                </p>
                <Link to="/servers/new">
                  <Button className="mt-4" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Server
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {servers.slice(0, 4).map((server) => (
                  <ServerCard key={server.id} server={server} />
                ))}
              </div>
            )}
          </div>

          {/* Alerts Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground">Active Alerts</h2>
              <Link to="/alerts" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            {alerts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                <Shield className="mx-auto h-10 w-10 text-success" />
                <h3 className="mt-4 font-medium text-foreground">All clear!</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No active alerts at the moment
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 3).map((alert) => (
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
        </div>
      </div>
    </MainLayout>
  );
}
