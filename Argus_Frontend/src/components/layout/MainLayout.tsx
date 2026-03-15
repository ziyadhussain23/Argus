import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Button } from '../ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeepWebSocketAlive } from '@/hooks/use-realtime';
import { SearchCommand } from '@/components/SearchCommand';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  // Keep WebSocket alive across all page navigations
  useKeepWebSocketAlive(true);

  // Auto-close sidebar on mobile when screen resizes
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-transparent relative">
      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Mobile backdrop overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
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
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
