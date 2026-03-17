import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
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
  Clock,
  Activity,
  Terminal,
  LineChartIcon,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Palette,
  Pencil,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { serversApi, alertsApi, getApiBaseUrl, type Server as ServerType, type Alert, type Metric } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRealtime } from '@/hooks/use-realtime';
import { RealtimeSubscription } from '@/hooks/use-realtime';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts';

type ChartType = 'line' | 'area' | 'bar';

const METRIC_TYPES = [
  'CPU_USAGE',
  'MEMORY_USAGE',
  'DISK_USAGE',
  'LOAD_AVERAGE',
  'PROCESS_COUNT',
  'UPTIME',
  'MEMORY_TOTAL',
  'MEMORY_AVAILABLE',
  'DISK_TOTAL',
  'DISK_AVAILABLE',
];

type MetricMap = Record<string, Metric[]>;
type MetricLatestMap = Record<string, Metric>;

const CHART_COLORS = [
  { name: 'Default', value: '' },
  { name: 'Blue', value: 'hsl(221.2 83.2% 53.3%)' },
  { name: 'Purple', value: 'hsl(262.1 83.3% 57.8%)' },
  { name: 'Pink', value: 'hsl(316 70% 50%)' },
  { name: 'Red', value: 'hsl(0 84.2% 60.2%)' },
  { name: 'Orange', value: 'hsl(24.6 95% 53.1%)' },
  { name: 'Green', value: 'hsl(142.1 76.2% 36.3%)' },
  { name: 'Teal', value: 'hsl(175 80% 40%)' },
  { name: 'Cyan', value: 'hsl(190 90% 50%)' },
];

