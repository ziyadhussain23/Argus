import { ReactNode, useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Button } from '../ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeepWebSocketAlive } from '@/hooks/use-realtime';
import { SearchCommand } from '@/components/SearchCommand';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [manualToggle, setManualToggle] = useState(false);
  const { toast } = useToast();
  const location = useLocation();

  const routeLabels: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/servers': 'Servers',
    '/servers/new': 'Add Server',
    '/servers/import': 'Bulk Import',
    '/alerts': 'Alerts',
    '/rules': 'Alert Rules',
    '/history': 'History',
    '/reports': 'Reports',
    '/settings': 'Settings',
    '/about': 'About',
    '/faq': 'FAQ',
    '/help': 'Help & Support',
  };

  const breadcrumbs = useMemo(() => {
    const path = location.pathname;
    const crumbs: { label: string; path?: string }[] = [{ label: 'Dashboard', path: '/dashboard' }];

    if (path === '/dashboard') return crumbs;

    // e.g. /servers/123/edit or /servers/123
    const segments = path.split('/').filter(Boolean);
    let accumulated = '';
    for (let i = 0; i < segments.length; i++) {
      accumulated += '/' + segments[i];
      const label = routeLabels[accumulated];
      if (label) {
        crumbs.push(i === segments.length - 1 ? { label } : { label, path: accumulated });
      } else if (/^\d+$/.test(segments[i])) {
        // numeric ID like /servers/123
        const parentLabel = routeLabels['/' + segments[i - 1]] || segments[i - 1];
        crumbs.push(i === segments.length - 1
          ? { label: `${parentLabel} Detail` }
          : { label: `${parentLabel} Detail`, path: accumulated });
      } else if (segments[i] === 'edit') {
        crumbs.push({ label: 'Edit' });
      }
    }
    return crumbs;
  }, [location.pathname]);

  // Keep WebSocket alive across all page navigations
  useKeepWebSocketAlive(true);

  // Warn user before session expires
  useEffect(() => {
    const handleExpiring = () => {
      toast({ title: 'Session expiring', description: 'Your session will expire in about 60 seconds. Save your work.' });
    };
    const handleExpired = () => {
      toast({ title: 'Session expired', description: 'You have been logged out.', variant: 'destructive' });
    };
    window.addEventListener('argus:session-expiring', handleExpiring);
    window.addEventListener('argus:session-expired', handleExpired);
    return () => {
      window.removeEventListener('argus:session-expiring', handleExpiring);
      window.removeEventListener('argus:session-expired', handleExpired);
    };
  }, [toast]);

  // Auto-close sidebar on mobile when screen resizes (only if not manually toggled)
  useEffect(() => {
    if (!manualToggle) {
      setIsSidebarOpen(!isMobile);
    }
    setManualToggle(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  const handleToggle = useCallback(() => {
    setManualToggle(true);
    setIsSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // Scroll lock when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isMobile, isSidebarOpen]);

  // Close sidebar on Escape key
  useEffect(() => {
    if (!isMobile || !isSidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isSidebarOpen, closeSidebar]);

  return (
    <div className="min-h-screen bg-transparent relative">
      <Sidebar isOpen={isSidebarOpen} toggle={handleToggle} />

      {/* Mobile backdrop overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={closeSidebar}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') closeSidebar(); }}
        />
      )}

      {/* Mobile/Toggle Header for small screens or when collapsed */}
      <div className={cn(
        "fixed top-0 z-30 flex items-center p-4 transition-all duration-300",
        isSidebarOpen ? "left-64" : "left-0"
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          className="text-foreground hover:text-primary bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:bg-accent"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      <main className={cn(
        "transition-all duration-300 min-h-screen pt-16",
        isSidebarOpen ? "pl-64" : "pl-0"
      )}>
        <div className="p-8">
          {breadcrumbs.length > 1 && (
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                {breadcrumbs.map((crumb, i) => (
                  <Fragment key={i}>
                    {i > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {crumb.path && i < breadcrumbs.length - 1 ? (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.path}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
          {children}
        </div>
      </main>
      <SearchCommand />
    </div>
  );
}
