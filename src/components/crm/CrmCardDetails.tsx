import { useState } from 'react';
import { CrmCardWithDetails, CrmCardActivity } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  MessageSquare, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertTriangle,
  Plus,
  ExternalLink
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface CrmCardDetailsProps {
  card: CrmCardWithDetails;
  onClose: () => void;
  onAddActivity?: (activity: { activity_type: string; description: string }) => Promise<any>;
  onEdit?: () => void;
  onDelete?: () => void;
  isMobile?: boolean;
}

export function CrmCardDetails({
  card,
  onClose,
  onAddActivity,
  onEdit,
  onDelete,
  isMobile = false
}: CrmCardDetailsProps) {
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };
  
  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true,
      locale: ptBR
    });
  };
  
  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  // Get priority label
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return 'Normal';
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'completed': return 'Concluído';
      case 'archived': return 'Arquivado';
      default: return 'Desconhecido';
    }
  };
  
  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'note': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'stage_change': return <Edit className="h-4 w-4 text-yellow-500" />;
      case 'contact': return <Phone className="h-4 w-4 text-green-500" />;
      case 'reservation': return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'event': return <Calendar className="h-4 w-4 text-orange-500" />;
      default: return <MessageSquare className="h-4 w-4 text-blue-500" />;
    }
  };
  
  // Handle note submit
  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNote.trim() || !onAddActivity) return;
    
    try {
      setIsSubmitting(true);
      
      await onAddActivity({
        activity_type: 'note',
        description: newNote
      });
      
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-medium">Detalhes do Card</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-semibold">{card.title}</h2>
              <Badge className={getPriorityColor(card.priority)}>
                {getPriorityLabel(card.priority)}
              </Badge>
            </div>
            
            {card.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {card.description}
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1">
            {card.tags.map(tag => (
              <Badge 
                key={tag.id} 
                variant="outline" 
                className="text-xs"
                style={{ 
                  borderColor: tag.color || undefined,
                  color: tag.color || undefined
                }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={cn("mt-1", getStatusColor(card.status))}>
                {getStatusLabel(card.status)}
              </Badge>
            </div>
            
            {card.value && (
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="font-medium">
                  {card.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            )}
            
            {card.due_date && (
              <div>
                <p className="text-sm text-muted-foreground">Data de Vencimento</p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{formatDate(card.due_date)}</span>
                </div>
              </div>
            )}
            
            {card.last_contact_date && (
              <div>
                <p className="text-sm text-muted-foreground">Último Contato</p>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{formatDate(card.last_contact_date)}</span>
                  {card.last_contact_channel && (
                    <span className="ml-1 text-xs">
                      via {card.last_contact_channel}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {card.contact && (
            <>
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-2">Informações do Cliente</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{card.contact.name}</span>
                  </div>
                  
                  {card.contact.phone_number && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{card.contact.phone_number}</span>
                    </div>
                  )}
                  
                  {card.contact.customer_type && (
                    <div className="flex items-center">
                      <Badge variant="outline">
                        {card.contact.customer_type === 'vip' ? 'VIP' : 
                         card.contact.customer_type === 'returning' ? 'Cliente Recorrente' : 
                         'Novo Cliente'}
                      </Badge>
                    </div>
                  )}
                  
                  {card.contact.notes && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Observações</p>
                      <p className="text-sm">{card.contact.notes}</p>
                    </div>
                  )}
                  
                  <div className="mt-2">
                    <Link 
                      to={`/chat?contact=${card.contact.id}`}
                      className="inline-flex items-center text-sm text-primary hover:text-primary/80"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Abrir chat com este cliente
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
          
          <Separator />
          
          <div>
            <h4 className="text-sm font-medium mb-2">Histórico de Atividades</h4>
            
            {onAddActivity && (
              <form onSubmit={handleNoteSubmit} className="mb-4">
                <Textarea
                  placeholder="Adicionar uma nota..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="mb-2"
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={!newNote.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>Adicionando...</>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Nota
                    </>
                  )}
                </Button>
              </form>
            )}
            
            <div className="space-y-3">
              {card.activities.length > 0 ? (
                card.activities.map((activity) => (
                  <div key={activity.id} className="flex gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.performed_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma atividade registrada.
                </p>
              )}
            </div>
          </div>
          
          {(onEdit || onDelete) && (
            <>
              <Separator />
              
              <div className="flex justify-end gap-2">
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
                
                {onDelete && (
                  <Button variant="destructive" size="sm" onClick={onDelete}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}