import { memo, useMemo } from 'react';
import { ChatMessage } from '@/db/schema';
import { ContactWithConversation } from '@/hooks/useChat';
import { User, Bot } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ChatConversationMessage } from './ChatConversationMessage';

interface ChatConversationMessageListProps {
  messages: ChatMessage[];
  contact: ContactWithConversation;
  isTyping: boolean;
}

export const ChatConversationMessageList = memo(function ChatConversationMessageList({
  messages,
  contact,
  isTyping
}: ChatConversationMessageListProps) {
  // Group messages by date
  const messageGroups = useMemo(() => {
    const groups: { [date: string]: ChatMessage[] } = {};
    
    messages.forEach(message => {
      const date = format(new Date(message.created_at), 'dd/MM/yyyy');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  }, [messages]);

  return (
    <div className="space-y-6">
      {Object.entries(messageGroups).map(([date, msgs]) => (
        <div key={date}>
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-muted"></div>
            <span className="mx-4 flex-shrink text-xs text-muted-foreground">{date}</span>
            <div className="flex-grow border-t border-muted"></div>
          </div>
          
          <div className="space-y-4">
            {msgs.map(message => (
              <ChatConversationMessage 
                key={message.id} 
                message={message} 
                contact={contact} 
              />
            ))}
          </div>
        </div>
      ))}
      
      {isTyping && (
        <div className="flex justify-start">
          <div className="flex items-end gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="max-w-[75%] rounded-lg px-4 py-2 text-sm bg-muted text-foreground">
              <div className="flex space-x-1">
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"></div>
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]"></div>
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});