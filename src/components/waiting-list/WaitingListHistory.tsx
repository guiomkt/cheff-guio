import { useState } from 'react';
import { WaitingEntry } from '@/hooks/useWaitingList';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Clock, 
  Calendar,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { cn } from '@/lib/utils';

interface WaitingListHistoryProps {
  entries: WaitingEntry[];
}

export function WaitingListHistory({ entries }: WaitingListHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };
  
  // Format time
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: ptBR });
  };
  
  // Calculate waiting time
  const calculateWaitingTime = (createdAt: string, updatedAt: string) => {
    const waitingMinutes = differenceInMinutes(
      new Date(updatedAt),
      new Date(createdAt)
    );
    
    return `${waitingMinutes} min`;
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'seated':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Acomodado</Badge>;
      case 'no_show':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Não Compareceu</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };
  
  // Filter entries by search query and date range
  const filteredEntries = entries.filter(entry => {
    // Filter by search query
    const matchesSearch = searchQuery === '' || 
      entry.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.phone_number.includes(searchQuery);
    
    // Filter by date range
    let matchesDateRange = true;
    if (dateRange?.from) {
      const entryDate = new Date(entry.created_at);
      entryDate.setHours(0, 0, 0, 0);
      
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        
        matchesDateRange = entryDate >= fromDate && entryDate <= toDate;
      } else {
        matchesDateRange = entryDate.getTime() === fromDate.getTime();
      }
    }
    
    return matchesSearch && matchesDateRange;
  });
  
  // Group entries by date
  const groupedEntries = filteredEntries.reduce((groups, entry) => {
    const date = format(new Date(entry.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, WaitingEntry[]>);
  
  // Sort dates in descending order
  const sortedDates = Object.keys(groupedEntries).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome ou telefone..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <DateRangePicker
          date={dateRange}
          onSelect={setDateRange}
        />
        
        <Button 
          variant="outline" 
          onClick={() => {
            setSearchQuery('');
            setDateRange(undefined);
          }}
        >
          Limpar Filtros
        </Button>
      </div>
      
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum registro encontrado</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Não foram encontrados registros com os filtros aplicados.
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          {sortedDates.map(date => (
            <div key={date} className="mb-6">
              <h3 className="font-medium mb-2">
                {formatDate(date)}
              </h3>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Pessoas</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Espera</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedEntries[date].map(entry => (
                    <TableRow 
                      key={entry.id}
                      className={cn(
                        entry.status === 'no_show' && "bg-red-50 dark:bg-red-900/10"
                      )}
                    >
                      <TableCell className="font-medium">{entry.queue_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{entry.phone_number}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{entry.party_size}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{formatTime(entry.created_at)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Finalizado: {formatTime(entry.updated_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {calculateWaitingTime(entry.created_at, entry.updated_at)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(entry.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </ScrollArea>
      )}
    </div>
  );
}