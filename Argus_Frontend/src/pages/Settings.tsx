import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings as SettingsIcon, 
  Server, 
  Check,
  Loader2
} from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const [apiUrl, setApiUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setApiUrl(getApiBaseUrl());
  }, []);

  const handleSaveApiUrl = () => {
    setIsSaving(true);
    try {
      setApiBaseUrl(apiUrl);
      toast({
        title: 'Settings saved',
        description: 'API URL has been updated.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestSuccess(null);

    try {
      const response = await fetch(`${apiUrl}/servers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok || response.status === 401) {
        // 401 is okay - it means the server is responding, just needs auth
        setTestSuccess(true);
        toast({
          title: 'Connection successful',
          description: 'The API server is responding.',
        });
      } else {
        throw new Error('Server not responding');
      }
    } catch (error) {
      setTestSuccess(false);
      toast({
        title: 'Connection failed',
        description: 'Could not connect to the API server.',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Configure your Argus monitoring dashboard
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* API Configuration */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  API Configuration
                </h2>
                <p className="text-sm text-muted-foreground">
                  Configure the Argus backend API connection
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiUrl">API Base URL</Label>
                <Input
                  id="apiUrl"
                  placeholder="http://localhost:8080/api/v1"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The base URL of your Argus backend server
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveApiUrl} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : testSuccess === true ? (
                    <Check className="mr-2 h-4 w-4 text-success" />
                  ) : null}
                  Test Connection
                </Button>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <SettingsIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Account Information
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your account details
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Username</span>
                <span className="font-medium text-foreground">{user?.username || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium text-foreground">{user?.role || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">
            About Argus
          </h2>
          <div className="prose prose-sm prose-invert max-w-none">
            <p className="text-muted-foreground">
              Argus is a real-time server monitoring and alerting system that uses lightweight 
              agents deployed on client servers to collect metrics and send them to a central 
              monitoring server. The system evaluates metrics against user-defined alert rules 
              and sends notifications when thresholds are breached.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                Spring Boot 4.0.1
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                Java 21
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                MySQL 8.0
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                Redis 7.0
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                WebSocket (STOMP)
              </span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
