import { useState } from 'react';
import { WaitingEntry, TableWithArea, RestaurantArea } from '@/store/appStore';
import { WaitingListTableHeader } from './WaitingListTableHeader';
import { WaitingListTableRow } from './WaitingListTableRow';
import { WaitingListTableEmptyState } from './WaitingListTableEmptyState';
import { WaitingListTableStatusDialog } from './WaitingListTableStatusDialog';
import { WaitingListTableMobileView } from './WaitingListTableMobileView';

interface WaitingListTableContainerProps {
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

export function WaitingListTableContainer({
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
}: WaitingListTableContainerProps) {
  const [selectedEntry, setSelectedEntry] = useState<WaitingEntry | null>(null);
  const [isSeatingDialogOpen, setIsSeatingDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Empty state
  if (entries.length === 0) {
    return <WaitingListTableEmptyState isHistoryView={isHistoryView} />;
  }

  return (
    <div className="h-full w-full overflow-auto">
      {/* Desktop View */}
      <div className="hidden md:block w-full">
        <Table>
          <WaitingListTableHeader isHistoryView={isHistoryView} />
          <TableBody>
            {entries.map((entry, index) => (
              <WaitingListTableRow
                key={entry.id}
                entry={entry}
                index={index}
                isHistoryView={isHistoryView}
                onNotify={onNotify}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onEdit={onEdit}
                onOpenSeatingDialog={() => {
                  setSelectedEntry(entry);
                  setIsSeatingDialogOpen(true);
                }}
                onNoShow={onNoShow}
                onOpenRemoveDialog={() => {
                  setSelectedEntry(entry);
                  setIsRemoveDialogOpen(true);
                }}
                totalEntries={entries.length}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Mobile View */}
      <div className="md:hidden">
        <WaitingListTableMobileView 
          entries={entries}
          isHistoryView={isHistoryView}
          onNotify={onNotify}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onEdit={onEdit}
          onOpenSeatingDialog={(entry) => {
            setSelectedEntry(entry);
            setIsSeatingDialogOpen(true);
          }}
          onNoShow={onNoShow}
          onOpenRemoveDialog={(entry) => {
            setSelectedEntry(entry);
            setIsRemoveDialogOpen(true);
          }}
        />
      </div>
      
      {/* Seating Dialog */}
      <WaitingListTableStatusDialog
        isOpen={isSeatingDialogOpen}
        onClose={() => setIsSeatingDialogOpen(false)}
        title="Acomodar Cliente"
        selectedEntry={selectedEntry}
        areas={areas}
        tables={availableTables}
        tablesLoading={tablesLoading}
        selectedAreaId={selectedAreaId}
        selectedTableId={selectedTableId}
        onAreaChange={setSelectedAreaId}
        onTableChange={setSelectedTableId}
        onConfirm={handleSeat}
        isLoading={isLoading}
        confirmText="Acomodar Cliente"
      />
      
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