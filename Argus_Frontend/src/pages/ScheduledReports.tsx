import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Clock, Plus, Trash2, Download, Loader2, Server as ServerIcon,
  Cpu, HardDrive, MemoryStick, Activity, BarChart3, Timer, Pencil,
  Mail, Info
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { reportsApi, serversApi, type ScheduledReport, type Server } from '@/lib/api';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const AVAILABLE_METRICS = [
  { value: 'CPU_USAGE', label: 'CPU Usage', unit: '%', icon: Cpu },
  { value: 'MEMORY_USAGE', label: 'Memory Usage', unit: '%', icon: MemoryStick },
  { value: 'DISK_USAGE', label: 'Disk Usage', unit: '%', icon: HardDrive },
  { value: 'LOAD_AVERAGE', label: 'Load Average', unit: '', icon: Activity },
  { value: 'PROCESS_COUNT', label: 'Process Count', unit: '', icon: BarChart3 },
  { value: 'UPTIME', label: 'Uptime', unit: 's', icon: Timer },
];

const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF Report' },
  { value: 'csv', label: 'CSV Spreadsheet' },
  { value: 'excel', label: 'Excel Workbook' },
];

const FREQUENCY_OPTIONS = [
  { value: 'none', label: 'Manual only' },
  { value: 'auto', label: 'Auto send via Email' },
];

const TIMEFRAME_OPTIONS = [
  { value: '1h', label: 'Last 1 Hour', ms: 60 * 60 * 1000 },
  { value: '6h', label: 'Last 6 Hours', ms: 6 * 60 * 60 * 1000 },
  { value: '24h', label: 'Last 24 Hours', ms: 24 * 60 * 60 * 1000 },
  { value: '7d', label: 'Last 7 Days', ms: 7 * 24 * 60 * 60 * 1000 },
  { value: '30d', label: 'Last 30 Days', ms: 30 * 24 * 60 * 60 * 1000 },
];

