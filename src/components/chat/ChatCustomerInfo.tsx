import { useState } from 'react';
import { ContactWithConversation } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Phone,
  Calendar,
  Clock,
  MessageSquare,
  AlertTriangle,
  ThumbsUp,
  Tag,
  Edit,
  Save,
  X,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatCustomerInfoProps {
  contact: ContactWithConversation | null;
  onUpdateContact: (contactId: string, data: any) => Promise<any>;
  onUpdateConversation: (conversationId: string, data: any) => Promise<any>;
}

interface EditedContactType {
  name: string;
  notes: string;
  customer_type: string;
  tags: string[];
}

export function ChatCustomerInfo({
  contact,
  onUpdateContact,
  onUpdateConversation
}: ChatCustomerInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState<EditedContactType | null>(null);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Start editing
  const handleStartEditing = () => {
    setEditedContact({
      name: contact?.name || '',
      notes: contact?.notes || '',
      customer_type: contact?.customer_type || 'new',
      tags: [...(contact?.tags || [])]
    });
    setIsEditing(true);
  };

  // Cancel editing
  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditedContact(null);
  };

  // Save changes
  const handleSaveChanges = async () => {
    if (!contact || !editedContact) return;
    
    setIsLoading(true);
    try {
      await onUpdateContact(contact.id, editedContact);
      setIsEditing(false);
      setEditedContact(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedContact((prev: EditedContactType | null) => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });
  };

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setEditedContact((prev: EditedContactType | null) => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });
  };

  // Handle intent change
  const handleIntentChange = async (intent: string) => {
    if (!contact || !contact.conversation.id) return;
    
    setIsLoading(true);
    try {
      await onUpdateConversation(contact.conversation.id, { intent });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sentiment change
  const handleSentimentChange = async (sentiment: string) => {
    if (!contact || !contact.conversation.id) return;
    
    setIsLoading(true);
    try {
      await onUpdateConversation(contact.conversation.id, { sentiment });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new tag
  const handleAddTag = () => {
    if (!newTag.trim() || !editedContact) return;
    
    setEditedContact((prev: EditedContactType | null) => {
      if (!prev) return null;
      return {
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      };
    });
    
    setNewTag('');
  };

  // Remove a tag
  const handleRemoveTag = (tag: string) => {
    if (!editedContact) return;
    
    setEditedContact((prev: EditedContactType | null) => {
      if (!prev) return null;
      return {
        ...prev,
        tags: prev.tags.filter((t: string) => t !== tag)
      };
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  if (!contact) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum cliente selecionado</h3>
          <p className="text-muted-foreground">
            Selecione um contato para ver suas informações
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
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
          variant="ghost"
          size="icon"
          onClick={isEditing ? handleCancelEditing : handleStartEditing}
          disabled={isLoading}
        >
          {isEditing ? (
            <X className="h-4 w-4" />
          ) : (
            <Edit className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <ScrollArea className="flex-1 overflow-y-auto">
        {/* Basic Info */}
        <div className="space-y-4">
          {!isEditing ? (
            <>
              <div className="flex items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mr-4">
                  {contact.profile_image_url ? (
                    <img
                      src={contact.profile_image_url}
                      alt={contact.name}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium">{contact.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-3 w-3 mr-1" />
                    {contact.phone_number}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      contact.customer_type === 'vip' 
                        ? 'bg-yellow-100 text-yellow-800 mt-1' 
                        : contact.customer_type === 'returning'
                          ? 'bg-green-100 text-green-800 mt-1'
                          : 'bg-blue-100 text-blue-800 mt-1'
                    }
                  >
                    {contact.customer_type === 'vip' ? 'VIP' : 
                     contact.customer_type === 'returning' ? 'Cliente Recorrente' : 
                     'Novo Cliente'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Notas</h4>
                <p className="text-sm text-muted-foreground">
                  {contact.notes || "Nenhuma nota adicionada"}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    value={editedContact?.name || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="customer_type">Tipo de Cliente</Label>
                  <Select
                    value={editedContact?.customer_type || ''}
                    onValueChange={(value) => handleSelectChange('customer_type', value)}
                  >
                    <SelectTrigger id="customer_type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo Cliente</SelectItem>
                      <SelectItem value="returning">Cliente Recorrente</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={editedContact?.notes || ''}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </div>
            </>
          )}
          
          <Separator />
          
          {/* Conversation Info */}
          <div>
            <h4 className="text-sm font-medium mb-3">Informações da Conversa</h4>
            
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="intent">Intenção</Label>
                <Select
                  value={contact.conversation.intent}
                  onValueChange={handleIntentChange}
                  disabled={isEditing}
                >
                  <SelectTrigger id="intent">
                    <SelectValue placeholder="Selecione a intenção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Geral</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="reservation">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                        <span>Reserva</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="menu">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2 text-green-500" />
                        <span>Cardápio</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="complaint">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                        <span>Reclamação</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="feedback">
                      <div className="flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-2 text-yellow-500" />
                        <span>Feedback</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="sentiment">Sentimento</Label>
                <Select
                  value={contact.conversation.sentiment}
                  onValueChange={handleSentimentChange}
                  disabled={isEditing}
                >
                  <SelectTrigger id="sentiment">
                    <SelectValue placeholder="Selecione o sentimento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">
                      <div className="flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-2 text-green-500" />
                        <span>Positivo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="neutral">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Neutro</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="negative">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                        <span>Negativo</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Criado em</Label>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(contact.created_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Última mensagem</Label>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(contact.last_message_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Tags */}
          <div>
            <h4 className="text-sm font-medium mb-3">Tags</h4>
            
            {!isEditing ? (
              <div className="flex flex-wrap gap-2">
                {contact.tags && contact.tags.length > 0 ? (
                  contact.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma tag adicionada</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {editedContact?.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {tag}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}