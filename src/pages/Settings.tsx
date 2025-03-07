import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RestaurantSettings } from '@/components/settings/RestaurantSettings';
import { MenuSettings } from '@/components/settings/MenuSettings';
import { AiSettings } from '@/components/settings/AiSettings';
import { WhatsAppSettings } from '@/components/settings/WhatsAppSettings';
import { KnowledgeBaseSettings } from '@/components/settings/KnowledgeBaseSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { BackupSettings } from '@/components/settings/BackupSettings';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Utensils, 
  Bot, 
  MessageSquare, 
  BookOpen,
  Bell,
  Database
} from 'lucide-react';

export function Settings() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Get the first restaurant ID on component mount
  useEffect(() => {
    async function getRestaurantId() {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id')
          .eq('onboarding_completed', true)
          .limit(1)
          .single();
        
        if (error) throw error;
        if (data) {
          setRestaurantId(data.id);
        }
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        toast({
          title: 'Erro ao carregar restaurante',
          description: 'Não foi possível carregar as informações do restaurante.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    getRestaurantId();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>
      
      <div className="flex-1 border rounded-lg overflow-hidden">
        <Tabs defaultValue="restaurant" className="h-full flex flex-col">
          <div className="border-b px-4 py-2">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="restaurant" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>Restaurante</span>
              </TabsTrigger>
              <TabsTrigger value="menu" className="flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                <span>Cardápio</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <span>IA</span>
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>WhatsApp</span>
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Base de Conhecimento</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span>Notificações</span>
              </TabsTrigger>
              <TabsTrigger value="backup" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Backup</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-auto">
            <TabsContent value="restaurant" className="h-full p-4">
              <RestaurantSettings restaurantId={restaurantId} />
            </TabsContent>
            
            <TabsContent value="menu" className="h-full p-4">
              <MenuSettings restaurantId={restaurantId} />
            </TabsContent>
            
            <TabsContent value="ai" className="h-full p-4">
              <AiSettings restaurantId={restaurantId} />
            </TabsContent>
            
            <TabsContent value="whatsapp" className="h-full p-4">
              <WhatsAppSettings restaurantId={restaurantId} />
            </TabsContent>
            
            <TabsContent value="knowledge" className="h-full p-4">
              <KnowledgeBaseSettings restaurantId={restaurantId} />
            </TabsContent>
            
            <TabsContent value="notifications" className="h-full p-4">
              <NotificationSettings restaurantId={restaurantId} />
            </TabsContent>
            
            <TabsContent value="backup" className="h-full p-4">
              <BackupSettings restaurantId={restaurantId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}