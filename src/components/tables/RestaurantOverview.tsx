import { useState } from 'react';
import { TableWithArea } from '@/hooks/useTables';
import { RestaurantArea } from '@/db/schema';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Ban,
  ChevronDown,
  ChevronUp,
  Users,
  Utensils
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface RestaurantOverviewProps {
  areas: RestaurantArea[];
  tables: TableWithArea[];
  onTableSelect: (table: TableWithArea | null) => void;
  onAreaSelect: (area: RestaurantArea | null) => void;
  onChangeStatus: (tableId: string, status: 'available' | 'occupied' | 'reserved' | 'blocked', notes?: string) => Promise<any>;
}

export function RestaurantOverview({
  areas,
  tables,
  onTableSelect,
  onAreaSelect,
  onChangeStatus
}: RestaurantOverviewProps) {
  const [expandedAreas, setExpandedAreas] = useState<string[]>([]);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [statusToChange, setStatusToChange] = useState<'available' | 'occupied' | 'reserved' | 'blocked' | null>(null);
  const [statusNotes, setStatusNotes] = useState('');

  // Toggle area expansion
  const toggleAreaExpansion = (areaId: string) => {
    setExpandedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId) 
        : [...prev, areaId]
    );
  };

  // Get tables for a specific area
  const getTablesByArea = (areaId: string): TableWithArea[] => {
    return tables.filter(table => table.area_id === areaId);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Disponível</Badge>;
      case 'occupied':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Ocupada</Badge>;
      case 'reserved':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Reservada</Badge>;
      case 'blocked':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Bloqueada</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'occupied':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'reserved':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'blocked':
        return <Ban className="h-4 w-4 text-gray-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  // Handle status change
  const handleStatusChange = (tableId: string, status: 'available' | 'occupied' | 'reserved' | 'blocked') => {
    setSelectedTableId(tableId);
    setStatusToChange(status);
    setShowStatusDialog(true);
  };

  // Confirm status change
  const confirmStatusChange = async () => {
    if (!selectedTableId || !statusToChange) return;
    
    await onChangeStatus(selectedTableId, statusToChange, statusNotes);
    setStatusNotes('');
    setShowStatusDialog(false);
    setSelectedTableId(null);
    setStatusToChange(null);
  };

  // Calculate area statistics
  const getAreaStats = (areaId: string) => {
    const areaTables = getTablesByArea(areaId);
    const totalTables = areaTables.length;
    const availableTables = areaTables.filter(t => t.status === 'available').length;
    const occupiedTables = areaTables.filter(t => t.status === 'occupied').length;
    const reservedTables = areaTables.filter(t => t.status === 'reserved').length;
    const blockedTables = areaTables.filter(t => t.status === 'blocked').length;
    
    // Calculate total capacity and current occupation
    const totalCapacity = areaTables.reduce((sum, table) => sum + table.capacity, 0);
    const occupiedCapacity = areaTables
      .filter(t => t.status === 'occupied' || t.status === 'reserved')
      .reduce((sum, table) => sum + table.capacity, 0);
    
    const occupationPercentage = totalCapacity > 0 
      ? Math.round((occupiedCapacity / totalCapacity) * 100) 
      : 0;
    
    return {
      totalTables,
      availableTables,
      occupiedTables,
      reservedTables,
      blockedTables,
      totalCapacity,
      occupiedCapacity,
      occupationPercentage
    };
  };

  // Get table by ID
  const getTableById = (tableId: string): TableWithArea | undefined => {
    return tables.find(t => t.id === tableId);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Total de Mesas
            </CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tables.length}</div>
            <p className="text-xs text-muted-foreground">
              Em {areas.length} áreas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Mesas Disponíveis
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tables.filter(t => t.status === 'available').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((tables.filter(t => t.status === 'available').length / tables.length) * 100) || 0}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Mesas Ocupadas
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tables.filter(t => t.status === 'occupied').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((tables.filter(t => t.status === 'occupied').length / tables.length) * 100) || 0}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Capacidade Total
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tables.reduce((sum, table) => sum + table.capacity, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pessoas
            </p>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-xl font-semibold mt-6 mb-4">Áreas do Restaurante</h2>
      
      <div className="space-y-4">
        {areas.map(area => {
          const isExpanded = expandedAreas.includes(area.id);
          const areaTables = getTablesByArea(area.id);
          const stats = getAreaStats(area.id);
          
          return (
            <Card key={area.id} className={area.is_active ? '' : 'opacity-70'}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CardTitle className="text-lg">{area.name}</CardTitle>
                    {!area.is_active && (
                      <Badge variant="outline" className="ml-2 bg-gray-100">Inativa</Badge>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleAreaExpansion(area.id)}
                    className="h-8 w-8 p-0"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                <CardDescription>
                  {area.description || 'Sem descrição'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Mesas</span>
                    <span className="font-medium">{stats.totalTables}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Disponíveis</span>
                    <span className="font-medium text-green-600">{stats.availableTables}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Ocupadas</span>
                    <span className="font-medium text-red-600">{stats.occupiedTables}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Ocupação</span>
                    <span className="font-medium">{stats.occupationPercentage}%</span>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">Mesas nesta área</h4>
                    
                    {areaTables.length > 0 ? (
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {areaTables.map(table => (
                          <div 
                            key={table.id} 
                            className="border rounded-md p-3 hover:bg-accent/10 transition-colors cursor-pointer"
                            onClick={() => onTableSelect(table)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h5 className="font-medium">Mesa {table.number}</h5>
                                {table.name && <p className="text-xs text-muted-foreground">{table.name}</p>}
                              </div>
                              {getStatusBadge(table.status)}
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm">{table.capacity} lugares</span>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    Alterar Status
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(table.id, 'available');
                                  }}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                    <span>Disponível</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(table.id, 'occupied');
                                  }}>
                                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                    <span>Ocupada</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(table.id, 'reserved');
                                  }}>
                                    <Clock className="mr-2 h-4 w-4 text-blue-500" />
                                    <span>Reservada</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(table.id, 'blocked');
                                  }}>
                                    <Ban className="mr-2 h-4 w-4 text-gray-500" />
                                    <span>Bloqueada</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 border rounded-md bg-muted/20">
                        <p className="text-muted-foreground">
                          Nenhuma mesa nesta área.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        
        {areas.length === 0 && (
          <div className="text-center py-8 border rounded-md bg-muted/20">
            <p className="text-muted-foreground">
              Nenhuma área cadastrada. Adicione áreas para começar.
            </p>
          </div>
        )}
      </div>
      
      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status da Mesa</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedTableId && (
              <p>
                Alterar status da Mesa {getTableById(selectedTableId)?.number} para{" "}
                <span className={`font-medium ${
                  statusToChange === 'available' ? 'text-green-600' : 
                  statusToChange === 'occupied' ? 'text-red-600' : 
                  statusToChange === 'reserved' ? 'text-blue-600' : 
                  statusToChange === 'blocked' ? 'text-gray-600' : ''
                }`}>
                  {statusToChange === 'available' ? 'Disponível' : 
                   statusToChange === 'occupied' ? 'Ocupada' : 
                   statusToChange === 'reserved' ? 'Reservada' : 
                   statusToChange === 'blocked' ? 'Bloqueada' : ''}
                </span>
                ?
              </p>
            )}
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