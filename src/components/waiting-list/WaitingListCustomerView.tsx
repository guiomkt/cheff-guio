import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
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
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { RestaurantArea } from '@/hooks/useWaitingList';

export function WaitingListCustomerView() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [areas, setAreas] = useState<RestaurantArea[]>([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    party_size: 2,
    area_preference: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<number | null>(null);

  // Fetch restaurant info and areas
  useEffect(() => {
    async function fetchRestaurantInfo() {
      if (!restaurantId) return;
      
      try {
        // Fetch restaurant info
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .single();
        
        if (restaurantError) throw restaurantError;
        setRestaurant(restaurantData);
        
        // Fetch areas
        const { data: areasData, error: areasError } = await supabase
          .from('restaurant_areas')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true)
          .order('order');
        
        if (areasError) throw areasError;
        setAreas(areasData || []);
        
        // Get estimated wait time
        const { data: waitTimeData, error: waitTimeError } = await supabase
          .from('waiting_list')
          .select('estimated_wait_time')
          .eq('restaurant_id', restaurantId)
          .eq('status', 'waiting')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (!waitTimeError && waitTimeData && waitTimeData.length > 0) {
          // Calculate average wait time from the last 5 entries
          const totalWaitTime = waitTimeData.reduce((sum, entry) => 
            sum + (entry.estimated_wait_time || 15), 0);
          setEstimatedWaitTime(Math.round(totalWaitTime / waitTimeData.length));
        } else {
          // Default wait time
          setEstimatedWaitTime(15);
        }
      } catch (error) {
        console.error('Error fetching restaurant info:', error);
        setError('Não foi possível carregar as informações do restaurante.');
      }
    }
    
    fetchRestaurantInfo();
  }, [restaurantId]);

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurantId || !formData.customer_name || !formData.phone_number) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get the next queue number
      const { data: maxQueueNumber, error: maxQueueError } = await supabase
        .from('waiting_list')
        .select('queue_number')
        .eq('restaurant_id', restaurantId)
        .order('queue_number', { ascending: false })
        .limit(1)
        .single();
      
      const nextQueueNumber = maxQueueError ? 1 : (maxQueueNumber?.queue_number || 0) + 1;
      
      // Create the new entry
      const newEntry = {
        restaurant_id: restaurantId,
        customer_name: formData.customer_name,
        phone_number: formData.phone_number,
        party_size: formData.party_size,
        queue_number: nextQueueNumber,
        status: 'waiting',
        priority: 'low',
        area_preference: formData.area_preference || null,
        estimated_wait_time: estimatedWaitTime,
        notes: formData.notes || null
      };
      
      const { error } = await supabase
        .from('waiting_list')
        .insert(newEntry);
      
      if (error) throw error;
      
      // Show success message
      setIsSuccess(true);
      setQueueNumber(nextQueueNumber);
    } catch (error) {
      console.error('Error adding to waiting list:', error);
      setError('Não foi possível adicionar você à fila de espera. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error && !restaurant) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
              <p className="text-center">{error}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-green-600">Adicionado à Fila!</CardTitle>
            <CardDescription className="text-center">
              {restaurant?.name || 'Restaurante'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Seu número na fila: {queueNumber}</h3>
              <p className="text-center mb-4">
                Você foi adicionado à fila de espera. Tempo estimado de espera: {estimatedWaitTime} minutos.
              </p>
              <div className="bg-muted/30 p-4 rounded-md w-full">
                <div className="flex items-center mb-2">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{formData.party_size} pessoas</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Você receberá uma notificação quando sua mesa estiver pronta.</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => window.location.reload()}>Adicionar Outra Pessoa</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Fila de Espera</CardTitle>
          <CardDescription className="text-center">
            {restaurant?.name || 'Carregando...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="customer_name">Nome *</Label>
              <Input
                id="customer_name"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleInputChange}
                placeholder="Seu nome completo"
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
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            
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
            
            {areas.length > 0 && (
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
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Alguma observação especial? (opcional)"
                rows={3}
              />
            </div>
            
            {error && (
              <div className="bg-red-100 text-red-800 p-3 rounded-md">
                {error}
              </div>
            )}
            
            <div className="bg-muted/30 p-3 rounded-md">
              <p className="text-sm">
                Tempo estimado de espera: <strong>{estimatedWaitTime} minutos</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Você receberá uma notificação por WhatsApp quando sua mesa estiver pronta.
              </p>
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Adicionando...' : 'Entrar na Fila'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}