import { useState } from 'react';
import { WaitingEntry, RestaurantArea, TableWithArea } from '@/hooks/useWaitingList';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MoreHorizontal, 
  Bell, 
  Check, 
  X, 
  ChevronUp, 
  ChevronDown,
  Edit,
  Trash2,
  Users,
  Clock,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow, format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface WaitingListTableProps {
  entries: WaitingEntry[];
  onNotify: (entryId: string) => Promise<void>;
  onSeat: (entryId: string, tableId?: string) => Promise<void>;
  onNoShow: (entryId: string) => Promise<void>;
  onMoveUp: (entryId: string) => Promise<void>;
  onMoveDown: (entryId: string) => Promise<void>;
  onEdit: (entry: WaitingEntry) => void;
  onRemove: (entryId: string) => Promise<void>;
  tables: TableWithArea[];
  areas: RestaurantArea[];
  tablesLoading: boolean;
  isHistoryView?: boolean;
}

export function WaitingListTable({
  entries,
  onNotify,
  onSeat,
  onNoShow,
  onMoveUp,
  onMoveDown,
  onEdit,
  onRemove,
  tables,
  areas,
  tablesLoading,
  isHistoryView = false
}: WaitingListTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<WaitingEntry | null>(null);
  const [isSeatingDialogOpen, setIsSeatingDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Format time
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: ptBR });
  };

  // Format waiting time
  const formatWaitingTime = (dateString: string) => {
    const waitingTime = formatDistanceToNow(new Date(dateString), { 
      locale: ptBR,
      addSuffix: false
    });
    return waitingTime;
  };

  // Get waiting time in minutes
  const getWaitingTimeInMinutes = (dateString: string) => {
    return differenceInMinutes(new Date(), new Date(dateString));
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Aguardando</Badge>;
      case 'notified':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Notificado</Badge>;
      case 'seated':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Acomodado</Badge>;
      case 'no_show':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Não Compareceu</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Alta</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Média</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Baixa</Badge>;
      default:
        return null;
    }
  };

  // Handle seating a customer
  const handleSeat = async () => {
    if (!selectedEntry) return;
    
    setIsLoading(true);
    try {
      await onSeat(selectedEntry.id, selectedTableId || undefined);
      setIsSeatingDialogOpen(false);
      setSelectedEntry(null);
      setSelectedTableId(null);
      setSelectedAreaId(null);
    } catch (error) {
      console.error('Error seating customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle removing a customer
  const handleRemove = async () => {
    if (!selectedEntry) return;
    
    setIsLoading(true);
    try {
      await onRemove(selectedEntry.id);
      setIsRemoveDialogOpen(false);
      setSelectedEntry(null);
    } catch (error) {
      console.error('Error removing customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tables by area
  const getTablesByArea = () => {
    if (!selectedAreaId) return tables.filter(table => table.status === 'available');
    return tables.filter(table => table.area_id === selectedAreaId && table.status === 'available');
  };

  // Get available tables
  const availableTables = getTablesByArea();

  // Get waiting time color based on duration
  const getWaitingTimeColor = (dateString: string) => {
    const minutes = getWaitingTimeInMinutes(dateString);
    if (minutes < 15) return 'text-green-600';
    if (minutes < 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Empty state
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhum cliente na fila</h3>
        <p className="text-muted-foreground text-center max-w-md">
          {isHistoryView 
            ? "Não há registros de clientes para hoje nesta categoria."
            : "Adicione clientes à fila de espera para começar a gerenciar."}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto">
      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Pessoas</TableHead>
              <TableHead className="hidden md:table-cell">Chegada</TableHead>
              <TableHead className="hidden md:table-cell">Espera</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow 
                key={entry.id}
                className={cn(
                  entry.priority === 'high' && "bg-red-50 dark:bg-red-900/10",
                  entry.status === 'notified' && "bg-yellow-50 dark:bg-yellow-900/10"
                )}
              >
                <TableCell className="font-medium">
                  {entry.queue_number}
                  {entry.priority && (
                    <div className="mt-1">
                      {getPriorityBadge(entry.priority)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{entry.customer_name}</div>
                    <div className="text-sm text-muted-foreground flex items-center">
                      {entry.phone_number}
                      {entry.notes && (
                        <span className="ml-2 text-xs bg-muted px-1 py-0.5 rounded">
                          Obs
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>{entry.party_size}</span>
                  </div>
                  {entry.area_preference && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Pref: {areas.find(a => a.id === entry.area_preference)?.name || 'Área desconhecida'}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>{formatTime(entry.created_at)}</span>
                  </div>
                  {entry.estimated_wait_time && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Est: {entry.estimated_wait_time} min
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className={cn(
                    "font-medium",
                    getWaitingTimeColor(entry.created_at)
                  )}>
                    {formatWaitingTime(entry.created_at)}
                  </div>
                  {entry.notification_time && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Notificado: {formatTime(entry.notification_time)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {getStatusBadge(entry.status)}
                </TableCell>
                <TableCell className="text-right">
                  {isHistoryView ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-muted-foreground">
                        {entry.status === 'seated' 
                          ? `Acomodado às ${formatTime(entry.updated_at)}` 
                          : `No-show às ${formatTime(entry.updated_at)}`}
                      </span>
                    </div>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {entry.status === 'waiting' && (
                          <DropdownMenuItem onClick={() => onNotify(entry.id)}>
                            <Bell className="mr-2 h-4 w-4 text-yellow-500" />
                            <span>Notificar</span>
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedEntry(entry);
                            setIsSeatingDialogOpen(true);
                          }}
                        >
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          <span>Acomodar</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => onNoShow(entry.id)}>
                          <X className="mr-2 h-4 w-4 text-red-500" />
                          <span>Não Compareceu</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {entry.status === 'waiting' && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => onMoveUp(entry.id)}
                              disabled={index === 0}
                            >
                              <ChevronUp className="mr-2 h-4 w-4" />
                              <span>Mover para Cima</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={() => onMoveDown(entry.id)}
                              disabled={index === entries.length - 1}
                            >
                              <ChevronDown className="mr-2 h-4 w-4" />
                              <span>Mover para Baixo</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                          </>
                        )}
                        
                        <DropdownMenuItem onClick={() => onEdit(entry)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedEntry(entry);
                            setIsRemoveDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Remover</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Seating Dialog */}
      <Dialog open={isSeatingDialogOpen} onOpenChange={setIsSeatingDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Acomodar Cliente</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedEntry && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{selectedEntry.customer_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedEntry.party_size} pessoas • Aguardando {formatWaitingTime(selectedEntry.created_at)}
                    </p>
                  </div>
                  {getStatusBadge(selectedEntry.status)}
                </div>
                
                <div className="space-y-3">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Área</label>
                    <Select 
                      value={selectedAreaId || "none"} 
                      onValueChange={(value) => setSelectedAreaId(value === "none" ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma área" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Todas as áreas</SelectItem>
                        {areas.map(area => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Mesa</label>
                    <Select 
                      value={selectedTableId || "none"} 
                      onValueChange={(value) => setSelectedTableId(value === "none" ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma mesa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem mesa específica</SelectItem>
                        {tablesLoading ? (
                          <SelectItem value="loading" disabled>Carregando mesas...</SelectItem>
                        ) : availableTables.length > 0 ? (
                          availableTables.map(table => (
                            <SelectItem key={table.id} value={table.id}>
                              Mesa {table.number} ({table.capacity} lugares) - {table.area.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none-available" disabled>Nenhuma mesa disponível</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {selectedEntry.notes && (
                  <div className="bg-muted/30 p-3 rounded-md">
                    <div className="flex items-start">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                      <div>
                        <p className="text-sm font-medium">Observações</p>
                        <p className="text-sm">{selectedEntry.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSeatingDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSeat} disabled={isLoading}>
              {isLoading ? 'Processando...' : 'Acomodar Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Remove Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remover Cliente</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedEntry && (
              <div>
                <p>
                  Tem certeza que deseja remover <strong>{selectedEntry.customer_name}</strong> da fila de espera?
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={isLoading}>
              {isLoading ? 'Removendo...' : 'Remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}