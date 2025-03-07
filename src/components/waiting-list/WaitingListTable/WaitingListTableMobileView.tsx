import { memo } from 'react';
import { WaitingEntry } from '@/store/appStore';
import { formatDistanceToNow, format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface WaitingListTableMobileViewProps {
  entries: WaitingEntry[];
  isHistoryView: boolean;
  onNotify: (entryId: string) => Promise<void>;
  onMoveUp: (entryId: string) => Promise<void>;
  onMoveDown: (entryId: string) => Promise<void>;
  onEdit: (entry: WaitingEntry) => void;
  onOpenSeatingDialog: (entry: WaitingEntry) => void;
  onNoShow: (entryId: string) => Promise<void>;
  onOpenRemoveDialog: (entry: WaitingEntry) => void;
}

export const WaitingListTableMobileView = memo(function WaitingListTableMobileView({
  entries,
  isHistoryView,
  onNotify,
  onMoveUp,
  onMoveDown,
  onEdit,
  onOpenSeatingDialog,
  onNoShow,
  onOpenRemoveDialog
}: WaitingListTableMobileViewProps) {
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

  // Get waiting time color based on duration
  const getWaitingTimeColor = (dateString: string) => {
    const minutes = differenceInMinutes(new Date(), new Date(dateString));
    if (minutes < 15) return 'text-green-600';
    if (minutes < 30) return 'text-yellow-600';
    return 'text-red-600';
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

  return (
    <div className="space-y-4 p-2">
      {entries.map((entry, index) => (
        <div 
          key={entry.id}
          className={cn(
            "border rounded-lg p-4 bg-card",
            entry.priority === 'high' && "border-red-300 bg-red-50 dark:bg-red-900/10",
            entry.status === 'notified' && "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10"
          )}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">#{entry.queue_number}</span>
                <h3 className="font-medium">{entry.customer_name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {entry.party_size} pessoas • Aguardando {formatWaitingTime(entry.created_at)}
              </p>
            </div>
            {getStatusBadge(entry.status)}
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-sm">{formatTime(entry.created_at)}</span>
            </div>
            <div className={cn(
              "font-medium text-sm",
              getWaitingTimeColor(entry.created_at)
            )}>
              {formatWaitingTime(entry.created_at)}
            </div>
          </div>
          
          {entry.notes && (
            <div className="bg-muted/30 p-2 rounded-md mb-2 flex items-start">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
              <p className="text-sm">{entry.notes}</p>
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-2">
            {isHistoryView ? (
              <div className="text-sm text-muted-foreground">
                {entry.status === 'seated' 
                  ? `Acomodado às ${formatTime(entry.updated_at)}` 
                  : `No-show às ${formatTime(entry.updated_at)}`}
              </div>
            ) : (
              <>
                {entry.status === 'waiting' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onNotify(entry.id)}
                  >
                    <Bell className="h-4 w-4 mr-1" />
                    Notificar
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onOpenSeatingDialog(entry)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Acomodar
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {entry.status === 'waiting' && (
                      <>
                        <DropdownMenuItem onClick={() => onMoveUp(entry.id)}>
                          <ChevronUp className="mr-2 h-4 w-4" />
                          <span>Mover para Cima</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => onMoveDown(entry.id)}>
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
                    
                    <DropdownMenuItem onClick={() => onNoShow(entry.id)}>
                      <X className="mr-2 h-4 w-4 text-red-500" />
                      <span>Não Compareceu</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => onOpenRemoveDialog(entry)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Remover</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});