import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Loader2, 
  AlertTriangle, 
  Trash2,
  Server
} from 'lucide-react';
import { serversApi, alertRulesApi, Server as ServerType, AlertRule } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const METRIC_TYPES = [
  { value: 'CPU_USAGE', label: 'CPU Usage (%)' },
  { value: 'MEMORY_USAGE', label: 'Memory Usage (%)' },
  { value: 'DISK_USAGE', label: 'Disk Usage (%)' },
  { value: 'MEMORY_AVAILABLE', label: 'Memory Available (MB)' },
  { value: 'LOAD_AVERAGE', label: 'Load Average' },
  { value: 'PROCESS_COUNT', label: 'Process Count' },
];

const OPERATORS = [
  { value: 'GREATER_THAN', label: 'Greater than (>)' },
  { value: 'LESS_THAN', label: 'Less than (<)' },
  { value: 'GREATER_THAN_OR_EQUAL', label: 'Greater than or equal (>=)' },
  { value: 'LESS_THAN_OR_EQUAL', label: 'Less than or equal (<=)' },
  { value: 'EQUALS', label: 'Equals (=)' },
  { value: 'NOT_EQUALS', label: 'Not equals (!=)' },
];

const SEVERITIES = [
  { value: 'INFO', label: 'Info' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'CRITICAL', label: 'Critical' },
];

export default function AlertRules() {
  const [servers, setServers] = useState<ServerType[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    metricType: '',
    conditionOperator: '',
    thresholdValue: '',
    durationSeconds: '60',
    severity: '',
    cooldownMinutes: '5',
  });

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await serversApi.getAll();
        if (response.success) {
          setServers(response.data);
          if (response.data.length > 0) {
            setSelectedServer(response.data[0].id.toString());
          }
        }
      } catch (error) {
        toast({ title: 'Failed to fetch servers', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchServers();
  }, []);

  useEffect(() => {
    if (selectedServer) {
      fetchRules();
    }
  }, [selectedServer]);

  const fetchRules = async () => {
    if (!selectedServer) return;
    
    try {
      const response = await alertRulesApi.getByServer(Number(selectedServer));
      if (response.success) {
        setRules(response.data);
      }
    } catch (error) {
      toast({ title: 'Failed to fetch rules', variant: 'destructive' });
    }
  };

  const handleCreateRule = async () => {
    if (!selectedServer) return;
    setIsSubmitting(true);

    try {
      const response = await alertRulesApi.create({
        name: formData.name,
        description: formData.description,
        serverId: Number(selectedServer),
        metricType: formData.metricType,
        conditionOperator: formData.conditionOperator,
        thresholdValue: Number(formData.thresholdValue),
        durationSeconds: Number(formData.durationSeconds),
        severity: formData.severity,
        cooldownMinutes: Number(formData.cooldownMinutes),
      });

      if (response.success) {
        setRules([...rules, response.data]);
        setIsDialogOpen(false);
        setFormData({
          name: '',
          description: '',
          metricType: '',
          conditionOperator: '',
          thresholdValue: '',
          durationSeconds: '60',
          severity: '',
          cooldownMinutes: '5',
        });
        toast({ title: 'Alert rule created' });
      }
    } catch (error) {
      toast({ 
        title: 'Failed to create rule', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRule = async (ruleId: number, enabled: boolean) => {
    try {
      await alertRulesApi.toggle(ruleId, enabled);
      setRules(rules.map(r => r.id === ruleId ? { ...r, isEnabled: enabled } : r));
      toast({ title: `Rule ${enabled ? 'enabled' : 'disabled'}` });
    } catch (error) {
      toast({ title: 'Failed to toggle rule', variant: 'destructive' });
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    try {
      await alertRulesApi.delete(ruleId);
      setRules(rules.filter(r => r.id !== ruleId));
      toast({ title: 'Rule deleted' });
    } catch (error) {
      toast({ title: 'Failed to delete rule', variant: 'destructive' });
    }
  };

  const getOperatorSymbol = (op: string) => {
    const symbols: Record<string, string> = {
      GREATER_THAN: '>',
      LESS_THAN: '<',
      GREATER_THAN_OR_EQUAL: '>=',
      LESS_THAN_OR_EQUAL: '<=',
      EQUALS: '=',
      NOT_EQUALS: '!=',
    };
    return symbols[op] || op;
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Alert Rules</h1>
            <p className="mt-1 text-muted-foreground">
              Configure threshold-based alerts for your servers
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={servers.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Alert Rule</DialogTitle>
                <DialogDescription>
                  Set up a new threshold-based alert for the selected server.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., High CPU Alert"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Describe this alert rule..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Metric Type</Label>
                    <Select
                      value={formData.metricType}
                      onValueChange={(value) => setFormData({ ...formData, metricType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select metric" />
                      </SelectTrigger>
                      <SelectContent>
                        {METRIC_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select
                      value={formData.conditionOperator}
                      onValueChange={(value) => setFormData({ ...formData, conditionOperator: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Threshold Value</Label>
                    <Input
                      id="threshold"
                      type="number"
                      placeholder="90"
                      value={formData.thresholdValue}
                      onChange={(e) => setFormData({ ...formData, thresholdValue: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value) => setFormData({ ...formData, severity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEVERITIES.map((sev) => (
                          <SelectItem key={sev.value} value={sev.value}>
                            {sev.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (seconds)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="60"
                      value={formData.durationSeconds}
                      onChange={(e) => setFormData({ ...formData, durationSeconds: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cooldown">Cooldown (minutes)</Label>
                    <Input
                      id="cooldown"
                      type="number"
                      placeholder="5"
                      value={formData.cooldownMinutes}
                      onChange={(e) => setFormData({ ...formData, cooldownMinutes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRule} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Rule'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Server Selector */}
        {servers.length > 0 && (
          <div className="flex items-center gap-4">
            <Server className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedServer} onValueChange={setSelectedServer}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a server" />
              </SelectTrigger>
              <SelectContent>
                {servers.map((server) => (
                  <SelectItem key={server.id} value={server.id.toString()}>
                    {server.name} ({server.hostAddress})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Rules Table */}
        {servers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
            <Server className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-display text-lg font-medium text-foreground">
              No servers registered
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a server first to create alert rules
            </p>
          </div>
        ) : rules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-display text-lg font-medium text-foreground">
              No alert rules
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first alert rule to get notified when thresholds are breached
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{rule.metricType}</TableCell>
                    <TableCell>
                      <code className="text-sm">
                        {getOperatorSymbol(rule.conditionOperator)} {rule.thresholdValue}
                      </code>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={rule.severity} showDot={false} size="sm" />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.isEnabled}
                        onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
