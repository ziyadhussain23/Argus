import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, Cookie } from 'lucide-react';
import { ArgusLogo } from '@/components/ArgusLogo';
import { motion } from 'framer-motion';

export default function Cookies() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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

            <main className="pt-24 sm:pt-32 pb-20 container mx-auto px-4 sm:px-6 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-2 text-primary mb-4">
                        <Cookie className="h-5 w-5" />
                        <span className="font-semibold uppercase tracking-wider text-sm">Legal</span>
                    </div>
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-8">
                        Cookie Policy
                    </h1>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground/90">
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            This Cookie Policy explains how Argus uses cookies and similar technologies to recognize you when you visit our website.
                        </p>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. What are Cookies?</h2>
                            <p className="text-muted-foreground">
                                Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Why We Use Cookies</h2>
                            <p className="mb-4">We use cookies for several reasons:</p>
                            <ul className="list-disc pl-4 sm:pl-6 space-y-2 text-muted-foreground">
                                <li><strong>Essential Cookies:</strong> These are strictly necessary for the website to function (e.g., keeping you logged in).</li>
                                <li><strong>Performance Cookies:</strong> These allow us to count visits and traffic sources so we can measure and improve the performance of our site.</li>
                                <li><strong>Functional Cookies:</strong> These enable the website to provide enhanced functionality and personalization.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Your Choices</h2>
                            <p className="text-muted-foreground">
                                You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your browser controls to accept or refuse cookies.
                            </p>
                        </section>

                        <div className="pt-8 text-sm text-muted-foreground">
                            Last updated: {new Date().toLocaleDateString()}
                        </div>
                    </div>
                </motion.div>
            </main>

            <footer className="py-12 bg-card border-t border-border mt-20">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <ArgusLogo size="sm" />
                        </div>
                        <div className="flex gap-8 text-sm text-muted-foreground">
                            <Link to="/about" className="hover:text-primary transition-colors">About</Link>
                            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
                            <Link to="/cookies" className="text-primary font-medium">Cookies</Link>
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
