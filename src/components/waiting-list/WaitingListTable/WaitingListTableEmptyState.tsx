import { Users } from 'lucide-react';

interface WaitingListTableEmptyStateProps {
  isHistoryView?: boolean;
}

export function WaitingListTableEmptyState({ isHistoryView = false }: WaitingListTableEmptyStateProps) {
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