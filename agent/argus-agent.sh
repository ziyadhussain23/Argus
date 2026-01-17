#!/bin/bash

#######################################################
# ARGUS MONITORING AGENT
# 
# This script collects system metrics and sends them
# to the Argus monitoring server.
#
# Installation:
# 1. Copy this script to the target server
# 2. Set the ARGUS_SERVER_URL and AGENT_KEY variables
# 3. Make executable: chmod +x argus-agent.sh
# 4. Add to crontab: */1 * * * * /path/to/argus-agent.sh
#######################################################

# Configuration - Environment variables override these defaults
ARGUS_SERVER_URL="${ARGUS_SERVER_URL:-http://localhost:8080}"
AGENT_KEY="${AGENT_KEY:-your-agent-key-here}"

# Check if keys are set
if [ "$AGENT_KEY" = "your-agent-key-here" ]; then
    echo "Error: AGENT_KEY is not set. Please set it in the script or via environment variable."
    echo "Usage: AGENT_KEY=your-key ARGUS_SERVER_URL=http://server:port bash argus-agent.sh"
    exit 1
fi

# Collect CPU Usage
get_cpu_usage() {
    # Get CPU usage percentage (user + system)
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    if [ -z "$cpu_usage" ]; then
        cpu_usage=$(mpstat 1 1 2>/dev/null | tail -1 | awk '{print 100 - $NF}')
    fi
    echo "${cpu_usage:-0}"
}

# Collect Memory Usage
get_memory_usage() {
    # Returns: used_percent total_mb available_mb
    mem_info=$(free -m | awk 'NR==2{printf "%.2f %d %d", $3*100/$2, $2, $7}')
    echo "$mem_info"
}

# Collect Disk Usage
get_disk_usage() {
    # Get root partition usage in MB
    # Returns: used_percent total_mb available_mb
    disk_info=$(df -m / | awk 'NR==2{gsub("%",""); printf "%.2f %d %d", $5, $2, $4}')
    echo "$disk_info"
}

# Collect Network I/O (bytes since boot)
get_network_io() {
    # Get default interface
    default_iface=$(ip route | grep default | awk '{print $5}' | head -1)
    if [ -n "$default_iface" ]; then
        rx_bytes=$(cat /sys/class/net/$default_iface/statistics/rx_bytes 2>/dev/null || echo "0")
        tx_bytes=$(cat /sys/class/net/$default_iface/statistics/tx_bytes 2>/dev/null || echo "0")
        echo "$rx_bytes $tx_bytes"
    else
        echo "0 0"
    fi
}

# Collect Process Count
get_process_count() {
    ps aux | wc -l
}

# Collect Load Average
get_load_average() {
    cat /proc/loadavg | awk '{print $1}'
}

# Collect System Uptime (in seconds)
get_uptime() {
    cat /proc/uptime | awk '{print $1}'
}

# Main execution
main() {
    # Collect all metrics
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
    
    # Get current timestamp in milliseconds
    timestamp=$(($(date +%s) * 1000))
    
    # Build JSON payload
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
    
    # Send to Argus server
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$json_payload" \
        "$ARGUS_SERVER_URL/api/v1/metrics/ingest" 2>&1)
    
    # Log result
    if echo "$response" | grep -q '"success":true'; then
        echo "[$(date)] Metrics sent successfully"
    else
        echo "[$(date)] Failed to send metrics: $response" >&2
    fi
}

# Run main function
main
