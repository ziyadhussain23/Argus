import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Code, Lock, GitBranch, Webhook, Cloud, ArrowLeft } from 'lucide-react';

const apiEndpoints = [
    { method: 'GET', path: '/servers', desc: 'List all servers' },
    { method: 'GET', path: '/servers/{id}', desc: 'Get server details' },
    { method: 'GET', path: '/servers/{id}/metrics', desc: 'Get server metrics' },
    { method: 'POST', path: '/servers', desc: 'Add new server' },
    { method: 'DELETE', path: '/servers/{id}', desc: 'Remove server' },
    { method: 'GET', path: '/alerts', desc: 'List all alerts' },
    { method: 'POST', path: '/alerts', desc: 'Create alert rule' },
    { method: 'PUT', path: '/alerts/{id}', desc: 'Update alert rule' },
    { method: 'DELETE', path: '/alerts/{id}', desc: 'Delete alert rule' },
];

export default function APIReference() {
    return (
        <MainLayout>
            <div className="min-h-screen">
                <div className="border-b border-border bg-gradient-to-br from-emerald-500/10 to-background">
                    <div className="container mx-auto px-6 py-12">
                        <Link to="/docs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Documentation
                        </Link>
                        <div className="max-w-4xl">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm mb-6">
                                <Code className="h-4 w-4" />
                                API Reference
                            </div>
                            <h1 className="font-display text-5xl font-bold text-foreground mb-4">
                                API Reference
                            </h1>
                            <p className="text-xl text-muted-foreground">
                                Complete REST API documentation for programmatic access
                            </p>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-6 py-16 max-w-4xl">
                    {/* Authentication */}
                    <section className="mb-16">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Lock className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="font-display text-3xl font-bold text-foreground">Authentication</h2>
                                <p className="text-muted-foreground">API keys and bearer tokens</p>
                            </div>
                        </div>

                        <div className="p-6 rounded-xl border border-border bg-card">
                            <h3 className="font-semibold text-foreground mb-4">Base URL</h3>
                            <pre className="bg-muted p-4 rounded-lg mb-6">
                                <code className="text-sm font-mono">https://api.argus.io/v1</code>
                            </pre>

                            <h3 className="font-semibold text-foreground mb-4">Authentication Header</h3>
                            <pre className="bg-muted p-4 rounded-lg mb-4">
                                <code className="text-sm font-mono">Authorization: Bearer YOUR_API_KEY</code>
                            </pre>
                            <p className="text-sm text-muted-foreground">
                                Get your API key from Settings → API Keys in your dashboard
                            </p>
                        </div>
                    </section>

                    {/* Endpoints */}
                    <section className="mb-16">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <GitBranch className="h-6 w-6 text-purple-500" />
                            </div>
                            <div>
                                <h2 className="font-display text-3xl font-bold text-foreground">Endpoints</h2>
                                <p className="text-muted-foreground">Available API endpoints</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {apiEndpoints.map((endpoint, idx) => (
                                <div key={idx} className="p-4 rounded-lg border border-border bg-card flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-md text-xs font-semibold ${endpoint.method === 'GET' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                            endpoint.method === 'POST' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                endpoint.method === 'PUT' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                                    'bg-red-500/10 text-red-600 dark:text-red-400'
                                        }`}>
                                        {endpoint.method}
                                    </span>
                                    <code className="font-mono text-sm flex-1">{endpoint.path}</code>
                                    <span className="text-sm text-muted-foreground">{endpoint.desc}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Webhooks */}
                    <section className="mb-16">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Webhook className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <h2 className="font-display text-3xl font-bold text-foreground">Webhooks</h2>
                                <p className="text-muted-foreground">Real-time event notifications</p>
                            </div>
                        </div>

                        <div className="p-6 rounded-xl border border-border bg-card">
                            <p className="text-muted-foreground mb-4">
                                Configure webhooks to receive HTTP POST requests when events occur
                            </p>
                            <h3 className="font-semibold text-foreground mb-3">Available Events</h3>
                            <ul className="space-y-2 text-muted-foreground">
                                <li className="flex gap-2"><span className="text-primary">•</span>server.added</li>
                                <li className="flex gap-2"><span className="text-primary">•</span>server.removed</li>
                                <li className="flex gap-2"><span className="text-primary">•</span>alert.triggered</li>
                                <li className="flex gap-2"><span className="text-primary">•</span>alert.resolved</li>
                            </ul>
                        </div>
                    </section>

                    <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                        <h3 className="font-display text-2xl font-bold text-foreground mb-3">Questions?</h3>
                        <p className="text-muted-foreground mb-6">Contact our support team for API assistance</p>
                        <Button asChild><Link to="/help">Contact Support</Link></Button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
