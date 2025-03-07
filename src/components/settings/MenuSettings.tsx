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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, Plus, Edit, Trash2, Image } from 'lucide-react';
import { MenuCategory, MenuItem } from '@/db/schema';

interface MenuSettingsProps {
  restaurantId: string | null;
}

export function MenuSettings({ restaurantId }: MenuSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const { toast } = useToast();

  // Fetch menu data
  useEffect(() => {
    async function fetchMenu() {
      if (!restaurantId) return;
      
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('menu_categories')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('order');
        
        if (categoriesError) throw categoriesError;
        
        // Fetch items
        const { data: itemsData, error: itemsError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('name');
        
        if (itemsError) throw itemsError;
        
        setCategories(categoriesData || []);
        setItems(itemsData || []);
      } catch (error) {
        console.error('Error fetching menu:', error);
        toast({
          title: 'Erro ao carregar cardápio',
          description: 'Não foi possível carregar as informações do cardápio.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchMenu();
  }, [restaurantId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categorias do Cardápio</CardTitle>
              <CardDescription>
                Gerencie as categorias do seu cardápio
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {categories.map(category => (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="hover:bg-accent/20 px-4 rounded-md">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center">
                      <span className="font-medium">{category.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({items.filter(item => item.category_id === category.id).length} itens)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!category.is_active && (
                        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                          Inativo
                        </span>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2 pb-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Editar Categoria
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remover Categoria
                        </Button>
                      </div>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Item
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      {items
                        .filter(item => item.category_id === category.id)
                        .map(item => (
                          <div 
                            key={item.id} 
                            className="flex justify-between items-center p-4 border rounded-lg bg-card"
                          >
                            <div className="flex items-center gap-4">
                              {item.image_url ? (
                                <img 
                                  src={item.image_url} 
                                  alt={item.name}
                                  className="w-16 h-16 object-cover rounded-md"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                                  <Image className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <h4 className="font-medium">{item.name}</h4>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {item.description}
                                  </p>
                                )}
                                <p className="text-sm font-medium mt-1">
                                  {item.price.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={item.is_active} />
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          {categories.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma categoria cadastrada. Adicione categorias para começar.
              </p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Categoria
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Cardápios Sazonais</CardTitle>
          <CardDescription>
            Configure cardápios especiais para datas ou eventos específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Em breve você poderá criar cardápios especiais para datas comemorativas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}