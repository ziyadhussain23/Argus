import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Server, 
  Bell, 
  AlertTriangle, 
  Settings, 
  LogOut,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Server, label: 'Servers', path: '/servers' },
  { icon: Bell, label: 'Alerts', path: '/alerts' },
  { icon: AlertTriangle, label: 'Alert Rules', path: '/rules' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">Argus</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.username || 'User'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email || 'user@example.com'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
