# Argus Agent Launcher - Runs the agent in continuous mode
# Usage: .\run-agent.ps1

$ScriptPath = Join-Path $PSScriptRoot "argus-agent.ps1"

# Run the agent with continuous mode enabled, 1 second interval
& $ScriptPath -Continuous -IntervalSeconds 1
