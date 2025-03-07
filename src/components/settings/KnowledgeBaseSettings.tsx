import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface KnowledgeBaseSettingsProps {
  restaurantId: string | null;
}

export function KnowledgeBaseSettings({ restaurantId }: KnowledgeBaseSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [knowledgeItems, setKnowledgeItems] = useState<any[]>([]);
  const { toast } = useToast();

  // Fetch knowledge base items
  useEffect(() => {
    async function fetchKnowledgeBase() {
      if (!restaurantId) return;
      
      try {
        const { data, error } = await supabase
          .from('knowledge_base')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('category');
        
        if (error) throw error;
        
        setKnowledgeItems(data || []);
      } catch (error) {
        console.error('Error fetching knowledge base:', error);
        toast({
          title: 'Erro ao carregar base de conhecimento',
          description: 'Não foi possível carregar os itens da base de conhecimento.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchKnowledgeBase();
  }, [restaurantId]);

  // Filter items based on search and category
  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

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
              <CardTitle>Base de Conhecimento</CardTitle>
              <CardDescription>
                Gerencie as perguntas e respostas da base de conhecimento
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar na base de conhecimento..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="restaurant">Restaurante</SelectItem>
                  <SelectItem value="menu">Cardápio</SelectItem>
                  <SelectItem value="events">Eventos</SelectItem>
                  <SelectItem value="reservations">Reservas</SelectItem>
                  <SelectItem value="policies">Políticas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pergunta</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.question}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.category === 'restaurant' ? 'Restaurante' :
                         item.category === 'menu' ? 'Cardápio' :
                         item.category === 'events' ? 'Eventos' :
                         item.category === 'reservations' ? 'Reservas' :
                         item.category === 'policies' ? 'Políticas' :
                         item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span>{item.usage_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <p className="text-muted-foreground">
                        Nenhum item encontrado na base de conhecimento.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
          <CardDescription>
            Análise das perguntas mais feitas pelos clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total de Perguntas </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">
                    Últimos 30 dias
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Taxa de Resposta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">95%</div>
                  <p className="text-xs text-muted-foreground">
                    Perguntas respondidas com sucesso
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Novas Perguntas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">47</div>
                  <p className="text-xs text-muted-foreground">
                    Aguardando resposta
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-4">Tendências de Perguntas</h4>
              <div className="space-y-4">
                {[
                  { question: "Qual o horário de funcionamento?", count: 156, trend: "up" },
                  { question: "Fazem reservas para grupos?", count: 98, trend: "up" },
                  { question: "Tem opções vegetarianas?", count: 87, trend: "stable" },
                  { question: "Aceitam cartão refeição?", count: 65, trend: "down" },
                  { question: "Tem estacionamento?", count: 54, trend: "stable" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{item.count} vezes</span>
                      </div>
                    </div>
                    <TrendingUp className={`h-4 w-4 ${
                      item.trend === 'up' ? 'text-green-500' :
                      item.trend === 'down' ? 'text-red-500' :
                      'text-yellow-500'
                    }`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Sugestões Automáticas</CardTitle>
          <CardDescription>
            Itens sugeridos para adicionar à base de conhecimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { question: "Qual o valor do couvert?", frequency: 12, category: "menu" },
              { question: "Tem música ao vivo?", frequency: 8, category: "events" },
              { question: "Fazem pratos sem glúten?", frequency: 6, category: "menu" }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{item.question}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">
                      {item.category === 'menu' ? 'Cardápio' :
                       item.category === 'events' ? 'Eventos' :
                       item.category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Perguntado {item.frequency} vezes esta semana
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}