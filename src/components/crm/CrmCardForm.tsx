import { useState, useEffect } from 'react';
import { CrmCardWithDetails, CrmStage, ChatContact, CrmCardTag } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CrmCardFormProps {
  card?: CrmCardWithDetails;
  stages: CrmStage[];
  contacts: ChatContact[];
  tags: CrmCardTag[];
  onSubmit: (cardData: any, selectedTagIds: string[]) => Promise<any>;
  onCancel: () => void;
}

export function CrmCardForm({
  card,
  stages,
  contacts,
  tags,
  onSubmit,
  onCancel
}: CrmCardFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stage_id: '',
    contact_id: '',
    priority: 'medium',
    status: 'active',
    due_date: null as Date | null,
    value: ''
  });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form data if editing an existing card
  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title || '',
        description: card.description || '',
        stage_id: card.stage_id || '',
        contact_id: card.contact_id || '',
        priority: card.priority || 'medium',
        status: card.status || 'active',
        due_date: card.due_date ? new Date(card.due_date) : null,
        value: card.value ? card.value.toString() : ''
      });
      
      setSelectedTagIds(card.tags.map(tag => tag.id));
    } else if (stages.length > 0) {
      // Set default stage to first stage if creating a new card
      setFormData(prev => ({ ...prev, stage_id: stages[0].id }));
    }
  }, [card, stages]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value === 'none' ? '' : value }));
  };
  
  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, due_date: date || null }));
  };
  
  // Handle tag toggle
  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };
  
  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Format data for submission
      const submissionData = {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : null,
        due_date: formData.due_date ? formData.due_date.toISOString() : null
      };
      
      await onSubmit(submissionData, selectedTagIds);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Título do card"
          required
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Descrição do card"
          rows={3}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="stage_id">Etapa *</Label>
        <Select 
          value={formData.stage_id} 
          onValueChange={(value) => handleSelectChange('stage_id', value)}
          required
        >
          <SelectTrigger id="stage_id">
            <SelectValue placeholder="Selecione a etapa" />
          </SelectTrigger>
          <SelectContent>
            {stages.map(stage => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="contact_id">Cliente</Label>
        <Select 
          value={formData.contact_id} 
          onValueChange={(value) => handleSelectChange('contact_id', value)}
        >
          <SelectTrigger id="contact_id">
            <SelectValue placeholder="Selecione um cliente (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {contacts.map(contact => (
              <SelectItem key={contact.id} value={contact.id}>
                {contact.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => handleSelectChange('priority', value)}
          >
            <SelectTrigger id="priority">
              <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => handleSelectChange('status', value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="due_date">Data de Vencimento</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="due_date"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.due_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.due_date ? (
                  format(formData.due_date, "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.due_date || undefined}
                onSelect={handleDateChange}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="value">Valor (R$)</Label>
          <Input
            id="value"
            name="value"
            type="number"
            step="0.01"
            min="0"
            value={formData.value}
            onChange={handleInputChange}
            placeholder="Ex: 1000.00"
          />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label>Tags</Label>
        <ScrollArea className="h-24 border rounded-md p-2">
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Badge
                key={tag.id}
                variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                className="cursor-pointer"
                style={{ 
                  backgroundColor: selectedTagIds.includes(tag.id) ? tag.color || undefined : undefined,
                  borderColor: tag.color || undefined,
                  color: selectedTagIds.includes(tag.id) ? 'white' : tag.color || undefined
                }}
                onClick={() => handleTagToggle(tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
            
            {tags.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma tag disponível.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : card ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}