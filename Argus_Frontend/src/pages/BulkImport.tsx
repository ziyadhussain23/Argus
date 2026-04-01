import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Upload, FileText, Loader2, CheckCircle2, XCircle, Download } from 'lucide-react';
import { serversApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CsvRow {
  name: string;
  hostAddress: string;
  operatingSystem: string;
  description: string;
  status: 'pending' | 'importing' | 'success' | 'error';
  error?: string;
}

/** Parse a single CSV line respecting quoted fields */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string): CsvRow[] {
  // Strip BOM if present
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map(h => h.toLowerCase());
  const nameIdx = header.findIndex(h => h === 'name' || h === 'server name' || h === 'servername');
  const hostIdx = header.findIndex(h => h === 'host' || h === 'hostaddress' || h === 'host address' || h === 'ip' || h === 'address');
  const osIdx = header.findIndex(h => h === 'os' || h === 'operatingsystem' || h === 'operating system');
  const descIdx = header.findIndex(h => h === 'description' || h === 'desc' || h === 'notes');

  if (nameIdx === -1 || hostIdx === -1) return [];

  return lines.slice(1).map(line => {
    const cols = parseCsvLine(line);
    return {
      name: cols[nameIdx] || '',
      hostAddress: cols[hostIdx] || '',
      operatingSystem: osIdx >= 0 ? cols[osIdx] || 'Other Linux' : 'Other Linux',
      description: descIdx >= 0 ? cols[descIdx] || '' : '',
      status: 'pending' as const,
    };
  }).filter(row => row.name && row.hostAddress);
}

export default function BulkImport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({ title: 'Please select a .csv file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'CSV file must be under 5 MB.', variant: 'destructive' });
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        toast({ title: 'No valid rows found', description: 'Ensure CSV has "name" and "host" columns with data rows.', variant: 'destructive' });
        return;
      }
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.status === 'success') continue;

      setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'importing' } : r));

      try {
        await serversApi.create({
          name: row.name,
          hostAddress: row.hostAddress,
          operatingSystem: row.operatingSystem,
          description: row.description || undefined,
        });
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'success' } : r));
        successCount++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', error: msg } : r));
        failCount++;
      }
    }

    setIsImporting(false);
    toast({
      title: `Import complete: ${successCount} succeeded, ${failCount} failed`,
      variant: failCount > 0 ? 'destructive' : 'default',
    });
  };

  const downloadTemplate = () => {
    const csv = 'name,host,os,description\nWeb Server 1,192.168.1.10,Ubuntu 22.04 LTS,Production web server\nDB Server,192.168.1.20,CentOS 8,MySQL database server\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'argus-servers-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const pendingCount = rows.filter(r => r.status === 'pending').length;
  const successCount = rows.filter(r => r.status === 'success').length;
  const errorCount = rows.filter(r => r.status === 'error').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate('/servers')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Servers
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Bulk Import Servers</h1>
            <p className="mt-1 text-muted-foreground">
              Upload a CSV file to add multiple servers at once
            </p>
          </div>
        </div>

        {/* Upload Area */}
        {rows.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-8 sm:py-16 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground">Drop a CSV file or click to browse</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  CSV must have columns: name, host (required), os, description (optional)
                </p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
              <div className="flex justify-center mt-4">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV Template
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Table */}
        {rows.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {fileName}
                  </CardTitle>
                  <CardDescription>
                    {rows.length} server(s) found — {pendingCount} pending, {successCount} imported, {errorCount} failed
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setRows([]); setFileName(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                    Clear
                  </Button>
                  <Button onClick={handleImport} disabled={isImporting || pendingCount === 0}>
                    {isImporting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</>
                    ) : (
                      <><Upload className="mr-2 h-4 w-4" />Import {pendingCount} Server(s)</>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Host Address</TableHead>
                      <TableHead>OS</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, idx) => (
                      <TableRow key={idx} className={row.status === 'error' ? 'bg-destructive/5' : row.status === 'success' ? 'bg-success/5' : ''}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.hostAddress}</TableCell>
                        <TableCell>{row.operatingSystem}</TableCell>
                        <TableCell className="text-muted-foreground">{row.description || '—'}</TableCell>
                        <TableCell>
                          {row.status === 'pending' && <span className="text-xs text-muted-foreground">Pending</span>}
                          {row.status === 'importing' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                          {row.status === 'success' && <CheckCircle2 className="h-4 w-4 text-success" />}
                          {row.status === 'error' && (
                            <span className="flex items-center gap-1 text-xs text-destructive" title={row.error}>
                              <XCircle className="h-4 w-4" />
                              Failed
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
