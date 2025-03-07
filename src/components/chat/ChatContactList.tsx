import { useState } from 'react';
import { ContactWithConversation } from '@/hooks/useChat';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Calendar, 
  HelpCircle, 
  AlertTriangle,
  ThumbsUp,
  Bot,
  User,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatContactListProps {
  contacts: ContactWithConversation[];
  activeContact: ContactWithConversation | null;
  onSelectContact: (contact: ContactWithConversation) => void;
  onApplyFilter: (filter: { status?: string; intent?: string; search?: string }) => void;
  filter: { status?: string; intent?: string; search?: string };
}

export function ChatContactList({
  contacts,
  activeContact,
  onSelectContact,
  onApplyFilter,
  filter
}: ChatContactListProps) {
  const [searchQuery, setSearchQuery] = useState(filter.search || '');

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilter({ ...filter, search: searchQuery });
  };

  // Handle filter by status
  const handleFilterByStatus = (status: string | undefined) => {
    onApplyFilter({ ...filter, status });
  };

  // Handle filter by intent
  const handleFilterByIntent = (intent: string | undefined) => {
    onApplyFilter({ ...filter, intent });
  };

  // Get intent icon
  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'reservation':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'menu':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'complaint':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'feedback':
        return <ThumbsUp className="h-4 w-4 text-yellow-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format last message time
  const formatLastMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true,
      locale: ptBR
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex-shrink-0">
        <form onSubmit={handleSearchSubmit} className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar contatos..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Status
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleFilterByStatus(undefined)}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterByStatus('new')}>
                  Novos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterByStatus('active')}>
                  Ativos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterByStatus('inactive')}>
                  Inativos
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Intenção
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleFilterByIntent(undefined)}>
                  Todas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterByIntent('general')}>
                  <HelpCircle className="mr-2 h-4 w-4 text-gray-500" />
                  Geral
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterByIntent('reservation')}>
                  <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                  Reserva
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterByIntent('menu')}>
                  <MessageSquare className="mr-2 h-4 w-4 text-green-500" />
                  Cardápio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterByIntent('complaint')}>
                  <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                  Reclamação
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterByIntent('feedback')}>
                  <ThumbsUp className="mr-2 h-4 w-4 text-yellow-500" />
                  Feedback
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </form>
        
        {/* Active filters display */}
        {(filter.status || filter.intent) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {filter.status && (
              <Badge variant="outline" className="flex items-center gap-1">
                Status: {filter.status}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => handleFilterByStatus(undefined)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filter.intent && (
              <Badge variant="outline" className="flex items-center gap-1">
                Intenção: {filter.intent}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => handleFilterByIntent(undefined)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="divide-y">
          {contacts.length > 0 ? (
            contacts.map(contact => (
              <div
                key={contact.id}
                className={cn(
                  "flex items-start p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                  activeContact?.id === contact.id ? "bg-muted" : ""
                )}
                onClick={() => onSelectContact(contact)}
              >
                <div className="relative mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  {contact.profile_image_url ? (
                    <img
                      src={contact.profile_image_url}
                      alt={contact.name}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-muted-foreground" />
                  )}
                  {contact.unread_count > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                      {contact.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">{contact.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {formatLastMessageTime(contact.last_message_at)}
                    </span>
                  </div>
                  <div className="flex items-center mt-1">
                    {contact.conversation.ai_enabled ? (
                      <Bot className="h-3 w-3 mr-1 text-primary" />
                    ) : (
                      <User className="h-3 w-3 mr-1 text-muted-foreground" />
                    )}
                    <p className="text-sm text-muted-foreground truncate">
                      {contact.last_message?.content || "Nenhuma mensagem"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {getIntentIcon(contact.conversation.intent)}
                    <span className="text-xs capitalize">
                      {contact.conversation.intent === 'general' ? 'Geral' :
                       contact.conversation.intent === 'reservation' ? 'Reserva' :
                       contact.conversation.intent === 'menu' ? 'Cardápio' :
                       contact.conversation.intent === 'complaint' ? 'Reclamação' :
                       contact.conversation.intent === 'feedback' ? 'Feedback' : 
                       contact.conversation.intent}
                    </span>
                    {contact.customer_type === 'vip' && (
                      <Badge variant="outline" className="ml-1 bg-yellow-100 text-yellow-800 text-[10px] px-1 py-0">
                        VIP
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum contato encontrado</p>
              {(filter.status || filter.intent || filter.search) && (
                <Button 
                  variant="link" 
                  className="mt-2 text-sm"
                  onClick={() => onApplyFilter({})}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}