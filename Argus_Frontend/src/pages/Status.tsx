// Status Page - Argus System Status (Live Data)
import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { CheckCircle2, AlertCircle, Activity, XCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getApiBaseUrl, getToken, serversApi } from '@/lib/api';

interface ComponentStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'checking';
  responseTime?: number;
}

export default function Status() {
  const [components, setComponents] = useState<ComponentStatus[]>([
    { name: 'API Server', status: 'checking' },
    { name: 'WebSocket Service', status: 'checking' },
    { name: 'Authentication', status: 'checking' },
    { name: 'Server Monitoring', status: 'checking' },
  ]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    const baseUrl = getApiBaseUrl();
    const results: ComponentStatus[] = [];

    // Check API Server
    try {
      const start = Date.now();
      const res = await fetch(`${baseUrl}/servers`, {
        headers: { Authorization: `Bearer ${getToken() || ''}` },
      });
      const ms = Date.now() - start;
      results.push({ name: 'API Server', status: res.ok ? 'operational' : 'degraded', responseTime: ms });
    } catch {
      results.push({ name: 'API Server', status: 'down' });
    }

    // Check WebSocket endpoint
    try {
      const wsBase = baseUrl.replace('/api/v1', '');
      const start = Date.now();
      const res = await fetch(`${wsBase}/ws/info`);
      const ms = Date.now() - start;
      results.push({ name: 'WebSocket Service', status: res.ok ? 'operational' : 'degraded', responseTime: ms });
    } catch {
      results.push({ name: 'WebSocket Service', status: 'down' });
    }

    // Check Authentication
    try {
      const start = Date.now();
      const res = await fetch(`${baseUrl}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: getToken() || '' }),
      });
      const ms = Date.now() - start;
      // Any response means auth service is up (even 400 for bad token)
      results.push({ name: 'Authentication', status: (res.ok || res.status === 400) ? 'operational' : 'degraded', responseTime: ms });
    } catch {
      results.push({ name: 'Authentication', status: 'down' });
    }

    // Check Server Monitoring (can we fetch server data?)
    try {
      const start = Date.now();
      const data = await serversApi.getAll();
      const ms = Date.now() - start;
      results.push({ name: 'Server Monitoring', status: data.success ? 'operational' : 'degraded', responseTime: ms });
    } catch {
      results.push({ name: 'Server Monitoring', status: 'down' });
    }

    setComponents(results);
    setLastChecked(new Date());
    setIsChecking(false);
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Re-check every 60s
    return () => clearInterval(interval);
  }, [checkHealth]);

  const allOperational = components.every(c => c.status === 'operational');
  const anyDown = components.some(c => c.status === 'down');

  const statusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle2 className="h-6 w-6 text-emerald-500" />;
      case 'degraded': return <AlertCircle className="h-6 w-6 text-amber-500" />;
      case 'down': return <XCircle className="h-6 w-6 text-red-500" />;
      default: return <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'operational': return <span className="text-sm text-emerald-600 dark:text-emerald-400">Operational</span>;
      case 'degraded': return <span className="text-sm text-amber-600 dark:text-amber-400">Degraded</span>;
      case 'down': return <span className="text-sm text-red-600 dark:text-red-400">Down</span>;
      default: return <span className="text-sm text-muted-foreground">Checking...</span>;
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <motion.div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                  anyDown ? 'bg-red-500/10 text-red-500' : allOperational ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                }`}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Activity className="h-8 w-8" />
              </motion.div>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              System Status
            </h1>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
              anyDown
                ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                : allOperational
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
            }`}>
              <div className={`h-2 w-2 rounded-full animate-pulse ${
                anyDown ? 'bg-red-500' : allOperational ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
              <span className="font-medium">
                {anyDown ? 'Some Systems Down' : allOperational ? 'All Systems Operational' : 'Partial Degradation'}
              </span>
            </div>
          </div>

          {/* System Components */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground">
                System Components
              </h2>
              <Button variant="outline" size="sm" onClick={checkHealth} disabled={isChecking}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <div className="space-y-3">
              {components.map((component, idx) => (
                <motion.div
                  key={component.name}
                  className="rounded-xl border border-border bg-card p-4 sm:p-6 flex items-center justify-between hover:border-primary/30 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex items-center gap-4">
                    {statusIcon(component.status)}
                    <div>
                      <h3 className="font-semibold text-foreground">{component.name}</h3>
                      {statusLabel(component.status)}
                    </div>
                  </div>
                  <div className="text-right">
                    {component.responseTime != null && (
                      <>
                        <div className="text-sm text-muted-foreground">Response</div>
                        <div className="font-semibold text-foreground">{component.responseTime}ms</div>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center p-4 sm:p-6 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              Status checks run automatically every 60 seconds.
            </p>
            {lastChecked && (
              <p className="text-xs text-muted-foreground mt-2">
                Last checked: {lastChecked.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
