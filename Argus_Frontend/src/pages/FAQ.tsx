import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ChevronDown, ChevronRight, HelpCircle,
    Server, CreditCard, Shield, User, Settings, MessageCircle, ArrowLeft
} from 'lucide-react';
import { ArgusLogo } from '@/components/ArgusLogo';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const faqCategories = [
    { id: 'general', label: 'General', icon: HelpCircle },
    { id: 'getting-started', label: 'Getting Started', icon: Server },
    { id: 'pricing', label: 'Pricing & Billing', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'account', label: 'Account', icon: User },
    { id: 'technical', label: 'Technical', icon: Settings },
];

const faqs = [
    {
        category: 'general',
        question: 'What is Argus?',
        answer: 'Argus is a comprehensive server monitoring platform that provides real-time visibility into your infrastructure. It monitors CPU, memory, disk, network, and other critical metrics, alerting you when issues arise before they become problems.'
    },
    {
        category: 'general',
        question: 'Who is Argus designed for?',
        answer: 'Argus is designed for DevOps teams, system administrators, developers, and anyone who needs to monitor server infrastructure. Whether you manage a single server or thousands, Argus scales to meet your needs.'
    },
    {
        category: 'general',
        question: 'How is Argus different from other monitoring tools?',
        answer: 'Argus combines powerful monitoring capabilities with an intuitive interface and intelligent alerting. Our lightweight agents have minimal overhead, and our real-time WebSocket updates ensure you always have current data. Plus, we offer competitive pricing with no hidden fees.'
    },
    {
        category: 'getting-started',
        question: 'How do I get started with Argus?',
        answer: 'Getting started is simple: 1) Create a free account, 2) Add your first server by copying a single command, 3) Our agent will automatically start collecting metrics, and 4) View your dashboard to see real-time data. The entire process takes less than 5 minutes.'
    },
    {
        category: 'getting-started',
        question: 'How do I install the Argus agent?',
        answer: 'After logging in, navigate to "Add Server" and you\'ll receive a simple one-line command. Run this command on your server (Linux, Windows, or macOS), and the agent will automatically install, configure, and start sending metrics.'
    },
    {
        category: 'getting-started',
        question: 'What operating systems are supported?',
        answer: 'Argus supports all major operating systems including Linux (Ubuntu, Debian, CentOS, RHEL, Fedora, etc.), Windows Server (2012 and later), and macOS. Our agents are lightweight and have minimal resource footprint.'
    },
    {
        category: 'getting-started',
        question: 'Can I try Argus for free?',
        answer: 'Yes! We offer a free tier that includes monitoring for up to 3 servers with 7 days of data retention. No credit card required. You can upgrade anytime to unlock more features and servers.'
    },
    {
        category: 'pricing',
        question: 'What pricing plans are available?',
        answer: 'We offer flexible pricing: Free (3 servers, 7-day retention), Pro ($29/month for 20 servers, 30-day retention), and Enterprise (unlimited servers, custom retention, dedicated support). All plans include real-time monitoring and alerting.'
    },
    {
        category: 'pricing',
        question: 'Is there a free trial?',
        answer: 'Yes, all paid plans come with a 14-day free trial. You can try Pro or Enterprise features without entering payment information. If you decide not to continue, you\'ll automatically be moved to the free tier.'
    },
    {
        category: 'pricing',
        question: 'Can I change my plan anytime?',
        answer: 'Absolutely! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll be prorated for the remaining billing period. When downgrading, changes take effect at the start of your next billing cycle.'
    },
    {
        category: 'pricing',
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, and bank transfers for annual Enterprise plans. All payments are processed securely through Stripe.'
    },
    {
        category: 'security',
        question: 'How secure is my data with Argus?',
        answer: 'Security is our top priority. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We use SOC 2 compliant infrastructure, implement role-based access control, and maintain detailed audit logs. We never share your data with third parties.'
    },
    {
        category: 'security',
        question: 'Where is my data stored?',
        answer: 'Your data is stored in secure, SOC 2 compliant data centers. We offer data residency options for Enterprise customers who need to keep data in specific geographic regions (US, EU, or Asia-Pacific).'
    },
    {
        category: 'security',
        question: 'Does Argus have access to my server data?',
        answer: 'Our agents only collect system metrics (CPU, memory, disk, network). We do not access your application data, files, or any sensitive information. The agent is open-source, so you can review exactly what data is collected.'
    },
    {
        category: 'account',
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page, enter your email address, and we\'ll send you a secure reset link. The link expires after 24 hours for security. You can also reset your password from Account Settings when logged in.'
    },
    {
        category: 'account',
        question: 'Can I add team members to my account?',
        answer: 'Yes! Pro and Enterprise plans support multiple team members. You can invite users with different roles: Admin (full access), Editor (can add/modify servers and alerts), or Viewer (read-only access).'
    },
    {
        category: 'account',
        question: 'How do I delete my account?',
        answer: 'You can delete your account from Settings > Account > Delete Account. This will permanently remove all your data, including servers, metrics, and alert history. Please export any data you need before deletion, as this action cannot be undone.'
    },
    {
        category: 'technical',
        question: 'What metrics does Argus monitor?',
        answer: 'Argus monitors: CPU usage (per-core and aggregate), Memory (used, available, cached), Disk (usage, I/O rates, latency), Network (bandwidth, packets, errors), Processes (top consumers), and System (uptime, load average). Custom metrics can be added via our API.'
    },
    {
        category: 'technical',
        question: 'How often are metrics collected?',
        answer: 'Metrics are collected every 10 seconds by default. Pro and Enterprise users can configure collection intervals from 1 second to 5 minutes based on their needs. More frequent collection provides better resolution for debugging.'
    },
    {
        category: 'technical',
        question: 'Can I set up custom alerts?',
        answer: 'Yes! You can create custom alert rules based on any metric. Set thresholds (e.g., CPU > 90%), configure notification channels (email, Slack, webhooks), and define escalation policies. Alerts can be customized per server or applied globally.'
    },
    {
        category: 'technical',
        question: 'Does Argus have an API?',
        answer: 'Yes, we provide a comprehensive REST API for all platform features. You can programmatically add servers, query metrics, manage alerts, and integrate with your existing tools. API documentation is available in your dashboard.'
    },
    {
        category: 'technical',
        question: 'How much system resource does the agent use?',
        answer: 'Our agent is designed to be extremely lightweight: typically less than 1% CPU usage and under 50MB of memory. The agent is written in Go for optimal performance and minimal footprint, ensuring it won\'t impact your server performance.'
    },
];

