import { useEffect, useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AlertCard } from '@/components/AlertCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bell, 
  Loader2, 
  Filter,
  Shield,
  Search,
  Check,
  CheckCircle2,
  X,
  History
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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [resolvedAlerts, setResolvedAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingResolved, setIsLoadingResolved] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('active');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const [selectedAlerts, setSelectedAlerts] = useState<Set<number>>(new Set());
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

  const fetchResolvedAlerts = async () => {
    setIsLoadingResolved(true);
    try {
      const response = await alertsApi.getResolved();
      if (response.success) {
        setResolvedAlerts(response.data);
      }
    } catch {
      // Backend endpoint /alerts/resolved may not exist yet — silently return empty
      setResolvedAlerts([]);
    } finally {
      setIsLoadingResolved(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => clearTimeout(debounceTimer.current);
  }, []);

  // Fetch resolved alerts when switching to that tab
  useEffect(() => {
    if (activeTab === 'resolved') {
      fetchResolvedAlerts();
    }
  }, [activeTab]);

  // Debounce search input
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const handleAcknowledge = async (alertId: number, _note?: string) => {
    try {
      await alertsApi.acknowledge(alertId);
      setAlerts(prev => prev.map(a =>
        a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' as const } : a
      ));
      setSelectedAlerts(prev => { const next = new Set(prev); next.delete(alertId); return next; });
      toast({ title: 'Alert acknowledged' });
    } catch (error) {
      toast({ title: 'Failed to acknowledge alert', variant: 'destructive' });
    }
  };

  const handleResolve = async (alertId: number) => {
    try {
      await alertsApi.resolve(alertId);
      setAlerts(prev => {
        const resolved = prev.find(a => a.id === alertId);
        if (resolved) {
          setResolvedAlerts(p => [{ ...resolved, status: 'RESOLVED' as const }, ...p]);
        }
        return prev.filter(a => a.id !== alertId);
      });
      setSelectedAlerts(prev => { const next = new Set(prev); next.delete(alertId); return next; });
      toast({ title: 'Alert resolved' });
    } catch (error) {
      toast({ title: 'Failed to resolve alert', variant: 'destructive' });
    }
  };

  const handleBulkAcknowledge = async () => {
    const ids = Array.from(selectedAlerts).filter(id => {
      const alert = alerts.find(a => a.id === id);
      return alert && alert.status === 'ACTIVE';
    });
    let failed = 0;
    const succeeded: number[] = [];
    for (const id of ids) {
      try { await alertsApi.acknowledge(id); succeeded.push(id); } catch { failed++; }
    }
    setAlerts(prev => prev.map(a => succeeded.includes(a.id) ? { ...a, status: 'ACKNOWLEDGED' as const } : a));
    setSelectedAlerts(new Set());
    if (failed > 0) {
      toast({ title: `${ids.length - failed} acknowledged, ${failed} failed`, variant: 'destructive' });
    } else {
      toast({ title: `${ids.length} alert(s) acknowledged` });
    }
  };

  const handleBulkResolve = async () => {
    const ids = Array.from(selectedAlerts);
    let failed = 0;
    const resolvedItems: Alert[] = [];
    for (const id of ids) {
      try {
        await alertsApi.resolve(id);
        const found = alerts.find(a => a.id === id);
        if (found) resolvedItems.push({ ...found, status: 'RESOLVED' as const });
      } catch { failed++; }
    }
    if (resolvedItems.length > 0) {
      setResolvedAlerts(prev => [...resolvedItems, ...prev]);
    }
    setAlerts(prev => prev.filter(a => !ids.includes(a.id)));
    setSelectedAlerts(new Set());
    if (failed > 0) {
      toast({ title: `${ids.length - failed} resolved, ${failed} failed`, variant: 'destructive' });
    } else {
      toast({ title: `${ids.length} alert(s) resolved` });
    }
  };

  const toggleSelectAlert = (id: number) => {
    setSelectedAlerts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedAlerts.size === filteredAlerts.length) {
      setSelectedAlerts(new Set());
    } else {
      setSelectedAlerts(new Set(filteredAlerts.map(a => a.id)));
    }
  };

  const filteredAlerts = (activeTab === 'resolved' ? resolvedAlerts : alerts).filter((alert) => {
    const matchesSearch = debouncedSearch === '' ||
      alert.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      alert.serverName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      alert.message.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
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

        {/* Tabs: Active / Resolved */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Bell className="h-4 w-4" />
              Active ({alerts.length})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="gap-2">
              <History className="h-4 w-4" />
              Resolved ({resolvedAlerts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6 mt-4">
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

            {/* Search & Filters */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search alerts by title, server, or message..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

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

            {/* Active Alerts List */}
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
                {/* Bulk Actions Bar */}
                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={filteredAlerts.length > 0 && selectedAlerts.size === filteredAlerts.length}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedAlerts.size > 0 ? `${selectedAlerts.size} selected` : 'Select all'}
                    </span>
                  </div>
                  {selectedAlerts.size > 0 && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleBulkAcknowledge}>
                        <Check className="mr-1 h-3.5 w-3.5" />
                        Acknowledge ({selectedAlerts.size})
                      </Button>
                      <Button variant="default" size="sm" onClick={handleBulkResolve}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Resolve ({selectedAlerts.size})
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedAlerts(new Set())}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {filteredAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3">
                    <div className="pt-5">
                      <Checkbox
                        checked={selectedAlerts.has(alert.id)}
                        onCheckedChange={() => toggleSelectAlert(alert.id)}
                      />
                    </div>
                    <div className="flex-1">
                      <AlertCard
                        alert={alert}
                        onAcknowledge={handleAcknowledge}
                        onResolve={handleResolve}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-6 mt-4">
            {/* Search for resolved */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search resolved alerts..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

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
            </div>

            {isLoadingResolved ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
                <History className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-display text-lg font-medium text-foreground">
                  No resolved alerts
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Resolved alerts will appear here once the backend endpoint is available.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Requires: <code className="rounded bg-muted px-1.5 py-0.5">GET /api/v1/alerts/resolved</code>
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
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
