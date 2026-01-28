import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Server, 
  Loader2, 
  Copy, 
  Check,
  Terminal,
  Download
} from 'lucide-react';
import { serversApi, Server as ServerType, getApiBaseUrl } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const operatingSystems = [
  { value: 'macOS', label: 'macOS' },
  { value: 'Windows 10', label: 'Windows 10' },
  { value: 'Windows 11', label: 'Windows 11' },
  { value: 'Ubuntu 22.04 LTS', label: 'Ubuntu 22.04 LTS' },
  { value: 'Ubuntu 20.04 LTS', label: 'Ubuntu 20.04 LTS' },
  { value: 'Debian 12', label: 'Debian 12' },
  { value: 'Debian 11', label: 'Debian 11' },
  { value: 'CentOS 8', label: 'CentOS 8' },
  { value: 'CentOS 7', label: 'CentOS 7' },
  { value: 'RHEL 8', label: 'RHEL 8' },
  { value: 'RHEL 9', label: 'RHEL 9' },
  { value: 'Amazon Linux 2', label: 'Amazon Linux 2' },
  { value: 'Other Linux', label: 'Other Linux' },
];

// Get the server URL for agent configuration
const getServerUrl = () => {
  const apiUrl = getApiBaseUrl();
  // Extract base URL without /api/v1
  return apiUrl.replace('/api/v1', '');
};

// Generate Windows PowerShell agent script
const generateWindowsScript = (agentKey: string, serverUrl: string, serverName: string): string => {
  return `# Argus Monitoring Agent for Windows
# Server: ${serverName}
# Generated: ${new Date().toISOString()}
# 
# INSTRUCTIONS:
# 1. Save this file as argus-agent.ps1
# 2. Run in PowerShell as Administrator:
#    powershell -ExecutionPolicy Bypass -File argus-agent.ps1
# 3. Press Ctrl+C to stop monitoring

$ARGUS_SERVER_URL = "${serverUrl}"
$AGENT_KEY = "${agentKey}"

Write-Host "🚀 Starting Argus Monitoring Agent..."
Write-Host "📊 Server: $ARGUS_SERVER_URL"
Write-Host "🔑 Agent Key: $($AGENT_KEY.Substring(0,20))..."
Write-Host "⏱️  Interval: 60 seconds"
Write-Host "❌ Press Ctrl+C to stop"
Write-Host "----------------------------------------"

function Get-CpuUsage {
    $cpu = Get-WmiObject -Class Win32_Processor | Measure-Object -Property LoadPercentage -Average
    return [math]::Round($cpu.Average, 2)
}

function Get-MemoryUsage {
    $os = Get-WmiObject -Class Win32_OperatingSystem
    $totalMB = [math]::Round($os.TotalVisibleMemorySize / 1024, 0)
    $freeMB = [math]::Round($os.FreePhysicalMemory / 1024, 0)
    $usedMB = $totalMB - $freeMB
    $usedPercent = [math]::Round(($usedMB / $totalMB) * 100, 2)
    return @{ UsedPercent = $usedPercent; TotalMB = $totalMB; AvailableMB = $freeMB }
}

function Get-DiskUsage {
    $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    $totalMB = [math]::Round($disk.Size / 1MB, 0)
    $freeMB = [math]::Round($disk.FreeSpace / 1MB, 0)
    $usedPercent = [math]::Round((($totalMB - $freeMB) / $totalMB) * 100, 2)
    return @{ UsedPercent = $usedPercent; TotalMB = $totalMB; AvailableMB = $freeMB }
}

function Get-NetworkIO {
    $netAdapters = Get-NetAdapterStatistics | Where-Object { $_.ReceivedBytes -gt 0 }
    $rxBytes = ($netAdapters | Measure-Object -Property ReceivedBytes -Sum).Sum
    $txBytes = ($netAdapters | Measure-Object -Property SentBytes -Sum).Sum
    return @{ RxBytes = $rxBytes; TxBytes = $txBytes }
}

function Get-ProcessCount {
    return (Get-Process).Count
}

function Get-LoadAverage {
    $cpu = Get-WmiObject -Class Win32_Processor | Measure-Object -Property LoadPercentage -Average
    return [math]::Round($cpu.Average / 100, 2)
}

function Get-Uptime {
    $os = Get-WmiObject -Class Win32_OperatingSystem
    $uptime = (Get-Date) - $os.ConvertToDateTime($os.LastBootUpTime)
    return [math]::Round($uptime.TotalSeconds, 0)
}

# Main loop
$runCount = 0
while ($true) {
    $runCount++
    $timestamp = [long]((Get-Date -UFormat %s) * 1000)
    
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Run #$runCount - Sending metrics..."
    
    $cpu = Get-CpuUsage
    $mem = Get-MemoryUsage
    $disk = Get-DiskUsage
    $net = Get-NetworkIO
    $procs = Get-ProcessCount
    $load = Get-LoadAverage
    $uptime = Get-Uptime
    
    $payload = @{
        agentKey = $AGENT_KEY
        timestamp = $timestamp
        metrics = @(
            @{ type = "CPU_USAGE"; value = $cpu; unit = "%" }
            @{ type = "MEMORY_USAGE"; value = $mem.UsedPercent; unit = "%" }
            @{ type = "MEMORY_TOTAL"; value = $mem.TotalMB; unit = "MB" }
            @{ type = "MEMORY_AVAILABLE"; value = $mem.AvailableMB; unit = "MB" }
            @{ type = "DISK_USAGE"; value = $disk.UsedPercent; unit = "%" }
            @{ type = "DISK_TOTAL"; value = $disk.TotalMB; unit = "MB" }
            @{ type = "DISK_AVAILABLE"; value = $disk.AvailableMB; unit = "MB" }
            @{ type = "NETWORK_IN"; value = $net.RxBytes; unit = "bytes" }
            @{ type = "NETWORK_OUT"; value = $net.TxBytes; unit = "bytes" }
            @{ type = "PROCESS_COUNT"; value = $procs; unit = "count" }
            @{ type = "LOAD_AVERAGE"; value = $load; unit = "" }
            @{ type = "UPTIME"; value = $uptime; unit = "seconds" }
        )
    } | ConvertTo-Json -Depth 3
    
    try {
        $response = Invoke-RestMethod -Uri "$ARGUS_SERVER_URL/api/v1/metrics/ingest" -Method Post -Body $payload -ContentType "application/json"
        Write-Host "✅ Metrics sent successfully"
    } catch {
        Write-Host "❌ Failed to send metrics: $_"
    }
    
    Write-Host "💤 Waiting 60 seconds..."
    Write-Host "----------------------------------------"
    Start-Sleep -Seconds 60
}
`;
};

