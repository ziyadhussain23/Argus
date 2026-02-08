import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Shield, Lock, Key, Database, UserCheck, ArrowLeft } from 'lucide-react';

export default function SecurityCompliance() {
    return (
        <MainLayout>
            <div className="min-h-screen">
                <div className="border-b border-border bg-gradient-to-br from-red-500/10 to-background">
                    <div className="container mx-auto px-6 py-12">
                        <Link to="/docs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Documentation
                        </Link>
                        <div className="max-w-4xl">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm mb-6">
                                <Shield className="h-4 w-4" />
                                Security & Compliance
                            </div>
                            <h1 className="font-display text-5xl font-bold text-foreground mb-4">
                                Security & Compliance
                            </h1>
                            <p className="text-xl text-muted-foreground">
                                Enterprise-grade security and compliance standards
                            </p>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-6 py-16 max-w-4xl">
                    {/* Data Security */}
                    <section className="mb-16">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Lock className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="font-display text-3xl font-bold text-foreground">Data Security</h2>
                                <p className="text-muted-foreground">Industry-standard encryption and protection</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-6 rounded-xl border border-border bg-card">
                                <h3 className="font-semibold text-foreground mb-3">Encryption in Transit</h3>
                                <p className="text-muted-foreground mb-3">
                                    All data transmitted between your servers and Argus is encrypted using TLS 1.3
                                </p>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex gap-2"><span className="text-primary">•</span>256-bit encryption for all API communication</li>
                                    <li className="flex gap-2"><span className="text-primary">•</span>Perfect forward secrecy (PFS) enabled</li>
                                    <li className="flex gap-2"><span className="text-primary">•</span>Certificate pinning for added security</li>
                                </ul>
                            </div>

                            <div className="p-6 rounded-xl border border-border bg-card">
                                <h3 className="font-semibold text-foreground mb-3">Encryption at Rest</h3>
                                <p className="text-muted-foreground mb-3">
                                    All stored data is encrypted using AES-256 encryption
                                </p>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex gap-2"><span className="text-primary">•</span>Database encryption with managed keys</li>
                                    <li className="flex gap-2"><span className="text-primary">•</span>Encrypted backups and snapshots</li>
                                    <li className="flex gap-2"><span className="text-primary">•</span>Secure key rotation policy</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Compliance */}
                    <section className="mb-16">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <UserCheck className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="font-display text-3xl font-bold text-foreground">Compliance</h2>
                                <p className="text-muted-foreground">Meeting industry standards</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-6 rounded-xl border border-border bg-card">
                                <h3 className="font-semibold text-foreground mb-2">SOC 2 Type II</h3>
                                <p className="text-sm text-muted-foreground">Audited for security, availability, and confidentiality</p>
                            </div>
                            <div className="p-6 rounded-xl border border-border bg-card">
                                <h3 className="font-semibold text-foreground mb-2">GDPR Compliant</h3>
                                <p className="text-sm text-muted-foreground">European data protection standards</p>
                            </div>
                            <div className="p-6 rounded-xl border border-border bg-card">
                                <h3 className="font-semibold text-foreground mb-2">ISO 27001</h3>
                                <p className="text-sm text-muted-foreground">Information security management</p>
                            </div>
                            <div className="p-6 rounded-xl border border-border bg-card">
                                <h3 className="font-semibold text-foreground mb-2">HIPAA Ready</h3>
                                <p className="text-sm text-muted-foreground">Healthcare data protection available</p>
                            </div>
                        </div>
                    </section>

                    {/* Access Control */}
                    <section className="mb-16">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Key className="h-6 w-6 text-purple-500" />
                            </div>
                            <div>
                                <h2 className="font-display text-3xl font-bold text-foreground">Access Control</h2>
                                <p className="text-muted-foreground">Role-based permissions</p>
                            </div>
                        </div>

                        <div className="p-6 rounded-xl border border-border bg-card">
                            <p className="text-muted-foreground mb-4">
                                Control who can access what with granular role-based permissions
                            </p>
                            <ul className="space-y-2 text-muted-foreground">
                                <li className="flex gap-2"><span className="text-primary">•</span><strong>Admin:</strong> Full access to all features and settings</li>
                                <li className="flex gap-2"><span className="text-primary">•</span><strong>Editor:</strong> Can add/modify servers and alerts</li>
                                <li className="flex gap-2"><span className="text-primary">•</span><strong>Viewer:</strong> Read-only access to dashboards and metrics</li>
                            </ul>
                        </div>
                    </section>

                    {/* Best Practices */}
                    <section className="mb-16">
                        <h2 className="font-display text-3xl font-bold text-foreground mb-6">Security Best Practices</h2>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg border border-border bg-card">
                                <h3 className="font-semibold text-foreground mb-2">1. Use Strong API Keys</h3>
                                <p className="text-sm text-muted-foreground">Generate unique API keys for each server and rotate them regularly</p>
                            </div>
                            <div className="p-4 rounded-lg border border-border bg-card">
                                <h3 className="font-semibold text-foreground mb-2">2. Enable Two-Factor Authentication</h3>
                                <p className="text-sm text-muted-foreground">Protect your account with 2FA via authenticator apps</p>
                            </div>
                            <div className="p-4 rounded-lg border border-border bg-card">
                                <h3 className="font-semibold text-foreground mb-2">3. Review Audit Logs</h3>
                                <p className="text-sm text-muted-foreground">Regularly check audit logs for suspicious activity</p>
                            </div>
                            <div className="p-4 rounded-lg border border-border bg-card">
                                <h3 className="font-semibold text-foreground mb-2">4. Limit Network Access</h3>
                                <p className="text-sm text-muted-foreground">Configure firewall rules to allow only necessary outbound connections</p>
                            </div>
                        </div>
                    </section>

                    <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                        <h3 className="font-display text-2xl font-bold text-foreground mb-3">Security Questions?</h3>
                        <p className="text-muted-foreground mb-6">Our security team is here to help with compliance and security inquiries</p>
                        <Button asChild><Link to="/help">Contact Security Team</Link></Button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
