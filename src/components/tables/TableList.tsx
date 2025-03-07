import { TableWithArea } from '@/hooks/useTables';
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
import { 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Ban 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TableListProps {
  tables: TableWithArea[];
  selectedTable: TableWithArea | null;
  onSelectTable: (table: TableWithArea | null) => void;
  onChangeStatus: (tableId: string, status: 'available' | 'occupied' | 'reserved' | 'blocked', notes?: string) => Promise<any>;
}

export function TableList({
  tables,
  selectedTable,
  onSelectTable,
  onChangeStatus
}: TableListProps) {
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
  
  // Handle row click
  const handleRowClick = (table: TableWithArea) => {
    onSelectTable(selectedTable?.id === table.id ? null : table);
  };
  
  // Handle status change
  const handleStatusChange = (tableId: string, status: 'available' | 'occupied' | 'reserved' | 'blocked') => {
    onChangeStatus(tableId, status);
  };
  
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Número</TableHead>
              <TableHead>Área</TableHead>
              <TableHead className="hidden sm:table-cell">Capacidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tables.length > 0 ? (
              tables.map(table => (
                <TableRow 
                  key={table.id}
                  className={selectedTable?.id === table.id ? "bg-muted/50" : ""}
                  onClick={() => handleRowClick(table)}
                >
                  <TableCell className="font-medium">{table.number}</TableCell>
                  <TableCell className="max-w-[120px] truncate">{table.area.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{table.capacity} lugares</TableCell>
                  <TableCell>{getStatusBadge(table.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(table.id, 'available')}>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          <span>Marcar como Disponível</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(table.id, 'occupied')}>
                          <XCircle className="mr-2 h-4 w-4 text-red-500" />
                          <span>Marcar como Ocupada</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(table.id, 'reserved')}>
                          <Clock className="mr-2 h-4 w-4 text-blue-500" />
                          <span>Marcar como Reservada</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(table.id, 'blocked')}>
                          <Ban className="mr-2 h-4 w-4 text-gray-500" />
                          <span>Marcar como Bloqueada</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Nenhuma mesa nesta área.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}