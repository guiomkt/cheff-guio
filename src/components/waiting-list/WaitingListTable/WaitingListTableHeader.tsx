import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface WaitingListTableHeaderProps {
  isHistoryView?: boolean;
}

export function WaitingListTableHeader({ isHistoryView = false }: WaitingListTableHeaderProps) {
  return (
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
  );
}