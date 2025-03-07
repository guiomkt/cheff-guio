import { memo } from 'react';
import { MessageSquare } from 'lucide-react';

export const ChatConversationEmptyState = memo(function ChatConversationEmptyState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhuma conversa selecionada</h3>
        <p className="text-muted-foreground">
          Selecione um contato para iniciar uma conversa
        </p>
      </div>
    </div>
  );
});