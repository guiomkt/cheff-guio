import { memo } from 'react';
import { ContactWithConversation } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Bot, User } from 'lucide-react';

interface ChatConversationHeaderProps {
  contact: ContactWithConversation;
  isAiEnabled: boolean;
  onToggleAi: () => void;
}

export const ChatConversationHeader = memo(function ChatConversationHeader({
  contact,
  isAiEnabled,
  onToggleAi
}: ChatConversationHeaderProps) {
  return (
    <div className="p-4 border-b flex items-center justify-between">
      <div className="flex items-center">
        <div className="relative mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          {contact.profile_image_url ? (
            <img
              src={contact.profile_image_url}
              alt={contact.name}
              className="rounded-full object-cover"
            />
          ) : (
            <User className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <h3 className="font-medium">{contact.name}</h3>
          <p className="text-xs text-muted-foreground">
            {contact.phone_number}
          </p>
        </div>
      </div>
      <Button
        variant={isAiEnabled ? "default" : "outline"}
        size="sm"
        onClick={onToggleAi}
        className="gap-2"
      >
        <Bot className="h-4 w-4" />
        {isAiEnabled ? "IA Ativa" : "IA Pausada"}
      </Button>
    </div>
  );
});