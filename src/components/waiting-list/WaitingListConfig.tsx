import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  MessageSquare, 
  Bell, 
  Clock, 
  Save,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WaitingListConfig {
  id?: string;
  restaurant_id: string;
  auto_notification: boolean;
  notification_message: string;
  default_wait_time: number;
  max_party_size: number;
  enable_customer_form: boolean;
  customer_form_url: string;
  priority_enabled: boolean;
  collect_phone: boolean;
  collect_email: boolean;
  confirmation_message: string;
  created_at?: string;
  updated_at?: string;
}

interface WaitingListConfigProps {
  restaurantId: string | null;
  onClose: () => void;
}

export function WaitingListConfig({ restaurantId, onClose }: WaitingListConfigProps) {
  const [config, setConfig] = useState<WaitingListConfig>({
    restaurant_id: restaurantId || '',
    auto_notification: true,
    notification_message: 'Olá {name}, sua mesa está pronta! Por favor, dirija-se à recepção do restaurante.',
    default_wait_time: 15,
    max_party_size: 20,
    enable_customer_form: true,
    customer_form_url: '',
    priority_enabled: true,
    collect_phone: true,
    collect_email: false,
    confirmation_message: 'Olá {name}, você foi adicionado à fila de espera! Seu número é {queue_number} e o tempo estimado de espera é de {wait_time} minutos.'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const { toast } = useToast();

  // Fetch configuration
  useEffect(() => {
    async function fetchConfig() {
      if (!restaurantId) return;
      
      try {
        const { data, error } = await supabase
          .from('waiting_list_config')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setConfig(data);
        } else {
          // Create default config if none exists
          const defaultConfig = {
            restaurant_id: restaurantId,
            auto_notification: true,
            notification_message: 'Olá {name}, sua mesa está pronta! Por favor, dirija-se à recepção do restaurante.',
            default_wait_time: 15,
            max_party_size: 20,
            enable_customer_form: true,
            customer_form_url: `https://chefguio.app/waiting-list/${restaurantId}`,
            priority_enabled: true,
            collect_phone: true,
            collect_email: false,
            confirmation_message: 'Olá {name}, você foi adicionado à fila de espera! Seu número é {queue_number} e o tempo estimado de espera é de {wait_time} minutos.'
          };
          
          setConfig(defaultConfig);
        }
      } catch (error) {
        console.error('Error fetching waiting list config:', error);
        toast({
          title: 'Erro ao carregar configurações',
          description: 'Não foi possível carregar as configurações da fila de espera.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchConfig();
  }, [restaurantId]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  // Handle number input change
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setConfig(prev => ({ ...prev, [name]: numValue }));
    }
  };

  // Handle switch change
  const handleSwitchChange = (name: string, checked: boolean) => {
    setConfig(prev => ({ ...prev, [name]: checked }));
  };

  // Save configuration
  const saveConfig = async () => {
    if (!restaurantId) return;
    
    setIsSaving(true);
    try {
      if (config.id) {
        // Update existing config
        const { error } = await supabase
          .from('waiting_list_config')
          .update(config)
          .eq('id', config.id);
        
        if (error) throw error;
      } else {
        // Insert new config
        const { error } = await supabase
          .from('waiting_list_config')
          .insert(config);
        
        if (error) throw error;
      }
      
      toast({
        title: 'Configurações salvas',
        description: 'As configurações da fila de espera foram salvas com sucesso.',
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving waiting list config:', error);
      toast({
        title: 'Erro ao salvar configurações',
        description: 'Não foi possível salvar as configurações da fila de espera.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-auto max-h-[70vh]">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Configurações da Fila de Espera</h2>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Geral</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Formulário</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure as opções gerais da fila de espera
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="default_wait_time">Tempo de Espera Padrão (minutos)</Label>
                <Input
                  id="default_wait_time"
                  name="default_wait_time"
                  type="number"
                  min="1"
                  value={config.default_wait_time}
                  onChange={handleNumberChange}
                />
                <p className="text-sm text-muted-foreground">
                  Tempo estimado de espera padrão para novos clientes
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="max_party_size">Tamanho Máximo de Grupo</Label>
                <Input
                  id="max_party_size"
                  name="max_party_size"
                  type="number"
                  min="1"
                  value={config.max_party_size}
                  onChange={handleNumberChange}
                />
                <p className="text-sm text-muted-foreground">
                  Número máximo de pessoas permitido por grupo
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="priority_enabled"
                  checked={config.priority_enabled}
                  onCheckedChange={(checked) => handleSwitchChange('priority_enabled', checked)}
                />
                <Label htmlFor="priority_enabled">Habilitar Prioridades</Label>
              </div>
              <p className="text-sm text-muted-foreground -mt-2">
                Permite definir prioridades para clientes (alta, média, baixa)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Configure as mensagens e comportamento das notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_notification"
                  checked={config.auto_notification}
                  onCheckedChange={(checked) => handleSwitchChange('auto_notification', checked)}
                />
                <Label htmlFor="auto_notification">Notificação Automática</Label>
              </div>
              <p className="text-sm text-muted-foreground -mt-2">
                Envia automaticamente uma mensagem quando o cliente é adicionado à fila
              </p>
              
              <div className="grid gap-2">
                <Label htmlFor="notification_message">Mensagem de Mesa Pronta</Label>
                <Textarea
                  id="notification_message"
                  name="notification_message"
                  value={config.notification_message}
                  onChange={handleInputChange}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Mensagem enviada quando a mesa está pronta. Use {"{name}"} para o nome do cliente e {"{queue_number}"} para o número na fila.
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="confirmation_message">Mensagem de Confirmação</Label>
                <Textarea
                  id="confirmation_message"
                  name="confirmation_message"
                  value={config.confirmation_message}
                  onChange={handleInputChange}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Mensagem enviada quando o cliente é adicionado à fila. Use {"{name}"}, {"{queue_number}"} e {"{wait_time}"} como variáveis.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="customer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Formulário do Cliente</CardTitle>
              <CardDescription>
                Configure o formulário de entrada na fila para clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enable_customer_form"
                  checked={config.enable_customer_form}
                  onCheckedChange={(checked) => handleSwitchChange('enable_customer_form', checked)}
                />
                <Label htmlFor="enable_customer_form">Habilitar Formulário do Cliente</Label>
              </div>
              <p className="text-sm text-muted-foreground -mt-2">
                Permite que os clientes entrem na fila através de um formulário online
              </p>
              
              <div className="grid gap-2">
                <Label htmlFor="customer_form_url">URL do Formulário</Label>
                <Input
                  id="customer_form_url"
                  name="customer_form_url"
                  value={config.customer_form_url || `https://chefguio.app/waiting-list/${restaurantId}`}
                  onChange={handleInputChange}
                  disabled
                />
                <p className="text-sm text-muted-foreground">
                  URL do formulário para os clientes entrarem na fila
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="collect_phone"
                  checked={config.collect_phone}
                  onCheckedChange={(checked) => handleSwitchChange('collect_phone', checked)}
                />
                <Label htmlFor="collect_phone">Coletar Telefone</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="collect_email"
                  checked={config.collect_email}
                  onCheckedChange={(checked) => handleSwitchChange('collect_email', checked)}
                />
                <Label htmlFor="collect_email">Coletar Email</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={saveConfig} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}