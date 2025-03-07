import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Loader2 } from 'lucide-react';

interface AiSettingsProps {
  restaurantId: string | null;
}

export function AiSettings({ restaurantId }: AiSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [personality, setPersonality] = useState<'formal' | 'friendly' | 'enthusiastic'>('friendly');
  const [formData, setFormData] = useState({
    defaultResponses: {
      greeting: 'Olá! Bem-vindo ao restaurante. Como posso ajudar?',
      farewell: 'Obrigado por seu contato! Esperamos vê-lo em breve!',
      busy: 'No momento estamos com todas as mesas ocupadas. Gostaria de entrar na lista de espera?',
      outOfHours: 'Estamos fechados no momento. Nosso horário de funcionamento é...'
    },
    behavior: {
      transferToHuman: true,
      transferThreshold: 3,
      proactivityLevel: 'medium'
    },
    restrictions: {
      canDiscussPrice: true,
      canMakeReservations: true,
      canHandleComplaints: false,
      maxInteractionsPerUser: 10
    }
  });
  const { toast } = useToast();

  // Fetch AI settings
  useEffect(() => {
    async function fetchSettings() {
      if (!restaurantId) return;
      
      try {
        const { data, error } = await supabase
          .from('ai_settings')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .maybeSingle(); // Use maybeSingle instead of single to handle no rows gracefully
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setPersonality(data.personality);
          setFormData(data.settings);
        }
      } catch (error) {
        console.error('Error fetching AI settings:', error);
        toast({
          title: 'Erro ao carregar configurações',
          description: 'Não foi possível carregar as configurações da IA.',
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
        .from('ai_settings')
        .upsert({
          restaurant_id: restaurantId,
          personality,
          settings: formData
        });
      
      if (error) throw error;
      
      toast({
        title: 'Configurações salvas',
        description: 'As configurações da IA foram atualizadas com sucesso.',
      });
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações da IA.',
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
          <CardTitle>Personalidade da IA</CardTitle>
          <CardDescription>
            Escolha o estilo de comunicação da IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className={`cursor-pointer transition-colors ${
                personality === 'formal' ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setPersonality('formal')}
            >
              <CardHeader>
                <CardTitle className="text-lg">Formal e Profissional</CardTitle>
                <CardDescription>
                  Ideal para restaurantes de alta gastronomia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm">Exemplo:</p>
                  <p className="text-sm mt-2">
                    "Boa noite, como posso auxiliá-lo com sua reserva hoje?"
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-colors ${
                personality === 'friendly' ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setPersonality('friendly')}
            >
              <CardHeader>
                <CardTitle className="text-lg">Amigável e Casual</CardTitle>
                <CardDescription>
                  Perfeito para restaurantes familiares
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm">Exemplo:</p>
                  <p className="text-sm mt-2">
                    "Oi! Que bom ter você por aqui! Como posso ajudar com seu pedido hoje? 😊"
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-colors ${
                personality === 'enthusiastic' ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setPersonality('enthusiastic')}
            >
              <CardHeader>
                <CardTitle className="text-lg">Entusiasta e Expressivo</CardTitle>
                <CardDescription>
                  Ideal para bares e casas noturnas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm">Exemplo:</p>
                  <p className="text-sm mt-2">
                    "Eai, galera! 🎉 Vamo que vamo! O que vocês tão pensando pra hoje? Temos várias novidades incríveis! 🔥"
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Respostas Padrão</CardTitle>
          <CardDescription>
            Configure as mensagens padrão que a IA usará em diferentes situações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="greeting">Saudação</Label>
            <Textarea
              id="greeting"
              value={formData.defaultResponses.greeting}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                defaultResponses: {
                  ...prev.defaultResponses,
                  greeting: e.target.value
                }
              }))}
              placeholder="Ex: Olá! Bem-vindo ao [nome do restaurante]. Como posso ajudar?"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="farewell">Despedida</Label>
            <Textarea
              id="farewell"
              value={formData.defaultResponses.farewell}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                defaultResponses: {
                  ...prev.defaultResponses,
                  farewell: e.target.value
                }
              }))}
              placeholder="Ex: Obrigado por seu contato! Esperamos vê-lo em breve!"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="busy">Restaurante Lotado</Label>
            <Textarea
              id="busy"
              value={formData.defaultResponses.busy}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                defaultResponses: {
                  ...prev.defaultResponses,
                  busy: e.target.value
                }
              }))}
              placeholder="Ex: No momento estamos com todas as mesas ocupadas. Gostaria de entrar na lista de espera?"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="outOfHours">Fora do Horário</Label>
            <Textarea
              id="outOfHours"
              value={formData.defaultResponses.outOfHours}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                defaultResponses: {
                  ...prev.defaultResponses,
                  outOfHours: e.target.value
                }
              }))}
              placeholder="Ex: Estamos fechados no momento. Nosso horário de funcionamento é..."
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Comportamento</CardTitle>
          <CardDescription>
            Configure como a IA deve se comportar em diferentes situações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Transferir para Humano</Label>
              <p className="text-sm text-muted-foreground">
                Transferir conversa para atendente humano após várias tentativas
              </p>
            </div>
            <Switch
              checked={formData.behavior.transferToHuman}
              onCheckedChange={(checked) => setFormData(prev => ({
                ...prev,
                behavior: {
                  ...prev.behavior,
                  transferToHuman: checked
                }
              }))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="transferThreshold">Limite de Tentativas</Label>
            <Input
              id="transferThreshold"
              type="number"
              min="1"
              value={formData.behavior.transferThreshold}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                behavior: {
                  ...prev.behavior,
                  transferThreshold: parseInt(e.target.value) || 3
                }
              }))}
            />
            <p className="text-sm text-muted-foreground">
              Número de tentativas antes de transferir para um humano
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="proactivityLevel">Nível de Proatividade</Label>
            <Select
              value={formData.behavior.proactivityLevel}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                behavior: {
                  ...prev.behavior,
                  proactivityLevel: value
                }
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nível de proatividade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixo - Apenas responde perguntas</SelectItem>
                <SelectItem value="medium">Médio - Sugere opções relacionadas</SelectItem>
                <SelectItem value="high">Alto - Muito sugestivo e engajador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Restrições</CardTitle>
          <CardDescription>
            Configure o que a IA pode ou não pode fazer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Discutir Preços</Label>
              <p className="text-sm text-muted-foreground">
                Permitir que a IA informe preços dos itens
              </p>
            </div>
            <Switch
              checked={formData.restrictions.canDiscussPrice}
              onCheckedChange={(checked) => setFormData(prev => ({
                ...prev,
                restrictions: {
                  ...prev.restrictions,
                  canDiscussPrice: checked
                }
              }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Fazer Reservas</Label>
              <p className="text-sm text-muted-foreground">
                Permitir que a IA faça reservas automaticamente
              </p>
            </div>
            <Switch
              checked={formData.restrictions.canMakeReservations}
              onCheckedChange={(checked) => setFormData(prev => ({
                ...prev,
                restrictions: {
                  ...prev.restrictions,
                  canMakeReservations: checked
                }
              }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Lidar com Reclamações</Label>
              <p className="text-sm text-muted-foreground">
                Permitir que a IA trate reclamações iniciais
              </p>
            </div>
            <Switch
              checked={formData.restrictions.canHandleComplaints}
              onCheckedChange={(checked) => setFormData(prev => ({
                ...prev,
                restrictions: {
                  ...prev.restrictions,
                  canHandleComplaints: checked
                }
              }))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="maxInteractions">Máximo de Interações por Usuário</Label>
            <Input
              id="maxInteractions"
              type="number"
              min="1"
              value={formData.restrictions.maxInteractionsPerUser}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                restrictions: {
                  ...prev.restrictions,
                  maxInteractionsPerUser: parseInt(e.target.value) || 10
                }
              }))}
            />
            <p className="text-sm text-muted-foreground">
              Número máximo de mensagens antes de transferir para um humano
            </p>
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