export default function AddServer() {
  const [name, setName] = useState('');
  const [hostAddress, setHostAddress] = useState('');
  const [operatingSystem, setOperatingSystem] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdServer, setCreatedServer] = useState<ServerType | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await serversApi.create({
        name,
        hostAddress,
        operatingSystem,
        description,
      });

      if (response.success) {
        setCreatedServer(response.data);
        toast({
          title: 'Server registered!',
          description: 'Now configure the agent on your server.',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to register server',
        description: error instanceof Error ? error.message : 'Could not register server',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyAgentKey = () => {
    if (createdServer?.agentKey) {
      navigator.clipboard.writeText(createdServer.agentKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (createdServer) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl space-y-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/servers')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Servers
          </Button>

          <div className="rounded-xl border border-success/30 bg-success/5 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                <Check className="h-5 w-5 text-success" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Server Registered Successfully!
                </h2>
                <p className="text-sm text-muted-foreground">
                  {createdServer.name} ({createdServer.hostAddress})
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Configure Agent
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Agent Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={createdServer.agentKey}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" onClick={copyAgentKey}>
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Keep this key secure. You'll need it to configure the agent.
                </p>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <Terminal className="h-4 w-4" />
                  Installation Steps
                </div>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Download the agent script to your server</li>
                  <li>Make it executable: <code className="text-primary">chmod +x argus-agent.sh</code></li>
                  <li>Configure the AGENT_KEY in the script with the key above</li>
                  <li>Set up a cron job or systemd service to run the agent</li>
                </ol>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => navigate(`/servers/${createdServer.id}`)}>
                View Server Details
              </Button>
              <Button variant="outline" onClick={() => navigate('/servers')}>
                Go to Servers
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl space-y-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/servers')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Servers
        </Button>

        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Add Server</h1>
          <p className="mt-1 text-muted-foreground">
            Register a new server for monitoring
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Server Information</h3>
                <p className="text-sm text-muted-foreground">Basic details about your server</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Server Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Production Server 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hostAddress">Host Address</Label>
                <Input
                  id="hostAddress"
                  placeholder="e.g., 192.168.1.100 or server.example.com"
                  value={hostAddress}
                  onChange={(e) => setHostAddress(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="os">Operating System</Label>
                <Select value={operatingSystem} onValueChange={setOperatingSystem} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select operating system" />
                  </SelectTrigger>
                  <SelectContent>
                    {operatingSystems.map((os) => (
                      <SelectItem key={os} value={os}>
                        {os}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this server's purpose..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/servers')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Server'
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
