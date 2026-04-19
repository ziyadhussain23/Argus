#!/usr/bin/env bash
#######################################################
# ARGUS MONITORING AGENT — Generic Linux
# Server: demo
# Generated: 2026-04-19T15:02:18.933Z
#
# Reads everything from /proc and /sys directly so it works
# on minimal images that don't have top, free, ip, etc.
#
# 1. Save as argus-agent.sh
# 2. chmod +x argus-agent.sh
# 3. ./argus-agent.sh   (Ctrl+C to stop)
#######################################################
set -u

ARGUS_SERVER_URL='http://127.0.0.1:18889'
AGENT_KEY='k'
INTERVAL=60
NET_STATE_FILE="/tmp/argus-agent-net-${AGENT_KEY:0:16}.state"

command -v curl >/dev/null 2>&1 || { echo "curl is required" >&2; exit 2; }

num() { [[ "${1:-}" =~ ^-?[0-9]+([.][0-9]+)?$ ]] && echo "$1" || echo 0; }

cpu_model() { awk -F: '/^model name/{gsub(/^ +/,"",$2); print $2; exit}' /proc/cpuinfo 2>/dev/null | tr -d '"' | head -c 120; }

cpu_usage() {
    read -r _ u1 n1 s1 i1 w1 q1 sq1 _ < /proc/stat
    sleep 1
    read -r _ u2 n2 s2 i2 w2 q2 sq2 _ < /proc/stat
    awk -v u1="$u1" -v n1="$n1" -v s1="$s1" -v i1="$i1" -v w1="$w1" -v q1="$q1" -v sq1="$sq1" \
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
echo "Argus generic Linux agent — every ${INTERVAL}s. Ctrl+C to stop."
while true; do
    out=$(send_once 2>&1)
    if echo "$out" | grep -q '"success":true'; then
        echo "[$(date '+%F %T')] OK"
    else
        echo "[$(date '+%F %T')] FAIL: $out" >&2
    fi
    sleep $INTERVAL
done
