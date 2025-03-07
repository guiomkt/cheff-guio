import { memo } from 'react';
import { WaitingEntry, RestaurantArea, TableWithArea } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare } from 'lucide-react';
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
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WaitingListTableStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  selectedEntry: WaitingEntry | null;
  areas: RestaurantArea[];
  tables: TableWithArea[];
  tablesLoading: boolean;
  selectedAreaId: string | null;
  selectedTableId: string | null;
  onAreaChange: (areaId: string | null) => void;
  onTableChange: (tableId: string | null) => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  confirmText: string;
}

export const WaitingListTableStatusDialog = memo(function WaitingListTableStatusDialog({
  isOpen,
  onClose,
  title,
  selectedEntry,
  areas,
  tables,
  tablesLoading,
  selectedAreaId,
  selectedTableId,
  onAreaChange,
  onTableChange,
  onConfirm,
  isLoading,
  confirmText
}: WaitingListTableStatusDialogProps) {
  // Format waiting time
  const formatWaitingTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      locale: ptBR,
      addSuffix: false
    });
  };

  if (!selectedEntry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{selectedEntry.customer_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedEntry.party_size} pessoas • Aguardando {formatWaitingTime(selectedEntry.created_at)}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label>Área</Label>
                <Select 
                  value={selectedAreaId || "none"} 
                  onValueChange={(value) => onAreaChange(value === "none" ? null : value)}
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
                <Label>Mesa</Label>
                <Select 
                  value={selectedTableId || "none"} 
                  onValueChange={(value) => onTableChange(value === "none" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma mesa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem mesa específica</SelectItem>
                    {tablesLoading ? (
                      <SelectItem value="loading" disabled>Carregando mesas...</SelectItem>
                    ) : tables.length > 0 ? (
                      tables.map(table => (
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processando...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});