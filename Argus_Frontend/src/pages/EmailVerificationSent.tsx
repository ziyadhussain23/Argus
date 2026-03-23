import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle2, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function EmailVerificationSent() {
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds remaining
  const [resendCount, setResendCount] = useState(0);
  const { toast } = useToast();

  const startCooldown = useCallback((seconds: number) => {
    setCooldown(seconds);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address to resend the verification link.',
        variant: 'destructive',
      });
      return;
    }

    setIsResending(true);
    try {
      const response = await authApi.resendVerification(email);
      toast({
        title: 'Email Sent!',
        description: response.message || 'Verification email has been resent. Please check your inbox.',
      });
      setEmail('');
      const newCount = resendCount + 1;
      setResendCount(newCount);
      // 1st resend: no cooldown, 2nd: 5 min, 3rd+: 15 min
      if (newCount === 1) {
        // no cooldown on first resend
      } else if (newCount === 2) {
        startCooldown(5 * 60);
      } else {
        startCooldown(15 * 60);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to Resend',
        description: error.message || 'Could not resend verification email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-sm bg-background/80">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
              <Mail className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Verification Email Sent!
            </CardTitle>
            <CardDescription className="text-base mt-2">
              We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Check your email</p>
                  <p className="text-muted-foreground">We sent a verification link to your email address.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Click the link</p>
                  <p className="text-muted-foreground">Click the verification link in the email to activate your account.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Start monitoring</p>
                  <p className="text-muted-foreground">Once verified, you can start using Argus to monitor your servers.</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Didn't receive the email? Check your spam folder or resend the verification link.
              </p>
              <form onSubmit={handleResendVerification} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isResending}
                  />
                </div>
                <Button 
                  type="submit"
                  className="w-full" 
                  variant="outline"
                  disabled={isResending || cooldown > 0}
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resending...
                    </>
                  ) : cooldown > 0 ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend available in {formatTime(cooldown)}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
                {cooldown > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-1000 ease-linear"
                        style={{ width: `${(cooldown / (resendCount <= 2 ? 5 * 60 : 15 * 60)) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {resendCount <= 2 ? 'Next resend available in 5 minutes' : 'Next resend available in 15 minutes'}
                    </p>
                  </div>
                )}
              </form>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={() => window.location.href = '/login'} 
                className="w-full"
              >
                Go to Login
              </Button>
              <div className="text-center">
                <Link 
                  to="/" 
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
