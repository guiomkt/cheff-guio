import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Loader2 } from 'lucide-react';

export function RestaurantInfoStep() {
  const { 
    restaurantInfo, 
    setRestaurantInfo, 
    goToNextStep, 
    isLoading,
    canProceed
  } = useOnboarding();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRestaurantInfo({ [name]: value });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Informações do Restaurante</h2>
        <p className="text-muted-foreground">
          Preencha os dados básicos do seu estabelecimento
        </p>
      </div>
      
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome do Restaurante *</Label>
          <Input
            id="name"
            name="name"
            value={restaurantInfo.name || ''}
            onChange={handleChange}
            placeholder="Ex: Restaurante Pelegrino"
            required
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            name="description"
            value={restaurantInfo.description || ''}
            onChange={handleChange}
            placeholder="Descreva seu restaurante em poucas palavras..."
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="address">Endereço *</Label>
            <Input
              id="address"
              name="address"
              value={restaurantInfo.address || ''}
              onChange={handleChange}
              placeholder="Ex: Rua das Flores, 123"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="city">Cidade *</Label>
            <Input
              id="city"
              name="city"
              value={restaurantInfo.city || ''}
              onChange={handleChange}
              placeholder="Ex: São Paulo"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="state">Estado</Label>
            <Input
              id="state"
              name="state"
              value={restaurantInfo.state || ''}
              onChange={handleChange}
              placeholder="Ex: SP"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="postal_code">CEP</Label>
            <Input
              id="postal_code"
              name="postal_code"
              value={restaurantInfo.postal_code || ''}
              onChange={handleChange}
              placeholder="Ex: 01234-567"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              name="phone"
              value={restaurantInfo.phone || ''}
              onChange={handleChange}
              placeholder="Ex: (11) 99999-9999"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={restaurantInfo.email || ''}
              onChange={handleChange}
              placeholder="Ex: contato@restaurante.com"
            />
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            value={restaurantInfo.website || ''}
            onChange={handleChange}
            placeholder="Ex: www.restaurante.com"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="max_capacity">Capacidade Máxima (pessoas)</Label>
          <Input
            id="max_capacity"
            name="max_capacity"
            type="number"
            value={restaurantInfo.max_capacity || ''}
            onChange={handleChange}
            placeholder="Ex: 120"
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={goToNextStep} 
          disabled={isLoading || !canProceed}
          className="w-full sm:w-auto"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Próximo
        </Button>
      </div>
    </div>
  );
}