import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, Eye, EyeOff, Loader2, Mail, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showVerificationError, setShowVerificationError] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        // Fetch user's email by username
        try {
          const emailResponse = await authApi.getUserEmail(username);
          if (emailResponse.success && emailResponse.data) {
            setUserEmail(emailResponse.data);
          }
        } catch (e) {
          // If we can't get email, user will need to enter it manually
          console.error('Failed to fetch user email:', e);
        }
      } else {
        toast({
          title: 'Login failed',
          description: errorMessage,
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
    <div className="flex min-h-screen relative">
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
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
