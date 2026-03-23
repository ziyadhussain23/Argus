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
  EyeOff,
  Smartphone,
  MessageSquare,
  Send,
  User as UserIcon,
} from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, authApi, notificationsApi, profileApi, type SmsUsageStats, type SmsLogEntry, type UserProfile } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Settings() {
  const [apiUrl, setApiUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsAvailable, setSmsAvailable] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [smsUsage, setSmsUsage] = useState<SmsUsageStats | null>(null);
  const [smsServiceStatus, setSmsServiceStatus] = useState<{ available: boolean; message: string } | null>(null);
  const [smsLogs, setSmsLogs] = useState<SmsLogEntry[]>([]);
  const [isLoadingSmsData, setIsLoadingSmsData] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const { user, logout } = useAuth();

  useEffect(() => {
    setApiUrl(getApiBaseUrl());

    const loadPreferences = async () => {
      try {
        const response = await notificationsApi.getPreferences();
        setEmailNotifications(response.data.emailEnabled);
        setCriticalOnly(response.data.smsForCriticalOnly);
        setSmsEnabled(response.data.smsEnabled);
        setSmsAvailable(response.data.smsAvailable);
        setPhoneVerified(response.data.phoneVerified);
        const existingPhone = response.data.phoneNumber || '';
        setPhoneNumber(existingPhone.includes('*') ? '' : existingPhone);
      } catch {
        // Keep defaults if preferences endpoint is unavailable
      }
    };

    loadPreferences();
    loadSmsData();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await profileApi.get();
      if (res.data) setProfile(res.data);
    } catch {
      // Profile is optional, use context user as fallback
    }
  };

  const loadSmsData = async () => {
    setIsLoadingSmsData(true);
    try {
      const [usageRes, statusRes, logsRes] = await Promise.all([
        notificationsApi.getSmsUsage().catch(() => null),
        notificationsApi.getSmsStatus().catch(() => null),
        notificationsApi.getSmsLogs().catch(() => null),
      ]);
      if (usageRes?.data) setSmsUsage(usageRes.data);
      if (statusRes?.data) setSmsServiceStatus(statusRes.data);
      if (logsRes?.data) setSmsLogs(logsRes.data);
    } catch {
      // SMS data is optional
    } finally {
      setIsLoadingSmsData(false);
    }
  };

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

  const handleToggleEmail = async (checked: boolean) => {
    const previous = emailNotifications;
    setEmailNotifications(checked);
    setIsSavingNotifications(true);
    try {
      await notificationsApi.updatePreferences({
        emailEnabled: checked,
        smsEnabled,
        smsForCriticalOnly: criticalOnly,
      });
    } catch (error) {
      setEmailNotifications(previous);
      toast({
        title: 'Failed to update email notifications',
        description: error instanceof Error ? error.message : 'Unexpected error',
        variant: 'destructive',
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleToggleCritical = async (checked: boolean) => {
    const previous = criticalOnly;
    setCriticalOnly(checked);
    setIsSavingNotifications(true);
    try {
      await notificationsApi.updatePreferences({
        emailEnabled: emailNotifications,
        smsEnabled,
        smsForCriticalOnly: checked,
      });
    } catch (error) {
      setCriticalOnly(previous);
      toast({
        title: 'Failed to update critical alert preference',
        description: error instanceof Error ? error.message : 'Unexpected error',
        variant: 'destructive',
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleToggleSms = async (checked: boolean) => {
    const previous = smsEnabled;
    setSmsEnabled(checked);
    setIsSavingNotifications(true);
    try {
      await notificationsApi.updatePreferences({
        emailEnabled: emailNotifications,
        smsEnabled: checked,
        smsForCriticalOnly: criticalOnly,
      });
    } catch (error) {
      setSmsEnabled(previous);
      toast({
        title: 'Failed to update SMS notifications',
        description: error instanceof Error ? error.message : 'Unexpected error',
        variant: 'destructive',
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSavePhone = async () => {
    if (!phoneNumber.trim()) {
      toast({ title: 'Phone number is required', variant: 'destructive' });
      return;
    }
    setIsUpdatingPhone(true);
    try {
      await notificationsApi.updatePhoneNumber(phoneNumber.trim());
      setPhoneVerified(false);
      toast({ title: 'Phone number saved. Verify it to enable SMS alerts.' });
    } catch (error) {
      toast({
        title: 'Failed to update phone number',
        description: error instanceof Error ? error.message : 'Unexpected error',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const handleRemovePhone = async () => {
    setIsUpdatingPhone(true);
    try {
      await notificationsApi.removePhoneNumber();
      setPhoneNumber('');
      setPhoneVerified(false);
      setSmsEnabled(false);
      toast({ title: 'Phone number removed' });
    } catch (error) {
      toast({
        title: 'Failed to remove phone number',
        description: error instanceof Error ? error.message : 'Unexpected error',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    try {
      await notificationsApi.sendPhoneVerificationOtp();
      toast({ title: 'Verification code sent to your phone' });
    } catch (error) {
      toast({
        title: 'Failed to send verification code',
        description: error instanceof Error ? error.message : 'Unexpected error',
        variant: 'destructive',
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast({ title: 'Enter verification code', variant: 'destructive' });
      return;
    }
    setIsVerifyingPhone(true);
    try {
      await notificationsApi.verifyPhoneOtp(otp.trim());
      setPhoneVerified(true);
      setOtp('');
      toast({ title: 'Phone number verified' });
    } catch (error) {
      toast({
        title: 'Failed to verify code',
        description: error instanceof Error ? error.message : 'Unexpected error',
        variant: 'destructive',
      });
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleSendTestSms = async () => {
    setIsSendingTestSms(true);
    try {
      await notificationsApi.sendTestSms();
      toast({ title: 'Test SMS sent' });
    } catch (error) {
      toast({
        title: 'Failed to send test SMS',
        description: error instanceof Error ? error.message : 'Unexpected error',
        variant: 'destructive',
      });
    } finally {
      setIsSendingTestSms(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await authApi.deleteAccount();
      toast({ title: 'Account deleted successfully' });
      logout();
    } catch (error) {
      toast({
        title: 'Failed to delete account',
        description: error instanceof Error ? error.message : 'Unexpected error',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingAccount(false);
    }
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
                <UserIcon className="h-5 w-5 text-primary" />
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

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                  {(profile?.username || user?.username || 'U').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold text-foreground">{profile?.username || user?.username || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">{profile?.email || user?.email || 'N/A'}</p>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary mt-1">
                  {profile?.role || user?.role || 'USER'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Username</span>
                <span className="font-medium text-foreground">{profile?.username || user?.username || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{profile?.email || user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium text-foreground">{profile?.role || user?.role || 'N/A'}</span>
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
              <Switch checked={emailNotifications} onCheckedChange={handleToggleEmail} disabled={isSavingNotifications} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">Critical Alerts Only</p>
                <p className="text-sm text-muted-foreground">Only notify for critical severity</p>
              </div>
              <Switch checked={criticalOnly} onCheckedChange={handleToggleCritical} disabled={isSavingNotifications} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">SMS Notifications</p>
                <p className="text-sm text-muted-foreground">
                  {smsAvailable ? 'Receive alerts via SMS' : 'SMS provider is not configured on backend'}
                </p>
              </div>
              <Switch checked={smsEnabled} onCheckedChange={handleToggleSms} disabled={isSavingNotifications || !smsAvailable || !phoneVerified} />
            </div>

            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium text-foreground">Phone Verification</p>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                <Input
                  placeholder="+15551234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={handleSavePhone} disabled={isUpdatingPhone}>
                  {isUpdatingPhone ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save
                </Button>
                <Button type="button" variant="outline" onClick={handleRemovePhone} disabled={isUpdatingPhone || !phoneNumber}>
                  Remove
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Status: {phoneVerified ? 'Verified' : 'Not verified'}
              </div>
              <div className="grid gap-3 md:grid-cols-[auto_1fr_auto]">
                <Button type="button" variant="outline" onClick={handleSendOtp} disabled={isSendingOtp || !phoneNumber}>
                  {isSendingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Code
                </Button>
                <Input
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <Button type="button" onClick={handleVerifyOtp} disabled={isVerifyingPhone || !otp}>
                  {isVerifyingPhone ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify
                </Button>
              </div>
              <Button type="button" variant="secondary" onClick={handleSendTestSms} disabled={isSendingTestSms || !phoneVerified || !smsAvailable}>
                {isSendingTestSms ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                Send Test SMS
              </Button>
            </div>
          </div>
        </div>

        {/* SMS Dashboard */}
        {smsAvailable && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">SMS Dashboard</h2>
                <p className="text-sm text-muted-foreground">
                  {smsServiceStatus ? smsServiceStatus.message : 'SMS usage, quota, and delivery history'}
                </p>
              </div>
            </div>

            {/* SMS Quota */}
            {smsUsage && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hourly Quota</span>
                    <span className="font-medium">{smsUsage.hourlyUsed} / {smsUsage.hourlyLimit}</span>
                  </div>
                  <Progress value={smsUsage.hourlyLimit > 0 ? (smsUsage.hourlyUsed / smsUsage.hourlyLimit) * 100 : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">{smsUsage.hourlyRemaining} remaining this hour</p>
                </div>
                <div className="space-y-2 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Daily Quota</span>
                    <span className="font-medium">{smsUsage.dailyUsed} / {smsUsage.dailyLimit}</span>
                  </div>
                  <Progress value={smsUsage.dailyLimit > 0 ? (smsUsage.dailyUsed / smsUsage.dailyLimit) * 100 : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">{smsUsage.dailyRemaining} remaining today</p>
                </div>
              </div>
            )}

            {/* SMS Logs */}
            {smsLogs.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Recent SMS Activity</h3>
                <ScrollArea className="h-64 rounded-lg border border-border">
                  <div className="p-4 space-y-3">
                    {smsLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                        <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                          log.status === 'DELIVERED' ? 'bg-green-500' :
                          log.status === 'SENT' ? 'bg-blue-500' :
                          log.status === 'FAILED' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{log.phoneNumber}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              log.status === 'DELIVERED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              log.status === 'SENT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              log.status === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {log.status}
                            </span>
                          </div>
                          {log.messagePreview && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">{log.messagePreview}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                          {log.errorMessage && (
                            <p className="text-xs text-destructive mt-1">{log.errorMessage}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

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
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                  >
                    {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
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
