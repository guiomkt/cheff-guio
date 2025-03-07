import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Loader2, Smartphone } from 'lucide-react';

export function WhatsAppStep() {
  const { 
    whatsAppInfo, 
    setWhatsAppInfo, 
    goToNextStep, 
    goToPreviousStep, 
    isLoading,
    canProceed
  } = useOnboarding();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWhatsAppInfo({ [name]: value });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Integração com WhatsApp</h2>
        <p className="text-muted-foreground">
          Configure a integração com WhatsApp para atendimento automatizado
        </p>
      </div>
      
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="instance_name">Nome da Instância</Label>
          <Input
            id="instance_name"
            name="instance_name"
            value={whatsAppInfo.instance_name || ''}
            onChange={handleChange}
            placeholder="Ex: Atendimento Principal"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="phone_number">Número de Telefone *</Label>
          <Input
            id="phone_number"
            name="phone_number"
            value={whatsAppInfo.phone_number || ''}
            onChange={handleChange}
            placeholder="Ex: +5511999999999"
            required
          />
          <p className="text-xs text-muted-foreground">
            Inclua o código do país e DDD. Exemplo: +5511999999999
          </p>
        </div>
        
        <div className="bg-muted/30 p-4 rounded-md mt-4">
          <div className="flex items-start space-x-4">
            <Smartphone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium">Como funciona a integração?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Após concluir o onboarding, você receberá um QR Code para escanear com o WhatsApp do seu celular. 
                Isso conectará o número informado ao ChefGuio, permitindo o atendimento automatizado.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
        <Button 
          variant="outline" 
          onClick={goToPreviousStep}
          className="order-2 sm:order-1"
        >
          Voltar
        </Button>
        <Button 
          onClick={goToNextStep} 
          disabled={isLoading || !canProceed}
          className="order-1 sm:order-2"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Próximo
        </Button>
      </div>
    </div>
  );
}