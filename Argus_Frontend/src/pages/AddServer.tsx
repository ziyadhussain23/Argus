import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Server, 
  Loader2, 
  Copy, 
  Check,
  Terminal,
  Download
} from 'lucide-react';
import { serversApi, Server as ServerType, getApiBaseUrl } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const operatingSystems = [
  'Ubuntu 22.04 LTS',
  'Ubuntu 20.04 LTS',
  'Debian 12',
  'Debian 11',
  'CentOS 8',
  'CentOS 7',
  'RHEL 8',
  'RHEL 9',
  'Amazon Linux 2',
  'Other',
];

export default function AddServer() {
  const [name, setName] = useState('');
  const [hostAddress, setHostAddress] = useState('');
  const [operatingSystem, setOperatingSystem] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdServer, setCreatedServer] = useState<ServerType | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await serversApi.create({
        name,
        hostAddress,
        operatingSystem,
        description,
      });

      if (response.success) {
        setCreatedServer(response.data);
        toast({
          title: 'Server registered!',
          description: 'Now configure the agent on your server.',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to register server',
        description: error instanceof Error ? error.message : 'Could not register server',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyAgentKey = () => {
    if (createdServer?.agentKey) {
      navigator.clipboard.writeText(createdServer.agentKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (createdServer) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl space-y-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/servers')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Servers
          </Button>

          <div className="rounded-xl border border-success/30 bg-success/5 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                <Check className="h-5 w-5 text-success" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Server Registered Successfully!
                </h2>
                <p className="text-sm text-muted-foreground">
                  {createdServer.name} ({createdServer.hostAddress})
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Configure Agent
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Agent Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={createdServer.agentKey}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" onClick={copyAgentKey}>
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Keep this key secure. You'll need it to configure the agent.
                </p>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <Terminal className="h-4 w-4" />
                  Installation Steps
                </div>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Download the agent script to your server</li>
                  <li>Make it executable: <code className="text-primary">chmod +x argus-agent.sh</code></li>
                  <li>Configure the AGENT_KEY in the script with the key above</li>
                  <li>Set up a cron job or systemd service to run the agent</li>
                </ol>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => navigate(`/servers/${createdServer.id}`)}>
                View Server Details
              </Button>
              <Button variant="outline" onClick={() => navigate('/servers')}>
                Go to Servers
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl space-y-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/servers')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Servers
        </Button>

        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Add Server</h1>
          <p className="mt-1 text-muted-foreground">
            Register a new server for monitoring
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Server Information</h3>
                <p className="text-sm text-muted-foreground">Basic details about your server</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Server Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Production Server 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hostAddress">Host Address</Label>
                <Input
                  id="hostAddress"
                  placeholder="e.g., 192.168.1.100 or server.example.com"
                  value={hostAddress}
                  onChange={(e) => setHostAddress(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="os">Operating System</Label>
                <Select value={operatingSystem} onValueChange={setOperatingSystem} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select operating system" />
                  </SelectTrigger>
                  <SelectContent>
                    {operatingSystems.map((os) => (
                      <SelectItem key={os} value={os}>
                        {os}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this server's purpose..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/servers')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Server'
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
