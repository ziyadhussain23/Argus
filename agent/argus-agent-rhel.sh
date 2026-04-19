#!/usr/bin/env bash
#######################################################
# ARGUS MONITORING AGENT — RHEL 9
# Server: demo
# Generated: 2026-04-19T15:02:18.932Z
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

ARGUS_SERVER_URL='http://127.0.0.1:18889'
AGENT_KEY='k'
INTERVAL=60

command -v curl >/dev/null 2>&1 || { echo "curl is required (sudo yum install -y curl)" >&2; exit 2; }

num() { [[ "${1:-}" =~ ^-?[0-9]+([.][0-9]+)?$ ]] && echo "$1" || echo 0; }

NET_STATE_FILE="/tmp/argus-agent-net-${AGENT_KEY:0:16}.state"
cpu_model() { awk -F: '/^model name/{gsub(/^ +/,"",$2); print $2; exit}' /proc/cpuinfo 2>/dev/null | tr -d '"' | head -c 120; }

cpu_usage() {
    local idle
    idle=$(top -bn1 2>/dev/null | grep -m1 -E "Cpu\(s\)" \
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
    rx=${rx:-0}; tx=${tx:-0}
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
    cat <<EOF | curl -sS --connect-timeout 5 --max-time 15 \
        -H "Content-Type: application/json" -X POST -d @- \
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
echo "Argus RHEL 9 agent — every ${INTERVAL}s. Ctrl+C to stop."
while true; do
    out=$(send_once 2>&1)
    if echo "$out" | grep -q '"success":true'; then
        echo "[$(date '+%F %T')] OK"
    else
        echo "[$(date '+%F %T')] FAIL: $out" >&2
    fi
    sleep $INTERVAL
done
