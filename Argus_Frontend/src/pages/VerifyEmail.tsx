import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { authApi } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

type VerificationStatus = 'verifying' | 'success' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [message, setMessage] = useState('Verifying your email address...');
  const token = searchParams.get('token');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    let redirectTimer: ReturnType<typeof setTimeout>;

    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        const response = await authApi.verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Email verified successfully! Welcome to Argus!');

        // Redirect to login after 3 seconds
        redirectTimer = setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error: unknown) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to verify email. The link may be invalid or expired.');
      }
    };

    verifyEmail();
    return () => clearTimeout(redirectTimer);
  }, [token, navigate]);

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
              {status === 'verifying' && (
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              )}
              {status === 'success' && (
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              )}
              {status === 'error' && (
                <XCircle className="h-10 w-10 text-red-500" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {status === 'verifying' && 'Verifying Email'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'success' && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Redirecting to login page...</p>
              </div>
            )}
            {status === 'error' && (
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/register')}
                  className="w-full"
                  variant="outline"
                >
                  Back to Registration
                </Button>
                <Button 
                  onClick={() => navigate('/login')} 
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            )}
            <div className="text-center">
              <Link 
                to="/" 
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
