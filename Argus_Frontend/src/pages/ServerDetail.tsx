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
  ChevronRight,
  Palette,
  Download,
  Upload,
  Layers,
} from 'lucide-react';
import { serversApi, alertsApi, type Server as ServerType, type Alert, type Metric } from '@/lib/api';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend
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
  'NETWORK_IN',
  'NETWORK_OUT',
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
  const [networkChartType, setNetworkChartType] = useState<ChartType>('area');
  const [netInColor, setNetInColor] = useState<string>('');
  const [netOutColor, setNetOutColor] = useState<string>('');
  const [processChartType, setProcessChartType] = useState<ChartType>('area');
  const [processChartColor, setProcessChartColor] = useState<string>('');
  const [uptimeChartType, setUptimeChartType] = useState<ChartType>('area');
  const [uptimeChartColor, setUptimeChartColor] = useState<string>('');

  const serverId = id ? Number(id) : null;

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
    if (!id || isNaN(Number(id))) {
      navigate('/servers');
      return;
    }
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

  const memoryChartData = (metrics['MEMORY_USAGE'] || []).map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString(),
    value: m.value,
  }));

  // Build combined Network I/O chart data (merge by timestamp index)
  const networkInRaw = metrics['NETWORK_IN'] || [];
  const networkOutRaw = metrics['NETWORK_OUT'] || [];
  const networkChartData = (() => {
    const map = new Map<string, { time: string; netIn: number; netOut: number }>();
    networkInRaw.forEach(m => {
      const t = new Date(m.timestamp).toLocaleTimeString();
      const entry = map.get(t) || { time: t, netIn: 0, netOut: 0 };
      entry.netIn = m.value / 1000; // convert to KB/s
      map.set(t, entry);
    });
    networkOutRaw.forEach(m => {
      const t = new Date(m.timestamp).toLocaleTimeString();
      const entry = map.get(t) || { time: t, netIn: 0, netOut: 0 };
      entry.netOut = m.value / 1000; // convert to KB/s
      map.set(t, entry);
    });
    return Array.from(map.values());
  })();

  const processChartData = (metrics['PROCESS_COUNT'] || []).map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString(),
    value: m.value,
  }));

  const uptimeChartData = (metrics['UPTIME'] || []).map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString(),
    value: Number((m.value / 3600).toFixed(2)), // convert seconds to hours
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

  const formatNetworkRate = (bytesPerSec: number) => {
    if (bytesPerSec >= 1_000_000_000) return { value: (bytesPerSec / 1_000_000_000).toFixed(1), unit: 'GB/s' };
    if (bytesPerSec >= 1_000_000) return { value: (bytesPerSec / 1_000_000).toFixed(1), unit: 'MB/s' };
    if (bytesPerSec >= 1_000) return { value: (bytesPerSec / 1_000).toFixed(1), unit: 'KB/s' };
    return { value: bytesPerSec.toFixed(0), unit: 'B/s' };
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return { value: `${d}d ${h}h`, unit: '' };
    if (h > 0) return { value: `${h}h ${m}m`, unit: '' };
    return { value: `${m}m`, unit: '' };
  };

  const netIn = latestMetrics['NETWORK_IN']?.value ?? 0;
  const netOut = latestMetrics['NETWORK_OUT']?.value ?? 0;
  const netInFmt = formatNetworkRate(netIn);
  const netOutFmt = formatNetworkRate(netOut);
  const uptimeVal = latestMetrics['UPTIME']?.value ?? 0;
  const uptimeFmt = formatUptime(uptimeVal);

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
    domain?: [number | 'auto', number | 'auto'];
    yAxisFormatter?: (v: number) => string;
    tooltipFormatter?: (v: number) => [string, string];
  }) => {
    const { title, data, chartType: ct, setChartType: setCt, chartColor, setChartColor: setCc, defaultColor, domain = [0, 100], yAxisFormatter, tooltipFormatter } = opts;
    if (data.length === 0) return null;
    const color = chartColor || defaultColor;
    const fillColor = chartColor ? `${chartColor.replace(')', ' / 0.3)')}` : `${defaultColor.replace(')', ' / 0.3)')}`;
    const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' };
    const axisStroke = 'hsl(var(--muted-foreground))';
    const gridStroke = 'hsl(var(--border))';

    return (
      <div className="rounded-xl border-2 border-border bg-card p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
          <div className="flex flex-wrap gap-1 items-center">
            <ToggleGroup
              type="single"
              value={ct}
              onValueChange={(v) => { if (v) setCt(v as ChartType); }}
              className="rounded-lg border border-border p-1 bg-muted/50"
            >
              <ToggleGroupItem value="line" className="h-7 px-2 gap-1 text-xs">
                <LineChartIcon className="h-3 w-3" /> Line
              </ToggleGroupItem>
              <ToggleGroupItem value="area" className="h-7 px-2 gap-1 text-xs">
                <TrendingUp className="h-3 w-3" /> Area
              </ToggleGroupItem>
              <ToggleGroupItem value="bar" className="h-7 px-2 gap-1 text-xs">
                <BarChart3 className="h-3 w-3" /> Bar
              </ToggleGroupItem>
            </ToggleGroup>
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
                    <DropdownMenuItem key={c.name} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md p-0 hover:bg-muted focus:bg-muted" onSelect={() => setCc(c.value)} title={c.name}>
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
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            {ct === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" stroke={axisStroke} fontSize={12} />
                <YAxis stroke={axisStroke} fontSize={12} domain={domain} tickFormatter={yAxisFormatter} />
                <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
                <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
              </LineChart>
            ) : ct === 'area' ? (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" stroke={axisStroke} fontSize={12} />
                <YAxis stroke={axisStroke} fontSize={12} domain={domain} tickFormatter={yAxisFormatter} />
                <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
                <Area type="monotone" dataKey="value" stroke={color} fill={fillColor} strokeWidth={2} />
              </AreaChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" stroke={axisStroke} fontSize={12} />
                <YAxis stroke={axisStroke} fontSize={12} domain={domain} tickFormatter={yAxisFormatter} />
                <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
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
                  curl -sSL https://raw.githubusercontent.com/nightswatch/Argus/main/agent/argus-agent.sh | ARGUS_SERVER_URL=http://localhost:8080 AGENT_KEY={server.agentKey} bash
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 bg-background/50 hover:bg-background"
                  onClick={() => {
                    const command = `curl -sSL https://raw.githubusercontent.com/nightswatch/Argus/main/agent/argus-agent.sh | ARGUS_SERVER_URL=http://localhost:8080 AGENT_KEY=${server.agentKey} bash`;
                    navigator.clipboard.writeText(command);
                    toast({ title: 'Command copied!' });
                  }}
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

        {/* Network, Processes & Uptime */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Network In"
            value={latestMetrics['NETWORK_IN'] ? netInFmt.value : '--'}
            unit={latestMetrics['NETWORK_IN'] ? netInFmt.unit : ''}
            icon={<Download className="h-5 w-5" />}
          />
          <MetricCard
            title="Network Out"
            value={latestMetrics['NETWORK_OUT'] ? netOutFmt.value : '--'}
            unit={latestMetrics['NETWORK_OUT'] ? netOutFmt.unit : ''}
            icon={<Upload className="h-5 w-5" />}
          />
          <MetricCard
            title="Processes"
            value={latestMetrics['PROCESS_COUNT']?.value?.toFixed(0) ?? '--'}
            icon={<Layers className="h-5 w-5" />}
          />
          <MetricCard
            title="Uptime"
            value={latestMetrics['UPTIME'] ? uptimeFmt.value : '--'}
            unit={uptimeFmt.unit}
            icon={<Clock className="h-5 w-5" />}
          />
        </div>

        {/* CPU Chart */}
        {cpuChartData.length > 0 && (
          <div className="rounded-xl border-2 border-border bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-display text-lg font-semibold text-foreground">
                CPU Usage Over Time
              </h3>
              <div className="flex flex-wrap gap-1 rounded-lg border border-border p-1 bg-muted/50">
                <Button
                  variant={cpuChartType === 'line' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCpuChartType('line')}
                  className="h-7 px-2 gap-1 text-xs"
                >
                  <LineChartIcon className="h-3 w-3" />
                  Line
                </Button>
                <Button
                  variant={cpuChartType === 'area' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCpuChartType('area')}
                  className="h-7 px-2 gap-1 text-xs"
                >
                  <TrendingUp className="h-3 w-3" />
                  Area
                </Button>
                <Button
                  variant={cpuChartType === 'bar' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCpuChartType('bar')}
                  className="h-7 px-2 gap-1 text-xs"
                >
                  <BarChart3 className="h-3 w-3" />
                  Bar
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 rounded-md p-0"
                      style={cpuChartColor ? { color: cpuChartColor } : {}}
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Chart Color</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="grid grid-cols-4 gap-2 p-2">
                      {CHART_COLORS.map((color) => (
                        <DropdownMenuItem
                          key={color.name}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md p-0 hover:bg-muted focus:bg-muted"
                          onSelect={() => setCpuChartColor(color.value)}
                          title={color.name}
                        >
                          {color.value ? (
                            <div
                              className="h-6 w-6 rounded-full border border-border shadow-sm"
                              style={{ backgroundColor: color.value }}
                            />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-foreground/50 bg-background text-[10px] font-medium text-foreground">
                              /
                            </div>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                {cpuChartType === 'line' ? (
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
                      stroke={cpuChartColor || "hsl(var(--primary))"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                ) : cpuChartType === 'area' ? (
                  <AreaChart data={cpuChartData}>
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
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={cpuChartColor || "hsl(var(--primary))"}
                      fill={cpuChartColor ? `${cpuChartColor.replace(')', ' / 0.3)')}` : "hsl(var(--primary) / 0.3)"}
                      strokeWidth={2}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={cpuChartData}>
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
                    <Bar
                      dataKey="value"
                      fill={cpuChartColor || "hsl(var(--primary))"}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Memory Chart */}
        {memoryChartData.length > 0 && (
          <div className="rounded-xl border-2 border-border bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Memory Usage Over Time
              </h3>
              <div className="flex flex-wrap gap-1 rounded-lg border border-border p-1 bg-muted/50">
                <Button
                  variant={memoryChartType === 'line' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setMemoryChartType('line')}
                  className="h-7 px-2 gap-1 text-xs"
                >
                  <LineChartIcon className="h-3 w-3" />
                  Line
                </Button>
                <Button
                  variant={memoryChartType === 'area' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setMemoryChartType('area')}
                  className="h-7 px-2 gap-1 text-xs"
                >
                  <TrendingUp className="h-3 w-3" />
                  Area
                </Button>
                <Button
                  variant={memoryChartType === 'bar' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setMemoryChartType('bar')}
                  className="h-7 px-2 gap-1 text-xs"
                >
                  <BarChart3 className="h-3 w-3" />
                  Bar
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 rounded-md p-0"
                      style={memoryChartColor ? { color: memoryChartColor } : {}}
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Chart Color</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="grid grid-cols-4 gap-2 p-2">
                      {CHART_COLORS.map((color) => (
                        <DropdownMenuItem
                          key={color.name}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md p-0 hover:bg-muted focus:bg-muted"
                          onSelect={() => setMemoryChartColor(color.value)}
                          title={color.name}
                        >
                          {color.value ? (
                            <div
                              className="h-6 w-6 rounded-full border border-border shadow-sm"
                              style={{ backgroundColor: color.value }}
                            />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-foreground/50 bg-background text-[10px] font-medium text-foreground">
                              /
                            </div>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                {memoryChartType === 'line' ? (
                  <LineChart data={memoryChartData}>
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
                      stroke={memoryChartColor || "hsl(142 76% 36%)"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                ) : memoryChartType === 'area' ? (
                  <AreaChart data={memoryChartData}>
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
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={memoryChartColor || "hsl(142 76% 36%)"}
                      fill={memoryChartColor ? `${memoryChartColor.replace(')', ' / 0.3)')}` : "hsl(142 76% 36% / 0.3)"}
                      strokeWidth={2}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={memoryChartData}>
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
                    <Bar
                      dataKey="value"
                      fill={memoryChartColor || "hsl(142 76% 36%)"}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Network I/O Chart */}
        {networkChartData.length > 0 && (
          <div className="rounded-xl border-2 border-border bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="font-display text-lg font-semibold text-foreground">Network I/O</h3>
              </div>
              <div className="flex flex-wrap gap-1 items-center">
                <ToggleGroup
                  type="single"
                  value={networkChartType}
                  onValueChange={(v) => { if (v) setNetworkChartType(v as ChartType); }}
                  className="rounded-lg border border-border p-1 bg-muted/50"
                >
                  <ToggleGroupItem value="line" className="h-7 px-2 gap-1 text-xs">
                    <LineChartIcon className="h-3 w-3" /> Line
                  </ToggleGroupItem>
                  <ToggleGroupItem value="area" className="h-7 px-2 gap-1 text-xs">
                    <TrendingUp className="h-3 w-3" /> Area
                  </ToggleGroupItem>
                  <ToggleGroupItem value="bar" className="h-7 px-2 gap-1 text-xs">
                    <BarChart3 className="h-3 w-3" /> Bar
                  </ToggleGroupItem>
                </ToggleGroup>
                {/* Net In color */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-1.5 rounded-md gap-1 text-xs" style={netInColor ? { color: netInColor } : { color: 'hsl(190 90% 50%)' }}>
                      <Download className="h-3 w-3" /> In
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Network In Color</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="grid grid-cols-4 gap-2 p-2">
                      {CHART_COLORS.map((c) => {
                        const isSameAsOut = c.value !== '' && c.value === netOutColor;
                        return (
                          <DropdownMenuItem
                            key={c.name}
                            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-md p-0 hover:bg-muted focus:bg-muted ${isSameAsOut ? 'opacity-25 pointer-events-none' : ''}`}
                            onSelect={() => { if (!isSameAsOut) setNetInColor(c.value); }}
                            title={isSameAsOut ? `Already used by Net Out` : c.name}
                          >
                            {c.value ? (
                              <div className="h-6 w-6 rounded-full border border-border shadow-sm" style={{ backgroundColor: c.value }} />
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-foreground/50 bg-background text-[10px] font-medium text-foreground">/</div>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Net Out color */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-1.5 rounded-md gap-1 text-xs" style={netOutColor ? { color: netOutColor } : { color: 'hsl(280 70% 50%)' }}>
                      <Upload className="h-3 w-3" /> Out
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Network Out Color</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="grid grid-cols-4 gap-2 p-2">
                      {CHART_COLORS.map((c) => {
                        const isSameAsIn = c.value !== '' && c.value === netInColor;
                        return (
                          <DropdownMenuItem
                            key={c.name}
                            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-md p-0 hover:bg-muted focus:bg-muted ${isSameAsIn ? 'opacity-25 pointer-events-none' : ''}`}
                            onSelect={() => { if (!isSameAsIn) setNetOutColor(c.value); }}
                            title={isSameAsIn ? `Already used by Net In` : c.name}
                          >
                            {c.value ? (
                              <div className="h-6 w-6 rounded-full border border-border shadow-sm" style={{ backgroundColor: c.value }} />
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-foreground/50 bg-background text-[10px] font-medium text-foreground">/</div>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                {networkChartType === 'line' ? (
                  <LineChart data={networkChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v.toFixed(1)} KB/s`} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number, name: string) => [`${value.toFixed(1)} KB/s`, name === 'netIn' ? 'Network In' : 'Network Out']} />
                    <Legend formatter={(value) => (value === 'netIn' ? 'Network In' : 'Network Out')} />
                    <Line type="monotone" dataKey="netIn" stroke={netInColor || 'hsl(190 90% 50%)'} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="netOut" stroke={netOutColor || 'hsl(280 70% 50%)'} strokeWidth={2} dot={false} />
                  </LineChart>
                ) : networkChartType === 'area' ? (
                  <AreaChart data={networkChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v.toFixed(1)} KB/s`} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number, name: string) => [`${value.toFixed(1)} KB/s`, name === 'netIn' ? 'Network In' : 'Network Out']} />
                    <Legend formatter={(value) => (value === 'netIn' ? 'Network In' : 'Network Out')} />
                    <Area type="monotone" dataKey="netIn" stroke={netInColor || 'hsl(190 90% 50%)'} fill={(netInColor || 'hsl(190 90% 50%)').replace(')', ' / 0.3)')} strokeWidth={2} />
                    <Area type="monotone" dataKey="netOut" stroke={netOutColor || 'hsl(280 70% 50%)'} fill={(netOutColor || 'hsl(280 70% 50%)').replace(')', ' / 0.3)')} strokeWidth={2} />
                  </AreaChart>
                ) : (
                  <BarChart data={networkChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v.toFixed(1)} KB/s`} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number, name: string) => [`${value.toFixed(1)} KB/s`, name === 'netIn' ? 'Network In' : 'Network Out']} />
                    <Legend formatter={(value) => (value === 'netIn' ? 'Network In' : 'Network Out')} />
                    <Bar dataKey="netIn" fill={netInColor || 'hsl(190 90% 50%)'} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netOut" fill={netOutColor || 'hsl(280 70% 50%)'} radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Process Count & Uptime Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Process Count Chart */}
          {renderMetricChart({
            title: 'Process Count',
            data: processChartData,
            chartType: processChartType,
            setChartType: setProcessChartType,
            chartColor: processChartColor,
            setChartColor: setProcessChartColor,
            defaultColor: 'hsl(280 70% 50%)',
            domain: ['auto', 'auto'],
            tooltipFormatter: (v: number) => [`${v.toFixed(0)}`, 'Processes'],
          })}

          {/* Uptime Chart */}
          {renderMetricChart({
            title: 'Uptime',
            data: uptimeChartData,
            chartType: uptimeChartType,
            setChartType: setUptimeChartType,
            chartColor: uptimeChartColor,
            setChartColor: setUptimeChartColor,
            defaultColor: 'hsl(175 80% 40%)',
            domain: ['auto', 'auto'],
            yAxisFormatter: (v: number) => `${v.toFixed(0)}h`,
            tooltipFormatter: (v: number) => [`${v.toFixed(1)} hours`, 'Uptime'],
          })}
        </div>

        {/* Disk & Memory Info (Resizable) */}
        <ResizablePanelGroup direction="horizontal" className="rounded-xl border-2 border-border shadow-sm min-h-[280px]">
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="bg-card p-6 h-full">
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
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="bg-card p-6 h-full">
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
          </ResizablePanel>
        </ResizablePanelGroup>

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
