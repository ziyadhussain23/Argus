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
# 1. Save this file as argus-agent-windows.ps1
# 2. Run in PowerShell as Administrator:
#    powershell -ExecutionPolicy Bypass -File argus-agent-windows.ps1
# 3. Press Ctrl+C to stop monitoring

$ARGUS_SERVER_URL = "${serverUrl.replace(/["`$]/g, '`$&')}"
$AGENT_KEY = "${agentKey.replace(/["`$]/g, '`$&')}"
$NET_STATE_FILE = Join-Path $env:TEMP "argus-agent-net-$($AGENT_KEY.Substring(0,[Math]::Min(16,$AGENT_KEY.Length))).state"
$CPU_NAME = (Get-WmiObject -Class Win32_Processor | Select-Object -First 1 -ExpandProperty Name).Trim()

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

function Get-NetworkRate {
    $netAdapters = Get-NetAdapterStatistics | Where-Object { $_.ReceivedBytes -gt 0 }
    $rxTotal = [int64]((($netAdapters | Measure-Object -Property ReceivedBytes -Sum).Sum))
    $txTotal = [int64]((($netAdapters | Measure-Object -Property SentBytes     -Sum).Sum))
    $now = [int64]((Get-Date -UFormat %s))
    $rxRate = 0; $txRate = 0
    if (Test-Path $NET_STATE_FILE) {
        try {
            $prev = (Get-Content $NET_STATE_FILE -ErrorAction Stop).Trim().Split(' ')
            $prevT = [int64]$prev[0]; $prevRx = [int64]$prev[1]; $prevTx = [int64]$prev[2]
            $dt = $now - $prevT
            if ($dt -gt 0 -and $rxTotal -ge $prevRx -and $txTotal -ge $prevTx) {
                $rxRate = [int64](($rxTotal - $prevRx) / $dt)
                $txRate = [int64](($txTotal - $prevTx) / $dt)
            }
        } catch { }
    }
    "$now $rxTotal $txTotal" | Set-Content -Path $NET_STATE_FILE -Encoding ASCII
    return @{ RxBytes = $rxRate; TxBytes = $txRate }
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
    $net = Get-NetworkRate
    $procs = Get-ProcessCount
    $load = Get-LoadAverage
    $uptime = Get-Uptime
    
    $payload = @{
        agentKey = $AGENT_KEY
        timestamp = $timestamp
        metrics = @(
            @{ type = "CPU_USAGE"; value = $cpu; unit = "%"; additionalInfo = $CPU_NAME }
            @{ type = "MEMORY_USAGE"; value = $mem.UsedPercent; unit = "%" }
            @{ type = "MEMORY_TOTAL"; value = $mem.TotalMB; unit = "MB" }
            @{ type = "MEMORY_AVAILABLE"; value = $mem.AvailableMB; unit = "MB" }
            @{ type = "DISK_USAGE"; value = $disk.UsedPercent; unit = "%" }
            @{ type = "DISK_TOTAL"; value = $disk.TotalMB; unit = "MB" }
            @{ type = "DISK_AVAILABLE"; value = $disk.AvailableMB; unit = "MB" }
            @{ type = "NETWORK_IN"; value = $net.RxBytes; unit = "bytes/sec" }
            @{ type = "NETWORK_OUT"; value = $net.TxBytes; unit = "bytes/sec" }
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

// Generate macOS Bash agent script (Darwin tools only)
const generateMacOSScript = (agentKey: string, serverUrl: string, serverName: string): string => {
  return `#!/usr/bin/env bash
#######################################################
# ARGUS MONITORING AGENT — macOS
# Server: ${serverName}
# Generated: ${new Date().toISOString()}
#
# 1. Save as argus-agent-macos.sh
# 2. chmod +x argus-agent-macos.sh
# 3. ./argus-agent-macos.sh   (Ctrl+C to stop)
#######################################################
set -u

ARGUS_SERVER_URL='${serverUrl.replace(/'/g, "'\\''")}'
AGENT_KEY='${agentKey.replace(/'/g, "'\\''")}'
INTERVAL=60
NET_STATE_FILE="/tmp/argus-agent-net-\${AGENT_KEY:0:16}.state"

command -v curl >/dev/null 2>&1 || { echo "curl is required" >&2; exit 2; }

num() { [[ "\${1:-}" =~ ^-?[0-9]+([.][0-9]+)?$ ]] && echo "$1" || echo 0; }

cpu_model() { sysctl -n machdep.cpu.brand_string 2>/dev/null | tr -d '"' | head -c 120; }

cpu_usage() {
    top -l 1 -n 0 2>/dev/null | awk -F'[ ,%]+' '/CPU usage/ {
        for (i=1;i<=NF;i++) if ($i=="idle") { printf "%.2f", 100-$(i-1); exit }
    }'
}

memory_info() {
    local total page_size pf pi psp
    total=$(sysctl -n hw.memsize 2>/dev/null || echo 0)
    page_size=$(sysctl -n hw.pagesize 2>/dev/null || echo 4096)
    pf=$(vm_stat  | awk '/Pages free/        {gsub("\\.",""); print $3}'); pf=\${pf:-0}
    pi=$(vm_stat  | awk '/Pages inactive/    {gsub("\\.",""); print $3}'); pi=\${pi:-0}
    psp=$(vm_stat | awk '/Pages speculative/ {gsub("\\.",""); print $3}'); psp=\${psp:-0}
    awk -v t="$total" -v ps="$page_size" -v pf="$pf" -v pi="$pi" -v psp="$psp" 'BEGIN{
        tm=t/1024/1024; av=(pf+pi+psp)*ps/1024/1024; us=tm-av;
        if (tm<=0) { print "0 0 0"; exit } printf "%.2f %d %d", us*100/tm, tm, av;
    }'
}

disk_info() { df -m / 2>/dev/null | awk 'NR==2{gsub("%","",$5); printf "%.2f %d %d", $5, $2, $4}'; }

network_rate() {
    local iface rx tx now prev_t prev_rx prev_tx dt din dout
    iface=$(route -n get default 2>/dev/null | awk '/interface:/ {print $2; exit}')
    if [ -n "$iface" ]; then
        read -r rx tx <<< "$(netstat -ibn 2>/dev/null | awk -v i="$iface" '$1==i && $4 ~ /:/ {print $7, $10; exit}')"
    fi
    rx=\${rx:-0}; tx=\${tx:-0}
    now=$(date +%s); din=0; dout=0
    if [ -r "$NET_STATE_FILE" ]; then
        read -r prev_t prev_rx prev_tx < "$NET_STATE_FILE"
        dt=$(( now - prev_t ))
        if [ "$dt" -gt 0 ] && [ "$rx" -ge "$prev_rx" ] && [ "$tx" -ge "$prev_tx" ]; then
            din=$(( (rx - prev_rx) / dt ))
            dout=$(( (tx - prev_tx) / dt ))
        fi
    fi
    echo "$now $rx $tx" > "$NET_STATE_FILE"
    echo "$din $dout"
}

process_count() { echo "$(($(ps -A 2>/dev/null | wc -l | awk '{print $1}') - 1))"; }
load_average() { sysctl -n vm.loadavg 2>/dev/null | awk '{gsub("[{}]",""); print $1}'; }
uptime_seconds() {
    local boot
    boot=$(sysctl -n kern.boottime 2>/dev/null | awk -F'[ ,]+' '{for(i=1;i<=NF;i++) if($i=="sec"){print $(i+2); exit}}')
    [ -n "$boot" ] && [ "$boot" -gt 0 ] && echo $(($(date +%s) - boot)) || echo 0
}

send_once() {
    local cpu mu mt ma du dt da nin nout procs load up ts model
    cpu=$(num "$(cpu_usage)")
    model=$(cpu_model)
    read -r mu mt ma <<< "$(memory_info)"
    read -r du dt da <<< "$(disk_info)"
    read -r nin nout <<< "$(network_rate)"
    procs=$(num "$(process_count)"); load=$(num "$(load_average)"); up=$(num "$(uptime_seconds)")
    ts=$(($(date +%s) * 1000))
    cat <<EOF | curl -sS --connect-timeout 5 --max-time 15 \\
        -H "Content-Type: application/json" -X POST -d @- \\
        "$ARGUS_SERVER_URL/api/v1/metrics/ingest"
{
  "agentKey": "$AGENT_KEY",
  "timestamp": $ts,
  "metrics": [
    {"type":"CPU_USAGE","value":$cpu,"unit":"%","additionalInfo":"$model"},
    {"type":"MEMORY_USAGE","value":$(num "$mu"),"unit":"%"},
    {"type":"MEMORY_TOTAL","value":$(num "$mt"),"unit":"MB"},
    {"type":"MEMORY_AVAILABLE","value":$(num "$ma"),"unit":"MB"},
    {"type":"DISK_USAGE","value":$(num "$du"),"unit":"%"},
    {"type":"DISK_TOTAL","value":$(num "$dt"),"unit":"MB"},
    {"type":"DISK_AVAILABLE","value":$(num "$da"),"unit":"MB"},
    {"type":"NETWORK_IN","value":$(num "$nin"),"unit":"bytes/sec"},
    {"type":"NETWORK_OUT","value":$(num "$nout"),"unit":"bytes/sec"},
    {"type":"PROCESS_COUNT","value":$procs,"unit":"count"},
    {"type":"LOAD_AVERAGE","value":$load,"unit":""},
    {"type":"UPTIME","value":$up,"unit":"seconds"}
  ]
}
EOF
}

trap 'echo; echo "Stopping..."; exit 0' INT TERM
echo "Argus macOS agent — every \${INTERVAL}s. Ctrl+C to stop."
while true; do
    out=$(send_once 2>&1)
    if echo "$out" | grep -q '"success":true'; then
        echo "[$(date '+%F %T')] OK"
    else
        echo "[$(date '+%F %T')] FAIL: $out" >&2
    fi
    sleep $INTERVAL
done
`;
};

// Generate Debian/Ubuntu Bash agent script (apt-family)
const generateDebianScript = (agentKey: string, serverUrl: string, serverName: string, distro: string): string => {
  return `#!/usr/bin/env bash
#######################################################
# ARGUS MONITORING AGENT — ${distro}
# Server: ${serverName}
# Generated: ${new Date().toISOString()}
#
# 1. Save as argus-agent.sh
# 2. chmod +x argus-agent.sh
# 3. ./argus-agent.sh   (Ctrl+C to stop)
#
# Required: curl  (sudo apt install -y curl)
#######################################################
set -u

ARGUS_SERVER_URL='${serverUrl.replace(/'/g, "'\\''")}'
AGENT_KEY='${agentKey.replace(/'/g, "'\\''")}'
INTERVAL=60

command -v curl >/dev/null 2>&1 || { echo "curl is required (sudo apt install -y curl)" >&2; exit 2; }

num() { [[ "\${1:-}" =~ ^-?[0-9]+([.][0-9]+)?$ ]] && echo "$1" || echo 0; }

NET_STATE_FILE="/tmp/argus-agent-net-\${AGENT_KEY:0:16}.state"
cpu_model() { awk -F: '/^model name/{gsub(/^ +/,"",$2); print $2; exit}' /proc/cpuinfo 2>/dev/null | tr -d '"' | head -c 120; }

cpu_usage() {
    local idle
    idle=$(top -bn1 2>/dev/null | grep -m1 "Cpu(s)" \\
        | awk -F'[, ]+' '{ for (i=1;i<=NF;i++) if ($i ~ /id$/) { print $(i-1); exit } }')
    [ -n "$idle" ] && awk -v i="$idle" 'BEGIN{ printf "%.2f", 100 - i }' || echo 0
}

memory_info() {
    free -m 2>/dev/null | awk 'NR==2{ if ($2>0) printf "%.2f %d %d", $3*100/$2, $2, $7; else print "0 0 0" }'
}

disk_info() { df -m / 2>/dev/null | awk 'NR==2{gsub("%","",$5); printf "%.2f %d %d", $5, $2, $4}'; }

network_rate() {
    local iface rx tx now prev_t prev_rx prev_tx dt din dout
    iface=$(ip route 2>/dev/null | awk '/^default/ {print $5; exit}')
    if [ -n "$iface" ] && [ -r "/sys/class/net/$iface/statistics/rx_bytes" ]; then
        rx=$(cat "/sys/class/net/$iface/statistics/rx_bytes")
        tx=$(cat "/sys/class/net/$iface/statistics/tx_bytes")
    fi
    rx=\${rx:-0}; tx=\${tx:-0}
    now=$(date +%s); din=0; dout=0
    if [ -r "$NET_STATE_FILE" ]; then
        read -r prev_t prev_rx prev_tx < "$NET_STATE_FILE"
        dt=$(( now - prev_t ))
        if [ "$dt" -gt 0 ] && [ "$rx" -ge "$prev_rx" ] && [ "$tx" -ge "$prev_tx" ]; then
            din=$(( (rx - prev_rx) / dt ))
            dout=$(( (tx - prev_tx) / dt ))
        fi
    fi
    echo "$now $rx $tx" > "$NET_STATE_FILE"
    echo "$din $dout"
}

process_count() { ps -e --no-headers 2>/dev/null | wc -l; }
load_average() { awk '{print $1}' /proc/loadavg 2>/dev/null || echo 0; }
uptime_seconds() { awk '{print int($1)}' /proc/uptime 2>/dev/null || echo 0; }

send_once() {
    local cpu mu mt ma du dt da nin nout procs load up ts model
    cpu=$(num "$(cpu_usage)")
    model=$(cpu_model)
    read -r mu mt ma <<< "$(memory_info)"
    read -r du dt da <<< "$(disk_info)"
    read -r nin nout <<< "$(network_rate)"
    procs=$(num "$(process_count)"); load=$(num "$(load_average)"); up=$(num "$(uptime_seconds)")
    ts=$(($(date +%s) * 1000))
    cat <<EOF | curl -sS --connect-timeout 5 --max-time 15 \\
        -H "Content-Type: application/json" -X POST -d @- \\
        "$ARGUS_SERVER_URL/api/v1/metrics/ingest"
{
  "agentKey": "$AGENT_KEY",
  "timestamp": $ts,
  "metrics": [
    {"type":"CPU_USAGE","value":$cpu,"unit":"%","additionalInfo":"$model"},
    {"type":"MEMORY_USAGE","value":$(num "$mu"),"unit":"%"},
    {"type":"MEMORY_TOTAL","value":$(num "$mt"),"unit":"MB"},
    {"type":"MEMORY_AVAILABLE","value":$(num "$ma"),"unit":"MB"},
    {"type":"DISK_USAGE","value":$(num "$du"),"unit":"%"},
    {"type":"DISK_TOTAL","value":$(num "$dt"),"unit":"MB"},
    {"type":"DISK_AVAILABLE","value":$(num "$da"),"unit":"MB"},
    {"type":"NETWORK_IN","value":$(num "$nin"),"unit":"bytes/sec"},
    {"type":"NETWORK_OUT","value":$(num "$nout"),"unit":"bytes/sec"},
    {"type":"PROCESS_COUNT","value":$procs,"unit":"count"},
    {"type":"LOAD_AVERAGE","value":$load,"unit":""},
    {"type":"UPTIME","value":$up,"unit":"seconds"}
  ]
}
EOF
}

trap 'echo; echo "Stopping..."; exit 0' INT TERM
echo "Argus ${distro} agent — every \${INTERVAL}s. Ctrl+C to stop."
while true; do
    out=$(send_once 2>&1)
    if echo "$out" | grep -q '"success":true'; then
        echo "[$(date '+%F %T')] OK"
    else
        echo "[$(date '+%F %T')] FAIL: $out" >&2
    fi
    sleep $INTERVAL
done
`;
};

// Generate RHEL/CentOS/Amazon Linux Bash agent script (rpm-family)
const generateRhelScript = (agentKey: string, serverUrl: string, serverName: string, distro: string): string => {
  return `#!/usr/bin/env bash
#######################################################
# ARGUS MONITORING AGENT — ${distro}
# Server: ${serverName}
# Generated: ${new Date().toISOString()}
#
# 1. Save as argus-agent.sh
# 2. chmod +x argus-agent.sh
# 3. ./argus-agent.sh   (Ctrl+C to stop)
#
# Required: curl, iproute, procps-ng
#   sudo yum install -y curl iproute procps-ng   (CentOS 7 / RHEL 7)
#   sudo dnf install -y curl iproute procps-ng   (CentOS 8+ / RHEL 8+ / Amazon Linux 2023)
#######################################################
set -u

ARGUS_SERVER_URL='${serverUrl.replace(/'/g, "'\\''")}'
AGENT_KEY='${agentKey.replace(/'/g, "'\\''")}'
INTERVAL=60

command -v curl >/dev/null 2>&1 || { echo "curl is required (sudo yum install -y curl)" >&2; exit 2; }

num() { [[ "\${1:-}" =~ ^-?[0-9]+([.][0-9]+)?$ ]] && echo "$1" || echo 0; }

NET_STATE_FILE="/tmp/argus-agent-net-\${AGENT_KEY:0:16}.state"
cpu_model() { awk -F: '/^model name/{gsub(/^ +/,"",$2); print $2; exit}' /proc/cpuinfo 2>/dev/null | tr -d '"' | head -c 120; }

cpu_usage() {
    local idle
    idle=$(top -bn1 2>/dev/null | grep -m1 -E "Cpu\\(s\\)" \\
        | awk -F'[, ]+' '{ for (i=1;i<=NF;i++) if ($i ~ /id$/) { print $(i-1); exit } }')
    if [ -n "$idle" ]; then
        awk -v i="$idle" 'BEGIN{ printf "%.2f", 100 - i }'
    elif command -v mpstat >/dev/null 2>&1; then
        mpstat 1 1 2>/dev/null | awk '/Average/ {printf "%.2f", 100 - $NF; exit}'
    else
        echo 0
    fi
}

memory_info() {
    free -m 2>/dev/null | awk 'NR==2{
        avail = ($7 != "" ? $7 : ($2 - $3));
        if ($2>0) printf "%.2f %d %d", $3*100/$2, $2, avail;
        else      print  "0 0 0";
    }'
}

disk_info() { df -m / 2>/dev/null | awk 'NR==2{gsub("%","",$5); printf "%.2f %d %d", $5, $2, $4}'; }

network_rate() {
    local iface rx tx now prev_t prev_rx prev_tx dt din dout
    iface=$(ip route 2>/dev/null | awk '/^default/ {print $5; exit}')
    if [ -n "$iface" ] && [ -r "/sys/class/net/$iface/statistics/rx_bytes" ]; then
        rx=$(cat "/sys/class/net/$iface/statistics/rx_bytes")
        tx=$(cat "/sys/class/net/$iface/statistics/tx_bytes")
    fi
    rx=\${rx:-0}; tx=\${tx:-0}
    now=$(date +%s); din=0; dout=0
    if [ -r "$NET_STATE_FILE" ]; then
        read -r prev_t prev_rx prev_tx < "$NET_STATE_FILE"
        dt=$(( now - prev_t ))
        if [ "$dt" -gt 0 ] && [ "$rx" -ge "$prev_rx" ] && [ "$tx" -ge "$prev_tx" ]; then
            din=$(( (rx - prev_rx) / dt ))
            dout=$(( (tx - prev_tx) / dt ))
        fi
    fi
    echo "$now $rx $tx" > "$NET_STATE_FILE"
    echo "$din $dout"
}

process_count() {
    if ps -e --no-headers >/dev/null 2>&1; then
        ps -e --no-headers | wc -l
    else
        echo "$(($(ps -e | wc -l) - 1))"
    fi
}
load_average() { awk '{print $1}' /proc/loadavg 2>/dev/null || echo 0; }
uptime_seconds() { awk '{print int($1)}' /proc/uptime 2>/dev/null || echo 0; }

send_once() {
    local cpu mu mt ma du dt da nin nout procs load up ts model
    cpu=$(num "$(cpu_usage)")
    model=$(cpu_model)
    read -r mu mt ma <<< "$(memory_info)"
    read -r du dt da <<< "$(disk_info)"
    read -r nin nout <<< "$(network_rate)"
    procs=$(num "$(process_count)"); load=$(num "$(load_average)"); up=$(num "$(uptime_seconds)")
    ts=$(($(date +%s) * 1000))
    cat <<EOF | curl -sS --connect-timeout 5 --max-time 15 \\
        -H "Content-Type: application/json" -X POST -d @- \\
        "$ARGUS_SERVER_URL/api/v1/metrics/ingest"
{
  "agentKey": "$AGENT_KEY",
  "timestamp": $ts,
  "metrics": [
    {"type":"CPU_USAGE","value":$cpu,"unit":"%","additionalInfo":"$model"},
    {"type":"MEMORY_USAGE","value":$(num "$mu"),"unit":"%"},
    {"type":"MEMORY_TOTAL","value":$(num "$mt"),"unit":"MB"},
    {"type":"MEMORY_AVAILABLE","value":$(num "$ma"),"unit":"MB"},
    {"type":"DISK_USAGE","value":$(num "$du"),"unit":"%"},
    {"type":"DISK_TOTAL","value":$(num "$dt"),"unit":"MB"},
    {"type":"DISK_AVAILABLE","value":$(num "$da"),"unit":"MB"},
    {"type":"NETWORK_IN","value":$(num "$nin"),"unit":"bytes/sec"},
    {"type":"NETWORK_OUT","value":$(num "$nout"),"unit":"bytes/sec"},
    {"type":"PROCESS_COUNT","value":$procs,"unit":"count"},
    {"type":"LOAD_AVERAGE","value":$load,"unit":""},
    {"type":"UPTIME","value":$up,"unit":"seconds"}
  ]
}
EOF
}

trap 'echo; echo "Stopping..."; exit 0' INT TERM
echo "Argus ${distro} agent — every \${INTERVAL}s. Ctrl+C to stop."
while true; do
    out=$(send_once 2>&1)
    if echo "$out" | grep -q '"success":true'; then
        echo "[$(date '+%F %T')] OK"
    else
        echo "[$(date '+%F %T')] FAIL: $out" >&2
    fi
    sleep $INTERVAL
done
`;
};

// Generate Generic Linux Bash agent script — reads everything from /proc and /sys
// (works on Alpine, Arch, openSUSE, BusyBox, minimal containers, etc.)
const generateGenericLinuxScript = (agentKey: string, serverUrl: string, serverName: string): string => {
  return `#!/usr/bin/env bash
#######################################################
# ARGUS MONITORING AGENT — Generic Linux
# Server: ${serverName}
# Generated: ${new Date().toISOString()}
#
# Reads everything from /proc and /sys directly so it works
# on minimal images that don't have top, free, ip, etc.
#
# 1. Save as argus-agent.sh
# 2. chmod +x argus-agent.sh
# 3. ./argus-agent.sh   (Ctrl+C to stop)
#######################################################
set -u

ARGUS_SERVER_URL='${serverUrl.replace(/'/g, "'\\''")}'
AGENT_KEY='${agentKey.replace(/'/g, "'\\''")}'
INTERVAL=60
NET_STATE_FILE="/tmp/argus-agent-net-\${AGENT_KEY:0:16}.state"

command -v curl >/dev/null 2>&1 || { echo "curl is required" >&2; exit 2; }

num() { [[ "\${1:-}" =~ ^-?[0-9]+([.][0-9]+)?$ ]] && echo "$1" || echo 0; }

cpu_model() { awk -F: '/^model name/{gsub(/^ +/,"",$2); print $2; exit}' /proc/cpuinfo 2>/dev/null | tr -d '"' | head -c 120; }

cpu_usage() {
    read -r _ u1 n1 s1 i1 w1 q1 sq1 _ < /proc/stat
    sleep 1
    read -r _ u2 n2 s2 i2 w2 q2 sq2 _ < /proc/stat
    awk -v u1="$u1" -v n1="$n1" -v s1="$s1" -v i1="$i1" -v w1="$w1" -v q1="$q1" -v sq1="$sq1" \\
        -v u2="$u2" -v n2="$n2" -v s2="$s2" -v i2="$i2" -v w2="$w2" -v q2="$q2" -v sq2="$sq2" 'BEGIN{
        a=u1+n1+s1+i1+w1+q1+sq1; b=u2+n2+s2+i2+w2+q2+sq2;
        id1=i1+w1; id2=i2+w2; td=b-a; idd=id2-id1;
        if (td<=0) { print 0; exit } printf "%.2f", (1 - idd/td)*100;
    }'
}

memory_info() {
    awk '/^MemTotal:/ {t=$2/1024} /^MemAvailable:/ {a=$2/1024}
        END { if (t<=0) {print "0 0 0"; exit} u=t-a; printf "%.2f %d %d", u*100/t, t, a }' /proc/meminfo 2>/dev/null
}

disk_info() { df -m / 2>/dev/null | awk 'NR==2{gsub("%","",$5); printf "%.2f %d %d", $5, $2, $4}'; }

network_rate() {
    local d iface rx tx now prev_t prev_rx prev_tx dt din dout
    rx=0; tx=0
    for d in /sys/class/net/*; do
        iface=$(basename "$d")
        [ "$iface" = "lo" ] && continue
        if [ -r "$d/statistics/rx_bytes" ]; then
            rx=$(cat "$d/statistics/rx_bytes"); tx=$(cat "$d/statistics/tx_bytes"); break
        fi
    done
    rx=\${rx:-0}; tx=\${tx:-0}
    now=$(date +%s); din=0; dout=0
    if [ -r "$NET_STATE_FILE" ]; then
        read -r prev_t prev_rx prev_tx < "$NET_STATE_FILE"
        dt=$(( now - prev_t ))
        if [ "$dt" -gt 0 ] && [ "$rx" -ge "$prev_rx" ] && [ "$tx" -ge "$prev_tx" ]; then
            din=$(( (rx - prev_rx) / dt ))
            dout=$(( (tx - prev_tx) / dt ))
        fi
    fi
    echo "$now $rx $tx" > "$NET_STATE_FILE"
    echo "$din $dout"
}

process_count() {
    local n=0
    for d in /proc/[0-9]*; do n=$((n+1)); done
    echo "$n"
}
load_average() { awk '{print $1}' /proc/loadavg 2>/dev/null || echo 0; }
uptime_seconds() { awk '{print int($1)}' /proc/uptime 2>/dev/null || echo 0; }

send_once() {
    local cpu mu mt ma du dt da nin nout procs load up ts model
    cpu=$(num "$(cpu_usage)")
    model=$(cpu_model)
    read -r mu mt ma <<< "$(memory_info)"
    read -r du dt da <<< "$(disk_info)"
    read -r nin nout <<< "$(network_rate)"
    procs=$(num "$(process_count)"); load=$(num "$(load_average)"); up=$(num "$(uptime_seconds)")
    ts=$(($(date +%s) * 1000))
    cat <<EOF | curl -sS --connect-timeout 5 --max-time 15 \\
        -H "Content-Type: application/json" -X POST -d @- \\
        "$ARGUS_SERVER_URL/api/v1/metrics/ingest"
{
  "agentKey": "$AGENT_KEY",
  "timestamp": $ts,
  "metrics": [
    {"type":"CPU_USAGE","value":$cpu,"unit":"%","additionalInfo":"$model"},
    {"type":"MEMORY_USAGE","value":$(num "$mu"),"unit":"%"},
    {"type":"MEMORY_TOTAL","value":$(num "$mt"),"unit":"MB"},
    {"type":"MEMORY_AVAILABLE","value":$(num "$ma"),"unit":"MB"},
    {"type":"DISK_USAGE","value":$(num "$du"),"unit":"%"},
    {"type":"DISK_TOTAL","value":$(num "$dt"),"unit":"MB"},
    {"type":"DISK_AVAILABLE","value":$(num "$da"),"unit":"MB"},
    {"type":"NETWORK_IN","value":$(num "$nin"),"unit":"bytes/sec"},
    {"type":"NETWORK_OUT","value":$(num "$nout"),"unit":"bytes/sec"},
    {"type":"PROCESS_COUNT","value":$procs,"unit":"count"},
    {"type":"LOAD_AVERAGE","value":$load,"unit":""},
    {"type":"UPTIME","value":$up,"unit":"seconds"}
  ]
}
EOF
}

trap 'echo; echo "Stopping..."; exit 0' INT TERM
echo "Argus generic Linux agent — every \${INTERVAL}s. Ctrl+C to stop."
while true; do
    out=$(send_once 2>&1)
    if echo "$out" | grep -q '"success":true'; then
        echo "[$(date '+%F %T')] OK"
    else
        echo "[$(date '+%F %T')] FAIL: $out" >&2
    fi
    sleep $INTERVAL
done
`;
};

// Generate OS-specific agent script. Each OS in the dropdown gets a dedicated
// script (no runtime OS branching) so the file the user downloads is tailored.
const generateAgentScript = (agentKey: string, os: string, serverName: string): string => {
  const serverUrl = getServerUrl();
  const o = (os || '').toLowerCase();

  if (o.includes('windows')) {
    return generateWindowsScript(agentKey, serverUrl, serverName);
  }
  if (o.includes('macos') || o.includes('darwin') || o === 'mac') {
    return generateMacOSScript(agentKey, serverUrl, serverName);
  }
  if (o.includes('ubuntu') || o.includes('debian')) {
    return generateDebianScript(agentKey, serverUrl, serverName, os);
  }
  if (o.includes('centos') || o.includes('rhel') || o.includes('amazon linux') || o.includes('red hat')) {
    return generateRhelScript(agentKey, serverUrl, serverName, os);
  }
  // Other Linux / unknown -> portable /proc-based script
  return generateGenericLinuxScript(agentKey, serverUrl, serverName);
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
      const o = (operatingSystem || '').toLowerCase();
      const isWindows = o.includes('windows');
      let filename = 'argus-agent.sh';
      if (isWindows) {
        filename = 'argus-agent-windows.ps1';
      } else if (o.includes('macos') || o.includes('darwin')) {
        filename = 'argus-agent-macos.sh';
      } else if (o.includes('ubuntu') || o.includes('debian')) {
        filename = 'argus-agent-debian.sh';
      } else if (o.includes('centos') || o.includes('rhel') || o.includes('amazon linux') || o.includes('red hat')) {
        filename = 'argus-agent-rhel.sh';
      } else {
        filename = 'argus-agent-linux.sh';
      }
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
    const o = (operatingSystem || '').toLowerCase();
    if (o.includes('windows')) {
      return `# Windows PowerShell
# 1. Save as argus-agent-windows.ps1
# 2. Run: powershell -ExecutionPolicy Bypass -File argus-agent-windows.ps1`;
    }
    if (o.includes('macos') || o.includes('darwin')) {
      return `# macOS
# 1. Save as argus-agent-macos.sh
# 2. chmod +x argus-agent-macos.sh
# 3. ./argus-agent-macos.sh`;
    }
    if (o.includes('ubuntu') || o.includes('debian')) {
      return `# Debian / Ubuntu
# (Install curl if needed: sudo apt install -y curl)
# 1. Save as argus-agent.sh
# 2. chmod +x argus-agent.sh
# 3. ./argus-agent.sh`;
    }
    if (o.includes('centos') || o.includes('rhel') || o.includes('amazon linux') || o.includes('red hat')) {
      return `# RHEL / CentOS / Amazon Linux
# (Install curl if needed: sudo yum install -y curl   or   sudo dnf install -y curl)
# 1. Save as argus-agent.sh
# 2. chmod +x argus-agent.sh
# 3. ./argus-agent.sh`;
    }
    return `# Linux (generic)
# 1. Save as argus-agent.sh
# 2. chmod +x argus-agent.sh
# 3. ./argus-agent.sh`;
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
                  <div className="flex gap-2 flex-wrap">
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

            <div className="flex gap-4 flex-wrap">
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
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6">
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
                  onChange={(e) => setName(e.target.value.slice(0, 255))}
                  required
                  maxLength={255}
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

          <div className="flex justify-end gap-4 flex-wrap">
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
