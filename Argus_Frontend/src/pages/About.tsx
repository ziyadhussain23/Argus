import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';
import {
    Server, Bell, Shield, Zap, LineChart, Globe,
    ChevronRight, CheckCircle2, Cpu, Database, Code2,
    GitBranch, Layers, Heart, Target, Rocket, ArrowLeft
} from 'lucide-react';
import { ArgusLogo } from '@/components/ArgusLogo';

const features = [
    { icon: Server, title: 'Multi-Server Monitoring', desc: 'Monitor unlimited servers from a single, unified dashboard. Track performance across your entire infrastructure.' },
    { icon: Bell, title: 'Intelligent Alerting', desc: 'Set custom thresholds and receive instant notifications via email, SMS, or webhooks when issues arise.' },
    { icon: Zap, title: 'Real-Time Updates', desc: 'WebSocket-powered live metrics ensure you always have the most current data at your fingertips.' },
    { icon: LineChart, title: 'Historical Analytics', desc: 'Store and analyze historical data to identify trends, plan capacity, and optimize performance.' },
    { icon: Shield, title: 'Enterprise Security', desc: 'Bank-grade encryption, role-based access control, and audit logging to keep your data secure.' },
    { icon: Globe, title: 'Global Availability', desc: 'Deploy monitoring agents worldwide and ensure 24/7 visibility into your global infrastructure.' },
];

const techStack = [
    { icon: Code2, name: 'React + TypeScript', desc: 'Modern frontend' },
    { icon: Database, name: 'Spring Boot', desc: 'Robust backend' },
    { icon: Layers, name: 'MySQL', desc: 'Reliable storage' },
    { icon: GitBranch, name: 'WebSocket', desc: 'Live updates' },
];

const values = [
    { icon: Target, title: 'Mission-Driven', desc: 'We believe every team deserves enterprise-grade monitoring without enterprise complexity.' },
    { icon: Heart, title: 'User-Focused', desc: 'Every feature we build starts with understanding what our users truly need.' },
    { icon: Rocket, title: 'Innovation', desc: 'We continuously push boundaries to deliver cutting-edge monitoring solutions.' },
];

const stats = [
    { value: '24/7', label: 'Real-Time Monitoring' },
    { value: '∞', label: 'Servers Supported' },
    { value: '<1s', label: 'Alert Latency' },
    { value: 'Free', label: 'Open Source' },
];

