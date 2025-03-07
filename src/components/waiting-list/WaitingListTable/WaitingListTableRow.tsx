import { memo, useCallback } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WaitingEntry } from '@/store/appStore';
import { formatDistanceToNow, format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface WaitingListTableRowProps {
  entry: WaitingEntry;
  index: number;
  isHistoryView: boolean;
  onNotify: (entryId: string) => Promise<void>;
  onMoveUp: (entryId: string) => Promise<void>;
  onMoveDown: (entryId: string) => Promise<void>;
  onEdit: (entry: WaitingEntry) => void;
  onOpenSeatingDialog: () => void;
  onNoShow: (entryId: string) => Promise<void>;
  onOpenRemoveDialog: () => void;
  totalEntries: number;
}

export const WaitingListTableRow = memo(function WaitingListTableRow({
  entry,
  index,
  isHistoryView,
  onNotify,
  onMoveUp,
  onMoveDown,
  onEdit,
  onOpenSeatingDialog,
  onNoShow,
  onOpenRemoveDialog,
  totalEntries
}: WaitingListTableRowProps) {
  // Format time
  const formatTime = useCallback((dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: ptBR });
  }, []);

  // Format waiting time
  const formatWaitingTime = useCallback((dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      locale: ptBR,
      addSuffix: false
    });
  }, []);

  // Get waiting time in minutes
  const getWaitingTimeInMinutes = useCallback((dateString: string) => {
    return differenceInMinutes(new Date(), new Date(dateString));
  }, []);

  // Get waiting time color based on duration
  const getWaitingTimeColor = useCallback((dateString: string) => {
    const minutes = getWaitingTimeInMinutes(dateString);
    if (minutes < 15) return 'text-green-600';
    if (minutes < 30) return 'text-yellow-600';
    return 'text-red-600';
  }, [getWaitingTimeInMinutes]);

  // Get status badge
  const getStatusBadge = useCallback((status: string) => {
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
  }, []);

  const handleNotify = useCallback(() => {
    onNotify(entry.id);
  }, [entry.id, onNotify]);

  const handleMoveUp = useCallback(() => {
    onMoveUp(entry.id);
  }, [entry.id, onMoveUp]);

  const handleMoveDown = useCallback(() => {
    onMoveDown(entry.id);
  }, [entry.id, onMoveDown]);

  const handleEdit = useCallback(() => {
    onEdit(entry);
  }, [entry, onEdit]);

  const handleNoShow = useCallback(() => {
    onNoShow(entry.id);
  }, [entry.id, onNoShow]);

  return (
    <TableRow 
      className={cn(
        entry.priority === 'high' && "bg-red-50 dark:bg-red-900/10",
        entry.status === 'notified' && "bg-yellow-50 dark:bg-yellow-900/10"
      )}
    >
      <TableCell className="font-medium">
        {entry.queue_number}
        {entry.priority === 'high' && (
          <Badge variant="outline" className="ml-2 bg-red-100 text-red-800">
            Prioritário
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{entry.customer_name}</div>
          <div className="text-sm text-muted-foreground">
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
            Pref: Área {entry.area_preference}
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
          <div className="flex items-center justify-end gap-2">
            {entry.status === 'waiting' && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleNotify}
                title="Notificar"
              >
                <Bell className="h-4 w-4 text-yellow-500" />
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onOpenSeatingDialog}
              title="Acomodar"
            >
              <Check className="h-4 w-4 text-green-500" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {entry.status === 'waiting' && (
                  <>
                    <DropdownMenuItem 
                      onClick={handleMoveUp}
                      disabled={index === 0}
                    >
                      <ChevronUp className="mr-2 h-4 w-4" />
                      <span>Mover para Cima</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={handleMoveDown}
                      disabled={index === totalEntries - 1}
                    >
                      <ChevronDown className="mr-2 h-4 w-4" />
                      <span>Mover para Baixo</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                  </>
                )}
                
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Editar</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={handleNoShow}>
                  <X className="mr-2 h-4 w-4 text-red-500" />
                  <span>Não Compareceu</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={onOpenRemoveDialog}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Remover</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
});