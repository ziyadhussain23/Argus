#!/usr/bin/env bash
#######################################################
# ARGUS MONITORING AGENT — macOS
# Server: demo
# Generated: 2026-04-19T15:02:18.917Z
#
# 1. Save as argus-agent-macos.sh
# 2. chmod +x argus-agent-macos.sh
# 3. ./argus-agent-macos.sh   (Ctrl+C to stop)
#######################################################
set -u

ARGUS_SERVER_URL='http://127.0.0.1:18889'
AGENT_KEY='k'
INTERVAL=60
NET_STATE_FILE="/tmp/argus-agent-net-${AGENT_KEY:0:16}.state"

command -v curl >/dev/null 2>&1 || { echo "curl is required" >&2; exit 2; }

num() { [[ "${1:-}" =~ ^-?[0-9]+([.][0-9]+)?$ ]] && echo "$1" || echo 0; }

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
    pf=$(vm_stat  | awk '/Pages free/        {gsub("\.",""); print $3}'); pf=${pf:-0}
    pi=$(vm_stat  | awk '/Pages inactive/    {gsub("\.",""); print $3}'); pi=${pi:-0}
    psp=$(vm_stat | awk '/Pages speculative/ {gsub("\.",""); print $3}'); psp=${psp:-0}
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
echo "Argus macOS agent — every ${INTERVAL}s. Ctrl+C to stop."
while true; do
    out=$(send_once 2>&1)
    if echo "$out" | grep -q '"success":true'; then
        echo "[$(date '+%F %T')] OK"
    else
        echo "[$(date '+%F %T')] FAIL: $out" >&2
    fi
    sleep $INTERVAL
done