export default function About() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/')}
                            className="h-9 w-9"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <Link to="/" className="flex items-center gap-3">
                            <ArgusLogo size="sm" />
                        </Link>
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/about" className="text-sm font-medium text-primary">About</Link>
                        <Link to="/faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
                        <Link to="/help" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Help & Support</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Button variant="ghost" asChild>
                            <Link to="/login">Sign In</Link>
                        </Button>
                        <Button asChild>
                            <Link to="/register">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 relative overflow-hidden">
                <div className="absolute inset-0">
                    <motion.div
                        className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 10, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl"
                        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 12, repeat: Infinity }}
                    />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        className="max-w-4xl mx-auto text-center"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <motion.div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Activity className="h-4 w-4" />
                            About Argus
                        </motion.div>

                        <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                            Empowering Teams with{' '}
                            <span className="text-gradient-primary">Intelligent Monitoring</span>
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            Argus is a comprehensive server monitoring platform designed to give you complete visibility
                            into your infrastructure. From real-time metrics to intelligent alerting, we help you keep
                            your systems running smoothly.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-card border-y border-border">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                className="text-center"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="font-display text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</div>
                                <div className="text-muted-foreground">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* What is Argus Section */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="font-display text-4xl font-bold text-foreground mb-6">
                                What is <span className="text-gradient-primary">Argus</span>?
                            </h2>
                            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                                Named after the all-seeing giant of Greek mythology, Argus is your vigilant guardian for
                                server infrastructure. Our platform provides comprehensive monitoring capabilities that
                                help DevOps teams, system administrators, and developers maintain optimal system performance.
                            </p>
                            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                                With Argus, you get real-time visibility into CPU usage, memory consumption, disk I/O,
                                network traffic, and more. Our intelligent alerting system ensures you're notified
                                before small issues become major problems.
                            </p>
                            <div className="space-y-4">
                                {[
                                    'Deploy lightweight agents in seconds',
                                    'Monitor unlimited servers from one dashboard',
                                    'Set custom alert thresholds and rules',
                                    'Access historical data for trend analysis',
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        className="flex items-center gap-3"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                                        <span className="text-foreground">{item}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            className="relative"
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="relative bg-gradient-to-br from-card to-card/50 rounded-2xl border border-border p-8 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />

                                {/* Mock Dashboard Preview */}
                                <div className="relative space-y-4">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                            <span className="text-sm font-medium text-foreground">Live Dashboard</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Updated just now</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { icon: Cpu, label: 'CPU', value: '23%', color: 'text-emerald-500' },
                                            { icon: Database, label: 'Memory', value: '4.2 GB', color: 'text-blue-500' },
                                            { icon: Layers, label: 'Disk', value: '67%', color: 'text-amber-500' },
                                            { icon: Globe, label: 'Network', value: '1.2 Gbps', color: 'text-purple-500' },
                                        ].map((metric, i) => (
                                            <motion.div
                                                key={i}
                                                className="bg-background/50 rounded-xl p-4 border border-border"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.3 + i * 0.1 }}
                                            >
                                                <metric.icon className={`h-5 w-5 ${metric.color} mb-2`} />
                                                <div className="text-xs text-muted-foreground">{metric.label}</div>
                                                <div className="text-lg font-semibold text-foreground">{metric.value}</div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="mt-4 h-32 bg-background/50 rounded-xl border border-border flex items-center justify-center">
                                        <div className="flex items-end gap-1 h-20">
                                            {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 45, 90].map((h, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-4 bg-primary/60 rounded-t"
                                                    initial={{ height: 0 }}
                                                    whileInView={{ height: `${h}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: 0.5 + i * 0.05 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-gradient-to-b from-background to-card/50">
                <div className="container mx-auto px-6">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-display text-4xl font-bold text-foreground mb-4">
                            Powerful <span className="text-gradient-primary">Features</span>
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Everything you need to monitor, analyze, and optimize your server infrastructure
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <feature.icon className="h-7 w-7" />
                                </div>
                                <h3 className="font-display text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Technology Section */}
            <section className="py-24 bg-card border-y border-border">
                <div className="container mx-auto px-6">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-display text-4xl font-bold text-foreground mb-4">
                            Built with <span className="text-gradient-primary">Modern Technology</span>
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            We use industry-leading technologies to deliver a fast, reliable, and secure monitoring experience
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                        {techStack.map((tech, i) => (
                            <motion.div
                                key={i}
                                className="text-center p-6 rounded-2xl bg-background border border-border hover:border-primary/50 transition-all"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -3 }}
                            >
                                <div className="flex justify-center mb-4">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <tech.icon className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                                <div className="font-semibold text-foreground mb-1">{tech.name}</div>
                                <div className="text-sm text-muted-foreground">{tech.desc}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-display text-4xl font-bold text-foreground mb-4">
                            Our <span className="text-gradient-primary">Values</span>
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            The principles that guide everything we do
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {values.map((value, i) => (
                            <motion.div
                                key={i}
                                className="text-center p-8"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                            >
                                <div className="flex justify-center mb-6">
                                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        <value.icon className="h-8 w-8 text-primary" />
                                    </div>
                                </div>
                                <h3 className="font-display text-xl font-semibold text-foreground mb-3">{value.title}</h3>
                                <p className="text-muted-foreground">{value.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-t border-border">
                <div className="container mx-auto px-6">
                    <motion.div
                        className="max-w-3xl mx-auto text-center"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
                            Ready to Get Started?
                        </h2>
                        <p className="text-muted-foreground text-lg mb-8">
                            Join thousands of teams who trust Argus for their server monitoring needs.
                            Start your free trial today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" className="h-14 px-8 text-lg" asChild>
                                <Link to="/register">
                                    Start Free Trial
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg" asChild>
                                <Link to="/help">Contact Sales</Link>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-card border-t border-border">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <ArgusLogo size="sm" />
                        </div>
                        <div className="flex gap-8 text-sm text-muted-foreground">
                            <Link to="/about" className="hover:text-primary transition-colors">About</Link>
                            <Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link>
                            <Link to="/help" className="hover:text-primary transition-colors">Help & Support</Link>
                            <Link to="/login" className="hover:text-primary transition-colors">Login</Link>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Argus. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
