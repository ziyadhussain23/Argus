import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  Activity, Server, Bell, Shield, Zap, LineChart, ChevronRight,
  CheckCircle2, Cpu, HardDrive, Wifi, BarChart3, ArrowRight,
  Play, Clock, Globe, Book, Code, Terminal, AlertTriangle
} from 'lucide-react';
import { ArgusLogo } from '@/components/ArgusLogo';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const features = [
  { icon: Server, title: 'Multi-Server Monitoring', desc: 'Monitor all your servers from a single dashboard' },
  { icon: Bell, title: 'Intelligent Alerts', desc: 'Get notified before issues become problems' },
  { icon: Zap, title: 'Real-Time Updates', desc: 'Live metrics with WebSocket technology' },
  { icon: LineChart, title: 'Historical Data', desc: 'Analyze trends with historical analytics' },
  { icon: Shield, title: 'Enterprise Security', desc: 'Bank-grade encryption for your data' },
  { icon: Globe, title: '24/7 Monitoring', desc: 'Around the clock infrastructure visibility' },
];

const stats = [
  { value: 'Real-Time', label: 'Monitoring', icon: Clock },
  { value: 'Multi', label: 'Server Support', icon: Server },
  { value: 'WebSocket', label: 'Live Updates', icon: Zap },
  { value: 'Open', label: 'Source', icon: Code },
];

const metrics = [
  { icon: Cpu, label: 'CPU', value: '23%', color: 'text-emerald-500', bg: 'bg-emerald-500' },
  { icon: HardDrive, label: 'Memory', value: '4.2GB', color: 'text-blue-500', bg: 'bg-blue-500' },
  { icon: Wifi, label: 'Network', value: '1.2Gbps', color: 'text-purple-500', bg: 'bg-purple-500' },
  { icon: BarChart3, label: 'Disk I/O', value: '340MB/s', color: 'text-amber-500', bg: 'bg-amber-500' },
];

const faqs = [
  { q: "What is Argus?", a: "Argus is a real-time server monitoring system built with Spring Boot and React. It collects CPU, Memory, Disk, and Network metrics via a lightweight agent." },
  { q: "How do I install the agent?", a: "Run the PowerShell or Bash agent script on your server with the agent key from the dashboard. It starts sending metrics immediately." },
  { q: "What technologies does Argus use?", a: "Backend: Spring Boot, MySQL, Redis, WebSocket (STOMP/SockJS). Frontend: React, TypeScript, Tailwind CSS, shadcn/ui, Recharts." },
  { q: "Can I set custom alert rules?", a: "Yes, you can configure alert rules for CPU, Memory, Disk, and Network thresholds with email notifications." },
];

const STARS = Array.from({ length: 20 }, () => ({
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  size: `${Math.random() * 2 + 1}px`,
  duration: Math.random() * 3 + 2,
  delay: Math.random() * 2,
}));

const DIAMONDS = Array.from({ length: 10 }, () => ({
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  size: `${Math.random() * 10 + 5}px`,
  duration: Math.random() * 5 + 5,
  delay: Math.random() * 2,
}));

