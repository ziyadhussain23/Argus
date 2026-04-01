import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import {
  Book, Terminal, Server, Bell, ChevronRight, FileText, Code, Zap, Shield,
  Search, Copy, Check, Download, ExternalLink, Play, GitBranch, Database,
  Cloud, Lock, Webhook, BarChart, AlertTriangle, Settings2
} from 'lucide-react';

const docSections = [
  {
    title: 'Getting Started',
    link: '/docs/getting-started',
    icon: Zap,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    items: [
      { name: 'Quick Start Guide', href: '/docs/getting-started', icon: Play },
      { name: 'Installation', href: '/docs/getting-started', icon: Download },
      { name: 'Configuration', href: '/docs/getting-started', icon: Settings2 },
      { name: 'First Server Setup', href: '/docs/getting-started', icon: Server },
    ]
  },
  {
    title: 'Core Features',
    link: '/docs/features',
    icon: Server,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    items: [
      { name: 'Server Management', href: '/docs/features', icon: Server },
      { name: 'Real-time Monitoring', href: '/docs/features', icon: BarChart },
      { name: 'Metrics & Analytics', href: '/docs/features', icon: Database },
      { name: 'Alert Configuration', href: '/docs/features', icon: Bell },
    ]
  },
  {
    title: 'API Reference',
    link: '/docs/api',
    icon: Code,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    items: [
      { name: 'Authentication', href: '/docs/api', icon: Lock },
      { name: 'REST Endpoints', href: '/docs/api', icon: GitBranch },
      { name: 'WebSocket API', href: '/docs/api', icon: Cloud },
      { name: 'Webhooks', href: '/docs/api', icon: Webhook },
    ]
  },
  {
    title: 'Security & Compliance',
    link: '/docs/security',
    icon: Shield,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    items: [
      { name: 'Security Overview', href: '/docs/security', icon: Shield },
      { name: 'Best Practices', href: '/docs/security', icon: Check },
      { name: 'Data Encryption', href: '/docs/security', icon: Lock },
      { name: 'Troubleshooting', href: '/docs/security', icon: AlertTriangle },
    ]
  },
];

const codeExamples = [
  {
    title: 'Install Agent (Linux)',
    language: 'bash',
    code: `# One-line installation
curl -sSL https://argus.io/install.sh | bash

# Verify installation
argus-agent --version

# Start agent with your API key
argus-agent start --api-key YOUR_API_KEY`
  },
  {
    title: 'Install Agent (Windows)',
    language: 'powershell',
    code: `# PowerShell installation
iwr https://argus.io/install.ps1 | iex

# Start agent
argus-agent.exe start --api-key YOUR_API_KEY`
  },
  {
    title: 'API: Get Server Metrics',
    language: 'bash',
    code: `curl -X GET https://api.argus.io/v1/servers/{server_id}/metrics \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`
  },
  {
    title: 'API: Create Alert Rule',
    language: 'json',
    code: `{
  "name": "High CPU Alert",
  "metric": "cpu_usage",
  "threshold": 90,
  "condition": "greater_than",
  "duration": 300,
  "notifications": ["email", "slack"]
}`
  }
];