export default function ScheduledReports() {
  const { toast } = useToast();
  const [servers, setServers] = useState<Server[]>([]);
  const [loadingServers, setLoadingServers] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [reports, setReports] = useState<ScheduledReport[]>([]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    format: 'pdf' as 'pdf' | 'csv' | 'excel',
    servers: [] as number[],
    metrics: [] as string[],
    timeframe: '24h',
    frequency: 'none' as 'none' | 'auto',
    recipients: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [serversRes, reportsRes] = await Promise.all([
          serversApi.getAll(),
          reportsApi.getAll(),
        ]);
        setServers(serversRes.data ?? []);
        setReports(reportsRes.data ?? []);
      } catch {
        toast({ title: 'Failed to load report data', variant: 'destructive' });
      } finally {
        setLoadingServers(false);
        setLoadingReports(false);
      }
    };
    load();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', format: 'pdf', servers: [], metrics: [], timeframe: '24h', frequency: 'none', recipients: '' });
    setIsCreating(false);
    setEditingId(null);
  };

  const toggleMetric = (metric: string) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metric)
        ? prev.metrics.filter(m => m !== metric)
        : [...prev.metrics, metric],
    }));
  };

  const toggleServer = (id: number) => {
    setFormData(prev => ({
      ...prev,
      servers: prev.servers.includes(id)
        ? prev.servers.filter(s => s !== id)
        : [...prev.servers, id],
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({ title: 'Report name is required', variant: 'destructive' });
      return false;
    }
    if (formData.metrics.length === 0) {
      toast({ title: 'Select at least one metric', variant: 'destructive' });
      return false;
    }
    if (formData.frequency === 'auto' && !formData.recipients.trim()) {
      toast({ title: 'Email recipients are required for scheduled reports', variant: 'destructive' });
      return false;
    }
    if (formData.recipients.trim()) {
      const emails = formData.recipients.split(',').map(e => e.trim()).filter(Boolean);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalid = emails.find(e => !emailRegex.test(e));
      if (invalid) {
        toast({ title: `Invalid email: ${invalid}`, variant: 'destructive' });
        return false;
      }
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      const response = await reportsApi.create({
        name: formData.name.trim(),
        format: formData.format,
        servers: formData.servers,
        metrics: formData.metrics,
        timeframe: formData.timeframe,
        frequency: formData.frequency,
        recipients: formData.recipients.trim(),
        enabled: formData.frequency === 'auto',
      });
      setReports(prev => [response.data, ...prev]);
      resetForm();
      toast({ title: 'Report template created' });
    } catch (error) {
      toast({
        title: 'Failed to create report template',
        description: error instanceof Error ? error.message : 'Unexpected error',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!validateForm() || !editingId) return;

    try {
      const response = await reportsApi.update(editingId, {
        name: formData.name.trim(),
        format: formData.format,
        servers: formData.servers,
        metrics: formData.metrics,
        timeframe: formData.timeframe,
        frequency: formData.frequency,
        recipients: formData.recipients.trim(),
        enabled: formData.frequency === 'auto',
      });
      setReports(prev => prev.map(r => r.id === editingId ? response.data : r));
      resetForm();
      toast({ title: 'Report template updated' });
    } catch (error) {
      toast({
        title: 'Failed to update report template',
        description: error instanceof Error ? error.message : 'Unexpected error',
        variant: 'destructive',
      });
    }
  };

  const openEdit = (report: ScheduledReport) => {
    setFormData({
      name: report.name,
      format: report.format,
      servers: report.servers,
      metrics: report.metrics,
      timeframe: report.timeframe ?? '24h',
      frequency: report.frequency ?? 'none',
      recipients: report.recipients ?? '',
    });
    setEditingId(report.id);
    setIsCreating(true);
  };

  const toggleReportEnabled = async (report: ScheduledReport) => {
    try {
      const response = await reportsApi.update(report.id, {
        name: report.name,
        format: report.format,
        servers: report.servers,
        metrics: report.metrics,
        timeframe: report.timeframe,
        frequency: report.frequency,
        recipients: report.recipients,
        enabled: !report.enabled,
      });
      setReports(prev => prev.map(r => r.id === report.id ? response.data : r));
    } catch (error) {
      toast({
        title: 'Failed to toggle auto email',
        description: error instanceof Error ? error.message : 'Unexpected error',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await reportsApi.delete(id);
      setReports(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Report template removed' });
    } catch (error) {
      toast({
        title: 'Failed to delete report template',
        description: error instanceof Error ? error.message : 'Unexpected error',
        variant: 'destructive',
      });
    }
  };

  // ── Generate report with real data ──────────────────────────
  const generateReport = async (report: ScheduledReport) => {
    setGeneratingId(report.id);
    try {
      const targetServers = report.servers.length > 0
        ? servers.filter(s => report.servers.includes(s.id))
        : servers;

      if (targetServers.length === 0) {
        toast({ title: 'No servers available to report on', variant: 'destructive' });
        return;
      }

      // Fetch metrics for the selected time frame
      const tfOption = TIMEFRAME_OPTIONS.find(t => t.value === (report.timeframe ?? '24h'));
      const now = new Date();
      const start = new Date(now.getTime() - (tfOption?.ms ?? 24 * 60 * 60 * 1000));
      const allData: { serverName: string; serverHost: string; metric: string; value: number; unit: string; timestamp: string }[] = [];

      for (const server of targetServers) {
        for (const metricType of report.metrics) {
          try {
            // Try fetching time-range data first
            const res = await serversApi.getMetrics(server.id, {
              type: metricType,
              start: start.toISOString(),
              end: now.toISOString(),
            });
            const metricsArr = res.data;
            if (metricsArr && metricsArr.length > 0) {
              const metricInfo = AVAILABLE_METRICS.find(am => am.value === metricType);
              for (const m of metricsArr) {
                allData.push({
                  serverName: server.name,
                  serverHost: server.hostAddress,
                  metric: metricInfo?.label ?? metricType,
                  value: m.value,
                  unit: metricInfo?.unit ?? '',
                  timestamp: m.timestamp ?? now.toISOString(),
                });
              }
            } else {
              // Fallback to latest if no range data
              const latestRes = await serversApi.getLatestMetric(server.id, metricType);
              const m = latestRes.data;
              if (m) {
                const metricInfo = AVAILABLE_METRICS.find(am => am.value === metricType);
                allData.push({
                  serverName: server.name,
                  serverHost: server.hostAddress,
                  metric: metricInfo?.label ?? metricType,
                  value: m.value,
                  unit: metricInfo?.unit ?? '',
                  timestamp: m.timestamp ?? now.toISOString(),
                });
              }
            }
          } catch { /* skip unavailable metrics */ }
        }
      }

      if (allData.length === 0) {
        toast({ title: 'No metric data available for selected servers', variant: 'destructive' });
        return;
      }

      const ts = now.toLocaleString();
      const tfLabel = TIMEFRAME_OPTIONS.find(t => t.value === (report.timeframe ?? '24h'))?.label ?? 'Last 24 Hours';
      const safeFilename = report.name.replace(/[^a-zA-Z0-9_-]/g, '_');

      if (report.format === 'pdf') {
        generatePDF(report.name, allData, ts, safeFilename, tfLabel);
      } else if (report.format === 'excel') {
        generateExcel(report.name, allData, ts, safeFilename, tfLabel);
      } else {
        generateCSV(report.name, allData, ts, safeFilename, tfLabel);
      }

      // Update lastGenerated
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, lastGeneratedAt: now.toISOString() } : r));
      toast({ title: `Report "${report.name}" downloaded` });

    } catch {
      toast({ title: 'Failed to generate report', variant: 'destructive' });
    } finally {
      setGeneratingId(null);
    }
  };

  const generatePDF = (
    title: string,
    data: { serverName: string; serverHost: string; metric: string; value: number; unit: string; timestamp: string }[],
    timestamp: string,
    filename: string,
    timeframe: string
  ) => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Argus Infrastructure Report', 15, 20);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(title, 15, 28);

    pdf.setFontSize(9);
    pdf.setTextColor(100);
    pdf.text(`Generated: ${timestamp}  |  Time Frame: ${timeframe}`, 15, 34);
    pdf.setTextColor(0);

    // Table header
    let y = 44;
    pdf.setFillColor(240, 240, 240);
    pdf.rect(15, y - 5, 180, 8, 'F');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Server', 17, y);
    pdf.text('Host', 62, y);
    pdf.text('Metric', 107, y);
    pdf.text('Value', 152, y);
    pdf.text('Time', 172, y);

    y += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    for (const row of data) {
      if (y > 275) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(row.serverName.substring(0, 22), 17, y);
      pdf.text(row.serverHost.substring(0, 22), 62, y);
      pdf.text(row.metric, 107, y);
      pdf.text(`${row.value.toFixed(2)}${row.unit}`, 152, y);
      pdf.text(new Date(row.timestamp).toLocaleTimeString(), 172, y);
      y += 5;
    }

    // Summary
    y += 8;
    if (y > 260) { pdf.addPage(); y = 20; }
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary', 15, y);
    y += 6;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const uniqueServers = new Set(data.map(d => d.serverName)).size;
    const uniqueMetrics = new Set(data.map(d => d.metric)).size;
    pdf.text(`Servers: ${uniqueServers}  |  Metrics: ${uniqueMetrics}  |  Data Points: ${data.length}`, 15, y);

    pdf.save(`${filename}_${Date.now()}.pdf`);
  };

  const generateExcel = (
    title: string,
    data: { serverName: string; serverHost: string; metric: string; value: number; unit: string; timestamp: string }[],
    timestamp: string,
    filename: string,
    timeframe: string
  ) => {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Argus Infrastructure Report'],
      ['Report:', title],
      ['Generated:', timestamp],
      ['Time Frame:', timeframe],
      ['Servers:', new Set(data.map(d => d.serverName)).size.toString()],
      ['Metrics:', new Set(data.map(d => d.metric)).size.toString()],
      ['Data Points:', data.length.toString()],
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

    // Data sheet
    const rows = [
      ['Server', 'Host', 'Metric', 'Value', 'Unit', 'Timestamp'],
      ...data.map(d => [d.serverName, d.serverHost, d.metric, d.value, d.unit, new Date(d.timestamp).toLocaleString()]),
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Data');

    // Per-server sheets
    const byServer = new Map<string, typeof data>();
    for (const d of data) {
      const arr = byServer.get(d.serverName) ?? [];
      arr.push(d);
      byServer.set(d.serverName, arr);
    }
    for (const [name, rows_] of byServer) {
      const sheet = [
        ['Metric', 'Value', 'Unit', 'Timestamp'],
        ...rows_.map(d => [d.metric, d.value, d.unit, new Date(d.timestamp).toLocaleString()]),
      ];
      const safeName = name.replace(/[\\/*?[\]:]/g, '').substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet), safeName);
    }

    XLSX.writeFile(workbook, `${filename}_${Date.now()}.xlsx`);
  };

  const generateCSV = (
    title: string,
    data: { serverName: string; serverHost: string; metric: string; value: number; unit: string; timestamp: string }[],
    timestamp: string,
    filename: string,
    timeframe: string
  ) => {
    const header = ['Server', 'Host', 'Metric', 'Value', 'Unit', 'Timestamp'];
    const csvSafe = (value: string): string => {
      const escaped = value.replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(escaped)) return `"'${escaped}"`;
      return `"${escaped}"`;
    };
    const rows = data.map(d =>
      [d.serverName, d.serverHost, d.metric, d.value.toFixed(2), d.unit, new Date(d.timestamp).toLocaleString()]
        .map(v => csvSafe(String(v)))
        .join(',')
    );
    const csv = [
      `# Argus Infrastructure Report: ${title}`,
      `# Generated: ${timestamp}`,
      `# Time Frame: ${timeframe}`,
      '',
      header.join(','),
      ...rows,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // ── UI ──────────────────────────────────────────────────────
  const isEditing = isCreating && editingId !== null;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Reports</h1>
            <p className="mt-1 text-muted-foreground">
              Create report templates and generate downloadable infrastructure reports from live data
            </p>
          </div>
          {!isCreating && (
            <Button onClick={() => { resetForm(); setIsCreating(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Button>
          )}
        </div>

        {/* Create / Edit Form */}
        {isCreating && (
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? 'Edit Report Template' : 'Create Report Template'}</CardTitle>
              <CardDescription>
                {isEditing ? 'Update your report configuration.' : 'Define which servers and metrics to include, then generate on demand.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label>Report Name</Label>
                <Input
                  placeholder="e.g., Daily Infrastructure Summary"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  maxLength={100}
                />
              </div>

              {/* Format & Time Frame */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select value={formData.format} onValueChange={(v) => setFormData({ ...formData, format: v as 'pdf' | 'csv' | 'excel' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAT_OPTIONS.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Time Frame</Label>
                  <Select value={formData.timeframe} onValueChange={(v) => setFormData({ ...formData, timeframe: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEFRAME_OPTIONS.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Servers */}
              <div className="space-y-2">
                <Label>Servers <span className="text-muted-foreground font-normal">(leave empty for all servers)</span></Label>
                {loadingServers ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading servers…
                  </div>
                ) : servers.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">No servers registered yet.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {servers.map(s => (
                      <label key={s.id} className="flex items-center gap-2 rounded-md border border-border p-2 cursor-pointer hover:bg-muted/50">
                        <Checkbox
                          checked={formData.servers.includes(s.id)}
                          onCheckedChange={() => toggleServer(s.id)}
                        />
                        <ServerIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{s.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Email Schedule */}
              <div className="space-y-2">
                <Label>Auto Email Schedule <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v as 'none' | 'auto' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recipients */}
              {formData.frequency === 'auto' && (
                <div className="space-y-2">
                  <Label>Email Recipients <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
                  <Input
                    placeholder="admin@example.com, team@example.com"
                    value={formData.recipients}
                    onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                    maxLength={500}
                  />
                  <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 p-3 mt-2">
                    <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">Backend required:</strong> Automated email delivery needs the backend scheduled email service. 
                      Reports will be saved locally and you can always <strong>Generate</strong> and download them manually.
                      When auto-email is enabled, reports will be sent based on the selected <strong>Time Frame</strong> above.
                    </p>
                  </div>
                </div>
              )}

              {/* Metrics */}
              <div className="space-y-2">
                <Label>Metrics to Include</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {AVAILABLE_METRICS.map(m => (
                    <label key={m.value} className="flex items-center gap-2 rounded-md border border-border p-2 cursor-pointer hover:bg-muted/50">
                      <Checkbox
                        checked={formData.metrics.includes(m.value)}
                        onCheckedChange={() => toggleMetric(m.value)}
                      />
                      <m.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={isEditing ? handleUpdate : handleCreate}>
                {isEditing ? 'Save Changes' : 'Create Template'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Reports List */}
        {loadingReports && !isCreating ? (
          <div className="rounded-xl border border-border bg-card/50 py-16 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Loading report templates...</p>
          </div>
        ) : reports.length === 0 && !isCreating ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-display text-lg font-medium text-foreground">No report templates</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a report template to start generating infrastructure reports.
            </p>
            <Button className="mt-4" onClick={() => { resetForm(); setIsCreating(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Report
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => {
              const isGenerating = generatingId === report.id;
              const serverLabel = report.servers.length === 0
                ? 'All servers'
                : `${report.servers.length} server${report.servers.length > 1 ? 's' : ''}`;
              const hasSchedule = report.frequency === 'auto';
              return (
                <Card key={report.id} className={hasSchedule && !report.enabled ? 'opacity-60' : ''}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-foreground truncate">{report.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {report.format.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {TIMEFRAME_OPTIONS.find(t => t.value === (report.timeframe ?? '24h'))?.label ?? 'Last 24 Hours'}
                          </Badge>
                          {hasSchedule && (
                            <Badge variant={report.enabled ? 'default' : 'outline'} className="text-xs">
                              <Mail className="h-3 w-3 mr-1" />
                              Auto Email
                            </Badge>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ServerIcon className="h-3 w-3" />
                            {serverLabel}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {report.metrics.length} metric{report.metrics.length !== 1 ? 's' : ''}
                          </span>
                          {hasSchedule && report.recipients && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              → {report.recipients}
                            </span>
                          )}
                          {report.lastGeneratedAt && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Last: {new Date(report.lastGeneratedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasSchedule && (
                        <Switch
                          checked={report.enabled}
                          onCheckedChange={() => toggleReportEnabled(report)}
                          aria-label={report.enabled ? 'Disable auto-email' : 'Enable auto-email'}
                        />
                      )}
                      <Button
                        size="sm"
                        onClick={() => generateReport(report)}
                        disabled={isGenerating || loadingServers}
                      >
                        {isGenerating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        {isGenerating ? 'Generating…' : 'Generate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(report)}
                        aria-label={`Edit report ${report.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm(`Delete report "${report.name}"?`)) {
                            handleDelete(report.id);
                          }
                        }}
                        aria-label={`Delete report ${report.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
