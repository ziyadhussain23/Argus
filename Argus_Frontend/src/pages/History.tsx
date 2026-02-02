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
    FileImage,
    FileText,
    FileSpreadsheet,
    FileJson,
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
    ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts';

type ChartType = 'line' | 'area' | 'bar';
type MetricType = 'CPU_USAGE' | 'MEMORY_USAGE' | 'DISK_USAGE' | 'LOAD_AVERAGE';
type TimeFrame = '1h' | '6h' | '24h' | '7d' | '30d';

interface AggregatedMetric {
    time: string;
    timestamp: number;
    cpu: number;
    memory: number;
    disk: number;
    load: number;
}

const timeFrameOptions: { value: TimeFrame; label: string; bucketMinutes: number; dataPoints: number }[] = [
    { value: '1h', label: '1 Hour', bucketMinutes: 1, dataPoints: 60 },
    { value: '6h', label: '6 Hours', bucketMinutes: 5, dataPoints: 72 },
    { value: '24h', label: '24 Hours', bucketMinutes: 15, dataPoints: 96 },
    { value: '7d', label: '7 Days', bucketMinutes: 60, dataPoints: 168 },
    { value: '30d', label: '30 Days', bucketMinutes: 360, dataPoints: 120 },
];

const metricOptions = [
    { value: 'CPU_USAGE', label: 'CPU Usage', shortLabel: 'CPU', color: 'hsl(var(--primary))', icon: Cpu },
    { value: 'MEMORY_USAGE', label: 'Memory Usage', shortLabel: 'Memory', color: 'hsl(142 76% 36%)', icon: MemoryStick },
    { value: 'DISK_USAGE', label: 'Disk Usage', shortLabel: 'Disk', color: 'hsl(38 92% 50%)', icon: HardDrive },
    { value: 'LOAD_AVERAGE', label: 'Load Average', shortLabel: 'Load', color: 'hsl(280 70% 50%)', icon: Activity },
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
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('24h');
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
        const timeConfig = timeFrameOptions.find(t => t.value === timeFrame)!;

        try {
            // Filter servers based on selection
            const targetServers = selectedServer === 'all'
                ? servers
                : servers.filter(s => s.id.toString() === selectedServer);

            // Fetch metrics for selected servers
            const metricsPromises = targetServers.map(server =>
                Promise.all([
                    serversApi.getMetrics(server.id, { type: 'CPU_USAGE' }).catch(() => ({ success: false, data: [] })),
                    serversApi.getMetrics(server.id, { type: 'MEMORY_USAGE' }).catch(() => ({ success: false, data: [] })),
                    serversApi.getMetrics(server.id, { type: 'DISK_USAGE' }).catch(() => ({ success: false, data: [] })),
                    serversApi.getMetrics(server.id, { type: 'LOAD_AVERAGE' }).catch(() => ({ success: false, data: [] })),
                ])
            );

            const allResults = await Promise.all(metricsPromises);

            // Calculate time range
            const now = Date.now();
            const timeRangeMs = {
                '1h': 60 * 60 * 1000,
                '6h': 6 * 60 * 60 * 1000,
                '24h': 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '30d': 30 * 24 * 60 * 60 * 1000,
            }[timeFrame];
            const startTime = now - timeRangeMs;

            // Aggregate metrics by timestamp buckets
            const bucketSize = timeConfig.bucketMinutes * 60 * 1000;
            const bucketMap = new Map<number, { cpu: number[]; memory: number[]; disk: number[]; load: number[] }>();

            allResults.forEach((serverMetrics) => {
                const [cpuRes, memRes, diskRes, loadRes] = serverMetrics;

                const processMetrics = (res: { success: boolean; data: Metric[] }, key: 'cpu' | 'memory' | 'disk' | 'load') => {
                    if (res.success && res.data) {
                        res.data.forEach((m: Metric) => {
                            const metricTime = new Date(m.timestamp).getTime();
                            if (metricTime >= startTime) {
                                const bucket = Math.floor(metricTime / bucketSize) * bucketSize;
                                if (!bucketMap.has(bucket)) {
                                    bucketMap.set(bucket, { cpu: [], memory: [], disk: [], load: [] });
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
            });

            // Convert to array and calculate averages
            const formatTime = (timestamp: number) => {
                const date = new Date(timestamp);
                if (timeFrame === '1h' || timeFrame === '6h') {
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else if (timeFrame === '24h') {
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else {
                    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
                }))
                .sort((a, b) => a.timestamp - b.timestamp)
                .slice(-timeConfig.dataPoints);

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
    }, [servers.length, timeFrame, selectedServer]);

    const getMetricData = () => {
        const key = selectedMetric === 'CPU_USAGE' ? 'cpu'
            : selectedMetric === 'MEMORY_USAGE' ? 'memory'
                : selectedMetric === 'DISK_USAGE' ? 'disk' : 'load';
        return historyData.map(d => ({ time: d.time, value: Number(d[key].toFixed(2)) }));
    };

    const getMetricColor = () => {
        if (customColor) return customColor;
        return metricOptions.find(m => m.value === selectedMetric)?.color || 'hsl(var(--primary))';
    };

    const getMetricStats = () => {
        const data = getMetricData();
        if (data.length === 0) return { avg: 0, max: 0, min: 0, current: 0 };

        const values = data.map(d => d.value);
        return {
            avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
            max: Math.max(...values).toFixed(1),
            min: Math.min(...values).toFixed(1),
            current: values[values.length - 1]?.toFixed(1) || '0',
        };
    };

    const renderChart = () => {
        const data = getMetricData();
        const color = getMetricColor();
        const domain: [number | 'auto', number | 'auto'] = selectedMetric === 'LOAD_AVERAGE' ? ['auto', 'auto'] : [0, 100];

        const tooltipStyle = {
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
        };

        if (chartType === 'line') {
            return (
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={domain} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
                </LineChart>
            );
        } else if (chartType === 'area') {
            return (
                <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={domain} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="value" stroke={color} fill={`${color.replace(')', ' / 0.3)')}`} strokeWidth={2} />
                </AreaChart>
            );
        } else {
            return (
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={domain} />
                    <Tooltip contentStyle={tooltipStyle} />
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
            metricUnit: selectedMetric !== 'LOAD_AVERAGE' ? '%' : '',
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
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Current</p>
                        <p className="text-2xl font-bold text-foreground">{stats.current}{selectedMetric !== 'LOAD_AVERAGE' && '%'}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Average</p>
                        <p className="text-2xl font-bold text-foreground">{stats.avg}{selectedMetric !== 'LOAD_AVERAGE' && '%'}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Maximum</p>
                        <p className="text-2xl font-bold text-warning">{stats.max}{selectedMetric !== 'LOAD_AVERAGE' && '%'}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Minimum</p>
                        <p className="text-2xl font-bold text-success">{stats.min}{selectedMetric !== 'LOAD_AVERAGE' && '%'}</p>
                    </div>
                </div>

                {/* Main Chart */}
                <div ref={chartRef} className="rounded-xl border-2 border-border bg-card p-6 shadow-sm">
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
                            {/* Metric Selector */}
                            <div className="flex gap-1 rounded-lg border-2 border-border p-1.5 bg-muted/30">
                                {metricOptions.map((option) => {
                                    const isSelected = selectedMetric === option.value;
                                    return (
                                        <Button
                                            key={option.value}
                                            variant={isSelected ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setSelectedMetric(option.value as MetricType)}
                                            className={`h-9 px-3 gap-2 transition-all ${isSelected
                                                ? 'shadow-md ring-2 ring-offset-1 ring-offset-background'
                                                : 'opacity-60 hover:opacity-100'
                                                }`}
                                            style={isSelected ? {
                                                backgroundColor: option.color,
                                            } : {}}
                                        >
                                            <option.icon className="h-4 w-4" />
                                            <span className="hidden md:inline font-medium">{option.shortLabel}</span>
                                        </Button>
                                    );
                                })}
                            </div>

                            {/* Chart Type Selector */}
                            <div className="flex gap-1 rounded-lg border-2 border-border p-1.5 bg-muted/30">
                                <Button
                                    variant={chartType === 'line' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setChartType('line')}
                                    className={`h-9 px-3 gap-2 transition-all ${chartType === 'line'
                                        ? 'shadow-md ring-2 ring-primary ring-offset-1 ring-offset-background'
                                        : 'opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <LineChartIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline font-medium">Line</span>
                                </Button>
                                <Button
                                    variant={chartType === 'area' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setChartType('area')}
                                    className={`h-9 px-3 gap-2 transition-all ${chartType === 'area'
                                        ? 'shadow-md ring-2 ring-primary ring-offset-1 ring-offset-background'
                                        : 'opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="hidden sm:inline font-medium">Area</span>
                                </Button>
                                <Button
                                    variant={chartType === 'bar' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setChartType('bar')}
                                    className={`h-9 px-3 gap-2 transition-all ${chartType === 'bar'
                                        ? 'shadow-md ring-2 ring-primary ring-offset-1 ring-offset-background'
                                        : 'opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <BarChart3 className="h-4 w-4" />
                                    <span className="hidden sm:inline font-medium">Bar</span>
                                </Button>
                            </div>

                            {/* Color Picker */}
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
                                                onClick={() => setCustomColor(color.value)}
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

                    {/* Chart */}
                    <div className="h-80">
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
                            {metricOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setSelectedMetric(option.value as MetricType)}
                                    className={`flex items-center gap-2 text-sm transition-opacity ${selectedMetric === option.value ? 'opacity-100' : 'opacity-50 hover:opacity-75'
                                        }`}
                                >
                                    <div
                                        className="w-3 h-3 rounded-sm"
                                        style={{ backgroundColor: option.color }}
                                    />
                                    <span>{option.label}</span>
                                </button>
                            ))}
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
