// Status Page - Argus System Status
import { MainLayout } from '@/components/layout/MainLayout';
import { CheckCircle2, AlertCircle, Clock, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const systemComponents = [
  { name: 'API Server', status: 'operational', uptime: '99.99%' },
  { name: 'WebSocket Service', status: 'operational', uptime: '99.98%' },
  { name: 'Database', status: 'operational', uptime: '100%' },
  { name: 'Alert Service', status: 'operational', uptime: '99.97%' },
  { name: 'Authentication', status: 'operational', uptime: '100%' },
  { name: 'Metrics Collection', status: 'operational', uptime: '99.99%' },
];

const recentIncidents = [
  {
    date: '2026-01-28',
    title: 'Scheduled Maintenance',
    status: 'resolved',
    description: 'Routine database optimization completed successfully.',
  },
  {
    date: '2026-01-15',
    title: 'API Latency Issue',
    status: 'resolved',
    description: 'Brief increase in API response times. Resolved within 10 minutes.',
  },
];

const upcomingMaintenance = [
  {
    date: '2026-02-10',
    time: '02:00 - 04:00 UTC',
    title: 'Database Upgrade',
    impact: 'Minor service disruption expected',
  },
];

export default function Status() {
  return (
    <MainLayout>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-6 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <motion.div
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Activity className="h-8 w-8" />
              </motion.div>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              System Status
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium">All Systems Operational</span>
            </div>
          </div>

          {/* System Components */}
          <div className="mb-12">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              System Components
            </h2>
            <div className="space-y-3">
              {systemComponents.map((component, idx) => (
                <motion.div
                  key={idx}
                  className="rounded-xl border border-border bg-card p-6 flex items-center justify-between hover:border-primary/30 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    <div>
                      <h3 className="font-semibold text-foreground">{component.name}</h3>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        Operational
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Uptime</div>
                    <div className="font-semibold text-foreground">{component.uptime}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="mb-12">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              Recent Incidents
            </h2>
            {recentIncidents.length > 0 ? (
              <div className="space-y-4">
                {recentIncidents.map((incident, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-border bg-card p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{incident.title}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Resolved
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>
                        <p className="text-xs text-muted-foreground">{incident.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 rounded-xl border border-border bg-card">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-muted-foreground">No recent incidents</p>
              </div>
            )}
          </div>

          {/* Upcoming Maintenance */}
          <div className="mb-12">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              Scheduled Maintenance
            </h2>
            {upcomingMaintenance.length > 0 ? (
              <div className="space-y-4">
                {upcomingMaintenance.map((maintenance, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2">{maintenance.title}</h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p><strong>When:</strong> {maintenance.date} at {maintenance.time}</p>
                          <p><strong>Impact:</strong> {maintenance.impact}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 rounded-xl border border-border bg-card">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No scheduled maintenance</p>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center p-6 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              Subscribe to status updates via{' '}
              <a href="#" className="text-primary hover:underline">RSS</a> or{' '}
              <a href="#" className="text-primary hover:underline">Email</a>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
