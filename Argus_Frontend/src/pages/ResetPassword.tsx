import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Loader2, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import { ArgusLogo } from '@/components/ArgusLogo';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';

const resetPasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const navigate = useNavigate();
    const { toast } = useToast();

    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { password: '', confirmPassword: '' },
    });

    const handleSubmit = async (values: ResetPasswordFormValues) => {
        if (!token) {
            toast({
                title: 'Missing token',
                description: 'Invalid reset link. Please try requesting a new one.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await authApi.resetPassword(token, values.password);
            if (response.success) {
                setIsSuccess(true);
                toast({
                    title: 'Password reset successful',
                    description: 'You can now login with your new password.',
                });
                setTimeout(() => navigate('/login'), 3000);
            }
        } catch (error) {
            toast({
                title: 'Reset failed',
                description: error instanceof Error ? error.message : 'Something went wrong',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold">Invalid Link</h2>
                    <p className="text-muted-foreground">This password reset link is invalid or missing.</p>
                    <Button asChild>
                        <Link to="/forgot-password">Request new link</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-background flex flex-col items-center justify-center p-4">
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            <motion.div
                className="w-full max-w-md space-y-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="text-center">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
                        <ArgusLogo size="md" />
                    </Link>
                    <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">
                        {isSuccess ? 'Password reset!' : 'Set new password'}
                    </h2>
                    {!isSuccess && (
                        <p className="mt-2 text-sm text-muted-foreground">
                            Your new password must be different from previously used passwords.
                        </p>
                    )}
                </div>

                <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                    {isSuccess ? (
                        <div className="text-center space-y-6">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                                <CheckCircle2 className="h-8 w-8 text-success" />
                            </div>
                            <p className="text-muted-foreground">
                                Your password has been successfully reset. Redirecting to login...
                            </p>
                            <Button asChild className="w-full">
                                <Link to="/login">Back to Login</Link>
                            </Button>
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder="Minimum 8 characters"
                                                        className="pl-9 pr-10"
                                                        {...field}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder="Confirm new password"
                                                        className="pl-9"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Resetting password...
                                        </>
                                    ) : (
                                        'Reset password'
                                    )}
                                </Button>
                            </form>
                        </Form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
