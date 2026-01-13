import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
              <Activity className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold">Argus</span>
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to your account to continue monitoring
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center bg-gradient-to-br from-primary/5 via-background to-primary/10 border-l border-border p-16">
        <div className="max-w-lg text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                <Activity className="h-12 w-12 text-primary" />
              </div>
            </div>
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Continuous Monitoring
          </h2>
          <p className="mt-4 text-muted-foreground">
            Real-time server monitoring with intelligent alerting. Keep your infrastructure healthy and your team informed.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {['99.9%', '< 1s', '24/7'].map((stat, i) => (
              <div key={i} className="rounded-lg bg-card/50 border border-border p-4">
                <div className="font-display text-xl font-bold text-primary">{stat}</div>
                <div className="text-xs text-muted-foreground">
                  {i === 0 ? 'Uptime' : i === 1 ? 'Latency' : 'Monitoring'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