export default function FAQ() {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [openQuestions, setOpenQuestions] = useState<string[]>([]);

    const filteredFaqs = faqs.filter(faq => {
        const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
        const matchesSearch = searchQuery === '' ||
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const toggleQuestion = (question: string) => {
        setOpenQuestions(prev =>
            prev.includes(question)
                ? prev.filter(q => q !== question)
                : [...prev, question]
        );
    };

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

                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</Link>
                        <Link to="/faq" className="text-sm font-medium text-primary">FAQ</Link>
                        <Link to="/help" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Help & Support</Link>
                    </nav>

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

            {/* Hero Section */}
            <section className="pt-32 pb-16 relative overflow-hidden">
                <div className="absolute inset-0">
                    <motion.div
                        className="absolute top-20 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 10, repeat: Infinity }}
                    />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        className="max-w-3xl mx-auto text-center"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <motion.div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <HelpCircle className="h-4 w-4" />
                            Frequently Asked Questions
                        </motion.div>

                        <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground mb-6">
                            Got <span className="text-gradient-primary">Questions</span>?
                        </h1>

                        <p className="text-xl text-muted-foreground mb-8">
                            Find answers to common questions about Argus, pricing, features, and more.
                        </p>

                        {/* Search */}
                        <div className="relative max-w-xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search for answers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-14 pl-12 pr-4 text-lg rounded-xl"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FAQ Content */}
            <section className="py-16">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-4 gap-8">
                        {/* Categories Sidebar */}
                        <motion.div
                            className="lg:col-span-1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="sticky top-24 bg-card rounded-2xl border border-border p-4">
                                <h3 className="font-semibold text-foreground mb-4 px-2">Categories</h3>
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setActiveCategory('all')}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${activeCategory === 'all'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                    >
                                        <HelpCircle className="h-4 w-4" />
                                        <span className="text-sm font-medium">All Questions</span>
                                    </button>
                                    {faqCategories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${activeCategory === cat.id
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                }`}
                                        >
                                            <cat.icon className="h-4 w-4" />
                                            <span className="text-sm font-medium">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* FAQ List */}
                        <div className="lg:col-span-3">
                            <motion.div
                                className="space-y-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {filteredFaqs.length === 0 ? (
                                    <div className="text-center py-16">
                                        <HelpCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
                                        <p className="text-muted-foreground">
                                            Try adjusting your search or browse a different category
                                        </p>
                                    </div>
                                ) : (
                                    filteredFaqs.map((faq, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <Collapsible
                                              open={openQuestions.includes(faq.question)}
                                              onOpenChange={() => toggleQuestion(faq.question)}
                                            >
                                              <div className="bg-card rounded-xl border border-border overflow-hidden">
                                                <CollapsibleTrigger className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/50 transition-colors">
                                                    <span className="font-semibold text-foreground pr-4">{faq.question}</span>
                                                    <motion.div
                                                        animate={{ rotate: openQuestions.includes(faq.question) ? 180 : 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                    </motion.div>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <div className="px-6 pb-6 pt-0">
                                                        <div className="pt-4 border-t border-border">
                                                            <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                                                        </div>
                                                    </div>
                                                </CollapsibleContent>
                                              </div>
                                            </Collapsible>
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Still Have Questions CTA */}
            <section className="py-24 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-t border-border">
                <div className="container mx-auto px-6">
                    <motion.div
                        className="max-w-3xl mx-auto text-center"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex justify-center mb-6">
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <MessageCircle className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                            Still Have Questions?
                        </h2>
                        <p className="text-muted-foreground text-lg mb-8">
                            Can't find the answer you're looking for? Our support team is here to help.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" className="h-14 px-8 text-lg" asChild>
                                <Link to="/help">
                                    Contact Support
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg" asChild>
                                <Link to="/register">Get Started Free</Link>
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
                            <Link to="/login" className="hover:text-primary transition-colors">Login</Link>
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
