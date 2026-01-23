import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';
import {
  Activity, Server, Bell, Shield, Zap, LineChart, ChevronRight,
  CheckCircle2, Cpu, HardDrive, Wifi, BarChart3, Star, ArrowRight,
  Play, Users, Clock, Globe
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const features = [
  { icon: Server, title: 'Multi-Server Monitoring', desc: 'Monitor all your servers from a single dashboard' },
  { icon: Bell, title: 'Intelligent Alerts', desc: 'Get notified before issues become problems' },
  { icon: Zap, title: 'Real-Time Updates', desc: 'Live metrics with WebSocket technology' },
  { icon: LineChart, title: 'Historical Data', desc: 'Analyze trends with historical analytics' },
  { icon: Shield, title: 'Enterprise Security', desc: 'Bank-grade encryption for your data' },
  { icon: Globe, title: '24/7 Monitoring', desc: 'Around the clock infrastructure visibility' },
];

const stats = [
  { value: '99.99%', label: 'Uptime', icon: Clock },
  { value: '50K+', label: 'Servers', icon: Server },
  { value: '10K+', label: 'Users', icon: Users },
  { value: '<1s', label: 'Latency', icon: Zap },
];

const metrics = [
  { icon: Cpu, label: 'CPU', value: '23%', color: 'text-emerald-500', bg: 'bg-emerald-500' },
  { icon: HardDrive, label: 'Memory', value: '4.2GB', color: 'text-blue-500', bg: 'bg-blue-500' },
  { icon: Wifi, label: 'Network', value: '1.2Gbps', color: 'text-purple-500', bg: 'bg-purple-500' },
  { icon: BarChart3, label: 'Disk I/O', value: '340MB/s', color: 'text-amber-500', bg: 'bg-amber-500' },
];

const testimonials = [
  { quote: "Argus transformed our infrastructure monitoring. Incredible real-time insights!", author: "Sarah Chen", role: "DevOps Lead", rating: 5 },
  { quote: "The best monitoring solution we've ever used. Simple yet powerful.", author: "Michael Roberts", role: "CTO", rating: 5 },
  { quote: "Finally, a monitoring tool that just works. Highly recommended!", author: "Emily Watson", role: "System Admin", rating: 5 },
];

const faqs = [
  { q: "Is there a free trial?", a: "Yes, we offer a generous free tier for up to 3 servers. No credit card required to start." },
  { q: "How do I install the agent?", a: "Installation is simple. Just run our one-line command on your server (Linux, Windows, or macOS) and it handles the rest." },
  { q: "Is my data secure?", a: "Absolutely. We use bank-grade encryption for all data in transit and at rest. Your infrastructure details are never shared." },
  { q: "Can I get custom alerts?", a: "Yes, you can configure granular alert rules for CPU, Memory, Disk, and more, with delivery via Email, Slack, or Webhooks." },
];

export default function Index() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">Argus</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</Link>
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
      <section className="pt-32 pb-24 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 12, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl"
            animate={{ x: [0, 50, 0], opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 15, repeat: Infinity }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Activity className="h-4 w-4" />
                Server Monitoring Reimagined
              </motion.div>

              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
                Monitor Your{' '}
                <span className="text-gradient-primary">Infrastructure</span>{' '}
                in Real-Time
              </h1>

              <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
                Get complete visibility into your servers with real-time metrics, intelligent alerts,
                and beautiful dashboards. Deploy in minutes, not hours.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button size="lg" className="h-14 px-8 text-lg" asChild>
                  <Link to="/register">
                    Get Started Free
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg" asChild>
                  <Link to="/about">
                    <Play className="mr-2 h-5 w-5" />
                    Learn More
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Free forever tier
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Setup in 5 minutes
                </div>
              </div>
            </motion.div>

            {/* Right - Dashboard Preview */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative bg-gradient-to-br from-card to-card/80 rounded-2xl border border-border p-6 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />

                {/* Mock Dashboard */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <Activity className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <span className="font-semibold text-foreground">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs text-muted-foreground">Live</span>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {metrics.map((metric, i) => (
                      <motion.div
                        key={i}
                        className="bg-background/50 rounded-xl p-4 border border-border"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <metric.icon className={`h-5 w-5 ${metric.color}`} />
                          <span className="text-xs text-muted-foreground">{metric.label}</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">{metric.value}</div>
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${metric.bg} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${20 + i * 20}%` }}
                            transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Chart Area */}
                  <div className="bg-background/50 rounded-xl p-4 border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-foreground">System Load</span>
                      <span className="text-xs text-muted-foreground">Last 24 hours</span>
                    </div>
                    <div className="flex items-end gap-1 h-24">
                      {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 45, 90, 55, 70, 60].map((h, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 bg-primary/60 rounded-t hover:bg-primary transition-colors"
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.8 + i * 0.05, duration: 0.5 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                className="absolute -top-4 -right-4 bg-card rounded-xl border border-border p-3 shadow-lg"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-foreground font-medium">All Systems Online</span>
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -left-4 bg-card rounded-xl border border-border p-3 shadow-lg"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <span className="text-xs text-foreground">0 Active Alerts</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
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
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="font-display text-4xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need to <span className="text-gradient-primary">Monitor</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed for modern infrastructure monitoring
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
                <p className="text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-b from-background to-card/50">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Get Started in <span className="text-gradient-primary">3 Steps</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              From signup to monitoring in under 5 minutes
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up for free and access your dashboard' },
              { step: '02', title: 'Add Servers', desc: 'Deploy our agent with a single command' },
              { step: '03', title: 'Start Monitoring', desc: 'Get real-time insights and alerts' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="relative text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
              >
                <div className="font-display text-7xl font-bold text-primary/20 mb-4">{item.step}</div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full -ml-8">
                    <ArrowRight className="h-8 w-8 text-primary/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-card border-y border-border">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Loved by <span className="text-gradient-primary">Teams</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              See what our users have to say
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((item, i) => (
              <motion.div
                key={i}
                className="p-8 rounded-2xl bg-background border border-border"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex mb-4">
                  {[...Array(item.rating)].map((_, j) => (
                    <Star key={j} className="h-5 w-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">"{item.quote}"</p>
                <div>
                  <div className="font-semibold text-foreground">{item.author}</div>
                  <div className="text-sm text-muted-foreground">{item.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* FAQ Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Frequently Asked <span className="text-gradient-primary">Questions</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to know about Argus
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-border">
                  <AccordionTrigger className="text-lg font-medium">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
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
              Start your free trial today - no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 px-8 text-lg" asChild>
                <Link to="/register">
                  Get Started Free
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
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                  <Activity className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-display text-xl font-bold">Argus</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Real-time server monitoring for modern infrastructure.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/about" className="block hover:text-primary transition-colors">About</Link>
                <Link to="/faq" className="block hover:text-primary transition-colors">FAQ</Link>
                <a href="#" className="block hover:text-primary transition-colors">Pricing</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/help" className="block hover:text-primary transition-colors">Help Center</Link>
                <a href="#" className="block hover:text-primary transition-colors">Documentation</a>
                <a href="#" className="block hover:text-primary transition-colors">Status</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Account</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/login" className="block hover:text-primary transition-colors">Sign In</Link>
                <Link to="/register" className="block hover:text-primary transition-colors">Create Account</Link>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Argus. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <Link to="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
