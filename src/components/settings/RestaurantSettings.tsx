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
import { Loader2, Upload } from 'lucide-react';

interface RestaurantSettingsProps {
  restaurantId: string | null;
}

export function RestaurantSettings({ restaurantId }: RestaurantSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
    email: '',
    website: '',
    opening_hours: {} as { [key: string]: { open: string; close: string; enabled: boolean } },
    max_capacity: '0' // Changed to string to handle controlled input properly
  });
  const { toast } = useToast();

  // Initialize opening hours
  useEffect(() => {
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const initialHours = {} as typeof formData.opening_hours;
    days.forEach(day => {
      initialHours[day] = { open: '09:00', close: '23:00', enabled: true };
    });
    setFormData(prev => ({ ...prev, opening_hours: initialHours }));
  }, []);

  // Fetch restaurant data
  useEffect(() => {
    async function fetchRestaurant() {
      if (!restaurantId) return;
      
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .single();
        
        if (error) throw error;
        
        setFormData(prev => ({
          ...prev,
          name: data.name || '',
          description: data.description || '',
          logo_url: data.logo_url || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          postal_code: data.postal_code || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          opening_hours: data.opening_hours || prev.opening_hours,
          max_capacity: String(data.max_capacity || 0) // Convert to string for controlled input
        }));
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar as informações do restaurante.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchRestaurant();
  }, [restaurantId]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle opening hours change
  const handleHoursChange = (day: string, field: 'open' | 'close', value: string) => {
    setFormData(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours[day],
          [field]: value
        }
      }
    }));
  };

  // Handle day toggle
  const handleDayToggle = (day: string, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours[day],
          enabled
        }
      }
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    
    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        max_capacity: parseInt(formData.max_capacity) // Convert back to number for storage
      };

      const { error } = await supabase
        .from('restaurants')
        .update(dataToSave)
        .eq('id', restaurantId);
      
      if (error) throw error;
      
      toast({
        title: 'Configurações salvas',
        description: 'As informações do restaurante foram atualizadas com sucesso.',
      });
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar as informações do restaurante.',
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
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>
            Informações gerais do seu restaurante
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Restaurante</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
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
              rows={3}
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {formData.logo_url ? (
                <img 
                  src={formData.logo_url} 
                  alt="Logo" 
                  className="w-20 h-20 object-contain border rounded-lg"
                />
              ) : (
                <div className="w-20 h-20 border rounded-lg flex items-center justify-center bg-muted">
                  <span className="text-sm text-muted-foreground">Sem logo</span>
                </div>
              )}
              <Button type="button" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Alterar Logo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Endereço e Contato</CardTitle>
          <CardDescription>
            Informações de localização e contato do restaurante
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="postal_code">CEP</Label>
              <Input
                id="postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Horário de Funcionamento</CardTitle>
          <CardDescription>
            Configure os horários de funcionamento do restaurante
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(formData.opening_hours).map(([day, hours]) => (
              <div key={day} className="flex items-center gap-4">
                <Switch 
                  id={`day-${day}`}
                  checked={hours.enabled}
                  onCheckedChange={(checked) => handleDayToggle(day, checked)}
                />
                <Label htmlFor={`day-${day}`} className="w-24">{day}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={hours.open}
                    onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                    className="w-32"
                  />
                  <span>às</span>
                  <Input
                    type="time"
                    value={hours.close}
                    onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Capacidade</CardTitle>
          <CardDescription>
            Configure a capacidade máxima do restaurante
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="max_capacity">Capacidade Máxima (pessoas)</Label>
            <Input
              id="max_capacity"
              name="max_capacity"
              type="number"
              min="0"
              value={formData.max_capacity}
              onChange={handleInputChange}
            />
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