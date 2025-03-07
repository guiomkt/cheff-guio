import { useRef, useEffect, useState, useCallback, memo } from 'react';
import { ChatMessage } from '@/db/schema';
import { ContactWithConversation } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Paperclip, 
  Bot, 
  User, 
  Image, 
  FileText,
  Smile,
  MessageSquare
} from 'lucide-react';
import { ChatConversationHeader } from './ChatConversationHeader';
import { ChatConversationMessageList } from './ChatConversationMessageList';
import { ChatConversationEmptyState } from './ChatConversationEmptyState';

interface ChatConversationContainerProps {
  contact: ContactWithConversation | null;
  messages: ChatMessage[];
  onSendMessage: (content: string, contentType?: 'text' | 'image' | 'file', mediaUrl?: string) => Promise<any>;
  isAiEnabled: boolean;
  onToggleAi: () => void;
}

export const ChatConversationContainer = memo(function ChatConversationContainer({
  contact,
  messages,
  onSendMessage,
  isAiEnabled,
  onToggleAi
}: ChatConversationContainerProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Handle message input change
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  }, []);

  // Handle message submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    await onSendMessage(newMessage);
    setNewMessage('');
  }, [newMessage, onSendMessage]);

  // Handle key press (Enter to send)
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }, [handleSubmit]);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // In a real app, you would upload the file to a storage service
    // and get a URL back. For now, we'll simulate this.
    const fileType = file.type.startsWith('image/') ? 'image' : 'file';
    const fakeUrl = `https://example.com/uploads/${file.name}`;
    
    // Send the message with the file
    onSendMessage(file.name, fileType, fakeUrl);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onSendMessage]);

  if (!contact) {
    return <ChatConversationEmptyState />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat header */}
      <ChatConversationHeader 
        contact={contact} 
        isAiEnabled={isAiEnabled} 
        onToggleAi={onToggleAi} 
      />
      
      <div className="flex-1 flex flex-col">
        {/* Messages area */}
        <ScrollArea className="flex-1 p-4">
          <ChatConversationMessageList 
            messages={messages} 
            contact={contact} 
            isTyping={isTyping} 
          />
          <div ref={messagesEndRef} />
        </ScrollArea>
        
        {/* Message input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-5 w-5" />
              <span className="sr-only">Anexar arquivo</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            />
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
            >
              <Smile className="h-5 w-5" />
              <span className="sr-only">Emojis</span>
            </Button>
            
            <div className="relative flex-1">
              <Textarea
                placeholder="Digite sua mensagem..."
                className="min-h-[80px] resize-none pr-12"
                value={newMessage}
                onChange={handleMessageChange}
                onKeyDown={handleKeyPress}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute bottom-3 right-3"
                disabled={!newMessage.trim()}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Enviar</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});