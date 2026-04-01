// History - System metrics history page with time frame selection
import { useEffect, useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarWidget } from '@/components/ui/calendar';
import {
    History,
    Loader2,
    LineChart as LineChartIcon,
    BarChart3,
    TrendingUp,
    Cpu,
    MemoryStick,
    HardDrive,
    Activity,
    RefreshCw,
    Calendar,
    Clock,
    Server,
    Palette,
    Download,
    Upload,
    FileImage,
    FileText,
    FileSpreadsheet,
    FileJson,
    Layers,
} from 'lucide-react';
import { serversApi, Server as ServerType, Metric } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
    exportChartAsImage,
    exportChartAsPDF,
    exportDataAsExcel,
    exportDataAsCSV,
    exportDataAsJSON,
} from '@/lib/export-utils';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend as RechartsLegend,
} from 'recharts';
import { format } from 'date-fns';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type ChartType = 'line' | 'area' | 'bar';
type MetricType = 'CPU_USAGE' | 'MEMORY_USAGE' | 'DISK_USAGE' | 'LOAD_AVERAGE' | 'NETWORK_IN' | 'NETWORK_OUT' | 'PROCESS_COUNT' | 'UPTIME';
type TimeFrame = '1h' | '6h' | '24h' | '7d' | '30d' | 'custom';

interface AggregatedMetric {
    time: string;
    timestamp: number;
    cpu: number;
    memory: number;
    disk: number;
    load: number;
    networkIn: number;
    networkOut: number;
    processCount: number;
    uptime: number;
}

const timeFrameOptions: { value: TimeFrame; label: string; bucketMinutes: number; dataPoints: number }[] = [
    { value: '1h', label: '1 Hour', bucketMinutes: 1, dataPoints: 60 },
    { value: '6h', label: '6 Hours', bucketMinutes: 5, dataPoints: 72 },
    { value: '24h', label: '24 Hours', bucketMinutes: 15, dataPoints: 96 },
    { value: '7d', label: '7 Days', bucketMinutes: 60, dataPoints: 168 },
    { value: '30d', label: '30 Days', bucketMinutes: 360, dataPoints: 120 },
];

const metricOptions = [
    { value: 'CPU_USAGE', label: 'CPU Usage', shortLabel: 'CPU', color: 'hsl(var(--primary))', icon: Cpu, unit: '%' },
    { value: 'MEMORY_USAGE', label: 'Memory Usage', shortLabel: 'Memory', color: 'hsl(142 76% 36%)', icon: MemoryStick, unit: '%' },
    { value: 'DISK_USAGE', label: 'Disk Usage', shortLabel: 'Disk', color: 'hsl(38 92% 50%)', icon: HardDrive, unit: '%' },
    { value: 'LOAD_AVERAGE', label: 'Load Average', shortLabel: 'Load', color: 'hsl(280 70% 50%)', icon: Activity, unit: '' },
    { value: 'NETWORK_IN', label: 'Network In', shortLabel: 'Net In', color: 'hsl(190 90% 50%)', icon: Download, unit: 'B/s' },
    { value: 'NETWORK_OUT', label: 'Network Out', shortLabel: 'Net Out', color: 'hsl(316 70% 50%)', icon: Upload, unit: 'B/s' },
    { value: 'PROCESS_COUNT', label: 'Processes', shortLabel: 'Procs', color: 'hsl(24.6 95% 53.1%)', icon: Layers, unit: '' },
    { value: 'UPTIME', label: 'Uptime', shortLabel: 'Uptime', color: 'hsl(175 80% 40%)', icon: Clock, unit: 's' },
];

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