export default function Index() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <ArgusLogo size="sm" />
          </Link>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Product</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-4 w-[300px]">
                    <NavigationMenuLink asChild>
                      <Link to="/about" className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                        <div className="text-sm font-medium">About</div>
                        <p className="text-xs text-muted-foreground mt-1">Learn about Argus monitoring</p>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link to="/docs" className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                        <div className="text-sm font-medium">Documentation</div>
                        <p className="text-xs text-muted-foreground mt-1">Technical guides and API docs</p>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Support</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-4 w-[300px]">
                    <NavigationMenuLink asChild>
                      <Link to="/faq" className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                        <div className="text-sm font-medium">FAQ</div>
                        <p className="text-xs text-muted-foreground mt-1">Frequently asked questions</p>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link to="/help" className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                        <div className="text-sm font-medium">Help & Support</div>
                        <p className="text-xs text-muted-foreground mt-1">Get assistance with Argus</p>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-24 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          {/* Blobs */}
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

          {/* Stars (Twinkling Dots) */}
          {STARS.map((star, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute bg-white rounded-full"
              style={{
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
              }}
              animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
              transition={{ duration: star.duration, repeat: Infinity, delay: star.delay }}
            />
          ))}

          {/* Diamonds (Floating Squares) */}
          {DIAMONDS.map((diamond, i) => (
            <motion.div
              key={`diamond-${i}`}
              className="absolute border border-primary/20 rotate-45"
              style={{
                top: diamond.top,
                left: diamond.left,
                width: diamond.size,
                height: diamond.size,
              }}
              animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3], rotate: [45, 90, 45] }}
              transition={{ duration: diamond.duration, repeat: Infinity, delay: diamond.delay }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
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

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
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
                      <span className="text-xs text-muted-foreground">Demo Preview</span>
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
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
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

      {/* THREE CORE FEATURES (Project Related Animations) - NEW ADDITION */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-24"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Core <span className="text-gradient-primary">Technology</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Advanced features built directly into the Argus platform.
            </p>
          </motion.div>

          {/* Feature 1: Real-time Data Ingestion */}
          <div className="flex flex-col lg:flex-row items-center gap-16 mb-32">
            <motion.div
              className="lg:w-1/2"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 mb-6">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="text-3xl font-bold mb-4">High-Frequency Data Ingestion</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Our agent collects metrics every second and streams them via secure WebSockets. No polling, no delays.
                Watch your data arrive instantly from anywhere in the world.
              </p>
              <ul className="space-y-3">
                {['Sub-second latency', 'Secure socket connection', 'Automatic compression'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-foreground/80">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" /> {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="lg:w-1/2 w-full"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              {/* Animation: Data Stream */}
              <div className="bg-[#020617] rounded-3xl p-8 shadow-2xl relative overflow-hidden h-[300px] flex items-center justify-between px-16 group/card">

                {/* Premium Gradient Border */}
                <div className="absolute inset-0 rounded-3xl border border-white/5 group-hover/card:border-white/10 transition-colors pointer-events-none" />
                <div className="absolute inset-0 rounded-3xl border border-blue-500/20 opacity-50 mix-blend-overlay" />

                {/* Background Grid/Noise */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/5 to-amber-500/5 opacity-20" />

                {/* Left: Source Servers */}
                <div className="relative z-10 flex flex-col gap-6">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="relative group">
                      <div className="h-10 w-10 rounded-xl bg-[#0f172a] border border-blue-500/20 flex items-center justify-center shadow-lg group-hover:border-emerald-500/50 group-hover:shadow-emerald-500/20 transition-all duration-500">
                        <Server className="h-5 w-5 text-blue-400 group-hover:text-emerald-400 transition-colors" />
                      </div>
                      {/* Particles - Matches Flow */}
                      <motion.div
                        className="absolute left-full top-1/2 h-2 w-2 rounded-full bg-gradient-to-r from-blue-400 to-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]"
                        style={{ y: '-50%' }}
                        animate={{
                          x: [0, 240],
                          opacity: [0, 1, 1, 0],
                          scale: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.4,
                          ease: "easeInOut"
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Right: Destination Pulse (Logo) */}
                <div className="relative z-10">
                  {/* Core Circle: Dark BG + Coffee Border (Amber) */}
                  <div className="h-24 w-24 rounded-full bg-[#0f172a] border border-amber-500/40 flex items-center justify-center relative shadow-[0_0_30px_rgba(245,158,11,0.15)]">

                    {/* Inner Icon: BLUE (Inside part) */}
                    <Activity className="h-8 w-8 text-blue-400" />
                    <Activity className="absolute h-8 w-8 text-blue-400/40 blur-sm" />

                    {/* Pulse Rings - COFFEE COLOR (Amber) */}
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border border-amber-500/30"
                        animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, delay: i * 1 }}
                      />
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>

          {/* Feature 2: Agent CLI */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16 mb-32">
            <motion.div
              className="lg:w-1/2"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-6">
                <Terminal className="h-7 w-7" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Single Command Deployment</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Forget complex configuration files. Just copy our one-line command and paste it into your terminal.
                The Argus Agent auto-detects your OS and sets everything up.
              </p>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm text-foreground mb-6">
                curl -sL https://argus.sh/install | bash
              </div>
            </motion.div>

            <motion.div
              className="lg:w-1/2 w-full"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              {/* Animation: Terminal */}
              <div className="bg-[#020617] rounded-3xl overflow-hidden shadow-2xl relative border border-emerald-500/10 font-mono text-sm h-[320px] group/terminal">

                {/* Premium Gradient Border & Effects */}
                <div className="absolute inset-0 rounded-3xl border border-white/5 group-hover/terminal:border-white/10 transition-colors pointer-events-none z-20" />
                <div className="absolute inset-0 rounded-3xl border border-emerald-500/20 opacity-50 mix-blend-overlay z-10" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-20 pointer-events-none" />

                <div className="bg-[#0f172a]/80 backdrop-blur-md px-6 py-4 flex items-center gap-2 border-b border-white/5 relative z-30">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-gray-400 text-xs">root@server:~</span>
                </div>
                <div className="p-6 text-gray-300 min-h-[250px]">
                  <div className="flex gap-2 mb-4">
                    <span className="text-green-500">➜</span>
                    <span className="text-blue-400">~</span>
                    <span>curl -sL https://argus.sh/install | bash</span>
                  </div>
                  <div className="space-y-1">
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.5 }}>[INFO] Argus Agent Installer v1.2.0</motion.div>
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.0 }}>[INFO] Detecting OS... Linux (Ubuntu 22.04 LTS)</motion.div>
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.5 }}>[INFO] Downloading agent binary...</motion.div>
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 2.2 }} className="text-emerald-500">[SUCCESS] Agent installed successfully!</motion.div>
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 2.8 }} className="text-blue-400">[INFO] Connection established to wss://api.argus.com</motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 3.5 }}
                      className="animate-pulse"
                    >
                      _
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Feature 3: Smart Alerting */}
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              className="lg:w-1/2"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-6">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Intelligent Thresholds</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Define custom rules for any metric. Argus monitors values in real-time and triggers instant notifications
                via Email, Slack, or Webhook when thresholds are breached.
              </p>
              <Link to="/register">
                <Button variant="outline" className="group">
                  Configure Alerts <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              className="lg:w-1/2 w-full"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              {/* Animation: Chart Spiking */}
              <div className="bg-[#020617] border border-red-500/10 rounded-3xl p-8 shadow-2xl shadow-red-500/5 relative overflow-hidden h-[340px] group/chart">

                {/* Premium Gradient Border & Effects */}
                <div className="absolute inset-0 rounded-3xl border border-white/5 group-hover/chart:border-white/10 transition-colors pointer-events-none" />
                <div className="absolute inset-0 rounded-3xl border border-red-500/20 opacity-50 mix-blend-overlay" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-bl from-red-500/5 via-transparent to-red-500/5 opacity-20" />

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-8">
                    <div className="font-semibold text-foreground">CPU Usage</div>
                    <div className="text-xs text-muted-foreground">Live Feed</div>
                  </div>
                  <div className="h-40 flex items-end justify-between gap-1 relative overflow-hidden">
                    {/* Threshold Line */}
                    <div className="absolute top-10 left-0 right-0 border-t border-dashed border-red-500/50 flex justify-end">
                      <span className="text-xs text-red-500 bg-card px-1 -mt-2.5">80% Limit</span>
                    </div>

                    {[30, 35, 32, 40, 38, 45, 42, 50, 48, 55, 60, 75, 85, 92, 95, 90].map((h, i) => (
                      <motion.div
                        key={i}
                        className={`w-full rounded-t-sm ${h > 80 ? 'bg-red-500' : 'bg-primary/50'}`}
                        initial={{ height: '10%' }}
                        whileInView={{ height: `${h}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                      />
                    ))}
                  </div>

                  {/* Alert Toast Popup Animation */}
                  <motion.div
                    className="bg-red-500 rounded-lg p-3 mt-4 flex items-center gap-3 text-white shadow-lg"
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.5, type: 'spring' }}
                  >
                    <AlertTriangle className="h-5 w-5 fill-white text-red-600" />
                    <div className="flex-1">
                      <div className="font-bold text-sm">Critical Alert Triggered</div>
                      <div className="text-xs text-red-100">CPU Usage &gt; 80% on Server-01</div>
                    </div>
                    <div className="text-xs bg-white/20 px-2 py-1 rounded">Now</div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6">
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 hidden lg:grid">
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

          {/* Carousel for smaller screens */}
          <div className="lg:hidden">
            <Carousel opts={{ align: 'start', loop: true }} className="w-full">
              <CarouselContent>
                {features.map((feature, i) => (
                  <CarouselItem key={i} className="md:basis-1/2">
                    <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 h-full">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <feature.icon className="h-7 w-7" />
                      </div>
                      <h3 className="font-display text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.desc}</p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-b from-background to-card/50">
        <div className="container mx-auto px-4 sm:px-6">
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
              { step: '01', title: 'Create Account', desc: 'Sign up for free and access your dashboard', img: '/illustrations/step-signup.svg' },
              { step: '02', title: 'Add Servers', desc: 'Deploy our agent with a single command', img: '/illustrations/step-add-server.svg' },
              { step: '03', title: 'Start Monitoring', desc: 'Get real-time insights and alerts', img: '/illustrations/step-metrics.svg' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="relative text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
              >
                <img src={item.img} alt={item.title} className="mx-auto w-40 h-40 mb-4 rounded-xl opacity-90" />
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

      {/* Tech Stack */}
      <section className="py-24 bg-card border-y border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Built With Modern <span className="text-gradient-primary">Tech Stack</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Reliable technologies powering Argus
            </p>
          </motion.div>

          {/* Architecture Flow Illustration */}
          <motion.div
            className="mb-12 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <img src="/illustrations/architecture-flow.svg" alt="Argus architecture flow" className="w-full max-w-3xl rounded-2xl border border-border/50" />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Spring Boot + Java', desc: 'Robust backend with REST APIs, JWT auth, and WebSocket support for real-time data.' },
              { title: 'React + TypeScript', desc: 'Modern frontend with Tailwind CSS, shadcn/ui components, and Recharts for live graphs.' },
              { title: 'MySQL + Redis', desc: 'Persistent storage for metrics and users, with Redis caching for fast performance.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="p-8 rounded-2xl bg-background border border-border"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <h3 className="font-semibold text-foreground text-lg mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
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
        <div className="container mx-auto px-4 sm:px-6">
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

      {/* Developer Resources Section */}
      <section className="py-24 bg-card border-t border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Built for <span className="text-gradient-primary">Developers</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comprehensive documentation and tools to help you build faster
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <Link to="/help" className="group relative overflow-hidden rounded-2xl bg-background border border-border hover:border-primary/50 transition-all p-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
              <div className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 mb-6">
                  <Book className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">Quick Start Guide</h3>
                <p className="text-muted-foreground mb-6">
                  Get up and running with Argus in less than 5 minutes. Step-by-step setup guides for all platforms.
                </p>
                <div className="flex items-center text-primary font-medium group-hover:translate-x-1 transition-transform">
                  Start Building <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </Link>

            <Link to="/help" className="group relative overflow-hidden rounded-2xl bg-background border border-border hover:border-primary/50 transition-all p-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
              <div className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 mb-6">
                  <Code className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">API Reference</h3>
                <p className="text-muted-foreground mb-6">
                  Complete REST API documentation with examples, authentication details, and interactive endpoints.
                </p>
                <div className="flex items-center text-primary font-medium group-hover:translate-x-1 transition-transform">
                  Explore API <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </Link>

            <Link to="/help" className="group relative overflow-hidden rounded-2xl bg-background border border-border hover:border-primary/50 transition-all p-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
              <div className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500 mb-6">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">Security & Compliance</h3>
                <p className="text-muted-foreground mb-6">
                  Learn about our enterprise-grade security, data encryption, and compliance standards.
                </p>
                <div className="flex items-center text-primary font-medium group-hover:translate-x-1 transition-transform">
                  View Security <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <ArgusLogo size="sm" />
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
                <Link to="/help" className="block hover:text-primary transition-colors">Documentation</Link>
                <Link to="/status" className="block hover:text-primary transition-colors">Status</Link>
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
              <Link to="/about" className="hover:text-primary transition-colors">Privacy</Link>
              <Link to="/about" className="hover:text-primary transition-colors">Terms</Link>
              <Link to="/about" className="hover:text-primary transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
