import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Server, BarChart, Bell, Database, Cloud, ArrowLeft, Activity, Zap, TrendingUp } from 'lucide-react';

export default function CoreFeatures() {
    return (
        <MainLayout>
            <div className="min-h-screen">
                {/* Header */}
                <div className="border-b border-border bg-gradient-to-br from-purple-500/10 to-background">
                    <div className="container mx-auto px-6 py-12">
                        <Link to="/docs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Documentation
                        </Link>
                        <div className="max-w-4xl">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-sm mb-6">
                                <Server className="h-4 w-4" />
                                Core Features
                            </div>
                            <h1 className="font-display text-5xl font-bold text-foreground mb-4">
                                Core Features
                            </h1>
                            <p className="text-xl text-muted-foreground">
                                Powerful monitoring, analytics, and alerting capabilities for your infrastructure
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-6 py-16 max-w-4xl">
                    {/* Server Management */}
                    <section className="mb-20">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Server className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="font-display text-3xl font-bold text-foreground">Server Management</h2>
                                <p className="text-muted-foreground">Centralized control over all your servers</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 rounded-xl border border-border bg-card">
                                <h3 className="text-xl font-semibold text-foreground mb-3">Multi-Server Dashboard</h3>
                                <p className="text-muted-foreground mb-4">
                                    View and manage all your servers from a single, unified dashboard. Monitor health status, resource usage, and uptime across your entire infrastructure at a glance.
                                </p>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Real-time server status indicators with color-coded health checks</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Quick server details: hostname, IP, OS, and location</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Sortable and filterable server lists for easy navigation</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Server grouping by tags, environments, or custom categories</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="p-6 rounded-xl border border-border bg-card">
                                <h3 className="text-xl font-semibold text-foreground mb-3">One-Click Server Addition</h3>
                                <p className="text-muted-foreground mb-4">
                                    Adding new servers is as simple as running a single command. Our intelligent agent auto-detects your server configuration and starts monitoring immediately.
                                </p>
                                <div className="bg-muted p-4 rounded-lg">
                                    <code className="text-sm font-mono">curl -sSL https://argus.io/install.sh | bash</code>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Real-time Monitoring */}
                    <section className="mb-20">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Activity className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="font-display text-3xl font-bold text-foreground">Real-Time Monitoring</h2>
                                <p className="text-muted-foreground">Live metrics updated every 10 seconds</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 rounded-xl border border-border bg-card">
                                <h3 className="text-xl font-semibold text-foreground mb-3">System Metrics</h3>
                                <div className="grid md:grid-cols-2 gap-4 mt-4">
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <div className="font-semibold text-foreground mb-2">CPU Usage</div>
                                        <p className="text-sm text-muted-foreground">Per-core and aggregate CPU utilization with historical trends</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <div className="font-semibold text-foreground mb-2">Memory Usage</div>
                                        <p className="text-sm text-muted-foreground">RAM usage, available memory, swap, and cache statistics</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <div className="font-semibold text-foreground mb-2">Disk I/O</div>
                                        <p className="text-sm text-muted-foreground">Read/write rates, IOPS, latency, and usage per disk</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <div className="font-semibold text-foreground mb-2">Network Traffic</div>
                                        <p className="text-sm text-muted-foreground">Bandwidth usage, packet rates, and connection statistics</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 rounded-xl border border-border bg-card">
                                <h3 className="text-xl font-semibold text-foreground mb-3">WebSocket Updates</h3>
                                <p className="text-muted-foreground">
                                    Our WebSocket technology ensures you always have the latest data without manual refresh. Changes appear instantly as they occur.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Metrics & Analytics */}
                    <section className="mb-20">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <BarChart className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <h2 className="font-display text-3xl font-bold text-foreground">Metrics & Analytics</h2>
                                <p className="text-muted-foreground">Historical data and trend analysis</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 rounded-xl border border-border bg-card">
                                <h3 className="text-xl font-semibold text-foreground mb-3">Historical Data Retention</h3>
                                <p className="text-muted-foreground mb-4">
                                    View historical metrics to identify patterns and plan capacity:
                                </p>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Free tier: 7 days of data retention</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Pro tier: 30 days of data retention</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Enterprise: Custom retention up to 2 years</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="p-6 rounded-xl border border-border bg-card">
                                <h3 className="text-xl font-semibold text-foreground mb-3">Interactive Charts</h3>
                                <p className="text-muted-foreground mb-4">
                                    Beautiful, responsive charts with zoom, pan, and export capabilities:
                                </p>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Export as PNG, JPG, PDF, Excel, CSV, or JSON</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Customizable time ranges and metric combinations</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Dark mode optimized visualizations</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Alerting */}
                    <section className="mb-20">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <Bell className="h-6 w-6 text-red-500" />
                            </div>
                            <div>
                                <h2 className="font-display text-3xl font-bold text-foreground">Smart Alerting</h2>
                                <p className="text-muted-foreground">Intelligent notifications when it matters</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 rounded-xl border border-border bg-card">
                                <h3 className="text-xl font-semibold text-foreground mb-3">Custom Alert Rules</h3>
                                <p className="text-muted-foreground mb-4">
                                    Create sophisticated alert rules based on any metric:
                                </p>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Threshold-based alerts (CPU above 90%, Memory above 85%, etc.)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Sustained condition alerts (trigger only if condition persists)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Multi-condition alerts with AND/OR logic</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Server-specific or global alert rules</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="p-6 rounded-xl border border-border bg-card">
                                <h3 className="text-xl font-semibold text-foreground mb-3">Notification Channels</h3>
                                <p className="text-muted-foreground mb-4">
                                    Get notified where you work:
                                </p>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <div className="font-semibold text-foreground mb-2">Email</div>
                                        <p className="text-sm text-muted-foreground">Instant email notifications to multiple addresses</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <div className="font-semibold text-foreground mb-2">Slack</div>
                                        <p className="text-sm text-muted-foreground">Direct channel or DM notifications</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <div className="font-semibold text-foreground mb-2">Webhooks</div>
                                        <p className="text-sm text-muted-foreground">POST to any endpoint for custom integrations</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/50">
                                        <div className="font-semibold text-foreground mb-2">SMS</div>
                                        <p className="text-sm text-muted-foreground">Critical alerts via text message</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Next Steps */}
                    <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                        <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                            Ready to Explore More?
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Learn how to integrate Argus with your existing tools via our comprehensive API
                        </p>
                        <div className="flex gap-4">
                            <Button asChild>
                                <Link to="/docs/api">View API Reference</Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link to="/docs/security">Security Guide</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
