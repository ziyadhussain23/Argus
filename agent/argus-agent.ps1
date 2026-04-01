# PowerShell Agent for Argus Monitoring
param(
    [string]$ServerUrl = "http://localhost:8080",
    [string]$AgentKey = "default-agent-key",
    [switch]$Continuous,
    [int]$IntervalSeconds = 10
)

function Get-CpuUsage {
    $cpu = Get-WmiObject Win32_Processor | Measure-Object -Property LoadPercentage -Average | Select-Object -ExpandProperty Average
    return $cpu
}

function Get-MemoryUsage {
    $os = Get-WmiObject Win32_OperatingSystem
    $total = $os.TotalVisibleMemorySize / 1024  # In MB
    $free = $os.FreePhysicalMemory / 1024       # In MB
    $used = $total - $free
    $percent = ($used / $total) * 100
    return @{
        Usage = [math]::Round($percent, 2)
        Total = [math]::Round($total)
        Available = [math]::Round($free)
    }
}

function Get-DiskUsage {
    $drive = Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='C:'"
    $total = $drive.Size / 1MB
    $free = $drive.FreeSpace / 1MB
    $used = $total - $free
    $percent = ($used / $total) * 100
    return @{
        Usage = [math]::Round($percent, 2)
        Total = [math]::Round($total)
        Available = [math]::Round($free)
    }
}

function Get-NetworkIO {
    $net = Get-WmiObject Win32_PerfFormattedData_Tcpip_NetworkInterface | Where-Object {$_.Name -notlike "*Loopback*"} | Select-Object -First 1
    if ($net) {
        return @{
            In = [double]$net.BytesReceivedPerSec
            Out = [double]$net.BytesSentPerSec
        }
    }
    return @{
        In = 0.0
        Out = 0.0
    }
}

function Get-ProcessCount {
    return (Get-Process).Count
}

function Get-SystemUptime {
    $uptime = (Get-CimInstance Win32_OperatingSystem).LastBootUpTime
    $uptimeSpan = New-TimeSpan -Start $uptime
    return [math]::Round($uptimeSpan.TotalSeconds)
}

function Get-LoadAverage {
    # Windows doesn't have native load average; approximate using CPU queue length
    $queueLength = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
    if ($null -eq $queueLength) { $queueLength = 0 }
    return [math]::Round($queueLength / 100 * (Get-CimInstance Win32_ComputerSystem).NumberOfLogicalProcessors, 2)
}

function Send-Metrics {
    $cpu = Get-CpuUsage
    $mem = Get-MemoryUsage
    $disk = Get-DiskUsage
    $net = Get-NetworkIO
    $procs = Get-ProcessCount
    $uptime = Get-SystemUptime
    $loadAvg = Get-LoadAverage
    
    # Build metrics array matching MetricPayload.MetricData structure
    $metricsArray = @(
        @{ type = "CPU_USAGE"; value = [double]$cpu; unit = "percent" },
        @{ type = "MEMORY_USAGE"; value = [double]$mem.Usage; unit = "percent" },
        @{ type = "MEMORY_TOTAL"; value = [double]$mem.Total; unit = "MB" },
        @{ type = "MEMORY_AVAILABLE"; value = [double]$mem.Available; unit = "MB" },
        @{ type = "DISK_USAGE"; value = [double]$disk.Usage; unit = "percent" },
        @{ type = "DISK_TOTAL"; value = [double]$disk.Total; unit = "MB" },
        @{ type = "DISK_AVAILABLE"; value = [double]$disk.Available; unit = "MB" },
        @{ type = "NETWORK_IN"; value = [double]$net.In; unit = "bytes/sec" },
        @{ type = "NETWORK_OUT"; value = [double]$net.Out; unit = "bytes/sec" },
        @{ type = "PROCESS_COUNT"; value = [double]$procs; unit = "count" },
        @{ type = "UPTIME"; value = [double]$uptime; unit = "seconds" },
        @{ type = "LOAD_AVERAGE"; value = [double]$loadAvg; unit = "" }
    )
    
    # Payload matching the MetricPayload structure expected by the backend
    $payload = @{
        agentKey = $AgentKey
        metrics = $metricsArray
        timestamp = [long]([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())
    }

    $json = $payload | ConvertTo-Json -Depth 3

    try {
        $headers = @{ "Content-Type" = "application/json" }
        # Correct endpoint: /api/v1/metrics/ingest
        $response = Invoke-RestMethod -Uri "$ServerUrl/api/v1/metrics/ingest" -Method Post -Body $json -Headers $headers
        Write-Host "[$(Get-Date)] Metrics sent successfully: CPU=$cpu% MEM=$($mem.Usage)%" -ForegroundColor Green
    } catch {
        Write-Host "[$(Get-Date)] Failed to send metrics: $($_.Exception.Message)" -ForegroundColor Red
        # Try to get more details from the error response
        if ($_.ErrorDetails.Message) {
            Write-Host "Error Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
        if ($_.Exception.Response) {
            Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__) ($($_.Exception.Response.StatusCode))" -ForegroundColor Yellow
        }
    }
}

Write-Host "Starting Argus Agent..." -ForegroundColor Cyan
Write-Host "Server: $ServerUrl" -ForegroundColor Cyan
Write-Host "Agent Key: $AgentKey" -ForegroundColor Cyan
Write-Host "Endpoint: $ServerUrl/api/v1/metrics/ingest" -ForegroundColor Cyan
Write-Host ""

if ($Continuous) {
    Write-Host "Running in continuous mode (Interval: ${IntervalSeconds}s)" -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    while ($true) {
        Send-Metrics
        Start-Sleep -Seconds $IntervalSeconds
    }
} else {
    Send-Metrics
}
