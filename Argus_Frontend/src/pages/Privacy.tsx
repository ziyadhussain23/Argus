import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, Shield } from 'lucide-react';
import { ArgusLogo } from '@/components/ArgusLogo';
import { motion } from 'framer-motion';

export default function Privacy() {
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
                            <ArgusLogo size="sm" />
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
                        <Shield className="h-5 w-5" />
                        <span className="font-semibold uppercase tracking-wider text-sm">Legal</span>
                    </div>
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-8">
                        Privacy Policy
                    </h1>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground/90">
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            At Argus, we take your privacy seriously. This policy describes how we collect, use, and protect your personal data.
                        </p>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Information We Collect</h2>
                            <p className="mb-4">We collect information you provide directly to us, including:</p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Account information (name, email, password)</li>
                                <li>Server usage data and metrics</li>
                                <li>Payment information (processed securely by our payment providers)</li>
                                <li>Communications you send to us</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. How We Use Your Data</h2>
                            <p className="mb-4">We use your data to:</p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Provide and maintain our monitoring services</li>
                                <li>Send you alerts and notifications</li>
                                <li>Analyze usage patterns to improve our product</li>
                                <li>Comply with legal obligations</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Data Security</h2>
                            <p className="text-muted-foreground">
                                We implement appropriate technical and organizational measures to protect specific data against unauthorized access, modification, or destruction. We use industry-standard encryption for data in transit and at rest.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Contact Us</h2>
                            <p className="text-muted-foreground">
                                If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@argus.com" className="text-primary hover:underline">privacy@argus.com</a>.
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
                            <ArgusLogo size="sm" />
                        </div>
                        <div className="flex gap-8 text-sm text-muted-foreground">
                            <Link to="/about" className="hover:text-primary transition-colors">About</Link>
                            <Link to="/privacy" className="text-primary font-medium">Privacy</Link>
                            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
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