export default function ServerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [server, setServer] = useState<ServerType | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [metrics, setMetrics] = useState<MetricMap>({});
  const [latestMetrics, setLatestMetrics] = useState<MetricLatestMap>({});
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cpuChartType, setCpuChartType] = useState<ChartType>('line');
  const [memoryChartType, setMemoryChartType] = useState<ChartType>('line');
  const [cpuChartColor, setCpuChartColor] = useState<string>('');
  const [memoryChartColor, setMemoryChartColor] = useState<string>('');

  const serverId = id && !isNaN(Number(id)) ? Number(id) : null;

  const realtimeSubscriptions = useMemo<RealtimeSubscription[]>(() => {
    if (!serverId) return [];

    return [
      {
        topic: `/topic/servers/${serverId}/metrics`,
        onMessage: (incoming: Metric[]) => {
          setMetrics((prev) => {
            const next = { ...prev };
            incoming.forEach((metric) => {
              const list = [...(next[metric.metricType] || []), metric];
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
  }, [serverId]);

  useRealtime(realtimeSubscriptions, !!serverId);

  const fetchData = async () => {
    if (!serverId) return;

    try {
      const [serverRes, alertsRes] = await Promise.all([
        serversApi.getById(serverId),
        alertsApi.getByServer(serverId),
      ]);

      if (serverRes.success) setServer(serverRes.data);
      if (alertsRes.success) setAlerts(alertsRes.data.filter(a => a.status !== 'RESOLVED'));

      const metricsPromises = METRIC_TYPES.map(type =>
        serversApi.getMetrics(serverId, { type }).catch(() => ({ success: false, data: [] }))
      );
      const latestPromises = METRIC_TYPES.map(type =>
        serversApi.getLatestMetric(serverId, type).catch(() => ({ success: false, data: null }))
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

  const handleAcknowledge = async (alertId: number, _note?: string) => {
    try {
      await alertsApi.acknowledge(alertId);
      setAlerts(prev => prev.map(a =>
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
      setAlerts(prev => prev.filter(a => a.id !== alertId));
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

  const memoryChartData = (metrics['MEMORY_USAGE'] || []).map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString(),
    value: m.value,
  }));

  // Calculate disk and memory info
  const memoryTotal = latestMetrics['MEMORY_TOTAL']?.value ?? 0;
  const memoryAvailable = latestMetrics['MEMORY_AVAILABLE']?.value ?? 0;
  const memoryUsed = memoryTotal - memoryAvailable;

  const diskTotal = latestMetrics['DISK_TOTAL']?.value ?? 0;
  const diskAvailable = latestMetrics['DISK_AVAILABLE']?.value ?? 0;
  const diskUsed = diskTotal - diskAvailable;

  const formatSize = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  /**
   * Reusable chart renderer — eliminates duplication between the CPU and Memory chart blocks.
   */
  const renderMetricChart = (opts: {
    title: string;
    data: { time: string; value: number }[];
    chartType: ChartType;
    setChartType: (t: ChartType) => void;
    chartColor: string;
    setChartColor: (c: string) => void;
    defaultColor: string;
  }) => {
    const { title, data, chartType: ct, setChartType: setCt, chartColor, setChartColor: setCc, defaultColor } = opts;
    if (data.length === 0) return null;
    const color = chartColor || defaultColor;
    // Replace only the LAST ')' to safely handle hsl(var(--foo)) patterns
    const makeAlpha = (c: string) => {
      const idx = c.lastIndexOf(')');
      if (idx === -1) return c;
      return c.slice(0, idx) + ' / 0.3)' + c.slice(idx + 1);
    };
    const fillColor = chartColor ? makeAlpha(chartColor) : makeAlpha(defaultColor);
    const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' };
    const axisStroke = 'hsl(var(--muted-foreground))';
    const gridStroke = 'hsl(var(--border))';

    return (
      <div className="rounded-xl border-2 border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
          <div className="flex gap-1 rounded-lg border border-border p-1 bg-muted/50">
            <Button variant={ct === 'line' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCt('line')} className="h-7 px-2 gap-1 text-xs">
              <LineChartIcon className="h-3 w-3" /> Line
            </Button>
            <Button variant={ct === 'area' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCt('area')} className="h-7 px-2 gap-1 text-xs">
              <TrendingUp className="h-3 w-3" /> Area
            </Button>
            <Button variant={ct === 'bar' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCt('bar')} className="h-7 px-2 gap-1 text-xs">
              <BarChart3 className="h-3 w-3" /> Bar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 rounded-md p-0" style={chartColor ? { color: chartColor } : {}}>
                  <Palette className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Chart Color</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="grid grid-cols-4 gap-2 p-2">
                  {CHART_COLORS.map((c) => (
                    <DropdownMenuItem key={c.name} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md p-0 hover:bg-muted focus:bg-muted" onClick={() => setCc(c.value)} title={c.name}>
                      {c.value ? (
                        <div className="h-6 w-6 rounded-full border border-border shadow-sm" style={{ backgroundColor: c.value }} />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-foreground/50 bg-background text-[10px] font-medium text-foreground">/</div>
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {ct === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" stroke={axisStroke} fontSize={12} />
                <YAxis stroke={axisStroke} fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
              </LineChart>
            ) : ct === 'area' ? (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" stroke={axisStroke} fontSize={12} />
                <YAxis stroke={axisStroke} fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="value" stroke={color} fill={fillColor} strokeWidth={2} />
              </AreaChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" stroke={axisStroke} fontSize={12} />
                <YAxis stroke={axisStroke} fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

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

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/servers/${id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
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
        </div>

        {/* Installation Instructions */}
        {server.status === 'OFFLINE' && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Agent Installation</CardTitle>
              </div>
              <CardDescription>
                Run this command on your server to install the agent and start sending metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative rounded-md bg-muted p-4 pr-12 font-mono text-sm max-w-full overflow-x-auto">
                <p className="whitespace-pre-wrap break-all">
                  curl -sSL https://raw.githubusercontent.com/nightswatch/Argus/main/agent/argus-agent.sh | ARGUS_SERVER_URL={getApiBaseUrl().replace('/api/v1', '')} AGENT_KEY={server.agentKey} bash
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 bg-background/50 hover:bg-background"
                  onClick={() => {
                    const command = `curl -sSL https://raw.githubusercontent.com/nightswatch/Argus/main/agent/argus-agent.sh | ARGUS_SERVER_URL=${getApiBaseUrl().replace('/api/v1', '')} AGENT_KEY=${server.agentKey} bash`;
                    navigator.clipboard.writeText(command);
                    toast({ title: 'Command copied!' });
                  }}
                  aria-label="Copy install command"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
        {renderMetricChart({
          title: 'CPU Usage Over Time',
          data: cpuChartData,
          chartType: cpuChartType,
          setChartType: setCpuChartType,
          chartColor: cpuChartColor,
          setChartColor: setCpuChartColor,
          defaultColor: 'hsl(var(--primary))',
        })}

        {/* Memory Chart */}
        {renderMetricChart({
          title: 'Memory Usage Over Time',
          data: memoryChartData,
          chartType: memoryChartType,
          setChartType: setMemoryChartType,
          chartColor: memoryChartColor,
          setChartColor: setMemoryChartColor,
          defaultColor: 'hsl(142 76% 36%)',
        })}

        {/* Disk & Memory Info */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Memory Information */}
          <div className="rounded-xl border-2 border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MemoryStick className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-semibold text-foreground">
                Memory Information
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold text-foreground">{formatSize(memoryTotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Used</span>
                <span className="font-semibold text-warning">{formatSize(memoryUsed)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Available</span>
                <span className="font-semibold text-success">{formatSize(memoryAvailable)}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${memoryTotal > 0 ? (memoryUsed / memoryTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Disk Information */}
          <div className="rounded-xl border-2 border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-semibold text-foreground">
                Disk Information
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold text-foreground">{formatSize(diskTotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Used</span>
                <span className="font-semibold text-warning">{formatSize(diskUsed)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Available</span>
                <span className="font-semibold text-success">{formatSize(diskAvailable)}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${diskTotal > 0 ? (diskUsed / diskTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* CPU & System Info */}
          <div className="space-y-6">
            {/* CPU Information */}
            <div className="rounded-xl border-2 border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="h-5 w-5 text-primary" />
                <h3 className="font-display text-lg font-semibold text-foreground">
                  CPU Information
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processor</span>
                  <span className="text-foreground font-medium">{server.operatingSystem || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Usage</span>
                  <span className={`font-semibold ${(latestMetrics['CPU_USAGE']?.value ?? 0) > 80 ? 'text-critical' :
                    (latestMetrics['CPU_USAGE']?.value ?? 0) > 60 ? 'text-warning' : 'text-success'
                    }`}>
                    {latestMetrics['CPU_USAGE']?.value?.toFixed(1) ?? '--'}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Load Average</span>
                  <span className="text-foreground font-medium">
                    {latestMetrics['LOAD_AVERAGE']?.value?.toFixed(2) ?? '--'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Process Count</span>
                  <span className="text-foreground font-medium">
                    {latestMetrics['PROCESS_COUNT']?.value?.toFixed(0) ?? '--'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="text-foreground font-medium">
                    {latestMetrics['UPTIME']?.value
                      ? `${Math.floor(latestMetrics['UPTIME'].value / 86400)}d ${Math.floor((latestMetrics['UPTIME'].value % 86400) / 3600)}h`
                      : '--'}
                  </span>
                </div>
              </div>
            </div>

            {/* Server Info */}
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

            {/* Agent Health */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Agent Health
                </h3>
              </div>

              {(() => {
                const heartbeat = server.lastHeartbeat ? new Date(server.lastHeartbeat) : null;
                const now = new Date();
                const diffMs = heartbeat ? now.getTime() - heartbeat.getTime() : Infinity;
                const diffMin = diffMs / 60000;

                let statusColor = 'text-muted-foreground';
                let statusBg = 'bg-muted';
                let statusLabel = 'Unknown';
                let StatusIcon = WifiOff;

                if (diffMin <= 2) {
                  statusColor = 'text-success';
                  statusBg = 'bg-success/10';
                  statusLabel = 'Connected';
                  StatusIcon = Wifi;
                } else if (diffMin <= 5) {
                  statusColor = 'text-warning';
                  statusBg = 'bg-warning/10';
                  statusLabel = 'Delayed';
                  StatusIcon = Wifi;
                } else if (heartbeat) {
                  statusColor = 'text-critical';
                  statusBg = 'bg-critical/10';
                  statusLabel = 'Disconnected';
                  StatusIcon = WifiOff;
                }

                return (
                  <div className="space-y-3">
                    <div className={`flex items-center gap-3 rounded-lg ${statusBg} p-3`}>
                      <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                      <div>
                        <p className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</p>
                        <p className="text-xs text-muted-foreground">
                          {heartbeat
                            ? `Last heartbeat ${formatDistanceToNow(heartbeat, { addSuffix: true })}`
                            : 'No heartbeat received yet'}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className="text-foreground font-medium">{server.status}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Active Alerts</span>
                      <span className="text-foreground font-medium">{server.activeAlerts}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">OS</span>
                      <span className="text-foreground font-medium">{server.operatingSystem || 'N/A'}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Agent Key */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Agent Key
              </h3>

              <div className="flex gap-2">
                <Input
                  type="password"
                  value={server.agentKey}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button variant="outline" size="icon" onClick={copyAgentKey} aria-label="Copy agent key">
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
                  aria-label="Regenerate agent key"
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
