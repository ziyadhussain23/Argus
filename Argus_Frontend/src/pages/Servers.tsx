import { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ServerCard } from '@/components/ServerCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  Server as ServerIcon,
  Filter,
  ArrowUpDown,
  Upload,
  Eye,
  Pencil,
  Trash2,
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const SERVERS_PER_PAGE = 9;

export default function Servers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name-az');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
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
    // Poll every 10 seconds, but pause when tab is hidden
    let interval = setInterval(fetchServers, 10000);
    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        fetchServers();
        interval = setInterval(fetchServers, 10000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    return () => clearTimeout(debounceTimer.current);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const filteredServers = useMemo(() => servers.filter((server) => {
    const matchesSearch =
      server.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      server.hostAddress.toLowerCase().includes(debouncedSearch.toLowerCase());
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
  }), [servers, debouncedSearch, statusFilter, sortBy]);

  const statusCounts = useMemo(() => ({
    all: servers.length,
    ONLINE: servers.filter(s => s.status === 'ONLINE').length,
    OFFLINE: servers.filter(s => s.status === 'OFFLINE').length,
    WARNING: servers.filter(s => s.status === 'WARNING').length,
    CRITICAL: servers.filter(s => s.status === 'CRITICAL').length,
  }), [servers]);

  const totalPages = Math.max(1, Math.ceil(filteredServers.length / SERVERS_PER_PAGE));
  const paginatedServers = filteredServers.slice(
    (currentPage - 1) * SERVERS_PER_PAGE,
    currentPage * SERVERS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, sortBy]);

  const handleDeleteServer = async (server: Server) => {
    try {
      await serversApi.delete(server.id);
      setServers(prev => prev.filter(s => s.id !== server.id));
      toast({ title: `Server "${server.name}" deleted` });
    } catch {
      toast({ title: 'Failed to delete server', variant: 'destructive' });
    }
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
          <div className="flex items-center gap-2">
            <Link to="/servers/import">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import
              </Button>
            </Link>
            <Link to="/servers/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Server
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search servers by name or address..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
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
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedServers.map((server) => (
                <ContextMenu key={server.id}>
                  <ContextMenuTrigger>
                    <HoverCard openDelay={400} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <div>
                          <ServerCard server={server} />
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-72" side="right">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">{server.name}</h4>
                          <p className="text-xs text-muted-foreground">{server.hostAddress}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <div className={`h-2 w-2 rounded-full ${server.status === 'ONLINE' ? 'bg-success' : server.status === 'CRITICAL' ? 'bg-destructive' : server.status === 'WARNING' ? 'bg-warning' : 'bg-muted-foreground'}`} />
                            <span>{server.status}</span>
                          </div>
                          {server.lastHeartbeat && (
                            <p className="text-xs text-muted-foreground">
                              Last heartbeat: {new Date(server.lastHeartbeat).toLocaleString()}
                            </p>
                          )}
                          {server.activeAlerts > 0 && (
                            <p className="text-xs text-destructive font-medium">{server.activeAlerts} active alert{server.activeAlerts > 1 ? 's' : ''}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{server.operatingSystem}</p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => navigate(`/servers/${server.id}`)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => navigate(`/servers/${server.id}/edit`)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Server
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem className="text-destructive" onClick={() => handleDeleteServer(server)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Server
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                    .map((page, idx, arr) => (
                      <span key={page} className="contents">
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <PaginationItem><PaginationEllipsis /></PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            isActive={currentPage === page}
                            onClick={() => setCurrentPage(page)}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </span>
                    ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
