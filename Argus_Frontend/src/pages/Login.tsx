import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Eye, EyeOff, Loader2, Server, Bell, Shield, Zap,
  CheckCircle2, ChevronRight, Cpu, HardDrive, Wifi, BarChart3,
  Mail, AlertCircle, ArrowLeft, Activity
} from 'lucide-react';
import { ArgusLogo, ArgusLogoGlow } from '@/components/ArgusLogo';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';

const features = [
  { icon: Server, text: 'Multi-server monitoring' },
  { icon: Bell, text: 'Intelligent alerting' },
  { icon: Zap, text: 'Real-time updates' },
  { icon: Shield, text: 'Enterprise security' },
];



const metrics = [
  { icon: Cpu, label: 'CPU', value: '23%', color: 'text-emerald-500' },
  { icon: HardDrive, label: 'RAM', value: '4.2GB', color: 'text-blue-500' },
  { icon: Wifi, label: 'Net', value: '1.2Gbps', color: 'text-purple-500' },
  { icon: BarChart3, label: 'I/O', value: '340MB/s', color: 'text-amber-500' },
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showVerificationError, setShowVerificationError] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateUsername = (value: string) => {
    const v = value.trim();
    if (!v) return 'Email or username is required';

    // If it looks like an email, validate as email.
    if (v.includes('@')) {
      if (v.length > 254) return 'Email must be 254 characters or fewer';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please enter a valid email address';
      return '';
    }

    // Otherwise validate as username.
    if (v.length < 3) return 'Username must be at least 3 characters';
    if (v.length > 50) return 'Username must be 50 characters or fewer';
    if (!/^[a-zA-Z0-9_.-]+$/.test(v)) return 'Username can only contain letters, numbers, underscores, dots, and hyphens';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const uError = validateUsername(username);
    setUsernameError(uError);
    if (uError) return;

    setIsLoading(true);
    setShowVerificationError(false);

    try {
      const response = await authApi.login(username, password);
      if (response.success && response.data) {
        login(response.data.token, response.data.user);
        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in to Argus.',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid credentials';
      
      // Check if error is about email verification
      if (errorMessage.toLowerCase().includes('email not verified') || 
          errorMessage.toLowerCase().includes('verify your email')) {
        setShowVerificationError(true);
      } else {
        toast({
          title: 'Login failed',
          description: 'Invalid email/username or password.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail && !username) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address to resend verification.',
        variant: 'destructive',
      });
      return;
    }

    setIsResending(true);
    try {
      // If we have email use it, otherwise try username (user might use email as username)
      const emailToUse = userEmail || username;
      await authApi.resendVerification(emailToUse);
      toast({
        title: 'Verification Email Sent',
        description: 'Please check your inbox for the verification link.',
      });
      setShowVerificationError(false);
    } catch (error) {
      toast({
        title: 'Failed to Resend',
        description: error instanceof Error ? error.message : 'Could not resend verification email.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
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

      {/* Main Login Section */}
      <div className="flex min-h-screen relative">
        {/* Left side - Form */}
        <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16">
          <motion.div
            className="mx-auto w-full max-w-md"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <Link to="/" className="inline-flex">
                <ArgusLogo size="md" />
              </Link>
            </div>

            <h1 className="font-display text-3xl font-bold text-foreground">
              Welcome back
            </h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to your account to continue monitoring
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {showVerificationError && (
                <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <AlertDescription className="text-orange-800 dark:text-orange-300">
                    <div className="space-y-3">
                      <p className="font-medium">Email Not Verified</p>
                      <p className="text-sm">Your email address needs to be verified before you can log in.</p>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="h-9 text-sm"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleResendVerification}
                          disabled={isResending}
                          className="whitespace-nowrap"
                        >
                          {isResending ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="mr-2 h-3 w-3" />
                              Resend
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Email or Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your email or username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); if (usernameError) setUsernameError(validateUsername(e.target.value)); }}
                  required
                  minLength={3}
                  maxLength={254}
                  className={`h-12 ${usernameError ? 'border-destructive' : ''}`}
                />
                {usernameError && <p className="text-xs text-destructive mt-1">{usernameError}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
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
              </div>

              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Create account
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

        {/* Right side - Visual */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center bg-gradient-to-br from-primary/5 via-background to-primary/10 border-l border-border p-16 relative overflow-hidden">
          {/* Animated background orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-20 left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity }}
            />
          </div>

          <motion.div
            className="max-w-lg text-center relative z-10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Engineer Illustration */}
            <motion.div
              className="mb-6 flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <img src="/illustrations/auth-engineer.svg" alt="Engineer monitoring" className="w-56 h-56 rounded-2xl" />
            </motion.div>

            {/* Logo & Title */}
            <motion.div
              className="mb-8 flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <ArgusLogoGlow size="lg" showText={false} />
            </motion.div>

            <h2 className="font-display text-3xl font-bold text-foreground mb-2">
              Continuous Monitoring
            </h2>
            <p className="text-muted-foreground mb-8">
              Real-time server monitoring with intelligent alerting. Keep your infrastructure healthy.
            </p>

            {/* Stats Grid */}
            <motion.div
              className="grid grid-cols-3 gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {['99.9%', '< 1s', '24/7'].map((stat, i) => (
                <div key={i} className="rounded-xl bg-card/80 backdrop-blur-sm border border-border p-4">
                  <div className="font-display text-2xl font-bold text-primary">{stat}</div>
                  <div className="text-xs text-muted-foreground">
                    {i === 0 ? 'Uptime' : i === 1 ? 'Latency' : 'Monitoring'}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Live Metrics Preview */}
            <motion.div
              className="grid grid-cols-2 gap-3 mb-8"
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

            {/* Features List */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-card/50 border border-border px-4 py-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  whileHover={{ x: 5, borderColor: 'hsl(var(--primary))' }}
                >
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>



            {/* Trust Badge */}
            <motion.div
              className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>99.99% Uptime</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Additional Content Below Login */}
      <section className="py-24 bg-gradient-to-b from-background to-card/50">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Why Choose <span className="text-gradient-primary">Argus</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join thousands of teams who trust Argus for their server monitoring needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Server, title: 'Unlimited Servers', desc: 'Monitor as many servers as you need' },
              { icon: Bell, title: 'Smart Alerts', desc: 'Get notified before problems occur' },
              { icon: Zap, title: 'Real-Time Data', desc: 'Live metrics with WebSocket updates' },
              { icon: Shield, title: 'Enterprise Security', desc: 'Bank-grade encryption for your data' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
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
            <h2 className="font-display text-4xl font-bold text-foreground mb-6">
              New to Argus?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Create your free account in minutes and start monitoring your infrastructure today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 px-8 text-lg" asChild>
                <Link to="/register">
                  Create Free Account
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
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
              <Link to="/register" className="hover:text-primary transition-colors">Register</Link>
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
