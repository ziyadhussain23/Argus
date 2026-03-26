import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import {
    Mail, MessageCircle, FileText, Users, ChevronRight,
    Send, Loader2, Book, Wrench, Zap, Clock, CheckCircle2,
    ExternalLink, Phone, MapPin, Globe, ArrowLeft
} from 'lucide-react';
import { ArgusLogo } from '@/components/ArgusLogo';

const supportOptions = [
    {
        icon: Mail,
        title: 'Email Support',
        desc: 'Get help via email with 24-48 hour response time',
        action: 'support@argus.io',
        buttonText: 'Send Email',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
    {
        icon: MessageCircle,
        title: 'Live Chat',
        desc: 'Chat with our team for immediate assistance',
        action: 'Available 9AM-6PM EST',
        buttonText: 'Start Chat',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
    },
    {
        icon: FileText,
        title: 'Documentation',
        desc: 'Browse our comprehensive guides and tutorials',
        action: 'docs.argus.io',
        buttonText: 'View Docs',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
    },
    {
        icon: Users,
        title: 'Community',
        desc: 'Join our community forum for discussions',
        action: 'community.argus.io',
        buttonText: 'Join Now',
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
    },
];

const quickLinks = [
    { icon: Book, title: 'Getting Started Guide', desc: 'Learn the basics in 5 minutes', path: '/about' },
    { icon: Wrench, title: 'Troubleshooting', desc: 'Common issues and solutions', path: '/faq' },
    { icon: Zap, title: 'API Documentation', desc: 'Integrate with your tools', path: '/about' },
    { icon: Globe, title: 'Status Page', desc: 'Check system status', path: '/status' },
];

const contactInfo = [
    { icon: Mail, label: 'Email', value: 'support@argus.io' },
    { icon: Phone, label: 'Phone', value: '+1 (555) 123-4567' },
    { icon: MapPin, label: 'Address', value: '123 Tech Street, San Francisco, CA' },
    { icon: Clock, label: 'Hours', value: 'Mon-Fri 9AM-6PM EST' },
];

export default function HelpSupport() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
            toast({ title: 'Please fill all fields', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);

        // Send via mailto as backend has no contact endpoint
        const mailBody = `Name: ${name}\nEmail: ${email}\n\n${message}`;
        const mailtoLink = `mailto:support@argus.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody)}`;
        window.open(mailtoLink, '_blank');

        toast({
            title: 'Email client opened!',
            description: 'Please send the email from your mail app. We\'ll respond within 24-48 hours.',
        });

        // Reset form
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        setIsSubmitting(false);
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
                        <Link to="/faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
                        <Link to="/help" className="text-sm font-medium text-primary">Help & Support</Link>
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
                        className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 10, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute bottom-0 right-1/3 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
                        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 12, repeat: Infinity }}
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
                            <MessageCircle className="h-4 w-4" />
                            Help & Support
                        </motion.div>

                        <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground mb-6">
                            We're Here to <span className="text-gradient-primary">Help</span>
                        </h1>

                        <p className="text-xl text-muted-foreground">
                            Get the support you need, whether you're just getting started or need advanced assistance.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Support Options */}
            <section className="py-16">
                <div className="container mx-auto px-6">
                    <motion.div
                        className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        {supportOptions.map((option, i) => (
                            <motion.div
                                key={i}
                                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -5 }}
                            >
                                <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${option.bgColor} ${option.color} mb-4`}>
                                    <option.icon className="h-7 w-7" />
                                </div>
                                <h3 className="font-display text-xl font-semibold text-foreground mb-2">{option.title}</h3>
                                <p className="text-muted-foreground mb-4 text-sm">{option.desc}</p>
                                <div className="text-sm text-muted-foreground mb-4">{option.action}</div>
                                <Button
                                    variant="outline"
                                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                    onClick={() => {
                                        if (option.title === 'Email Support') {
                                            window.location.href = `mailto:${option.action}`;
                                        } else if (option.title === 'Documentation') {
                                            window.location.href = '/help';
                                        } else if (option.title === 'Community') {
                                            window.location.href = '/faq';
                                        }
                                    }}
                                >
                                    {option.buttonText}
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Contact Form & Info */}
            <section className="py-24 bg-gradient-to-b from-background to-card/50">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16">
                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                                Send Us a Message
                            </h2>
                            <p className="text-muted-foreground mb-8">
                                Fill out the form below and we'll get back to you within 24-48 hours.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Your Name</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="h-12"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="john@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-12"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input
                                        id="subject"
                                        type="text"
                                        placeholder="How can we help?"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        required
                                        className="h-12"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Tell us more about your issue or question..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                        className="min-h-[150px] resize-none"
                                    />
                                </div>

                                <Button type="submit" size="lg" className="w-full h-14" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Send Message
                                            <Send className="ml-2 h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </motion.div>

                        {/* Contact Info & Quick Links */}
                        <motion.div
                            className="space-y-8"
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            {/* Contact Info */}
                            <div className="bg-card rounded-2xl border border-border p-8">
                                <h3 className="font-display text-xl font-semibold text-foreground mb-6">
                                    Contact Information
                                </h3>
                                <div className="space-y-4">
                                    {contactInfo.map((info, i) => (
                                        <div key={i} className="flex items-start gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                                                <info.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground">{info.label}</div>
                                                <div className="text-foreground font-medium">{info.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SLA Info */}
                            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-8">
                                <h3 className="font-display text-xl font-semibold text-foreground mb-4">
                                    Response Time SLA
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { level: 'Critical Issues', time: '< 1 hour', badge: 'bg-red-500' },
                                        { level: 'High Priority', time: '< 4 hours', badge: 'bg-amber-500' },
                                        { level: 'General Support', time: '24-48 hours', badge: 'bg-blue-500' },
                                    ].map((sla, i) => (
                                        <div key={i} className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-2 w-2 rounded-full ${sla.badge}`} />
                                                <span className="text-foreground">{sla.level}</span>
                                            </div>
                                            <span className="text-muted-foreground font-medium">{sla.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className="bg-card rounded-2xl border border-border p-8">
                                <h3 className="font-display text-xl font-semibold text-foreground mb-6">
                                    Quick Links
                                </h3>
                                <div className="space-y-3">
                                    {quickLinks.map((ql, i) => (
                                        <Link
                                            key={i}
                                            to={ql.path}
                                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted transition-colors group"
                                        >
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <ql.icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-foreground font-medium">{ql.title}</div>
                                                <div className="text-sm text-muted-foreground">{ql.desc}</div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* FAQ Teaser */}
            <section className="py-24 bg-card border-y border-border">
                <div className="container mx-auto px-6">
                    <motion.div
                        className="max-w-3xl mx-auto text-center"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                            Looking for Quick Answers?
                        </h2>
                        <p className="text-muted-foreground text-lg mb-8">
                            Check out our FAQ section for answers to common questions about Argus, pricing, and features.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" className="h-14 px-8 text-lg" asChild>
                                <Link to="/faq">
                                    Browse FAQ
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg" asChild>
                                <Link to="/about">Learn About Argus</Link>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
                <div className="container mx-auto px-6">
                    <motion.div
                        className="max-w-3xl mx-auto text-center"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex justify-center mb-6">
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                            Ready to Get Started?
                        </h2>
                        <p className="text-muted-foreground text-lg mb-8">
                            Join thousands of teams who trust Argus for their server monitoring needs.
                        </p>
                        <Button size="lg" className="h-14 px-8 text-lg" asChild>
                            <Link to="/register">
                                Start Free Trial
                                <ChevronRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
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
