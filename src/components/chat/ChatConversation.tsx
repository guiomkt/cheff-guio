import { useRef, useEffect, useState } from 'react';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ChatConversationProps {
  contact: ContactWithConversation | null;
  messages: ChatMessage[];
  onSendMessage: (content: string, contentType?: 'text' | 'image' | 'file', mediaUrl?: string) => Promise<any>;
  isAiEnabled: boolean;
  onToggleAi: () => void;
}

export function ChatConversation({
  contact,
  messages,
  onSendMessage,
  isAiEnabled,
  onToggleAi
}: ChatConversationProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle message input change
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  };

  // Handle message submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    await onSendMessage(newMessage);
    setNewMessage('');
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm', { locale: ptBR });
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { [date: string]: ChatMessage[] } = {};
    
    messages.forEach(message => {
      const date = format(new Date(message.created_at), 'dd/MM/yyyy');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  // Render message content based on type
  const renderMessageContent = (message: ChatMessage) => {
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

  if (!contact) {
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
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat header */}
      <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
        <div className="flex items-center">
          <div className="relative mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            {contact.profile_image_url ? (
              <img
                src={contact.profile_image_url}
                alt={contact.name}
                className="rounded-full object-cover h-full w-full"
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
      
      {/* Scrollable messages area */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {messages.length > 0 ? (
            Object.entries(messageGroups).map(([date, msgs]) => (
              <div key={date}>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-muted"></div>
                  <span className="mx-4 flex-shrink text-xs text-muted-foreground">{date}</span>
                  <div className="flex-grow border-t border-muted"></div>
                </div>
                
                <div className="space-y-4">
                  {msgs.map(message => (
                    <div
                      key={message.id}
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
                                className="rounded-full object-cover h-full w-full"
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
                          {renderMessageContent(message)}
                          <div className="flex items-center justify-end mt-1 gap-1">
                            <span className="text-[10px] opacity-70">
                              {formatMessageTime(message.created_at)}
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
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center py-20">
              <div className="text-center">
                <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-base font-medium mb-1">Nenhuma mensagem</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Envie uma mensagem para iniciar a conversa com {contact.name}
                </p>
              </div>
            </div>
          )}
          
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
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Message input - fixed at bottom */}
      <div className="p-4 border-t mt-auto flex-shrink-0">
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
  );
}