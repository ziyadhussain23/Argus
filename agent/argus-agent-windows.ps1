# Argus Monitoring Agent for Windows
# Server: your-server
# Generated: 2026-04-19T15:02:39.623Z
# 
# INSTRUCTIONS:
# 1. Save this file as argus-agent-windows.ps1
# 2. Run in PowerShell as Administrator:
#    powershell -ExecutionPolicy Bypass -File argus-agent-windows.ps1
# 3. Press Ctrl+C to stop monitoring

$ARGUS_SERVER_URL = "http://your-server:8080"
$AGENT_KEY = "YOUR_AGENT_KEY_HERE"
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
