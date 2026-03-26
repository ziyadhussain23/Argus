import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Eye, EyeOff, Loader2, Server, Bell, Shield, Zap,
  LineChart, Globe, Clock, Users, ChevronRight, CheckCircle2,
  Cpu, HardDrive, Wifi, BarChart3, ArrowRight, ArrowLeft, Activity
} from 'lucide-react';
import { ArgusLogo, ArgusLogoGlow } from '@/components/ArgusLogo';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';

const features = [
  { icon: Server, title: 'Multi-Server Support', desc: 'Monitor unlimited servers from one dashboard' },
  { icon: Bell, title: 'Smart Alerts', desc: 'Get notified before issues become problems' },
  { icon: Shield, title: 'Enterprise Security', desc: 'Bank-grade encryption for your data' },
  { icon: Zap, title: 'Real-time Updates', desc: 'WebSocket-powered live metrics' },
  { icon: LineChart, title: 'Advanced Analytics', desc: 'Deep insights with historical data' },
  { icon: Globe, title: 'Global Monitoring', desc: 'Monitor from multiple locations' },
];

const stats = [
  { value: '24/7', label: 'Real-Time Monitoring', icon: Clock },
  { value: '∞', label: 'Servers Supported', icon: Server },
  { value: 'Instant', label: 'Alert Delivery', icon: Bell },
  { value: 'Free', label: 'Open Source', icon: Users },
];



