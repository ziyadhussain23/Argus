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

// Generate macOS/Linux Bash agent script with continuous monitoring
const generateBashScript = (agentKey: string, serverUrl: string, serverName: string): string => {
  return `#!/bin/bash

#######################################################
# ARGUS MONITORING AGENT (Continuous)
# Server: ${serverName}
# Generated: ${new Date().toISOString()}
# 
# INSTRUCTIONS:
# 1. Save this file as argus-agent.sh
# 2. Make executable: chmod +x argus-agent.sh
# 3. Run: ./argus-agent.sh
# 4. Press Ctrl+C to stop
#######################################################

ARGUS_SERVER_URL="${serverUrl}"
AGENT_KEY="${agentKey}"
INTERVAL=60

echo "🚀 Starting Argus Monitoring Agent..."
echo "📊 Server: $ARGUS_SERVER_URL"
echo "🔑 Agent Key: \${AGENT_KEY:0:20}..."
echo "⏱️  Interval: $INTERVAL seconds"
echo "❌ Press Ctrl+C to stop"
echo "----------------------------------------"

# Handle Ctrl+C gracefully
trap 'echo -e "\\n🛑 Stopping monitoring..."; exit 0' SIGINT SIGTERM

# Collect CPU Usage
get_cpu_usage() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | cut -d'%' -f1)
    else
        cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
        if [ -z "$cpu_usage" ]; then
            cpu_usage=$(mpstat 1 1 2>/dev/null | tail -1 | awk '{print 100 - $NF}')
        fi
    fi
    echo "\${cpu_usage:-0}"
}

# Collect Memory Usage
get_memory_usage() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        total_mem=$(sysctl -n hw.memsize)
        total_mb=$((total_mem / 1024 / 1024))
        vm_stat_output=$(vm_stat)
        pages_free=$(echo "$vm_stat_output" | grep "Pages free" | awk '{print $3}' | tr -d '.')
        pages_active=$(echo "$vm_stat_output" | grep "Pages active" | awk '{print $3}' | tr -d '.')
        pages_inactive=$(echo "$vm_stat_output" | grep "Pages inactive" | awk '{print $3}' | tr -d '.')
        pages_wired=$(echo "$vm_stat_output" | grep "Pages wired down" | awk '{print $4}' | tr -d '.')
        page_size=$(sysctl -n hw.pagesize)
        used_pages=$((pages_active + pages_inactive + pages_wired))
        used_mb=$((used_pages * page_size / 1024 / 1024))
        available_mb=$((pages_free * page_size / 1024 / 1024))
        if [ $total_mb -gt 0 ]; then
            used_percent=$(awk "BEGIN {printf \\"%.2f\\", ($used_mb * 100.0 / $total_mb)}")
        else
            used_percent="0"
        fi
        echo "$used_percent $total_mb $available_mb"
    else
        mem_info=$(free -m | awk 'NR==2{printf "%.2f %d %d", $3*100/$2, $2, $7}')
        echo "$mem_info"
    fi
}

# Collect Disk Usage
get_disk_usage() {
    disk_info=$(df -m / | awk 'NR==2{gsub("%",""); printf "%.2f %d %d", $5, $2, $4}')
    echo "$disk_info"
}

# Collect Network I/O
get_network_io() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        net_stats=$(netstat -ib | grep -v "Name" | awk '{if ($1 !~ /lo/) {rx+=$7; tx+=$10}} END {print rx, tx}')
        echo "\${net_stats:-0 0}"
    else
        default_iface=$(ip route | grep default | awk '{print $5}' | head -1)
        if [ -n "$default_iface" ]; then
            rx_bytes=$(cat /sys/class/net/$default_iface/statistics/rx_bytes 2>/dev/null || echo "0")
            tx_bytes=$(cat /sys/class/net/$default_iface/statistics/tx_bytes 2>/dev/null || echo "0")
            echo "$rx_bytes $tx_bytes"
        else
            echo "0 0"
        fi
    fi
}

# Collect Process Count
get_process_count() {
    ps aux | wc -l
}

# Collect Load Average
get_load_average() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sysctl -n vm.loadavg | awk '{print $2}'
    else
        cat /proc/loadavg | awk '{print $1}'
    fi
}

# Collect Uptime
get_uptime() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        boot_time=$(sysctl -n kern.boottime | awk '{print $4}' | tr -d ',')
        current_time=$(date +%s)
        uptime_sec=$((current_time - boot_time))
        echo "$uptime_sec"
    else
        cat /proc/uptime | awk '{print $1}'
    fi
}

# Send metrics once
send_metrics() {
    cpu_usage=$(get_cpu_usage)
    
    mem_info=$(get_memory_usage)
    mem_usage=$(echo $mem_info | awk '{print $1}')
    mem_total=$(echo $mem_info | awk '{print $2}')
    mem_available=$(echo $mem_info | awk '{print $3}')
    
    disk_info=$(get_disk_usage)
    disk_usage=$(echo $disk_info | awk '{print $1}')
    disk_total=$(echo $disk_info | awk '{print $2}')
    disk_available=$(echo $disk_info | awk '{print $3}')
    
    network_io=$(get_network_io)
    net_in=$(echo $network_io | awk '{print $1}')
    net_out=$(echo $network_io | awk '{print $2}')
    
    process_count=$(get_process_count)
    load_avg=$(get_load_average)
    uptime=$(get_uptime)
    
    timestamp=$(($(date +%s) * 1000))
    
    json_payload=$(cat <<EOF
{
    "agentKey": "$AGENT_KEY",
    "timestamp": $timestamp,
    "metrics": [
        {"type": "CPU_USAGE", "value": $cpu_usage, "unit": "%"},
        {"type": "MEMORY_USAGE", "value": $mem_usage, "unit": "%"},
        {"type": "MEMORY_TOTAL", "value": $mem_total, "unit": "MB"},
        {"type": "MEMORY_AVAILABLE", "value": $mem_available, "unit": "MB"},
        {"type": "DISK_USAGE", "value": $disk_usage, "unit": "%"},
        {"type": "DISK_TOTAL", "value": $disk_total, "unit": "MB"},
        {"type": "DISK_AVAILABLE", "value": $disk_available, "unit": "MB"},
        {"type": "NETWORK_IN", "value": $net_in, "unit": "bytes"},
        {"type": "NETWORK_OUT", "value": $net_out, "unit": "bytes"},
        {"type": "PROCESS_COUNT", "value": $process_count, "unit": "count"},
        {"type": "LOAD_AVERAGE", "value": $load_avg, "unit": ""},
        {"type": "UPTIME", "value": $uptime, "unit": "seconds"}
    ]
}
EOF
)
    
    response=$(curl -s -X POST \\
        -H "Content-Type: application/json" \\
        -d "$json_payload" \\
        "$ARGUS_SERVER_URL/api/v1/metrics/ingest" 2>&1)
    
    if echo "$response" | grep -q '"success":true'; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Metrics sent successfully"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Failed: $response" >&2
    fi
}

# Main loop - runs forever until Ctrl+C
run_count=0
while true; do
    run_count=$((run_count + 1))
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Run #$run_count - Sending metrics..."
    send_metrics
    echo "💤 Waiting $INTERVAL seconds..."
    echo "----------------------------------------"
    sleep $INTERVAL
done
`;
};

