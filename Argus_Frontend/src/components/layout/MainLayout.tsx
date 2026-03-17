import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Button } from '../ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeepWebSocketAlive } from '@/hooks/use-realtime';
import { SearchCommand } from '@/components/SearchCommand';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [manualToggle, setManualToggle] = useState(false);
  const { toast } = useToast();

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
          {children}
        </div>
      </main>
      <SearchCommand />
    </div>
  );
}
