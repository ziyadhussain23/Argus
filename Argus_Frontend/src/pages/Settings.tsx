import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Settings as SettingsIcon, 
  Server, 
  Check,
  Loader2,
  Lock,
  Bell,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const [apiUrl, setApiUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('argus_email_notifications');
      return saved !== null ? JSON.parse(saved) === true : true;
    } catch { return true; }
  });
  const [criticalOnly, setCriticalOnly] = useState(() => {
    try {
      const saved = localStorage.getItem('argus_critical_only');
      return saved !== null ? JSON.parse(saved) === true : false;
    } catch { return false; }
  });
  const { toast } = useToast();
  const { user, logout } = useAuth();

  useEffect(() => {
    setApiUrl(getApiBaseUrl());
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast({ title: 'Please fill in all password fields', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8 || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      toast({ title: 'Password must be 8+ chars with uppercase, lowercase, number, and special character', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast({ title: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast({ title: 'Failed to change password', variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleEmail = (checked: boolean) => {
    setEmailNotifications(checked);
    localStorage.setItem('argus_email_notifications', JSON.stringify(checked));
  };

  const handleToggleCritical = (checked: boolean) => {
    setCriticalOnly(checked);
    localStorage.setItem('argus_critical_only', JSON.stringify(checked));
  };

  const handleSaveApiUrl = () => {
    const trimmed = apiUrl.trim();
    try {
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        toast({ title: 'Invalid URL', description: 'Only HTTP/HTTPS URLs are allowed.', variant: 'destructive' });
        return;
      }
    } catch {
      toast({ title: 'Invalid URL format', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      setApiBaseUrl(trimmed);
      toast({
        title: 'Settings saved',
        description: 'API URL has been updated.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (isTesting) return;
    setIsTesting(true);
    setTestSuccess(null);

    try {
      const token = localStorage.getItem('argus_token');
      const response = await fetch(`${apiUrl}/servers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok || response.status === 401) {
        setTestSuccess(true);
        toast({
          title: 'Connection successful',
          description: response.ok ? 'The API server is responding.' : 'Server reached, but authentication required.',
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

        {/* Change Password */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Change Password
              </h2>
              <p className="text-sm text-muted-foreground">
                Update your account password
              </p>
            </div>
          </div>

          <div className="grid gap-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="w-fit"
            >
              {isChangingPassword ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              Update Password
            </Button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Notification Preferences
              </h2>
              <p className="text-sm text-muted-foreground">
                Control how you receive alert notifications
              </p>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive alerts via email</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={handleToggleEmail} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">Critical Alerts Only</p>
                <p className="text-sm text-muted-foreground">Only notify for critical severity</p>
              </div>
              <Switch checked={criticalOnly} onCheckedChange={handleToggleCritical} />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-destructive/30 bg-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-destructive">
                Danger Zone
              </h2>
              <p className="text-sm text-muted-foreground">
                Irreversible account actions
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
            <div>
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account,
                    all servers, alert rules, and monitoring data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      toast({ title: 'Account deletion is not yet available via API' });
                    }}
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* About */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">
            About Argus
          </h2>
          <div className="prose prose-sm dark:prose-invert max-w-none">
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