// Generate OS-specific agent script
const generateAgentScript = (agentKey: string, os: string, serverName: string): string => {
  const serverUrl = getServerUrl();
  
  if (os.toLowerCase().includes('windows')) {
    return generateWindowsScript(agentKey, serverUrl, serverName);
  } else {
    return generateBashScript(agentKey, serverUrl, serverName);
  }
};

export default function AddServer() {
  const [name, setName] = useState('');
  const [hostAddress, setHostAddress] = useState('');
  const [operatingSystem, setOperatingSystem] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdServer, setCreatedServer] = useState<ServerType | null>(null);
  const [copied, setCopied] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
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

  // Copy the generated script to clipboard
  const copyScript = () => {
    if (createdServer?.agentKey) {
      const script = generateAgentScript(createdServer.agentKey, operatingSystem, createdServer.name);
      navigator.clipboard.writeText(script);
      setScriptCopied(true);
      setTimeout(() => setScriptCopied(false), 2000);
      toast({
        title: 'Script copied!',
        description: 'The agent script has been copied to your clipboard.',
      });
    }
  };

  // Download the generated script as a file
  const downloadScript = () => {
    if (createdServer?.agentKey) {
      const script = generateAgentScript(createdServer.agentKey, operatingSystem, createdServer.name);
      const isWindows = operatingSystem.toLowerCase().includes('windows');
      const filename = isWindows ? 'argus-agent.ps1' : 'argus-agent.sh';
      const mimeType = isWindows ? 'text/plain' : 'application/x-sh';
      
      const blob = new Blob([script], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Script downloaded!',
        description: `${filename} has been downloaded.`,
      });
    }
  };

  // Get OS-specific instructions for running the script
  const getScriptInstructions = (): string => {
    const isWindows = operatingSystem.toLowerCase().includes('windows');
    if (isWindows) {
      return `# Windows PowerShell
# 1. Save as argus-agent.ps1
# 2. Run: powershell -ExecutionPolicy Bypass -File argus-agent.ps1`;
    } else {
      return `# macOS / Linux
# 1. Save as argus-agent.sh
# 2. chmod +x argus-agent.sh
# 3. ./argus-agent.sh`;
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

              {/* Generated Script Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Agent Script ({operatingSystem || 'Select OS'})
                  </Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyScript}>
                      {scriptCopied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="ml-2">{scriptCopied ? 'Copied!' : 'Copy'}</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadScript}>
                      <Download className="h-4 w-4" />
                      <span className="ml-2">Download</span>
                    </Button>
                  </div>
                </div>
                
                <div className="relative">
                  <pre className="rounded-lg bg-muted p-4 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                    <code className="text-muted-foreground whitespace-pre">
                      {generateAgentScript(createdServer.agentKey, operatingSystem, createdServer.name)}
                    </code>
                  </pre>
                </div>
                
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                  <pre className="text-xs font-mono text-primary whitespace-pre-wrap">
                    {getScriptInstructions()}
                  </pre>
                </div>
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
                      <SelectItem key={os.value} value={os.value}>
                        {os.label}
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
