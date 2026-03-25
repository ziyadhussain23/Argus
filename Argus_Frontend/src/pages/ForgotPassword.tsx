import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Activity, Loader2, ArrowLeft, Mail, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [usernameLookup, setUsernameLookup] = useState('');
    const [isLookingUp, setIsLookingUp] = useState(false);
    const { toast } = useToast();

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    });

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleSubmit = async (values: ForgotPasswordFormValues) => {
        if (cooldown > 0) return;
        setIsLoading(true);

        try {
            const response = await authApi.forgotPassword(values.email);
            if (response.success) {
                setIsSubmitted(true);
                setCooldown(60);
                toast({
                    title: 'Email sent',
                    description: 'If an account exists with that email, you will receive reset instructions.',
                });
            }
        } catch (error) {
            toast({
                title: 'Request failed',
                description: error instanceof Error ? error.message : 'Something went wrong',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUsernameLookup = async () => {
        if (!usernameLookup.trim()) return;
        setIsLookingUp(true);
        try {
            const response = await authApi.getUserEmail(usernameLookup.trim());
            if (response.success && response.data) {
                form.setValue('email', response.data);
                toast({ title: 'Email found', description: 'Your email has been filled in.' });
            }
        } catch {
            toast({ title: 'Username not found', description: 'No account found with that username.', variant: 'destructive' });
        } finally {
            setIsLookingUp(false);
        }
    };

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
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                            <Activity className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="font-display text-2xl font-bold">Argus</span>
                    </Link>
                    <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">
                        Forgot password?
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        No worries, we'll send you reset instructions.
                    </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                    {!isSubmitted ? (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email address</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        type="email"
                                                        placeholder="name@example.com"
                                                        className="pl-9"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                                    <p className="text-xs text-muted-foreground">Don't remember your email? Look it up by username:</p>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Enter username"
                                                className="pl-9 h-10"
                                                value={usernameLookup}
                                                onChange={(e) => setUsernameLookup(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUsernameLookup(); } }}
                                            />
                                        </div>
                                        <Button type="button" variant="outline" size="default" onClick={handleUsernameLookup} disabled={isLookingUp || !usernameLookup.trim()}>
                                            {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lookup'}
                                        </Button>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending link...
                                        </>
                                    ) : (
                                        'Reset password'
                                    )}
                                </Button>
                            </form>
                        </Form>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                                <Mail className="h-6 w-6 text-success" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                If an account exists with that email, we've sent a password reset link. Please check your inbox and spam folder.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => { setIsSubmitted(false); }}
                                disabled={cooldown > 0}
                            >
                                {cooldown > 0 ? `Try again in ${cooldown}s` : 'Try another email'}
                            </Button>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to login
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
