// Dashboard - Main monitoring overview page
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/MetricCard';
import { ServerCard } from '@/components/ServerCard';
import { AlertCard } from '@/components/AlertCard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Server,
  AlertTriangle,
  Activity,
  Shield,
  Plus,
  ArrowRight,
  Loader2,
  MoreVertical,
  History,
  Layout,
  Cpu,
  Book,
  Code,
  LifeBuoy
} from 'lucide-react';
import { serversApi, alertsApi, alertRulesApi, Server as ServerType, Alert, AlertRule, Metric } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRealtime } from '@/hooks/use-realtime';
import {
  LineChart, Line, AreaChart, Area,
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VisibleSections {
  servers: boolean;
  alerts: boolean;
  rules: boolean;
  history: boolean;
  resources: boolean;
}

const HISTORY_POINTS_BY_RANGE: Record<string, number> = {
  '1h': 30,
  '6h': 36,
  '24h': 20,
  '7d': 40,
};

export default function Dashboard() {
  const [servers, setServers] = useState<ServerType[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [historyData, setHistoryData] = useState<{ time: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("24h");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Visibility State — persisted to localStorage
  const [visibleSections, setVisibleSections] = useState<VisibleSections>(() => {
    const stored = localStorage.getItem('argus_dashboard_sections');
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    return { servers: true, alerts: true, rules: true, history: true, resources: true };
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const primaryServerId = servers[0]?.id;

  const realtimeSubscriptions = useMemo(() => {
    if (!user) return [];

    return [
      {
        topic: `/topic/servers/user/${user.id}`,
        onMessage: (server: ServerType) => {
          setServers((prev) => {
            const index = prev.findIndex((s) => s.id === server.id);
            if (index >= 0) {
              const next = [...prev];
              next[index] = server;
              return next;
            }
            return [server, ...prev];
          });
        },
      },
      {
        topic: `/topic/alerts/user/${user.id}`,
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
      ...(primaryServerId
        ? [{
          topic: `/topic/servers/${primaryServerId}/metrics`,
          onMessage: (incoming: Metric[]) => {
            const incomingCpu = incoming.filter((metric) => metric.metricType === 'CPU_USAGE');
            if (incomingCpu.length === 0) return;

            setHistoryData((prev) => {
              const next = [...prev];
              incomingCpu.forEach((metric) => {
                next.push({
                  time: new Date(metric.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  }),
                  value: metric.value,
                });
              });

              const maxPoints = HISTORY_POINTS_BY_RANGE[timeRange] || 20;
              return next.slice(-maxPoints);
            });

            setLastUpdated(new Date());
          },
        }]
        : []),
    ];
  }, [user, primaryServerId, timeRange]);

  useRealtime(realtimeSubscriptions, !!user);

  const fetchData = async () => {
    try {
      const [serversRes, alertsRes] = await Promise.all([
        serversApi.getAll(),
        alertsApi.getActive(),
      ]);

      if (serversRes.success) {
        setServers(serversRes.data);
        if (serversRes.data.length > 0) {
          fetchRulesAndHistory(serversRes.data[0].id);
        }
      }
      if (alertsRes.success) setAlerts(alertsRes.data);
    } catch (error) {
      toast({
        title: 'Failed to fetch data',
        description: error instanceof Error ? error.message : 'Could not load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  };

  const fetchRulesAndHistory = async (serverId: number) => {
    try {
      const rulesRes = await alertRulesApi.getByServer(serverId);
      if (rulesRes.success) setRules(rulesRes.data.slice(0, 3));

      // Fetch history with time range filter
      const rangeMs: Record<string, number> = { '1h': 3600000, '6h': 21600000, '24h': 86400000, '7d': 604800000 };
      const start = new Date(Date.now() - (rangeMs[timeRange] || 86400000)).toISOString();
      const metricsRes = await serversApi.getMetrics(serverId, { type: 'CPU_USAGE', start });
      if (metricsRes.success) {
        const pointCount = HISTORY_POINTS_BY_RANGE[timeRange] || 20;
        const data = metricsRes.data
          .slice(-pointCount)
          .map((m: Metric) => ({
            time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: m.value
          }));
        setHistoryData(data);
      }
    } catch (error) {
      console.error('Failed to fetch secondary dashboard data', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Re-fetch history when time range changes
  useEffect(() => {
    if (servers.length > 0) {
      fetchRulesAndHistory(servers[0].id);
    }
  }, [timeRange]);

  useEffect(() => {
    if (primaryServerId) {
      fetchRulesAndHistory(primaryServerId);
    } else {
      setRules([]);
      setHistoryData([]);
    }
  }, [primaryServerId]);

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

  const toggleSection = (section: keyof VisibleSections) => {
    setVisibleSections(prev => {
      const next = { ...prev, [section]: !prev[section] };
      localStorage.setItem('argus_dashboard_sections', JSON.stringify(next));
      return next;
    });
  };

  const prevStatsRef = useRef<typeof stats | null>(null);

  const stats = {
    totalServers: servers.length,
    onlineServers: servers.filter(s => s.status === 'ONLINE').length,
    activeAlerts: alerts.length,
    criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length,
  };

  // Compute trend by comparing current stats to previous snapshot
  const computeTrend = (current: number, key: keyof typeof stats): { trend: 'up' | 'down' | 'stable'; trendValue: string } | {} => {
    const prev = prevStatsRef.current;
    if (!prev) return {};
    const diff = current - prev[key];
    if (diff === 0) return { trend: 'stable' as const, trendValue: 'No change' };
    return {
      trend: diff > 0 ? 'up' as const : 'down' as const,
      trendValue: `${diff > 0 ? '+' : ''}${diff}`,
    };
  };

  // Update previous stats ref after each data fetch
  useEffect(() => {
    if (!isLoading) {
      // Delay storing so the current render sees the old value
      const timeout = setTimeout(() => { prevStatsRef.current = { ...stats }; }, 100);
      return () => clearTimeout(timeout);
    }
  }, [servers, alerts]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Monitor your infrastructure at a glance
              {lastUpdated && (
                <span className="ml-2 text-xs text-muted-foreground/70">
                  · Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/servers/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Server
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Customize Dashboard</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={visibleSections.servers}
                  onCheckedChange={() => toggleSection('servers')}
                >
                  <Server className="mr-2 h-4 w-4" />
                  Servers
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleSections.alerts}
                  onCheckedChange={() => toggleSection('alerts')}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Active Alerts
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleSections.rules}
                  onCheckedChange={() => toggleSection('rules')}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Alert Rules
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleSections.history}
                  onCheckedChange={() => toggleSection('history')}
                >
                  <History className="mr-2 h-4 w-4" />
                  System History
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleSections.resources}
                  onCheckedChange={() => toggleSection('resources')}
                >
                  <Book className="mr-2 h-4 w-4" />
                  Resources
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <MetricCard
              title="Total Servers"
              value={stats.totalServers}
              icon={<Server className="h-5 w-5" />}
              {...computeTrend(stats.totalServers, 'totalServers')}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <MetricCard
              title="Online Servers"
              value={stats.onlineServers}
              unit={`/ ${stats.totalServers}`}
              icon={<Activity className="h-5 w-5" />}
              status={stats.onlineServers === stats.totalServers ? 'normal' : 'warning'}
              {...computeTrend(stats.onlineServers, 'onlineServers')}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            <MetricCard
              title="Active Alerts"
              value={stats.activeAlerts}
              icon={<AlertTriangle className="h-5 w-5" />}
              status={stats.criticalAlerts > 0 ? 'critical' : stats.activeAlerts > 0 ? 'warning' : 'normal'}
              {...computeTrend(stats.activeAlerts, 'activeAlerts')}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
            <MetricCard
              title="Critical Alerts"
              value={stats.criticalAlerts}
              icon={<Shield className="h-5 w-5" />}
              status={stats.criticalAlerts > 0 ? 'critical' : 'normal'}
              {...computeTrend(stats.criticalAlerts, 'criticalAlerts')}
            />
          </motion.div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Servers Section */}
          {visibleSections.servers && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
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
            </motion.div>
          )}

          {/* Alerts Section */}
          {visibleSections.alerts && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
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
            </motion.div>
          )}

          {/* Recent History Widget */}
          {visibleSections.history && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">System History</h2>
                <div className="flex items-center gap-4">
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue placeholder="Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last Hour</SelectItem>
                      <SelectItem value="6h">Last 6 Hours</SelectItem>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Link to="/history" className="text-sm text-primary hover:underline flex items-center gap-1">
                    Full History <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="h-56">
                  {historyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historyData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="time"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fillOpacity={1}
                          fill="url(#colorValue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <Activity className="h-8 w-8 opacity-50" />
                        <p>No history data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Alert Rules Widget */}
          {visibleSections.rules && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">Alert Rules</h2>
                <Link to="/rules" className="text-sm text-primary hover:underline flex items-center gap-1">
                  Manage Rules <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {rules.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                  <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    No alert rules configured
                  </p>
                  <Link to="/rules">
                    <Button variant="link" size="sm" className="mt-2 text-primary">
                      Configure Rules
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{rule.name}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={`px-1.5 py-0.5 rounded ${rule.isEnabled ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                            }`}>
                            {rule.isEnabled ? 'Active' : 'Disabled'}
                          </span>
                          <span>•</span>
                          <span>{rule.metricType}</span>
                        </div>
                      </div>
                      <Link to="/rules">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Quick Actions / Resources */}
        {visibleSections.resources && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="grid gap-6 md:grid-cols-3"
          >
            <Link to="/docs/getting-started" className="group rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <Book className="h-5 w-5" />
                </div>
                <div className="font-semibold text-foreground">Documentation</div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Read the getting started guide and server setup instructions.
              </p>
              <div className="flex items-center text-xs font-medium text-primary group-hover:translate-x-1 transition-transform">
                Read Docs <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </Link>

            <Link to="/docs/api" className="group rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Code className="h-5 w-5" />
                </div>
                <div className="font-semibold text-foreground">API Reference</div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Integrate with your tools using our REST API endpoints.
              </p>
              <div className="flex items-center text-xs font-medium text-primary group-hover:translate-x-1 transition-transform">
                View API <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </Link>

            <Link to="/docs/security" className="group rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="font-semibold text-foreground">Security</div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                View our security standards, compliance, and best practices.
              </p>
              <div className="flex items-center text-xs font-medium text-primary group-hover:translate-x-1 transition-transform">
                View Security <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </Link>
          </motion.div>
        )}

      </div>
    </MainLayout>
  );
}
