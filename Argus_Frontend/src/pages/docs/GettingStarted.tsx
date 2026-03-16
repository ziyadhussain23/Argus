import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Zap, Play, Download, Settings2, Server, CheckCircle, ArrowLeft, FileText } from 'lucide-react';

export default function GettingStarted() {
    return (
        <MainLayout>
            <div className="min-h-screen">
                {/* Header */}
                <div className="border-b border-border bg-gradient-to-br from-blue-500/10 to-background">
                    <div className="container mx-auto px-6 py-12">
                        <Link to="/docs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Documentation
                        </Link>
                        <div className="max-w-4xl">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm mb-6">
                                <Zap className="h-4 w-4" />
                                Getting Started Guide
                            </div>
                            <h1 className="font-display text-5xl font-bold text-foreground mb-4">
                                Get Started with Argus
                            </h1>
                            <p className="text-xl text-muted-foreground">
                                Complete guide to setting up and configuring Argus for your infrastructure monitoring needs
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-6 py-16 max-w-4xl">
                    {/* Overview */}
                    <section className="mb-16">
                        <h2 className="font-display text-3xl font-bold text-foreground mb-6">Overview</h2>
                        <p className="text-lg text-muted-foreground mb-4">
                            Argus is a modern, powerful server monitoring platform designed to give you complete visibility into your infrastructure.
                            This guide will walk you through the entire setup process, from creating your account to viewing your first metrics.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4 mt-8">
                            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">5 min</div>
                                <div className="text-sm text-muted-foreground">Average setup time</div>
                            </div>
                            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">Free</div>
                                <div className="text-sm text-muted-foreground">Start with 3 servers</div>
                            </div>
                            <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">24/7</div>
                                <div className="text-sm text-muted-foreground">Real-time monitoring</div>
                            </div>
                        </div>
                    </section>

                    {/* Prerequisites */}
                    <section className="mb-16">
                        <h2 className="font-display text-3xl font-bold text-foreground mb-6">Prerequisites</h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                                <CheckCircle className="h-6 w-6 text-emerald-500 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-foreground mb-2">Server Access</h3>
                                    <p className="text-muted-foreground">Root or sudo access to the server you want to monitor</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                                <CheckCircle className="h-6 w-6 text-emerald-500 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-foreground mb-2">Supported OS</h3>
                                    <p className="text-muted-foreground">Linux (Ubuntu, Debian, CentOS, RHEL), Windows Server 2012+, or macOS 10.14+</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                                <CheckCircle className="h-6 w-6 text-emerald-500 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-foreground mb-2">Internet Connection</h3>
                                    <p className="text-muted-foreground">Outbound HTTPS (port 443) access to api.argus.io</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Step-by-Step Guide */}
                    <section className="mb-16">
                        <h2 className="font-display text-3xl font-bold text-foreground mb-8">Step-by-Step Setup</h2>

                        {/* Step 1 */}
                        <div className="mb-12">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg flex-shrink-0">
                                    1
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-foreground mb-2">Create Your Account</h3>
                                    <p className="text-muted-foreground mb-4">Start with our free tier - no credit card required</p>
                                </div>
                            </div>
                            <div className="ml-14 space-y-4">
                                <div className="p-6 rounded-xl border border-border bg-card">
                                    <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                                        <li>Visit <a href="https://argus.io/register" className="text-primary hover:underline">argus.io/register</a></li>
                                        <li>Enter your email address and create a strong password</li>
                                        <li>Verify your email address using the link sent to your inbox</li>
                                        <li>Complete your profile with your organization details</li>
                                    </ol>
                                    <div className="mt-6">
                                        <Button asChild>
                                            <Link to="/register">
                                                Create Free Account
                                                <Play className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="mb-12">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg flex-shrink-0">
                                    2
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-foreground mb-2">Install the Agent</h3>
                                    <p className="text-muted-foreground mb-4">Deploy our lightweight monitoring agent on your server</p>
                                </div>
                            </div>
                            <div className="ml-14 space-y-6">
                                <div className="p-6 rounded-xl border border-border bg-card">
                                    <h4 className="font-semibold text-foreground mb-4">Linux Installation</h4>
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                                        <code className="text-sm font-mono">curl -sSL https://argus.io/install.sh | bash</code>
                                    </pre>
                                    <p className="text-sm text-muted-foreground">
                                        The installer will automatically detect your distribution and install the appropriate agent.
                                    </p>
                                </div>

                                <div className="p-6 rounded-xl border border-border bg-card">
                                    <h4 className="font-semibold text-foreground mb-4">Windows Installation</h4>
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                                        <code className="text-sm font-mono">iwr https://argus.io/install.ps1 | iex</code>
                                    </pre>
                                    <p className="text-sm text-muted-foreground">
                                        Run this in PowerShell as Administrator.
                                    </p>
                                </div>

                                <div className="p-6 rounded-xl border border-border bg-card">
                                    <h4 className="font-semibold text-foreground mb-4">macOS Installation</h4>
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                                        <code className="text-sm font-mono">brew install argus-agent</code>
                                    </pre>
                                    <p className="text-sm text-muted-foreground">
                                        Requires Homebrew package manager.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="mb-12">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg flex-shrink-0">
                                    3
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-foreground mb-2">Configure the Agent</h3>
                                    <p className="text-muted-foreground mb-4">Connect your agent to your Argus account</p>
                                </div>
                            </div>
                            <div className="ml-14 space-y-4">
                                <div className="p-6 rounded-xl border border-border bg-card">
                                    <p className="text-muted-foreground mb-4">
                                        After logging in to your Argus dashboard, navigate to Settings → API Keys to generate your authentication key.
                                    </p>
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                                        <code className="text-sm font-mono">argus-agent configure --api-key YOUR_API_KEY</code>
                                    </pre>
                                    <p className="text-sm text-muted-foreground">
                                        The agent will automatically start collecting metrics after configuration.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="mb-12">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg flex-shrink-0">
                                    4
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-foreground mb-2">Verify Installation</h3>
                                    <p className="text-muted-foreground mb-4">Confirm everything is working correctly</p>
                                </div>
                            </div>
                            <div className="ml-14 space-y-4">
                                <div className="p-6 rounded-xl border border-border bg-card">
                                    <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                                        <li>Check agent status: <code className="bg-muted px-2 py-1 rounded text-sm font-mono">argus-agent status</code></li>
                                        <li>View your dashboard at <Link to="/dashboard" className="text-primary hover:underline">argus.io/dashboard</Link></li>
                                        <li>Your server should appear in the Servers list within 30 seconds</li>
                                        <li>Metrics should start appearing within 1 minute</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Next Steps */}
                    <section className="mb-16">
                        <h2 className="font-display text-3xl font-bold text-foreground mb-6">Next Steps</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Link to="/docs/features" className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all">
                                <Server className="h-8 w-8 text-primary mb-4" />
                                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                                    Explore Core Features
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Learn about monitoring, alerts, and analytics capabilities
                                </p>
                            </Link>

                            <Link to="/docs/api" className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all">
                                <FileText className="h-8 w-8 text-primary mb-4" />
                                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                                    API Reference
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Integrate Argus with your existing tools and workflows
                                </p>
                            </Link>
                        </div>
                    </section>

                    {/* Help */}
                    <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                        <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                            Need Help?
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Our support team is available 24/7 to help you get started
                        </p>
                        <div className="flex gap-4">
                            <Button asChild>
                                <Link to="/help">Contact Support</Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link to="/faq">View FAQ</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
