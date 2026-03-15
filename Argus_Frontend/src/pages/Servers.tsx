import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ServerCard } from '@/components/ServerCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Search, 
  Server as ServerIcon, 
  Loader2,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { serversApi, Server } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Servers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name-az');
  const { toast } = useToast();

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await serversApi.getAll();
        if (response.success) {
          setServers(response.data);
        }
      } catch (error) {
        toast({
          title: 'Failed to fetch servers',
          description: error instanceof Error ? error.message : 'Could not load servers',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchServers();
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchServers, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredServers = servers.filter((server) => {
    const matchesSearch = 
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.hostAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || server.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name-az': return a.name.localeCompare(b.name);
      case 'name-za': return b.name.localeCompare(a.name);
      case 'status': {
        const order = { CRITICAL: 0, WARNING: 1, OFFLINE: 2, ONLINE: 3, UNKNOWN: 4 };
        return (order[a.status] ?? 5) - (order[b.status] ?? 5);
      }
      case 'newest': {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      }
      case 'oldest': {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      }
      default: return 0;
    }
  });

  const statusCounts = {
    all: servers.length,
    ONLINE: servers.filter(s => s.status === 'ONLINE').length,
    OFFLINE: servers.filter(s => s.status === 'OFFLINE').length,
    WARNING: servers.filter(s => s.status === 'WARNING').length,
    CRITICAL: servers.filter(s => s.status === 'CRITICAL').length,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Servers</h1>
            <p className="mt-1 text-muted-foreground">
              Manage and monitor your server fleet
            </p>
          </div>
          <Link to="/servers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Server
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search servers by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({statusCounts.all})</SelectItem>
                <SelectItem value="ONLINE">Online ({statusCounts.ONLINE})</SelectItem>
                <SelectItem value="OFFLINE">Offline ({statusCounts.OFFLINE})</SelectItem>
                <SelectItem value="WARNING">Warning ({statusCounts.WARNING})</SelectItem>
                <SelectItem value="CRITICAL">Critical ({statusCounts.CRITICAL})</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-az">Name A-Z</SelectItem>
                <SelectItem value="name-za">Name Z-A</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Server Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="border-t border-border pt-4 flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredServers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
            <ServerIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-display text-lg font-medium text-foreground">
              {servers.length === 0 ? 'No servers yet' : 'No servers found'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {servers.length === 0
                ? 'Add your first server to start monitoring'
                : 'Try adjusting your search or filter'}
            </p>
            {servers.length === 0 && (
              <Link to="/servers/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Server
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
