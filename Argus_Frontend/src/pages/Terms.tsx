import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Activity, ArrowLeft, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Terms() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="h-9 w-9"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <Link to="/" className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                                <Activity className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <span className="font-display text-xl font-bold">Argus</span>
                        </Link>
                    </div>

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

            <main className="pt-32 pb-20 container mx-auto px-6 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-2 text-primary mb-4">
                        <FileText className="h-5 w-5" />
                        <span className="font-semibold uppercase tracking-wider text-sm">Legal</span>
                    </div>
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-8">
                        Terms of Service
                    </h1>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground/90">
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Welcome to Argus. By using our monitoring services, you agree to these Terms of Service.
                        </p>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
                            <p className="text-muted-foreground">
                                By accessing or using the Argus platform, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Description of Service</h2>
                            <p className="text-muted-foreground mb-4">
                                Argus provides server monitoring and alerting services. We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. User Accounts</h2>
                            <p className="text-muted-foreground">
                                You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. You agree not to disclose your password to any third party.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Acceptable Use</h2>
                            <p className="text-muted-foreground">
                                You agree not to misuse the Argus services. For example, you must not interfere with our services or try to access them using a method other than the interface and the instructions that we provide.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Termination</h2>
                            <p className="text-muted-foreground">
                                We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                            </p>
                        </section>

                        <div className="pt-8 text-sm text-muted-foreground">
                            Last updated: {new Date().toLocaleDateString()}
                        </div>
                    </div>
                </motion.div>
            </main>

            <footer className="py-12 bg-card border-t border-border mt-20">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                                <Activity className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <span className="font-display text-xl font-bold">Argus</span>
                        </div>
                        <div className="flex gap-8 text-sm text-muted-foreground">
                            <Link to="/about" className="hover:text-primary transition-colors">About</Link>
                            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                            <Link to="/terms" className="text-primary font-medium">Terms</Link>
                            <Link to="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
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
