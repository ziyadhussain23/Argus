import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { MetricCard } from '@/components/MetricCard';
import { AlertCard } from '@/components/AlertCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Server,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Clock,
  Activity
} from 'lucide-react';
import { serversApi, alertsApi, Server as ServerType, Alert, Metric } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useRealtime } from '@/hooks/use-realtime';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const METRIC_TYPES = ['CPU_USAGE', 'MEMORY_USAGE', 'DISK_USAGE', 'LOAD_AVERAGE'];

export default function ServerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [server, setServer] = useState<ServerType | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [metrics, setMetrics] = useState<Record<string, Metric[]>>({});
  const [latestMetrics, setLatestMetrics] = useState<Record<string, Metric>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const realtimeSubscriptions = useMemo(() => {
    if (!id) return [];
    const serverId = Number(id);

    return [
      {
        topic: `/topic/servers/${serverId}`,
        onMessage: (updated: ServerType) => {
          setServer((prev) => (prev ? { ...prev, ...updated } : updated));
        },
      },
      {
        topic: `/topic/servers/${serverId}/metrics`,
        onMessage: (incoming: Metric[]) => {
          if (!incoming || incoming.length === 0) return;

          setMetrics((prev) => {
            const next = { ...prev };

            incoming.forEach((metric) => {
              const list = next[metric.metricType] ? [...next[metric.metricType]] : [];
              list.push(metric);
              if (list.length > 60) {
                list.splice(0, list.length - 60);
              }
              next[metric.metricType] = list;
            });

            return next;
          });

          setLatestMetrics((prev) => {
            const next = { ...prev };
            incoming.forEach((metric) => {
              next[metric.metricType] = metric;
            });
            return next;
          });
        },
      },
      {
        topic: `/topic/alerts/server/${serverId}`,
        onMessage: (alert: Alert) => {
          setAlerts((prev) => {
            if (alert.status === 'RESOLVED') {
              return prev.filter((a) => a.id !== alert.id);
            }
            const index = prev.findIndex((a) => a.id === alert.id);
            if (index >= 0) {
              const next = [...prev];
              next[index] = alert;
              return next;
            }
            return [alert, ...prev];
          });
        },
      },
    ];
  }, [id]);

  useRealtime(realtimeSubscriptions, !!id);

  const fetchData = async () => {
    if (!id) return;
    
    try {
      const [serverRes, alertsRes] = await Promise.all([
        serversApi.getById(Number(id)),
        alertsApi.getByServer(Number(id)),
      ]);

      if (serverRes.success) setServer(serverRes.data);
      if (alertsRes.success) setAlerts(alertsRes.data.filter(a => a.status !== 'RESOLVED'));

      // Fetch metrics for each type
      const metricsPromises = METRIC_TYPES.map(type =>
        serversApi.getMetrics(Number(id), { type }).catch(() => ({ success: false, data: [] }))
      );
      const latestPromises = METRIC_TYPES.map(type =>
        serversApi.getLatestMetric(Number(id), type).catch(() => ({ success: false, data: null }))
      );

      const metricsResults = await Promise.all(metricsPromises);
      const latestResults = await Promise.all(latestPromises);

      const metricsMap: Record<string, Metric[]> = {};
      const latestMap: Record<string, Metric> = {};

      METRIC_TYPES.forEach((type, i) => {
        if (metricsResults[i].success) {
          metricsMap[type] = metricsResults[i].data;
        }
        if (latestResults[i].success && latestResults[i].data) {
          latestMap[type] = latestResults[i].data;
        }
      });

      setMetrics(metricsMap);
      setLatestMetrics(latestMap);
    } catch (error) {
      toast({
        title: 'Failed to fetch server details',
        description: error instanceof Error ? error.message : 'Could not load server',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const copyAgentKey = () => {
    if (server?.agentKey) {
      navigator.clipboard.writeText(server.agentKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const regenerateKey = async () => {
    if (!server) return;
    setIsRegenerating(true);
    
    try {
      const response = await serversApi.regenerateKey(server.id);
      if (response.success) {
        setServer({ ...server, agentKey: response.data });
        toast({ title: 'Agent key regenerated' });
      }
    } catch (error) {
      toast({ title: 'Failed to regenerate key', variant: 'destructive' });
    } finally {
      setIsRegenerating(false);
    }
  };

  const deleteServer = async () => {
    if (!server) return;
    
    try {
      await serversApi.delete(server.id);
      toast({ title: 'Server deleted' });
      navigate('/servers');
    } catch (error) {
      toast({ title: 'Failed to delete server', variant: 'destructive' });
    }
  };

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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!server) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <h2 className="font-display text-xl font-semibold">Server not found</h2>
          <Button className="mt-4" onClick={() => navigate('/servers')}>
            Back to Servers
          </Button>
        </div>
      </MainLayout>
    );
  }

  const cpuChartData = (metrics['CPU_USAGE'] || []).map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString(),
    value: m.value,
  }));

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/servers')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Servers
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                <Server className="h-7 w-7 text-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    {server.name}
                  </h1>
                  <StatusBadge status={server.status} />
                </div>
                <p className="text-muted-foreground">{server.hostAddress}</p>
              </div>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Server?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {server.name} and all its metrics and alerts.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteServer}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="CPU Usage"
            value={latestMetrics['CPU_USAGE']?.value?.toFixed(1) ?? '--'}
            unit="%"
            icon={<Cpu className="h-5 w-5" />}
            status={
              (latestMetrics['CPU_USAGE']?.value ?? 0) > 90 ? 'critical' :
              (latestMetrics['CPU_USAGE']?.value ?? 0) > 70 ? 'warning' : 'normal'
            }
          />
          <MetricCard
            title="Memory Usage"
            value={latestMetrics['MEMORY_USAGE']?.value?.toFixed(1) ?? '--'}
            unit="%"
            icon={<MemoryStick className="h-5 w-5" />}
            status={
              (latestMetrics['MEMORY_USAGE']?.value ?? 0) > 90 ? 'critical' :
              (latestMetrics['MEMORY_USAGE']?.value ?? 0) > 70 ? 'warning' : 'normal'
            }
          />
          <MetricCard
            title="Disk Usage"
            value={latestMetrics['DISK_USAGE']?.value?.toFixed(1) ?? '--'}
            unit="%"
            icon={<HardDrive className="h-5 w-5" />}
            status={
              (latestMetrics['DISK_USAGE']?.value ?? 0) > 90 ? 'critical' :
              (latestMetrics['DISK_USAGE']?.value ?? 0) > 80 ? 'warning' : 'normal'
            }
          />
          <MetricCard
            title="Load Average"
            value={latestMetrics['LOAD_AVERAGE']?.value?.toFixed(2) ?? '--'}
            icon={<Activity className="h-5 w-5" />}
          />
        </div>

        {/* CPU Chart */}
        {cpuChartData.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              CPU Usage Over Time
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cpuChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Server Info */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Server Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Operating System</span>
                  <span className="text-foreground">{server.operatingSystem}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-foreground">
                    {formatDistanceToNow(new Date(server.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Heartbeat</span>
                  <span className="text-foreground">
                    {server.lastHeartbeat 
                      ? formatDistanceToNow(new Date(server.lastHeartbeat), { addSuffix: true })
                      : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Agent Key */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Agent Key
              </h3>
              
              <div className="flex gap-2">
                <Input
                  value={server.agentKey}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button variant="outline" size="icon" onClick={copyAgentKey}>
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={regenerateKey}
                  disabled={isRegenerating}
                >
                  <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this key to configure the Argus agent on your server.
              </p>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Active Alerts ({alerts.length})
            </h3>
            
            {alerts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                <Check className="mx-auto h-8 w-8 text-success" />
                <p className="mt-2 text-sm text-muted-foreground">No active alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
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
