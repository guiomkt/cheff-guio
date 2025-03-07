import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export function CompletionStep() {
  const { 
    goToPreviousStep, 
    saveProgress,
    restaurantId
  } = useOnboarding();
  
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleComplete = async () => {
    try {
      setIsLoading(true);
      
      // First save progress to ensure all data is stored
      await saveProgress();
      
      // Then mark as completed directly in the database
      if (restaurantId) {
        const { error } = await supabase
          .from('restaurants')
          .update({ 
            onboarding_completed: true,
            onboarding_step: 5
          })
          .eq('id', restaurantId);
          
        if (error) {
          console.error('Error updating restaurant:', error);
          throw error;
        }
      } else {
        // If no restaurant ID, create a new one with completed status
        const { data, error } = await supabase
          .from('restaurants')
          .insert({
            name: 'Meu Restaurante',
            onboarding_completed: true,
            onboarding_step: 5
          })
          .select('id')
          .single();
          
        if (error) {
          console.error('Error creating restaurant:', error);
          throw error;
        }
      }
      
      // Show success message
      toast({
        title: 'Configuração concluída!',
        description: 'Seu restaurante foi configurado com sucesso.',
      });
      
      // Force a window location change instead of using React Router
      window.location.href = '/';
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Erro ao concluir configuração',
        description: 'Ocorreu um erro ao finalizar o processo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuração Concluída!</h2>
        <p className="text-muted-foreground">
          Seu restaurante foi configurado com sucesso.
        </p>
      </div>
      
      <div className="py-8 flex flex-col items-center justify-center">
        <CheckCircle className="h-24 w-24 text-primary mb-6" />
        <p className="text-lg mb-2 text-center">
          Parabéns! Você concluiu a configuração inicial do ChefGuio.
        </p>
        <p className="text-muted-foreground text-center max-w-md">
          Agora você pode começar a gerenciar seu restaurante, 
          reservas, mesas e muito mais. Você pode ajustar as 
          configurações a qualquer momento.
        </p>
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
          onClick={handleComplete} 
          disabled={isLoading}
          className="order-1 sm:order-2"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ir para o Dashboard
        </Button>
      </div>
    </div>
  );
}