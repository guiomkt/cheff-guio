import { useState, useEffect } from 'react';
import { TableWithArea, TableShape, TableStatus } from '@/hooks/useTables';
import { RestaurantArea } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Ban,
  Square,
  Circle,
  RectangleHorizontal
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface TableSidebarProps {
  selectedTable: TableWithArea | null;
  selectedArea: RestaurantArea | null;
  onUpdateTable: (tableId: string, tableData: Partial<TableWithArea>) => Promise<any>;
  onDeleteTable: (tableId: string) => Promise<boolean>;
  onChangeStatus: (tableId: string, status: TableStatus, notes?: string) => Promise<any>;
  onUpdateArea: (areaId: string, areaData: Partial<RestaurantArea>) => Promise<any>;
  onDeleteArea: (areaId: string) => Promise<boolean>;
  onSelectArea: (area: RestaurantArea | null) => void;
  isEditMode: boolean;
  areas: RestaurantArea[];
}

export function TableSidebar({
  selectedTable,
  selectedArea,
  onUpdateTable,
  onDeleteTable,
  onChangeStatus,
  onUpdateArea,
  onDeleteArea,
  onSelectArea,
  isEditMode,
  areas
}: TableSidebarProps) {
  const [tableForm, setTableForm] = useState<Partial<TableWithArea>>({});
  const [areaForm, setAreaForm] = useState<Partial<RestaurantArea>>({});
  const [statusNotes, setStatusNotes] = useState('');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusToChange, setStatusToChange] = useState<TableStatus | null>(null);
  
  // Update table form when selected table changes
  useEffect(() => {
    if (selectedTable) {
      setTableForm(selectedTable);
    } else {
      setTableForm({});
    }
  }, [selectedTable]);
  
  // Update area form when selected area changes
  useEffect(() => {
    if (selectedArea) {
      setAreaForm(selectedArea);
    } else {
      setAreaForm({});
    }
  }, [selectedArea]);
  
  // Handle table form change
  const handleTableFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTableForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle table number change (must be a number)
  const handleTableNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setTableForm(prev => ({ ...prev, number: value }));
    }
  };
  
  // Handle table capacity change (must be a number)
  const handleTableCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setTableForm(prev => ({ ...prev, capacity: value }));
    }
  };
  
  // Handle table shape change
  const handleTableShapeChange = (value: string) => {
    setTableForm(prev => ({ ...prev, shape: value as TableShape }));
  };
  
  // Handle table area change
  const handleTableAreaChange = (value: string) => {
    setTableForm(prev => ({ ...prev, area_id: value }));
  };
  
  // Handle table save
  const handleTableSave = async () => {
    if (!selectedTable) return;
    
    // Create a copy of the form data without the area property
    const { area, ...tableDataToSave } = tableForm;
    
    await onUpdateTable(selectedTable.id, tableDataToSave);
  };
  
  // Handle table delete
  const handleTableDelete = async () => {
    if (!selectedTable) return;
    
    await onDeleteTable(selectedTable.id);
  };
  
  // Handle table status change
  const handleTableStatusChange = async (status: TableStatus) => {
    if (!selectedTable) return;
    
    setStatusToChange(status);
    setShowStatusDialog(true);
  };
  
  // Confirm status change
  const confirmStatusChange = async () => {
    if (!selectedTable || !statusToChange) return;
    
    await onChangeStatus(selectedTable.id, statusToChange, statusNotes);
    setStatusNotes('');
    setShowStatusDialog(false);
    setStatusToChange(null);
  };
  
  // Handle area form change
  const handleAreaFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAreaForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle area number change (must be a number)
  const handleAreaNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setAreaForm(prev => ({ ...prev, [field]: value }));
    }
  };
  
  // Handle area active change
  const handleAreaActiveChange = (checked: boolean) => {
    setAreaForm(prev => ({ ...prev, is_active: checked }));
  };
  
  // Handle area save
  const handleAreaSave = async () => {
    if (!selectedArea) return;
    
    await onUpdateArea(selectedArea.id, areaForm);
  };
  
  // Handle area delete
  const handleAreaDelete = async () => {
    if (!selectedArea) return;
    
    await onDeleteArea(selectedArea.id);
  };
  
  // Get status color
  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available': return 'text-green-500';
      case 'occupied': return 'text-red-500';
      case 'reserved': return 'text-blue-500';
      case 'blocked': return 'text-gray-500';
      default: return 'text-green-500';
    }
  };
  
  // Get status label
  const getStatusLabel = (status: TableStatus) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'occupied': return 'Ocupada';
      case 'reserved': return 'Reservada';
      case 'blocked': return 'Bloqueada';
      default: return 'Desconhecido';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: TableStatus) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-5 w-5" />;
      case 'occupied': return <XCircle className="h-5 w-5" />;
      case 'reserved': return <Clock className="h-5 w-5" />;
      case 'blocked': return <Ban className="h-5 w-5" />;
      default: return <CheckCircle className="h-5 w-5" />;
    }
  };
  
  // Get shape icon
  const getShapeIcon = (shape: TableShape) => {
    switch (shape) {
      case 'square': return <Square className="h-5 w-5" />;
      case 'round': return <Circle className="h-5 w-5" />;
      case 'rectangle': return <RectangleHorizontal className="h-5 w-5" />;
      default: return <Square className="h-5 w-5" />;
    }
  };
  
  return (
    <div className="w-80 border-l p-4 overflow-y-auto">
      {selectedTable ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Mesa {selectedTable.number}</h3>
            <div className={`flex items-center ${getStatusColor(selectedTable.status as TableStatus)}`}>
              {getStatusIcon(selectedTable.status as TableStatus)}
              <span className="ml-1 text-sm">{getStatusLabel(selectedTable.status as TableStatus)}</span>
            </div>
          </div>
          
          <Separator />
          
          {isEditMode ? (
            // Edit mode - show form
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="number">Número da Mesa</Label>
                <Input
                  id="number"
                  name="number"
                  type="number"
                  value={tableForm.number || ''}
                  onChange={handleTableNumberChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Mesa (opcional)</Label>
                <Input
                  id="name"
                  name="name"
                  value={tableForm.name || ''}
                  onChange={handleTableFormChange}
                  placeholder="Ex: Mesa VIP"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacidade (pessoas)</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  value={tableForm.capacity || ''}
                  onChange={handleTableCapacityChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="shape">Formato</Label>
                <Select 
                  value={tableForm.shape || 'square'} 
                  onValueChange={handleTableShapeChange}
                >
                  <SelectTrigger id="shape">
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="square">
                      <div className="flex items-center">
                        <Square className="h-4 w-4 mr-2" />
                        <span>Quadrada</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="round">
                      <div className="flex items-center">
                        <Circle className="h-4 w-4 mr-2" />
                        <span>Redonda</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="rectangle">
                      <div className="flex items-center">
                        <RectangleHorizontal className="h-4 w-4 mr-2" />
                        <span>Retangular</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="area_id">Área</Label>
                <Select 
                  value={tableForm.area_id || selectedTable.area_id} 
                  onValueChange={handleTableAreaChange}
                >
                  <SelectTrigger id="area_id">
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map(area => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={tableForm.is_active !== false}
                  onCheckedChange={(checked) => setTableForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Mesa Ativa</Label>
              </div>
              
              <div className="flex justify-between pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Mesa</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a Mesa {selectedTable.number}? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleTableDelete}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button size="sm" onClick={handleTableSave}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          ) : (
            // View mode - show details and status actions
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Área</p>
                  <p>{selectedTable.area.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacidade</p>
                  <p>{selectedTable.capacity} pessoas</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Formato</p>
                  <div className="flex items-center">
                    {getShapeIcon(selectedTable.shape as TableShape)}
                    <span className="ml-1">
                      {selectedTable.shape === 'square' ? 'Quadrada' : 
                       selectedTable.shape === 'round' ? 'Redonda' : 'Retangular'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className={getStatusColor(selectedTable.status as TableStatus)}>
                    {getStatusLabel(selectedTable.status as TableStatus)}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-2">Alterar Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start"
                    onClick={() => handleTableStatusChange('available')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Disponível
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start"
                    onClick={() => handleTableStatusChange('occupied')}
                  >
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                    Ocupada
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start"
                    onClick={() => handleTableStatusChange('reserved')}
                  >
                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                    Reservada
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start"
                    onClick={() => handleTableStatusChange('blocked')}
                  >
                    <Ban className="h-4 w-4 mr-2 text-gray-500" />
                    Bloqueada
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status-notes">Observações (opcional)</Label>
                <Textarea
                  id="status-notes"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Ex: Cliente solicitou mesa próxima à janela"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      ) : selectedArea ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Área: {selectedArea.name}</h3>
            {selectedArea.is_active ? (
              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Ativa
              </span>
            ) : (
              <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                Inativa
              </span>
            )}
          </div>
          
          <Separator />
          
          {isEditMode ? (
            // Edit mode - show form
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="area-name">Nome da Área</Label>
                <Input
                  id="area-name"
                  name="name"
                  value={areaForm.name || ''}
                  onChange={handleAreaFormChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="area-description">Descrição</Label>
                <Textarea
                  id="area-description"
                  name="description"
                  value={areaForm.description || ''}
                  onChange={handleAreaFormChange}
                  rows={3}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="area-max-capacity">Capacidade Máxima (pessoas)</Label>
                <Input
                  id="area-max-capacity"
                  name="max_capacity"
                  type="number"
                  value={areaForm.max_capacity || ''}
                  onChange={(e) => handleAreaNumberChange(e, 'max_capacity')}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="area-max-tables">Capacidade de Mesas</Label>
                <Input
                  id="area-max-tables"
                  name="max_tables"
                  type="number"
                  value={areaForm.max_tables || ''}
                  onChange={(e) => handleAreaNumberChange(e, 'max_tables')}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="area-is-active"
                  checked={areaForm.is_active !== false}
                  onCheckedChange={handleAreaActiveChange}
                />
                <Label htmlFor="area-is-active">Área Ativa</Label>
              </div>
              
              <div className="flex justify-between pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Área</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a área {selectedArea.name}? Esta ação não pode ser desfeita.
                        
                        {/* Show warning if area has tables */}
                        <p className="mt-2 text-red-500">
                          Você precisa remover todas as mesas desta área antes de excluí-la.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleAreaDelete}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button size="sm" onClick={handleAreaSave}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          ) : (
            // View mode - show details
            <div className="space-y-4">
              <div className="grid gap-2">
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p>{selectedArea.description || 'Sem descrição'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Capacidade Máxima</p>
                  <p>{selectedArea.max_capacity || 0} pessoas</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacidade de Mesas</p>
                  <p>{selectedArea.max_tables || 0} mesas</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p>{selectedArea.is_active ? 'Ativa' : 'Inativa'}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <p className="text-muted-foreground mb-2">
            Selecione uma mesa ou área para ver detalhes
          </p>
          {isEditMode && (
            <p className="text-sm text-muted-foreground">
              No modo de edição, você pode adicionar, editar e remover mesas e áreas.
            </p>
          )}
        </div>
      )}
      
      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status da Mesa</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Alterar status da Mesa {selectedTable?.number} para{" "}
              <span className={statusToChange ? getStatusColor(statusToChange) : ""}>
                {statusToChange ? getStatusLabel(statusToChange) : ""}
              </span>
              ?
            </p>
            <div className="mt-4">
              <Label htmlFor="dialog-notes">Observações (opcional)</Label>
              <Textarea
                id="dialog-notes"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Ex: Cliente solicitou mesa próxima à janela"
                rows={3}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmStatusChange}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}