export default function Documentation() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [filteredSections, setFilteredSections] = useState(docSections);
  const { toast } = useToast();

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSections(docSections);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = docSections.map(section => {
      const matchingItems = section.items.filter(item =>
        item.name.toLowerCase().includes(query)
      );

      const sectionMatches = section.title.toLowerCase().includes(query);

      if (sectionMatches || matchingItems.length > 0) {
        return {
          ...section,
          items: matchingItems.length > 0 ? matchingItems : section.items
        };
      }
      return null;
    }).filter(Boolean) as typeof docSections;

    setFilteredSections(filtered);
  }, [searchQuery]);

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: 'Copied to clipboard',
      description: 'Code snippet copied successfully',
    });
  };

  const downloadGuide = async () => {
    setIsDownloading(true);
    toast({
      title: 'Generating PDF...',
      description: 'Please wait while we prepare your documentation guide',
    });

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 20;

      // Header
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Argus Documentation Guide', margin, yPosition);

      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);

      yPosition += 15;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);

      // Table of Contents
      yPosition += 10;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Table of Contents', margin, yPosition);

      yPosition += 10;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const tocItems = [
        '1. Quick Start Guide',
        '2. Installation',
        '3. Configuration',
        '4. Server Management',
        '5. API Reference',
        '6. Troubleshooting',
      ];

      tocItems.forEach(item => {
        pdf.text(item, margin + 5, yPosition);
        yPosition += 7;
      });

      // Quick Start Section
      yPosition += 10;
      pdf.addPage();
      yPosition = 20;

      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('1. Quick Start Guide', margin, yPosition);

      yPosition += 10;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const quickStartSteps = [
        'Step 1: Create your free account at https://argus.io',
        'Step 2: Install the agent on your server',
        'Step 3: Configure monitoring and alerts',
        'Step 4: View real-time metrics on your dashboard',
      ];

      quickStartSteps.forEach(step => {
        pdf.text(step, margin, yPosition);
        yPosition += 8;
      });

      // Installation Section
      yPosition += 10;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('2. Installation', margin, yPosition);

      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Linux:', margin, yPosition);
      yPosition += 7;
      pdf.setFontSize(10);
      pdf.setFont('courier', 'normal');
      pdf.text('curl -sSL https://argus.io/install.sh | bash', margin + 5, yPosition);

      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Windows:', margin, yPosition);
      yPosition += 7;
      pdf.setFontSize(10);
      pdf.setFont('courier', 'normal');
      pdf.text('iwr https://argus.io/install.ps1 | iex', margin + 5, yPosition);

      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('macOS:', margin, yPosition);
      yPosition += 7;
      pdf.setFontSize(10);
      pdf.setFont('courier', 'normal');
      pdf.text('brew install argus-agent', margin + 5, yPosition);

      // API Reference
      yPosition += 15;
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('3. API Reference', margin, yPosition);

      yPosition += 10;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Base URL: https://api.argus.io/v1', margin, yPosition);
      yPosition += 7;
      pdf.text('Authentication: Bearer token in Authorization header', margin, yPosition);

      // Footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `Page ${i} of ${pageCount} | © ${new Date().getFullYear()} Argus`,
          pageWidth / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      pdf.save(`argus-documentation-guide-${Date.now()}.pdf`);

      toast({
        title: 'Download complete!',
        description: 'Documentation guide has been downloaded successfully',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Download failed',
        description: 'There was an error generating the PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 py-20">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8">
                <Book className="h-4 w-4" />
                Complete Developer Documentation
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground mb-6">
                Argus Documentation
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Everything you need to integrate, deploy, and monitor your infrastructure with Argus
              </p>

              {/* Search Bar */}
              <div className="relative w-full max-w-2xl mx-auto mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 pl-12 pr-4 text-lg rounded-xl bg-background"
                />
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/docs/getting-started">
                    Quick Start
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/docs/api">API Reference</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={downloadGuide}
                  disabled={isDownloading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isDownloading ? 'Generating...' : 'Download PDF'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 py-16">
          {/* Documentation Sections Grid */}
          {filteredSections.length === 0 ? (
            <div className="text-center py-16 mb-20">
              <Search className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
              <p className="text-muted-foreground">Try adjusting your search query</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              {filteredSections.map((section, idx) => (
                <Link
                  to={section.link}
                  key={idx}
                  className="block group rounded-2xl border border-border bg-card p-6 hover:border-primary/50 hover:shadow-lg transition-all h-full"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${section.bg} ${section.color} mb-4`}>
                    <section.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors">
                    {section.title}
                  </h3>
                  <ul className="space-y-3">
                    {section.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-center gap-2 text-muted-foreground">
                        <item.icon className="h-4 w-4 opacity-50" />
                        <span className="text-sm">{item.name}</span>
                      </li>
                    ))}
                  </ul>
                </Link>
              ))}
            </div>
          )}

          {/* Quick Start Section */}
          <div id="quick-start" className="mb-20 scroll-mt-20">
            <div className="flex items-center justify-between gap-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-bold text-foreground">Quick Start Guide</h2>
                  <p className="text-muted-foreground">Get up and running in under 5 minutes</p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link to="/docs/getting-started">View Full Guide</Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Create Your Account</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Sign up for free - no credit card required. Start monitoring up to 3 servers immediately.
                    </p>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/register">Sign Up Free</Link>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Install the Agent</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Run our lightweight agent on your server. Supports Linux, Windows, and macOS.
                    </p>
                    <Button size="sm" variant="outline" onClick={() => scrollToSection('installation')}>
                      View Install Commands
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Configure Monitoring</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Set up dashboards, alerts, and customize which metrics to track.
                    </p>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/docs/features">View Config Guide</Link>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Start Monitoring</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      View real-time metrics, set up alerts, and gain insights into your infrastructure.
                    </p>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/dashboard">Go to Dashboard</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Installation Section */}
          <div id="installation" className="mb-20 scroll-mt-20">
            <div className="flex items-center justify-between gap-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                  <Terminal className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-bold text-foreground">Installation</h2>
                  <p className="text-muted-foreground">Platform-specific installation guides</p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link to="/docs/getting-started">View All Platforms</Link>
              </Button>
            </div>

            <div className="grid gap-6">
              {codeExamples.slice(0, 2).map((example, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 bg-muted/50 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Terminal className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">{example.title}</h3>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(example.code, idx)}
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="h-4 w-4 mr-2 text-emerald-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-6">
                    <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto">
                      <code className="text-sm font-mono text-foreground">{example.code}</code>
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Reference Section */}
          <div id="api-endpoints" className="mb-20 scroll-mt-20">
            <div className="flex items-center justify-between gap-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Code className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-bold text-foreground">API Reference</h2>
                  <p className="text-muted-foreground">Complete REST API documentation</p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link to="/docs/api">View Complete API Docs</Link>
              </Button>
            </div>

            <div className="grid gap-6">
              {codeExamples.slice(2).map((example, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 bg-muted/50 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Code className="h-5 w-5 text-emerald-500" />
                      <h3 className="font-semibold text-foreground">{example.title}</h3>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(example.code, idx + 2)}
                    >
                      {copiedIndex === idx + 2 ? (
                        <>
                          <Check className="h-4 w-4 mr-2 text-emerald-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-6">
                    <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto">
                      <code className="text-sm font-mono text-foreground">{example.code}</code>
                    </pre>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-border">
              <div className="flex items-start gap-4">
                <ExternalLink className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Full API Documentation</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Explore our complete API reference with interactive examples, authentication guides, and rate limiting details.
                  </p>
                  <Button variant="outline" asChild>
                    <Link to="/docs/api">View Full API Docs</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div id="security" className="mb-20 scroll-mt-20">
            <div className="flex items-center justify-between gap-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-bold text-foreground">Security & Compliance</h2>
                  <p className="text-muted-foreground">Enterprise-grade security standards</p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link to="/docs/security">View Security Guide</Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-border bg-card">
                <Shield className="h-8 w-8 text-blue-500 mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Data Encryption</h3>
                <p className="text-sm text-muted-foreground">
                  AES-256 encryption at rest and TLS 1.3 in transit for all data.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <Check className="h-8 w-8 text-emerald-500 mb-4" />
                <h3 className="font-semibold text-foreground mb-2">SOC 2 Compliant</h3>
                <p className="text-sm text-muted-foreground">
                  Regularly audited to meet SOC 2 Type II standards for security.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <Lock className="h-8 w-8 text-purple-500 mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Access Control</h3>
                <p className="text-sm text-muted-foreground">
                  Granular role-based access control (RBAC) and audit logs.
                </p>
              </div>
            </div>
          </div>

          {/* Troubleshooting Section */}
          <div id="troubleshooting" className="mb-20 scroll-mt-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-3xl font-bold text-foreground">Troubleshooting</h2>
                <p className="text-muted-foreground">Common issues and solutions</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: 'Agent not connecting to servers',
                  a: 'Ensure your API key is correct and the agent has internet access. Check firewall rules allow outbound HTTPS connections to api.argus.io.'
                },
                {
                  q: 'Metrics not updating in real-time',
                  a: 'Verify WebSocket connections are established. Check browser console for errors and ensure no proxy is blocking WebSocket connections.'
                },
                {
                  q: 'High memory usage by agent',
                  a: 'The agent typically uses less than 50MB. If higher, check for metric collection interval settings and reduce frequency if needed.'
                }
              ].map((item, idx) => (
                <details key={idx} className="group rounded-xl border border-border bg-card">
                  <summary className="cursor-pointer p-6 font-semibold text-foreground flex items-center justify-between hover:bg-muted/30 transition-colors">
                    {item.q}
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-6 pb-6 pt-2 text-muted-foreground border-t border-border">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Help CTA */}
          <div className="text-center p-12 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20">
            <div className="max-w-2xl mx-auto">
              <h3 className="font-display text-3xl font-bold text-foreground mb-4">
                Need More Help?
              </h3>
              <p className="text-lg text-muted-foreground mb-8">
                Cannot find what you are looking for? Our support team is ready to assist you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/help">
                    Contact Support
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/faq">Browse FAQ</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={downloadGuide}
                  disabled={isDownloading}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {isDownloading ? 'Generating...' : 'Download Guide'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
