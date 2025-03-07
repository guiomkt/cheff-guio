import { memo, useMemo } from 'react';
import { ChatMessage } from '@/db/schema';
import { ContactWithConversation } from '@/hooks/useChat';
import { User, Bot } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ChatConversationMessageProps {
  message: ChatMessage;
  contact: ContactWithConversation;
}

export const ChatConversationMessage = memo(function ChatConversationMessage({
  message,
  contact
}: ChatConversationMessageProps) {
  // Format message timestamp
  const formattedTime = useMemo(() => {
    return format(new Date(message.created_at), 'HH:mm', { locale: ptBR });
  }, [message.created_at]);

  // Render message content based on type
  const renderMessageContent = () => {
    switch (message.content_type) {
      case 'image':
        return (
          <div className="mt-1">
            <img 
              src={message.media_url || ''} 
              alt={message.content} 
              className="max-w-[240px] rounded-md"
            />
            <p className="mt-1 text-sm">{message.content}</p>
          </div>
        );
      case 'file':
        return (
          <div className="mt-1 flex items-center p-2 bg-muted/50 rounded-md">
            <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
            <span className="text-sm">{message.content}</span>
          </div>
        );
      default:
        return <p>{message.content}</p>;
    }
  };

  return (
    <div
      className={cn(
        "flex",
        message.sender_type === 'customer' ? "justify-start" : "justify-end"
      )}
    >
      <div className="flex items-end gap-2">
        {message.sender_type === 'customer' && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
            {contact.profile_image_url ? (
              <img
                src={contact.profile_image_url}
                alt={contact.name}
                className="rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )}
        
        <div
          className={cn(
            "max-w-[75%] rounded-lg px-4 py-2 text-sm",
            message.sender_type === 'customer'
              ? "bg-muted text-foreground"
              : message.sender_type === 'ai'
                ? "bg-blue-100 dark:bg-blue-900 text-foreground"
                : "bg-primary text-primary-foreground"
          )}
        >
          {renderMessageContent()}
          <div className="flex items-center justify-end mt-1 gap-1">
            <span className="text-[10px] opacity-70">
              {formattedTime}
            </span>
            {message.sender_type === 'ai' && (
              <Bot className="h-3 w-3 opacity-70" />
            )}
          </div>
        </div>
        
        {message.sender_type !== 'customer' && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
            {message.sender_type === 'ai' ? (
              <Bot className="h-4 w-4 text-blue-500" />
            ) : (
              <User className="h-4 w-4 text-primary" />
            )}
          </div>
        )}
      </div>
    </div>
  );
});