export default function HistoryPage() {
    const [servers, setServers] = useState<ServerType[]>([]);
    const [selectedServer, setSelectedServer] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [chartType, setChartType] = useState<ChartType>('area');
    const [selectedMetric, setSelectedMetric] = useState<MetricType>('CPU_USAGE');
    const [customColor, setCustomColor] = useState<string>('');
    const [overlayMetrics, setOverlayMetrics] = useState<Set<MetricType>>(new Set());
    const [overlayColors, setOverlayColors] = useState<Record<string, string>>({});
    const overlayMode = overlayMetrics.size > 0;
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('24h');
    const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(undefined);
    const [customDateTo, setCustomDateTo] = useState<Date | undefined>(undefined);
    const [historyData, setHistoryData] = useState<AggregatedMetric[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const fetchServers = async () => {
        try {
            const res = await serversApi.getAll();
            if (res.success) {
                setServers(res.data);
            }
        } catch (error) {
            toast({
                title: 'Failed to fetch servers',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchHistoryData = async () => {
        if (servers.length === 0) return;

        setIsLoadingHistory(true);
        const timeConfig = timeFrameOptions.find(t => t.value === timeFrame) || timeFrameOptions[2]; // default 24h

        try {
            // Filter servers based on selection
            const targetServers = selectedServer === 'all'
                ? servers
                : servers.filter(s => s.id.toString() === selectedServer);

            // Calculate time range first so we can pass to API
            const now = Date.now();
            let startTime: number;
            let endTime: number = now;
            let bucketSize: number;
            let maxDataPoints: number;

            if (timeFrame === 'custom' && customDateFrom && customDateTo) {
                startTime = customDateFrom.getTime();
                endTime = customDateTo.getTime();
                const rangeMs = endTime - startTime;
                // Dynamic bucket: aim for ~120 data points
                bucketSize = Math.max(60000, Math.floor(rangeMs / 120));
                maxDataPoints = 120;
            } else {
                const timeRangeMs = {
                    '1h': 60 * 60 * 1000,
                    '6h': 6 * 60 * 60 * 1000,
                    '24h': 24 * 60 * 60 * 1000,
                    '7d': 7 * 24 * 60 * 60 * 1000,
                    '30d': 30 * 24 * 60 * 60 * 1000,
                    'custom': 24 * 60 * 60 * 1000,
                }[timeFrame];
                startTime = now - timeRangeMs;
                bucketSize = timeConfig.bucketMinutes * 60 * 1000;
                maxDataPoints = timeConfig.dataPoints;
            }

            // Format dates for API (local time ISO format for backend LocalDateTime)
            const pad = (n: number) => n.toString().padStart(2, '0');
            const toLocalISO = (ms: number) => {
                const d = new Date(ms);
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            };
            const startISO = toLocalISO(startTime);
            const endISO = toLocalISO(endTime);

            // Fetch metrics for selected servers with time range
            const metricsPromises = targetServers.map(server =>
                Promise.all([
                    serversApi.getMetrics(server.id, { type: 'CPU_USAGE', start: startISO, end: endISO }).catch(() => ({ success: false, data: [] as Metric[] })),
                    serversApi.getMetrics(server.id, { type: 'MEMORY_USAGE', start: startISO, end: endISO }).catch(() => ({ success: false, data: [] as Metric[] })),
                    serversApi.getMetrics(server.id, { type: 'DISK_USAGE', start: startISO, end: endISO }).catch(() => ({ success: false, data: [] as Metric[] })),
                    serversApi.getMetrics(server.id, { type: 'LOAD_AVERAGE', start: startISO, end: endISO }).catch(() => ({ success: false, data: [] as Metric[] })),
                    serversApi.getMetrics(server.id, { type: 'NETWORK_IN', start: startISO, end: endISO }).catch(() => ({ success: false, data: [] as Metric[] })),
                    serversApi.getMetrics(server.id, { type: 'NETWORK_OUT', start: startISO, end: endISO }).catch(() => ({ success: false, data: [] as Metric[] })),
                    serversApi.getMetrics(server.id, { type: 'PROCESS_COUNT', start: startISO, end: endISO }).catch(() => ({ success: false, data: [] as Metric[] })),
                    serversApi.getMetrics(server.id, { type: 'UPTIME', start: startISO, end: endISO }).catch(() => ({ success: false, data: [] as Metric[] })),
                ])
            );

            const allResults = await Promise.all(metricsPromises);

            // Aggregate metrics by timestamp buckets
            type BucketKeys = 'cpu' | 'memory' | 'disk' | 'load' | 'networkIn' | 'networkOut' | 'processCount' | 'uptime';
            const bucketMap = new Map<number, Record<BucketKeys, number[]>>();

            allResults.forEach((serverMetrics) => {
                const [cpuRes, memRes, diskRes, loadRes, netInRes, netOutRes, procRes, uptimeRes] = serverMetrics;

                const processMetrics = (res: { success: boolean; data: Metric[] }, key: BucketKeys) => {
                    if (res.success && res.data) {
                        res.data.forEach((m: Metric) => {
                            const metricTime = new Date(m.timestamp).getTime();
                            if (metricTime >= startTime) {
                                const bucket = Math.floor(metricTime / bucketSize) * bucketSize;
                                if (!bucketMap.has(bucket)) {
                                    bucketMap.set(bucket, { cpu: [], memory: [], disk: [], load: [], networkIn: [], networkOut: [], processCount: [], uptime: [] });
                                }
                                bucketMap.get(bucket)![key].push(m.value);
                            }
                        });
                    }
                };

                processMetrics(cpuRes, 'cpu');
                processMetrics(memRes, 'memory');
                processMetrics(diskRes, 'disk');
                processMetrics(loadRes, 'load');
                processMetrics(netInRes, 'networkIn');
                processMetrics(netOutRes, 'networkOut');
                processMetrics(procRes, 'processCount');
                processMetrics(uptimeRes, 'uptime');
            });

            // Convert to array and calculate averages
            const formatTime = (timestamp: number) => {
                const date = new Date(timestamp);
                if (timeFrame === '1h' || timeFrame === '6h') {
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else if (timeFrame === '24h') {
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else if (timeFrame === '7d') {
                    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit' })}`;
                } else {
                    // 30d: show date + abbreviated time to avoid duplicate labels for 6-hour buckets
                    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit' })}`;
                }
            };

            const aggregated: AggregatedMetric[] = Array.from(bucketMap.entries())
                .map(([timestamp, values]) => ({
                    timestamp,
                    time: formatTime(timestamp),
                    cpu: values.cpu.length > 0 ? values.cpu.reduce((a, b) => a + b, 0) / values.cpu.length : 0,
                    memory: values.memory.length > 0 ? values.memory.reduce((a, b) => a + b, 0) / values.memory.length : 0,
                    disk: values.disk.length > 0 ? values.disk.reduce((a, b) => a + b, 0) / values.disk.length : 0,
                    load: values.load.length > 0 ? values.load.reduce((a, b) => a + b, 0) / values.load.length : 0,
                    networkIn: values.networkIn.length > 0 ? values.networkIn.reduce((a, b) => a + b, 0) / values.networkIn.length : 0,
                    networkOut: values.networkOut.length > 0 ? values.networkOut.reduce((a, b) => a + b, 0) / values.networkOut.length : 0,
                    processCount: values.processCount.length > 0 ? values.processCount.reduce((a, b) => a + b, 0) / values.processCount.length : 0,
                    uptime: values.uptime.length > 0 ? values.uptime.reduce((a, b) => a + b, 0) / values.uptime.length : 0,
                }))
                .sort((a, b) => a.timestamp - b.timestamp)
                .slice(-maxDataPoints);

            setHistoryData(aggregated);
        } catch (error) {
            toast({
                title: 'Failed to fetch history',
                description: 'Could not load historical metrics',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchServers();
    }, []);

    useEffect(() => {
        if (servers.length > 0) {
            fetchHistoryData();
        }
    }, [servers.length, timeFrame, selectedServer, customDateFrom, customDateTo]);

    const metricKeyMap: Record<MetricType, keyof AggregatedMetric> = {
        CPU_USAGE: 'cpu',
        MEMORY_USAGE: 'memory',
        DISK_USAGE: 'disk',
        LOAD_AVERAGE: 'load',
        NETWORK_IN: 'networkIn',
        NETWORK_OUT: 'networkOut',
        PROCESS_COUNT: 'processCount',
        UPTIME: 'uptime',
    };

    const formatMetricValue = (value: number, metric: MetricType): string => {
        if (metric === 'NETWORK_IN' || metric === 'NETWORK_OUT') {
            if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1);
            if (value >= 1_000_000) return (value / 1_000_000).toFixed(1);
            if (value >= 1_000) return (value / 1_000).toFixed(1);
            return value.toFixed(0);
        }
        if (metric === 'UPTIME') {
            const d = Math.floor(value / 86400);
            const h = Math.floor((value % 86400) / 3600);
            return d > 0 ? `${d}d ${h}h` : `${h}h`;
        }
        if (metric === 'PROCESS_COUNT') return value.toFixed(0);
        return value.toFixed(2);
    };

    const getMetricUnit = (value: number, metric: MetricType): string => {
        if (metric === 'NETWORK_IN' || metric === 'NETWORK_OUT') {
            if (value >= 1_000_000_000) return 'GB/s';
            if (value >= 1_000_000) return 'MB/s';
            if (value >= 1_000) return 'KB/s';
            return 'B/s';
        }
        return metricOptions.find(m => m.value === metric)?.unit || '';
    };

    const getMetricData = () => {
        const key = metricKeyMap[selectedMetric];
        return historyData.map(d => ({ time: d.time, value: Number((d[key] as number).toFixed(2)) }));
    };

    const getMetricColor = () => {
        if (customColor) return customColor;
        return metricOptions.find(m => m.value === selectedMetric)?.color || 'hsl(var(--primary))';
    };

    const getMetricStats = () => {
        const data = getMetricData();
        if (data.length === 0) return { avg: '0', max: '0', min: '0', current: '0', unit: '' };

        const values = data.map(d => d.value);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const current = values[values.length - 1] ?? 0;
        const unit = getMetricUnit(current, selectedMetric);
        return {
            avg: formatMetricValue(avg, selectedMetric),
            max: formatMetricValue(max, selectedMetric),
            min: formatMetricValue(min, selectedMetric),
            current: formatMetricValue(current, selectedMetric),
            unit,
        };
    };

    const renderChart = () => {
        const data = getMetricData();
        const color = getMetricColor();
        const percentMetrics: MetricType[] = ['CPU_USAGE', 'MEMORY_USAGE', 'DISK_USAGE'];
        const domain: [number | 'auto', number | 'auto'] = percentMetrics.includes(selectedMetric) ? [0, 100] : ['auto', 'auto'];

        const tooltipStyle = {
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
        };

        // Per-metric Y-axis tick formatter
        const yAxisFormatter = (v: number) => {
            if (percentMetrics.includes(selectedMetric)) return `${v}%`;
            if (selectedMetric === 'NETWORK_IN' || selectedMetric === 'NETWORK_OUT') {
                if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} MB/s`;
                if (v >= 1_000) return `${(v / 1_000).toFixed(1)} KB/s`;
                return `${v.toFixed(0)} B/s`;
            }
            if (selectedMetric === 'UPTIME') {
                const h = v / 3600;
                if (h >= 24) return `${(h / 24).toFixed(0)}d`;
                return `${h.toFixed(0)}h`;
            }
            if (selectedMetric === 'PROCESS_COUNT') return `${v.toFixed(0)}`;
            return `${v}`;
        };

        // Per-metric tooltip value formatter
        const tooltipFormatter = (v: number) => {
            const label = metricOptions.find(m => m.value === selectedMetric)?.shortLabel || '';
            if (percentMetrics.includes(selectedMetric)) return [`${v.toFixed(1)}%`, label];
            if (selectedMetric === 'NETWORK_IN' || selectedMetric === 'NETWORK_OUT') {
                if (v >= 1_000_000) return [`${(v / 1_000_000).toFixed(2)} MB/s`, label];
                if (v >= 1_000) return [`${(v / 1_000).toFixed(2)} KB/s`, label];
                return [`${v.toFixed(0)} B/s`, label];
            }
            if (selectedMetric === 'UPTIME') {
                const d = Math.floor(v / 86400);
                const h = Math.floor((v % 86400) / 3600);
                return [d > 0 ? `${d}d ${h}h` : `${h}h`, label];
            }
            if (selectedMetric === 'PROCESS_COUNT') return [`${v.toFixed(0)}`, label];
            if (selectedMetric === 'LOAD_AVERAGE') return [`${v.toFixed(2)}`, label];
            return [`${v}`, label];
        };

        // Overlay mode: show all metrics on a single chart
        if (overlayMode) {
            const activeOptions = metricOptions.filter(opt => overlayMetrics.has(opt.value as MetricType));
            // Reverse map: data key -> MetricType
            const keyToMetric: Record<string, MetricType> = {};
            for (const [mt, key] of Object.entries(metricKeyMap)) {
                keyToMetric[key as string] = mt as MetricType;
            }
            const overlayTooltipFormatter = (value: number, name: string, props: { dataKey?: string }) => {
                const dataKey = props.dataKey as string;
                const mt = keyToMetric[dataKey];
                if (mt === 'CPU_USAGE' || mt === 'MEMORY_USAGE' || mt === 'DISK_USAGE') return [`${value.toFixed(1)}%`, name];
                if (mt === 'NETWORK_IN' || mt === 'NETWORK_OUT') {
                    if (value >= 1_000_000) return [`${(value / 1_000_000).toFixed(2)} MB/s`, name];
                    if (value >= 1_000) return [`${(value / 1_000).toFixed(2)} KB/s`, name];
                    return [`${value.toFixed(0)} B/s`, name];
                }
                if (mt === 'UPTIME') {
                    const d = Math.floor(value / 86400);
                    const h = Math.floor((value % 86400) / 3600);
                    return [d > 0 ? `${d}d ${h}h` : `${h}h`, name];
                }
                if (mt === 'PROCESS_COUNT') return [`${value.toFixed(0)}`, name];
                if (mt === 'LOAD_AVERAGE') return [`${value.toFixed(2)}`, name];
                return [`${value}`, name];
            };
            return (
                <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[0, 'auto']} />
                    <Tooltip contentStyle={tooltipStyle} formatter={overlayTooltipFormatter} />
                    <RechartsLegend />
                    {activeOptions.map((opt) => {
                        const key = metricKeyMap[opt.value as MetricType] as string;
                        const lineColor = overlayColors[opt.value] || opt.color;
                        return (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                name={opt.shortLabel}
                                stroke={lineColor}
                                strokeWidth={2}
                                dot={false}
                            />
                        );
                    })}
                </LineChart>
            );
        }

        if (chartType === 'line') {
            return (
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={domain} tickFormatter={yAxisFormatter} />
                    <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
                    <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
                </LineChart>
            );
        } else if (chartType === 'area') {
            return (
                <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={domain} tickFormatter={yAxisFormatter} />
                    <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
                    <Area type="monotone" dataKey="value" stroke={color} fill={(() => { const i = color.lastIndexOf(')'); return i === -1 ? color : color.slice(0, i) + ' / 0.3)' + color.slice(i + 1); })()  } strokeWidth={2} />
                </AreaChart>
            );
        } else {
            return (
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={domain} tickFormatter={yAxisFormatter} />
                    <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
                    <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
                </BarChart>
            );
        }
    };

    // Export handlers
    const getExportMetadata = () => {
        const metricInfo = metricOptions.find(m => m.value === selectedMetric);
        const timeFrameInfo = timeFrameOptions.find(t => t.value === timeFrame);
        return {
            metricName: metricInfo?.label || 'Unknown Metric',
            metricUnit: stats.unit,
            timeFrame: timeFrameInfo?.label || 'Unknown',
            serverSelection: selectedServer === 'all' ? 'All Servers' : servers.find(s => s.id.toString() === selectedServer)?.name || 'Unknown',
            timestamp: new Date().toLocaleString(),
        };
    };

    const handleExportImage = async (format: 'png' | 'jpg') => {
        if (!chartRef.current || historyData.length === 0) {
            toast({
                title: 'No data to export',
                description: 'Please wait for data to load',
                variant: 'destructive',
            });
            return;
        }

        setIsExporting(true);
        try {
            const metadata = getExportMetadata();
            const filename = `history-${selectedMetric.toLowerCase()}-${timeFrame}-${Date.now()}`;
            await exportChartAsImage(chartRef.current, filename, format);
            toast({
                title: 'Export successful',
                description: `Chart exported as ${format.toUpperCase()}`,
            });
        } catch (error) {
            toast({
                title: 'Export failed',
                description: 'Could not export chart',
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async () => {
        if (!chartRef.current || historyData.length === 0) {
            toast({
                title: 'No data to export',
                description: 'Please wait for data to load',
                variant: 'destructive',
            });
            return;
        }

        setIsExporting(true);
        try {
            const metadata = getExportMetadata();
            const filename = `history-report-${Date.now()}`;
            await exportChartAsPDF(chartRef.current, stats, metadata, filename);
            toast({
                title: 'Export successful',
                description: 'Report exported as PDF',
            });
        } catch (error) {
            toast({
                title: 'Export failed',
                description: 'Could not export PDF',
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportExcel = () => {
        if (historyData.length === 0) {
            toast({
                title: 'No data to export',
                description: 'Please wait for data to load',
                variant: 'destructive',
            });
            return;
        }

        setIsExporting(true);
        try {
            const data = getMetricData();
            const metadata = getExportMetadata();
            const filename = `history-data-${Date.now()}`;
            exportDataAsExcel(data, metadata, stats, filename);
            toast({
                title: 'Export successful',
                description: 'Data exported as Excel',
            });
        } catch (error) {
            toast({
                title: 'Export failed',
                description: 'Could not export Excel file',
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportCSV = () => {
        if (historyData.length === 0) {
            toast({
                title: 'No data to export',
                description: 'Please wait for data to load',
                variant: 'destructive',
            });
            return;
        }

        setIsExporting(true);
        try {
            const data = getMetricData();
            const metadata = getExportMetadata();
            const filename = `history-data-${Date.now()}`;
            exportDataAsCSV(data, metadata, filename);
            toast({
                title: 'Export successful',
                description: 'Data exported as CSV',
            });
        } catch (error) {
            toast({
                title: 'Export failed',
                description: 'Could not export CSV file',
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportJSON = () => {
        if (historyData.length === 0) {
            toast({
                title: 'No data to export',
                description: 'Please wait for data to load',
                variant: 'destructive',
            });
            return;
        }

        setIsExporting(true);
        try {
            const data = getMetricData();
            const metadata = getExportMetadata();
            const filename = `history-data-${Date.now()}`;
            exportDataAsJSON(data, metadata, stats, filename);
            toast({
                title: 'Export successful',
                description: 'Data exported as JSON',
            });
        } catch (error) {
            toast({
                title: 'Export failed',
                description: 'Could not export JSON file',
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    };

    const stats = getMetricStats();

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
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">System History</h1>
                        <p className="mt-1 text-muted-foreground">
                            View historical metrics for {selectedServer === 'all' ? 'all servers' : servers.find(s => s.id.toString() === selectedServer)?.name || 'selected server'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    disabled={isExporting || isLoadingHistory || historyData.length === 0}
                                >
                                    {isExporting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Image Formats</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleExportImage('png')} className="gap-2">
                                    <FileImage className="h-4 w-4" />
                                    Export as PNG
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportImage('jpg')} className="gap-2">
                                    <FileImage className="h-4 w-4" />
                                    Export as JPG
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Document Formats</DropdownMenuLabel>
                                <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
                                    <FileText className="h-4 w-4" />
                                    Export as PDF
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Data Formats</DropdownMenuLabel>
                                <DropdownMenuItem onClick={handleExportExcel} className="gap-2">
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Export as Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Export as CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportJSON} className="gap-2">
                                    <FileJson className="h-4 w-4" />
                                    Export as JSON
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            variant="outline"
                            onClick={fetchHistoryData}
                            disabled={isLoadingHistory}
                        >
                            {isLoadingHistory ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Refresh
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Server Selector */}
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Server className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Server Scope</p>
                                    <p className="text-xs text-muted-foreground">Select which servers to view</p>
                                </div>
                            </div>
                            <Select value={selectedServer} onValueChange={setSelectedServer}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select scope" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Servers ({servers.length})</SelectItem>
                                    {servers.map((server) => (
                                        <SelectItem key={server.id} value={server.id.toString()}>
                                            {server.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Time Frame Selector */}
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Time Frame</p>
                                    <p className="text-xs text-muted-foreground">Select the time range</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {timeFrameOptions.map((option) => (
                                    <Button
                                        key={option.value}
                                        variant={timeFrame === option.value ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setTimeFrame(option.value)}
                                        className={`h-9 flex-1 transition-all ${timeFrame === option.value
                                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg'
                                            : 'hover:border-primary/50'
                                            }`}
                                    >
                                        <Clock className="mr-2 h-3 w-3" />
                                        {option.label}
                                    </Button>
                                ))}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={timeFrame === 'custom' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setTimeFrame('custom')}
                                            className={`h-9 flex-1 transition-all ${timeFrame === 'custom'
                                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg'
                                                : 'hover:border-primary/50'
                                                }`}
                                        >
                                            <Calendar className="mr-2 h-3 w-3" />
                                            {timeFrame === 'custom' && customDateFrom && customDateTo
                                                ? `${format(customDateFrom, 'MMM d')} - ${format(customDateTo, 'MMM d')}`
                                                : 'Custom'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <div className="flex flex-col sm:flex-row">
                                            <div className="p-3 border-b sm:border-b-0 sm:border-r border-border">
                                                <p className="text-xs font-medium text-muted-foreground mb-2">From</p>
                                                <CalendarWidget
                                                    mode="single"
                                                    selected={customDateFrom}
                                                    onSelect={(date) => { setCustomDateFrom(date); setTimeFrame('custom'); }}
                                                    disabled={(date) => date > new Date()}
                                                />
                                            </div>
                                            <div className="p-3">
                                                <p className="text-xs font-medium text-muted-foreground mb-2">To</p>
                                                <CalendarWidget
                                                    mode="single"
                                                    selected={customDateTo}
                                                    onSelect={(date) => { setCustomDateTo(date); setTimeFrame('custom'); }}
                                                    disabled={(date) => date > new Date() || (customDateFrom ? date < customDateFrom : false)}
                                                />
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {(() => {
                        const MetricIcon = metricOptions.find(m => m.value === selectedMetric)?.icon || Activity;
                        return (
                            <>
                                <div className="rounded-xl border border-border bg-card p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">Current</p>
                                        <MetricIcon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <p className="text-2xl font-bold text-foreground">{stats.current}<span className="text-sm font-normal text-muted-foreground ml-1">{stats.unit}</span></p>
                                </div>
                                <div className="rounded-xl border border-border bg-card p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">Average</p>
                                        <MetricIcon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <p className="text-2xl font-bold text-foreground">{stats.avg}<span className="text-sm font-normal text-muted-foreground ml-1">{stats.unit}</span></p>
                                </div>
                                <div className="rounded-xl border border-border bg-card p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">Maximum</p>
                                        <MetricIcon className="h-4 w-4 text-warning" />
                                    </div>
                                    <p className="text-2xl font-bold text-warning">{stats.max}<span className="text-sm font-normal text-muted-foreground ml-1">{stats.unit}</span></p>
                                </div>
                                <div className="rounded-xl border border-border bg-card p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">Minimum</p>
                                        <MetricIcon className="h-4 w-4 text-success" />
                                    </div>
                                    <p className="text-2xl font-bold text-success">{stats.min}<span className="text-sm font-normal text-muted-foreground ml-1">{stats.unit}</span></p>
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* Main Chart */}
                <div ref={chartRef} className="rounded-xl border-2 border-border bg-card p-4 sm:p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <History className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-display text-lg font-semibold text-foreground">
                                    {metricOptions.find(m => m.value === selectedMetric)?.label}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Aggregated from {servers.length} server{servers.length !== 1 && 's'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Overlay Toggle */}
                            <Button
                                variant={overlayMode ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    if (overlayMode) {
                                        setOverlayMetrics(new Set());
                                        setOverlayColors({});
                                    } else {
                                        setOverlayMetrics(new Set([selectedMetric]));
                                        toast({
                                            title: 'Compare Mode',
                                            description: 'Select the graphs you want to compare from the metric options.',
                                        });
                                    }
                                }}
                                title="Select the graphs you want to compare from the metric options."
                                className={`h-[52px] px-4 gap-2 rounded-lg border-2 transition-all ${
                                    overlayMode
                                        ? 'ring-2 ring-primary ring-offset-1 ring-offset-background shadow-md'
                                        : 'border-border hover:border-primary/50'
                                }`}
                            >
                                <Layers className="h-4 w-4" />
                                <span className="hidden sm:inline font-medium">Compare</span>
                            </Button>

                            {/* Metric Selector */}
                            <div className={`flex flex-wrap gap-1 rounded-lg border-2 border-border p-1.5 bg-muted/30`}>
                                {metricOptions.map((option) => {
                                    const mt = option.value as MetricType;
                                    const isSelected = overlayMode ? overlayMetrics.has(mt) : selectedMetric === mt;
                                    return (
                                        <Button
                                            key={option.value}
                                            variant={isSelected ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => {
                                                if (overlayMode) {
                                                    const next = new Set(overlayMetrics);
                                                    if (next.has(mt)) {
                                                        if (next.size > 1) next.delete(mt);
                                                    } else {
                                                        next.add(mt);
                                                    }
                                                    setOverlayMetrics(next);
                                                } else {
                                                    setSelectedMetric(mt);
                                                }
                                            }}
                                            className={`h-9 px-3 gap-2 transition-all ${isSelected
                                                ? 'shadow-md ring-2 ring-offset-1 ring-offset-background'
                                                : 'opacity-60 hover:opacity-100'
                                                }`}
                                            style={isSelected ? {
                                                backgroundColor: (overlayMode && overlayColors[mt]) ? overlayColors[mt] : option.color,
                                            } : {}}
                                        >
                                            <option.icon className="h-4 w-4" />
                                            <span className="hidden md:inline font-medium">{option.shortLabel}</span>
                                        </Button>
                                    );
                                })}
                            </div>

                            {/* Chart Type Selector */}
                            <ToggleGroup
                              type="single"
                              value={chartType}
                              onValueChange={(v) => { if (v) setChartType(v as ChartType); }}
                              className={`rounded-lg border-2 border-border p-1.5 bg-muted/30 transition-opacity ${overlayMode ? 'opacity-40 pointer-events-none' : ''}`}
                            >
                              <ToggleGroupItem value="line" className="h-9 px-3 gap-2">
                                <LineChartIcon className="h-4 w-4" />
                                <span className="hidden sm:inline font-medium">Line</span>
                              </ToggleGroupItem>
                              <ToggleGroupItem value="area" className="h-9 px-3 gap-2">
                                <TrendingUp className="h-4 w-4" />
                                <span className="hidden sm:inline font-medium">Area</span>
                              </ToggleGroupItem>
                              <ToggleGroupItem value="bar" className="h-9 px-3 gap-2">
                                <BarChart3 className="h-4 w-4" />
                                <span className="hidden sm:inline font-medium">Bar</span>
                              </ToggleGroupItem>
                            </ToggleGroup>

                            {/* Per-metric color pickers in compare mode */}
                            {overlayMode && (
                                <div className="flex gap-1 items-center rounded-lg border-2 border-border p-1.5 bg-muted/30">
                                    {metricOptions
                                        .filter(opt => overlayMetrics.has(opt.value as MetricType))
                                        .map((opt) => {
                                            const mt = opt.value as MetricType;
                                            const currentColor = overlayColors[mt] || opt.color;
                                            // Collect colors used by OTHER overlay metrics (custom or default)
                                            const usedColors = new Set(
                                                Array.from(overlayMetrics)
                                                    .filter(m => m !== mt)
                                                    .map(m => overlayColors[m] || metricOptions.find(o => o.value === m)?.color || '')
                                            );
                                            return (
                                                <DropdownMenu key={mt}>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-9 px-2 gap-1.5 text-xs rounded-md"
                                                            style={{ color: currentColor }}
                                                        >
                                                            <div className="h-3 w-3 rounded-full border border-current" style={{ backgroundColor: currentColor }} />
                                                            <span className="hidden sm:inline">{opt.shortLabel}</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>{opt.shortLabel} Color</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <div className="grid grid-cols-4 gap-2 p-2">
                                                            {CHART_COLORS.filter(c => c.value !== '').map((c) => {
                                                                const isDuplicate = usedColors.has(c.value);
                                                                return (
                                                                    <DropdownMenuItem
                                                                        key={c.name}
                                                                        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-md p-0 hover:bg-muted focus:bg-muted ${isDuplicate ? 'opacity-25 pointer-events-none' : ''}`}
                                                                        onSelect={() => {
                                                                            if (!isDuplicate) {
                                                                                setOverlayColors(prev => ({ ...prev, [mt]: c.value }));
                                                                            }
                                                                        }}
                                                                        title={isDuplicate ? 'Already used by another graph' : c.name}
                                                                    >
                                                                        <div className="h-6 w-6 rounded-full border border-border shadow-sm" style={{ backgroundColor: c.value }} />
                                                                    </DropdownMenuItem>
                                                                );
                                                            })}
                                                        </div>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            );
                                        })}
                                    {/* Reset all colors to default */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 px-2 gap-1.5 text-xs rounded-md text-muted-foreground hover:text-foreground"
                                        onClick={() => setOverlayColors({})}
                                        title="Reset all colors to default"
                                    >
                                        <RefreshCw className="h-3 w-3" />
                                        <span className="hidden sm:inline">Reset</span>
                                    </Button>
                                </div>
                            )}

                            {/* Color Picker (single metric mode only) */}
                            {!overlayMode && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-[52px] w-[52px] rounded-lg border-2 border-border p-0 hover:bg-muted/50"
                                            style={customColor ? { borderColor: customColor } : {}}
                                        >
                                            <Palette className="h-5 w-5" style={customColor ? { color: customColor } : {}} />
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
                                                    onSelect={() => setCustomColor(color.value)}
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
                            )}
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="h-60 sm:h-80">
                        {isLoadingHistory ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : historyData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <History className="h-16 w-16 mb-4 opacity-50" />
                                <p className="text-lg font-medium">No historical data available</p>
                                <p className="text-sm mt-1">Add servers and wait for metrics to be collected</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                {renderChart()}
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Legend */}
                    {historyData.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 pt-4 border-t border-border">
                            {metricOptions.map((option) => {
                                const mt = option.value as MetricType;
                                const isActive = overlayMode ? overlayMetrics.has(mt) : selectedMetric === mt;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            if (overlayMode) {
                                                const next = new Set(overlayMetrics);
                                                if (next.has(mt)) {
                                                    if (next.size > 1) next.delete(mt);
                                                } else {
                                                    next.add(mt);
                                                }
                                                setOverlayMetrics(next);
                                            } else {
                                                setSelectedMetric(mt);
                                            }
                                        }}
                                        className={`flex items-center gap-2 text-sm transition-opacity ${isActive ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
                                    >
                                        <div
                                            className="w-3 h-3 rounded-sm"
                                            style={{ backgroundColor: (overlayMode && overlayColors[mt]) ? overlayColors[mt] : option.color }}
                                        />
                                        <span>{option.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Server Overview */}
                {servers.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-6">
                        <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                            Monitoring {servers.length} Server{servers.length !== 1 && 's'}
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {servers.map((server) => (
                                <div
                                    key={server.id}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                                >
                                    <div className={`h-2 w-2 rounded-full ${server.status === 'ONLINE' ? 'bg-success' : 'bg-destructive'}`} />
                                    <div className="flex-1 truncate">
                                        <p className="text-sm font-medium text-foreground truncate">{server.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{server.hostAddress}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
