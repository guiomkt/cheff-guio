import { useState } from 'react';
import { CrmCardWithDetails } from '@/db/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  AlertTriangle, 
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { format, isAfter, isBefore, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CrmCardProps {
  card: CrmCardWithDetails;
  onSelect: (card: CrmCardWithDetails) => void;
}

export function CrmCard({
  card,
  onSelect
}: CrmCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
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
  
  // Get due date status
  const getDueDateStatus = () => {
    if (!card.due_date) return null;
    
    const dueDate = new Date(card.due_date);
    const today = new Date();
    
    if (isToday(dueDate)) {
      return { color: 'text-yellow-500', label: 'Hoje' };
    } else if (isBefore(dueDate, today)) {
      return { color: 'text-red-500', label: 'Atrasado' };
    } else if (isAfter(dueDate, today)) {
      return { color: 'text-green-500', label: 'No prazo' };
    }
    
    return null;
  };
  
  const dueDateStatus = getDueDateStatus();
  
  return (
    <div 
      className={cn(
        "bg-card border rounded-md p-3 shadow-sm hover:shadow-md transition-all cursor-pointer",
        card.status === 'completed' && "opacity-70",
        card.status === 'archived' && "opacity-50"
      )}
      onClick={() => onSelect(card)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-sm line-clamp-2">{card.title}</h3>
        <Badge className={getPriorityColor(card.priority)}>
          {getPriorityLabel(card.priority)}
        </Badge>
      </div>
      
      {card.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {card.description}
        </p>
      )}
      
      {card.contact && (
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <User className="h-3 w-3 mr-1" />
          <span className="truncate">{card.contact.name}</span>
        </div>
      )}
      
      {card.contact?.phone_number && (
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <Phone className="h-3 w-3 mr-1" />
          <span>{card.contact.phone_number}</span>
        </div>
      )}
      
      {card.due_date && (
        <div className="flex items-center text-xs mb-2">
          <Calendar className="h-3 w-3 mr-1" />
          <span className="text-muted-foreground">{formatDate(card.due_date)}</span>
          {dueDateStatus && (
            <span className={`ml-2 ${dueDateStatus.color}`}>
              {dueDateStatus.label}
            </span>
          )}
        </div>
      )}
      
      {card.last_contact_date && (
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <Clock className="h-3 w-3 mr-1" />
          <span>Último contato: {formatDate(card.last_contact_date)}</span>
          {card.last_contact_channel && (
            <span className="ml-1">
              via {card.last_contact_channel}
            </span>
          )}
        </div>
      )}
      
      {card.value && (
        <div className="text-xs font-medium mb-2">
          Valor: {card.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      )}
      
      <div className="flex flex-wrap gap-1 mb-2">
        {card.tags.map(tag => (
          <Badge 
            key={tag.id} 
            variant="outline" 
            className="text-[10px] px-1 py-0 h-4"
            style={{ 
              borderColor: tag.color || undefined,
              color: tag.color || undefined
            }}
          >
            {tag.name}
          </Badge>
        ))}
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <Badge variant="outline" className={getStatusColor(card.status)}>
          {getStatusLabel(card.status)}
        </Badge>
        
        {card.activities.length > 0 && (
          <div className="flex items-center text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3 mr-1" />
            {card.activities.length}
          </div>
        )}
      </div>
    </div>
  );
}