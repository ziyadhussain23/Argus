import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  Bell,
  AlertTriangle,
  Settings,
  LogOut,
  HelpCircle,
  MessageCircle,
  Info,
  ArrowLeft,
  History,
  Wifi,
  WifiOff,
  FileText,
} from 'lucide-react';
import { ArgusLogo } from '@/components/ArgusLogo';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useWebSocketStatus } from '@/hooks/use-realtime';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NavLink } from '@/components/NavLink';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Server, label: 'Servers', path: '/servers' },
  { icon: Bell, label: 'Alerts', path: '/alerts' },
  { icon: AlertTriangle, label: 'Alert Rules', path: '/rules' },
  { icon: History, label: 'History', path: '/history' },
  { icon: FileText, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const secondaryNavItems = [
  { icon: Info, label: 'About', path: '/about' },
  { icon: MessageCircle, label: 'FAQ', path: '/faq' },
  { icon: HelpCircle, label: 'Help & Support', path: '/help' },
];

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

export function Sidebar({ isOpen, toggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const wsStatus = useWebSocketStatus();
  const { toast } = useToast();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card transition-transform duration-300",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Logo - Links to Home */}
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative">
            <ArgusLogo size="xs" showText={true} />
            {/* WebSocket Status Dot */}
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card',
                wsStatus === 'connected' && 'bg-green-500',
                wsStatus === 'connecting' && 'bg-amber-500 animate-pulse',
                wsStatus === 'disconnected' && 'bg-red-500'
              )}
              style={{ right: '-2px', bottom: '-2px' }}
            />
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  {wsStatus === 'connected' ? (
                    <Wifi className="h-3.5 w-3.5 text-green-500" />
                  ) : wsStatus === 'connecting' ? (
                    <Wifi className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  ) : (
                    <WifiOff className="h-3.5 w-3.5 text-red-500" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">
                  WebSocket: {wsStatus === 'connected' ? 'Connected' : wsStatus === 'connecting' ? 'Connecting…' : 'Disconnected'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ThemeToggle />
        </div>
      </div>

      {/* Back Button */}
      <div className="px-3 pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && item.path !== '/settings' && location.pathname.startsWith(item.path + '/'));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-muted hover:text-foreground"
              activeClassName="bg-primary/10 text-primary"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Resources Section - Above User Section */}
      <div className="border-t border-border px-3 py-3">
        <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Resources
        </p>
        {secondaryNavItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>

      {/* User section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
              {user?.username?.slice(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.username || 'User'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email || 'No email'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              try {
                await logout();
              } catch {
                toast({ title: 'Logout failed', variant: 'destructive' });
              }
            }}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
