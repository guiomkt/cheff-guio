import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RestaurantArea } from '@/hooks/useWaitingList';

interface WaitingListFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  areas: RestaurantArea[];
  initialData?: any;
}

export function WaitingListForm({
  onSubmit,
  onCancel,
  areas,
  initialData
}: WaitingListFormProps) {
  const [formData, setFormData] = useState({
    customer_name: initialData?.customer_name || '',
    phone_number: initialData?.phone_number || '',
    party_size: initialData?.party_size || 2,
    area_preference: initialData?.area_preference || '',
    estimated_wait_time: initialData?.estimated_wait_time || 15,
    notes: initialData?.notes || '',
    priority: initialData?.priority || 'low',
    send_notification: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle number input change
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setFormData(prev => ({ ...prev, [name]: numValue }));
    }
  };

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle switch change
  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, send_notification: checked }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.phone_number) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="customer_name">Nome do Cliente *</Label>
        <Input
          id="customer_name"
          name="customer_name"
          value={formData.customer_name}
          onChange={handleInputChange}
          placeholder="Ex: João Silva"
          required
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="phone_number">Telefone (WhatsApp) *</Label>
        <Input
          id="phone_number"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleInputChange}
          placeholder="Ex: (11) 99999-9999"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="party_size">Quantidade de Pessoas *</Label>
          <Input
            id="party_size"
            name="party_size"
            type="number"
            min="1"
            value={formData.party_size}
            onChange={handleNumberChange}
            required
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="estimated_wait_time">Tempo Estimado (min)</Label>
          <Input
            id="estimated_wait_time"
            name="estimated_wait_time"
            type="number"
            min="5"
            value={formData.estimated_wait_time}
            onChange={handleNumberChange}
          />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="area_preference">Preferência de Área</Label>
        <Select 
          value={formData.area_preference} 
          onValueChange={(value) => handleSelectChange('area_preference', value)}
        >
          <SelectTrigger id="area_preference">
            <SelectValue placeholder="Selecione uma área (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem preferência</SelectItem>
            {areas.map(area => (
              <SelectItem key={area.id} value={area.id}>
                {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
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
            <SelectItem value="high">Alta (Preferencial)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Ex: Cliente prefere mesa próxima à janela"
          rows={3}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="send_notification"
          checked={formData.send_notification}
          onCheckedChange={handleSwitchChange}
        />
        <Label htmlFor="send_notification">Enviar mensagem de confirmação</Label>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adicionando...' : 'Adicionar à Fila'}
        </Button>
      </div>
    </form>
  );
}