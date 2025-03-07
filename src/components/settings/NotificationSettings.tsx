import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  Bell, 
  Mail, 
  MessageSquare, 
  AlertTriangle,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

interface NotificationSettingsProps {
  restaurantId: string | null;
}

export function NotificationSettings({ restaurantId }: NotificationSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    notificationTypes: {
      newCustomer: true,
      newReservation: true,
      newComplaint: true,
      lowInventory: false
    },
    notificationSchedule: {
      start: '09:00',
      end: '22:00',
      daysEnabled: {
        sunday: true,
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true
      }
    },
    recipients: [
      { id: '1', name: 'Gerente', email: 'gerente@restaurante.com', role: 'manager' },
      { id: '2', name: 'Recepção', email: 'recepcao@restaurante.com', role: 'reception' }
    ]
  });
  const { toast } = useToast();

  // Fetch notification settings
  useEffect(() => {
    async function fetchSettings() {
      if (!restaurantId) return;
      
      try {
        const { data, error } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setFormData(data.settings);
        }
      } catch (error) {
        console.error('Error fetching notification settings:', error);
        toast({
          title: 'Erro ao carregar configurações',
          description: 'Não foi possível carregar as configurações de notificação.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSettings();
  }, [restaurantId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          restaurant_id: restaurantId,
          settings: formData
        });
      
      if (error) throw error;
      
      toast({
        title: 'Configurações salvas',
        description: 'As configurações de notificação foram atualizadas com sucesso.',
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações de notificação.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Canais de Notificação</CardTitle>
          <CardDescription>
            Configure como você deseja receber as notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações por E-mail</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações por e-mail
              </p>
            </div>
            <Switch
              checked={formData.emailNotifications}
              onCheckedChange={(checked) => setFormData(prev => ({
                ...prev,
                emailNotifications: checked
              }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações no navegador
              </p>
            </div>
            <Switch
              checked={formData.pushNotifications}
              onCheckedChange={(checked) => setFormData(prev => ({
                ...prev,
                pushNotifications: checked
              }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações SMS</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações por SMS
              </p>
            </div>
            <Switch
              checked={formData.smsNotifications}
              onCheckedChange={(checked) => setFormData(prev => ({
                ...prev,
                smsNotifications: checked
              }))}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Notificação</CardTitle>
          <CardDescription>
            Escolha quais eventos devem gerar notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <div>
                <Label>Novos Clientes</Label>
                <p className="text-sm text-muted-foreground">
                  Quando um novo cliente entrar em contato
                </p>
              </div>
            </div>
            <Switch
              checked={formData.notificationTypes.newCustomer}
              onCheckedChange={(checked) => setFormData(prev => ({
                ...prev,
                notificationTypes: {
                  ...prev.notificationTypes,
                  newCustomer: checked
                }
              }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-green-500" />
              <div>
                <Label>Novas Reservas</Label>
                <p className="text-sm text-muted-foreground">
                  Quando uma nova reserva for feita
                </p>
              </div>
            </div>
            <Switch
              checked={formData.notificationTypes.newReservation}
              onCheckedChange={(checked) => setFormData(prev => ({
                ...prev,
                notificationTypes: {
                  ...prev.notificationTypes,
                  newReservation: checked
                }
              }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <Label>Reclamações</Label>
                <p className="text-sm text-muted-foreground">
                  Quando houver uma nova reclamação
                </p>
              </div>
            </div>
            <Switch
              checked={formData.notificationTypes.newComplaint}
              onCheckedChange={(checked) => setFormData(prev => ({
                ...prev,
                notificationTypes: {
                  ...prev.notificationTypes,
                  newComplaint: checked
                }
              }))}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Horários de Notificação</CardTitle>
          <CardDescription>
            Configure quando as notificações podem ser enviadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-time">Horário Inicial</Label>
              <Input
                id="start-time"
                type="time"
                value={formData.notificationSchedule.start}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  notificationSchedule: {
                    ...prev.notificationSchedule,
                    start: e.target.value
                  }
                }))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="end-time">Horário Final</Label>
              <Input
                id="end-time"
                type="time"
                value={formData.notificationSchedule.end}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  notificationSchedule: {
                    ...prev.notificationSchedule,
                    end: e.target.value
                  }
                }))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Dias da Semana</Label>
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(formData.notificationSchedule.daysEnabled).map(([day, enabled]) => (
                <div 
                  key={day}
                  className="flex flex-col items-center"
                >
                  <Label className="text-xs mb-1">
                    {day === 'sunday' ? 'Dom' :
                     day === 'monday' ? 'Seg' :
                     day === 'tuesday' ? 'Ter' :
                     day === 'wednesday' ? 'Qua' :
                     day === 'thursday' ? 'Qui' :
                     day === 'friday' ? 'Sex' : 'Sáb'}
                  </Label>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      notificationSchedule: {
                        ...prev.notificationSchedule,
                        daysEnabled: {
                          ...prev.notificationSchedule.daysEnabled,
                          [day]: checked
                        }
                      }
                    }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Destinatários</CardTitle>
              <CardDescription>
                Gerencie quem recebe as notificações
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.recipients.map((recipient) => (
              <div 
                key={recipient.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{recipient.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {recipient.email}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select defaultValue={recipient.role}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="reception">Recepção</SelectItem>
                      <SelectItem value="kitchen">Cozinha</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Alterações'
          )}
        </Button>
      </div>
    </form>
  );
}