const metrics = [
  { icon: Cpu, label: 'CPU Usage', value: '23%', color: 'text-emerald-500' },
  { icon: HardDrive, label: 'Memory', value: '4.2 GB', color: 'text-blue-500' },
  { icon: Wifi, label: 'Network', value: '1.2 Gbps', color: 'text-purple-500' },
  { icon: BarChart3, label: 'Disk I/O', value: '340 MB/s', color: 'text-amber-500' },
];

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateUsername = (value: string) => {
    if (!value.trim()) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 50) return 'Username must be 50 characters or fewer';
    if (!/^[a-zA-Z0-9_.-]+$/.test(value)) return 'Only letters, numbers, underscores, dots, and hyphens allowed';
    return '';
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const uError = validateUsername(username);
    const eError = validateEmail(email);
    setUsernameError(uError);
    setEmailError(eError);
    if (uError || eError) return;

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      toast({
        title: 'Weak password',
        description: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register(username, email, password);
      if (response.success) {
        toast({
          title: 'Account created!',
          description: 'Please check your email for a verification link.',
        });
        navigate('/email-sent');
      }
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Could not create account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Back button */}
      <div className="fixed top-5 left-5 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
          aria-label="Go back to home"
          className="rounded-full bg-background/90 backdrop-blur-md shadow-md gap-2 px-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
      </div>

      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Hero Section with Form */}
      <div className="flex min-h-screen relative">
        {/* Left side - Visual */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center bg-gradient-to-br from-primary/10 via-background to-primary/5 border-r border-border p-16 relative overflow-hidden">
          {/* Animated background orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity }}
            />
          </div>

          <div className="max-w-lg text-center relative z-10">
            <motion.div
              className="mb-6 flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <img src="/illustrations/auth-stack.svg" alt="Technology stack" className="w-56 h-56 rounded-2xl" />
            </motion.div>

            <motion.div
              className="mb-8 flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <ArgusLogoGlow size="lg" showText={false} />
            </motion.div>

            <motion.h2
              className="font-display text-3xl font-bold text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Start Monitoring Today
            </motion.h2>

            <motion.p
              className="mt-4 text-muted-foreground text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Deploy lightweight agents on your servers and get real-time insights into CPU, memory, disk, and network usage.
            </motion.p>

            {/* Live Metrics Preview */}
            <motion.div
              className="mt-8 grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {metrics.map((metric, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border px-4 py-3"
                  whileHover={{ scale: 1.02, borderColor: 'hsl(var(--primary))' }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">{metric.label}</div>
                    <div className="text-sm font-semibold text-foreground">{metric.value}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Feature List */}
            <motion.div
              className="mt-8 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {[
                'Real-time metric collection',
                'Threshold-based alerting',
                'Email notifications',
                'WebSocket live updates',
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-card/50 border border-border px-4 py-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  whileHover={{ x: 5, borderColor: 'hsl(var(--primary))' }}
                >
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">{feature}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16">
          <motion.div
            className="mx-auto w-full max-w-md"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <Link to="/" className="inline-flex">
                <ArgusLogo size="md" />
              </Link>
            </div>

            <h1 className="font-display text-3xl font-bold text-foreground">
              Create an account
            </h1>
            <p className="mt-2 text-muted-foreground">
              Get started with server monitoring in minutes
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); if (usernameError) setUsernameError(validateUsername(e.target.value)); }}
                  required
                  minLength={3}
                  maxLength={50}
                  className={`h-12 ${usernameError ? 'border-destructive' : ''}`}
                />
                {usernameError && <p className="text-xs text-destructive mt-1">{usernameError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(validateEmail(e.target.value)); }}
                  required
                  className={`h-12 ${emailError ? 'border-destructive' : ''}`}
                />
                {emailError && <p className="text-xs text-destructive mt-1">{emailError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {password && (() => {
                  const checks = [
                    { pass: password.length >= 8, label: 'At least 8 characters' },
                    { pass: /[a-z]/.test(password), label: 'Lowercase letter (a-z)' },
                    { pass: /[A-Z]/.test(password), label: 'Uppercase letter (A-Z)' },
                    { pass: /[0-9]/.test(password), label: 'Number (0-9)' },
                    { pass: /[^A-Za-z0-9]/.test(password), label: 'Special character (!@#$...)' },
                  ];
                  const strength = checks.filter(c => c.pass).length;
                  const label = strength <= 2 ? 'Weak' : strength <= 3 ? 'Fair' : strength <= 4 ? 'Good' : 'Strong';
                  const color = strength <= 2 ? 'bg-red-500' : strength <= 3 ? 'bg-amber-500' : strength <= 4 ? 'bg-blue-500' : 'bg-green-500';
                  return (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? color : 'bg-muted'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Password strength: {label}</p>
                      <ul className="space-y-0.5">
                        {checks.map((c, i) => (
                          <li key={i} className={`text-xs flex items-center gap-1.5 ${c.pass ? 'text-green-500' : 'text-muted-foreground'}`}>
                            <span>{c.pass ? '✓' : '○'}</span>{c.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>

            {/* Quick Links */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex justify-center gap-6 text-sm text-muted-foreground">
                <Link to="/about" className="hover:text-primary transition-colors">About</Link>
                <Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link>
                <Link to="/help" className="hover:text-primary transition-colors">Help & Support</Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-background to-card/50 relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
            animate={{
              y: [0, 50, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 15, repeat: Infinity }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Everything You Need to <span className="text-gradient-primary">Monitor</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comprehensive server monitoring with powerful features designed for modern infrastructure
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                className="group p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-card border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring" }}
              >
                <div className="flex justify-center mb-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <div className="font-display text-4xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-b from-card/50 to-background">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Get Started in <span className="text-gradient-primary">3 Simple Steps</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              From signup to monitoring in under 5 minutes
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up for free and access your dashboard instantly' },
              { step: '02', title: 'Add Your Servers', desc: 'Deploy our lightweight agent on your servers with one command' },
              { step: '03', title: 'Start Monitoring', desc: 'Get real-time insights and set up custom alerts' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
              >
                <div className="text-center">
                  <div className="font-display text-6xl font-bold text-primary/20 mb-4">{item.step}</div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full">
                    <ArrowRight className="h-8 w-8 text-primary/30 mx-auto -ml-4" />
                  </div>
                )}
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
              Ready to Take Control of Your Infrastructure?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of developers and DevOps teams who trust Argus for their server monitoring needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 px-8 text-lg" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                Get Started Free
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg" asChild>
                <Link to="/about">Learn More</Link>
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
