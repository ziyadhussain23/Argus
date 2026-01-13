# Argus Monitoring Agent

This directory contains agent scripts that run on client servers to collect and send metrics to the Argus monitoring server.

## Available Agents

### 1. Shell Script Agent (`argus-agent.sh`)

A lightweight bash script for Linux servers.

**Features:**
- Collects CPU, Memory, Disk, Network, Process, and Load metrics
- No dependencies (uses standard Linux tools)
- Easy to deploy and configure

**Installation:**

```bash
# 1. Copy the script to your server
scp argus-agent.sh user@your-server:/opt/argus/

# 2. Make it executable
chmod +x /opt/argus/argus-agent.sh

# 3. Edit the configuration
nano /opt/argus/argus-agent.sh
# Update ARGUS_SERVER_URL and AGENT_KEY

# 4. Test manually
/opt/argus/argus-agent.sh

# 5. Add to crontab (runs every minute)
(crontab -l 2>/dev/null; echo "*/1 * * * * /opt/argus/argus-agent.sh >> /var/log/argus-agent.log 2>&1") | crontab -
```

### 2. Systemd Service (Recommended for Production)

For continuous monitoring with better reliability:

```bash
# Create systemd service file
sudo nano /etc/systemd/system/argus-agent.service
```

```ini
[Unit]
Description=Argus Monitoring Agent
After=network.target

[Service]
Type=simple
ExecStart=/bin/bash -c 'while true; do /opt/argus/argus-agent.sh; sleep 60; done'
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable argus-agent
sudo systemctl start argus-agent
```

## Getting Your Agent Key

1. Log in to the Argus dashboard
2. Go to Servers → Add Server
3. Enter server name and host address
4. Copy the generated Agent Key
5. Paste it in your agent configuration

## Metrics Collected

| Metric | Description | Unit |
|--------|-------------|------|
| CPU_USAGE | CPU utilization percentage | % |
| MEMORY_USAGE | Memory used percentage | % |
| MEMORY_TOTAL | Total memory | MB |
| MEMORY_AVAILABLE | Available memory | MB |
| DISK_USAGE | Root partition usage | % |
| NETWORK_IN | Bytes received | bytes |
| NETWORK_OUT | Bytes transmitted | bytes |
| PROCESS_COUNT | Number of running processes | count |
| LOAD_AVERAGE | 1-minute load average | - |
| UPTIME | System uptime | seconds |

## Troubleshooting

**Agent not sending metrics:**
```bash
# Check if script runs manually
/opt/argus/argus-agent.sh

# Check logs
tail -f /var/log/argus-agent.log

# Verify connectivity
curl -X POST http://your-argus-server:8080/api/v1/metrics/heartbeat?agentKey=your-key
```

**Invalid agent key error:**
- Verify the agent key in the Argus dashboard
- Regenerate the key if needed
