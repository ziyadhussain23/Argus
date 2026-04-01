import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { serversApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function EditServer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [hostAddress, setHostAddress] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const fetchServer = async () => {
      if (!id) return;
      try {
        if (isNaN(Number(id))) { navigate('/servers'); return; }
        const response = await serversApi.getById(Number(id));
        if (response.success) {
          setName(response.data.name);
          setHostAddress(response.data.hostAddress);
          setDescription(response.data.description || '');
        }
      } catch {
        toast({ title: 'Failed to load server', variant: 'destructive' });
        navigate('/servers');
      } finally {
        setIsLoading(false);
      }
    };
    fetchServer();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !hostAddress.trim()) {
      toast({ title: 'Name and host address are required', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      await serversApi.update(Number(id), { name: name.trim(), hostAddress: hostAddress.trim(), description: description.trim() });
      toast({ title: 'Server updated successfully' });
      navigate(`/servers/${id}`);
    } catch (error) {
      toast({
        title: 'Failed to update server',
        description: error instanceof Error ? error.message : 'Backend may not support server updates yet.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/servers/${id}`)} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Edit Server</h1>
            <p className="mt-1 text-muted-foreground">Update server details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Server Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 255))}
              placeholder="e.g., Production Server 1"
              required
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="host">Host Address</Label>
            <Input
              id="host"
              value={hostAddress}
              onChange={(e) => setHostAddress(e.target.value)}
              placeholder="e.g., 192.168.1.100"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description (Optional)</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this server..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 flex-wrap">
            <Button type="button" variant="outline" onClick={() => navigate(`/servers/${id}`)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />Save Changes</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
