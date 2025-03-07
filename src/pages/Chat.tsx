import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatContactList } from '@/components/chat/ChatContactList';
import { ChatConversation } from '@/components/chat/ChatConversation';
import { ChatCustomerInfo } from '@/components/chat/ChatCustomerInfo';
import { ChatTemplates } from '@/components/chat/ChatTemplates';
import { ChatAnalytics } from '@/components/chat/ChatAnalytics';
import ChatNotifications from '@/components/chat/ChatNotifications';
import { useChat, ContactWithConversation } from '@/hooks/useChat';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { QrCode, RefreshCw, ChevronLeft, Info, MessageSquare, BarChart4, Calendar, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useLocation, useNavigate } from 'react-router-dom';

export function Chat() {
  const { toast } = useToast();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rightPanel, setRightPanel] = useState<'info' | 'templates' | 'analytics' | 'notifications'>('info');
  const [mobileView, setMobileView] = useState<'contacts' | 'conversation'>('contacts');
  const [whatsappStatus, setWhatsappStatus] = useState<'disconnected' | 'pending' | 'connected'>('disconnected');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { contacts, messages, activeContact, selectContact, isLoading, sendMessage, isAiEnabled, toggleAi, applyFilter, filter, updateContact, updateConversation, templates, createTemplate, deleteTemplate, fetchContacts } = useChat(restaurantId);

  // Get the restaurant ID when component mounts
  useEffect(() => {
    getRestaurantId();
  }, []);

  // Check WhatsApp status periodically
  useEffect(() => {
    if (restaurantId) {
      checkWhatsappStatus(restaurantId);
      
      const interval = setInterval(() => {
        checkWhatsappStatus(restaurantId);
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [restaurantId]);

  async function getRestaurantId() {
    console.log("Iniciando getRestaurantId");
    try {
      const userResponse = await supabase.auth.getUser();
      console.log("Resposta do supabase.auth.getUser:", userResponse);
      const { data: { user } } = userResponse;
      
      if (!user) {
        console.log("Usuário não autenticado - Ativando modo temporário com ID simulado");
        // Usar um ID de restaurante temporário para desenvolvimento
        const tempRestaurantId = "temp_restaurant_id_123";
        setRestaurantId(tempRestaurantId);
        setIsDevelopmentMode(true);
        console.log("ID de restaurante temporário definido:", tempRestaurantId);
        
        // Informar ao usuário que estamos em modo de desenvolvimento
        toast({
          title: "Modo de desenvolvimento",
          description: "Usando ID de restaurante temporário para teste.",
          variant: "default"
        });
        
        return;
      }
      
      const { data, error } = await supabase
        .from('restaurant_profile')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching restaurant:', error);
        setError("Não foi possível carregar os dados do restaurante.");
        return;
      }
      
      if (data) {
        setRestaurantId(data.id);
      } else {
        setError("Perfil de restaurante não encontrado.");
      }
    } catch (err) {
      console.error('Error in getRestaurantId:', err);
      setError("Erro ao buscar dados do restaurante.");
    }
  }

  // Check for contact ID in URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const contactId = params.get('contact');
    
    if (contactId && contacts.length > 0) {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        selectContact(contact);
        setMobileView('conversation');
        
        // Clear the URL parameter after selecting the contact
        navigate('/chat', { replace: true });
      }
    }
  }, [contacts, location.search]);

  // Check WhatsApp connection status
  const checkWhatsappStatus = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_integrations')
        .select('status, qr_code_url')
        .eq('restaurant_id', id)
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "Results contain 0 rows" - not an error for us
        throw error;
      }
      
      if (data) {
        setWhatsappStatus(data.status as 'connected' | 'disconnected' | 'pending');
        setQrCodeUrl(data.qr_code_url);
      } else {
        setWhatsappStatus('disconnected');
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      setWhatsappStatus('disconnected');
    }
  };

  // Open QR code dialog
  const handleOpenQrDialog = () => {
    // In a real app, this would generate a new QR code
    // For now, we'll use a placeholder
    setQrCodeUrl('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=WhatsAppConnection');
    setIsQrDialogOpen(true);
  };

  // Refresh contacts
  const handleRefreshContacts = () => {
    fetchContacts();
    toast({
      title: 'Contatos atualizados',
      description: 'A lista de contatos foi atualizada.',
    });
  };

  // Create dummy data for demonstration
  const handleCreateDummyData = async () => {
    if (!restaurantId) return;
    
    try {
      // Create sample contacts
      const contacts = [
        {
          restaurant_id: restaurantId,
          phone_number: '+5511999999001',
          name: 'João Silva',
          status: 'active',
          customer_type: 'vip',
          last_message_at: new Date().toISOString(),
          unread_count: 2,
          tags: ['reserva', 'vip'],
          notes: 'Cliente frequente, prefere mesas próximas à janela'
        },
        {
          restaurant_id: restaurantId,
          phone_number: '+5511999999002',
          name: 'Maria Oliveira',
          status: 'active',
          customer_type: 'returning',
          last_message_at: new Date(Date.now() - 30 * 60000).toISOString(),
          unread_count: 0,
          tags: ['cardápio', 'vegetariano'],
          notes: 'Vegetariana, sempre pergunta sobre opções sem carne'
        },
        {
          restaurant_id: restaurantId,
          phone_number: '+5511999999003',
          name: 'Pedro Santos',
          status: 'new',
          customer_type: 'new',
          last_message_at: new Date(Date.now() - 120 * 60000).toISOString(),
          unread_count: 1,
          tags: [],
          notes: ''
        },
        {
          restaurant_id: restaurantId,
          phone_number: '+5511999999004',
          name: 'Ana Ferreira',
          status: 'active',
          customer_type: 'returning',
          last_message_at: new Date(Date.now() - 240 * 60000).toISOString(),
          unread_count: 0,
          tags: ['aniversário'],
          notes: 'Aniversário em 15/10'
        },
        {
          restaurant_id: restaurantId,
          phone_number: '+5511999999005',
          name: 'Carlos Mendes',
          status: 'inactive',
          customer_type: 'returning',
          last_message_at: new Date(Date.now() - 48 * 3600000).toISOString(),
          unread_count: 0,
          tags: ['reclamação', 'resolvido'],
          notes: 'Teve problema com reserva no mês passado, mas foi resolvido'
        }
      ];
      
      // Insert contacts
      for (const contact of contacts) {
        const { data: contactData, error: contactError } = await supabase
          .from('chat_contacts')
          .insert(contact)
          .select('id')
          .single();
          
        if (contactError) {
          console.error('Error creating contact:', contactError);
          continue;
        }
        
        // Create conversation for this contact
        const conversation = {
          restaurant_id: restaurantId,
          contact_id: contactData.id,
          status: 'open',
          intent: contact.name === 'João Silva' ? 'reservation' : 
                 contact.name === 'Maria Oliveira' ? 'menu' :
                 contact.name === 'Carlos Mendes' ? 'complaint' :
                 contact.name === 'Ana Ferreira' ? 'feedback' : 'general',
          sentiment: contact.name === 'Carlos Mendes' ? 'negative' :
                    contact.name === 'Ana Ferreira' ? 'positive' : 'neutral',
          ai_enabled: true
        };
        
        const { data: conversationData, error: conversationError } = await supabase
          .from('chat_conversations')
          .insert(conversation)
          .select('id')
          .single();
          
        if (conversationError) {
          console.error('Error creating conversation:', conversationError);
          continue;
        }
        
        // Create messages for this conversation
        const messages = [];
        
        if (contact.name === 'João Silva') {
          messages.push(
            {
              conversation_id: conversationData.id,
              sender_type: 'customer',
              content: 'Olá, gostaria de fazer uma reserva para hoje à noite',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 120 * 60000).toISOString()
            },
            {
              conversation_id: conversationData.id,
              sender_type: 'ai',
              content: 'Olá João! Claro, podemos ajudar com sua reserva. Para quantas pessoas seria e qual horário você prefere?',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 119 * 60000).toISOString()
            },
            {
              conversation_id: conversationData.id,
              sender_type: 'customer',
              content: 'Seria para 4 pessoas, por volta das 20h',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 118 * 60000).toISOString()
            },
            {
              conversation_id: conversationData.id,
              sender_type: 'ai',
              content: 'Perfeito! Temos disponibilidade para 4 pessoas às 20h. Gostaria de confirmar essa reserva?',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 117 * 60000).toISOString()
            },
            {
              conversation_id: conversationData.id,
              sender_type: 'customer',
              content: 'Sim, por favor. Tem alguma mesa próxima à janela?',
              content_type: 'text',
              is_read: false,
              created_at: new Date(Date.now() - 5 * 60000).toISOString()
            }
          );
        } else if (contact.name === 'Maria Oliveira') {
          messages.push(
            {
              conversation_id: conversationData.id,
              sender_type: 'customer',
              content: 'Boa tarde! Vocês têm opções vegetarianas no cardápio?',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 90 * 60000).toISOString()
            },
            {
              conversation_id: conversationData.id,
              sender_type: 'ai',
              content: 'Olá Maria! Sim, temos várias opções vegetarianas. Nossos destaques são a lasanha de berinjela, risoto de cogumelos e salada mediterrânea. Gostaria de ver o cardápio completo?',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 89 * 60000).toISOString()
            },
            {
              conversation_id: conversationData.id,
              sender_type: 'customer',
              content: 'Sim, por favor!',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 88 * 60000).toISOString()
            },
            {
              conversation_id: conversationData.id,
              sender_type: 'restaurant',
              content: 'Cardápio Vegetariano',
              content_type: 'file',
              media_url: 'https://example.com/menu.pdf',
              is_read: true,
              created_at: new Date(Date.now() - 87 * 60000).toISOString()
            },
            {
              conversation_id: conversationData.id,
              sender_type: 'customer',
              content: 'Obrigada! Vou dar uma olhada',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 85 * 60000).toISOString()
            }
          );
        } else if (contact.name === 'Pedro Santos') {
          messages.push(
            {
              conversation_id: conversationData.id,
              sender_type: 'customer',
              content: 'Olá, qual o horário de funcionamento do restaurante?',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 150 * 60000).toISOString()
            },
            {
              conversation_id: conversationData.id,
              sender_type: 'ai',
              content: 'Olá Pedro! Nosso restaurante funciona de terça a domingo, das 11h30 às 15h para almoço e das 18h30 às 23h para jantar. Às segundas estamos fechados para manutenção. Posso ajudar com mais alguma informação?',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 149 * 60000).toISOString()
            },
            {
              conversation_id: conversationData.id,
              sender_type: 'customer',
              content: 'Preciso fazer reserva ou posso ir direto?',
              content_type: 'text',
              is_read: false,
              created_at: new Date(Date.now() - 30 * 60000).toISOString()
            }
          );
        } else if (contact.name === 'Ana Ferreira') {
          messages.push(
            {
              conversation_id: conversationData.id,
              sender_type: 'customer',
              content: 'Adorei o jantar de ontem! A comida estava incrível!',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 250 * 60000).toISOString()
            },
            {
              conversation_id: conversationData.id,
              sender_type: 'ai',
              content: 'Olá Ana! Ficamos muito felizes que tenha gostado da experiência! Agradecemos o feedback e esperamos vê-la novamente em breve. Há algo específico que tenha gostado mais?',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 249 * 60000).toISOString()
            },
            {
              conversation_id: conversationData.id,
              sender_type: 'customer',
              content: 'O risoto de camarão estava divino! E o atendimento foi excelente também.',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 248 * 60000).toISOString()
            },
            {
              conversation_id: conversationData.id,
              sender_type: 'restaurant',
              content: 'Ana, muito obrigado pelo feedback! Vamos compartilhar seus elogios com nossa equipe. Como agradecimento, na sua próxima visita, a sobremesa será por nossa conta! É só mencionar este chat ao fazer a reserva.',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 247 * 60000).toISOString()
            }
          );
        } else if (contact.name === 'Carlos Mendes') {
          messages.push(
            {
              conversation_id: conversationData.id,
              sender_type: 'customer',
              content: 'Estou muito insatisfeito com o atendimento de hoje. Fiz uma reserva e quando cheguei não tinha mesa disponível.',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 72 * 3600000).toISOString()
            },
            {
              conversation_id: conversationData.id,
              sender_type: 'ai',
              content: 'Olá Carlos, lamentamos muito pelo ocorrido. Entendemos sua frustração e gostaríamos de resolver essa situação. Vou transferir seu atendimento para nosso gerente.',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 71.9 * 3600000).toISOString()
            },
            {
              conversation_id: conversationData.id,
              sender_type: 'restaurant',
              content: 'Carlos, aqui é o Roberto, gerente do restaurante. Peço sinceras desculpas pelo transtorno com sua reserva. Houve um erro no nosso sistema. Gostaria de oferecer um jantar completo por nossa conta para você e um acompanhante como forma de compensação. Podemos agendar para a data que preferir.',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 71.8 * 3600000).toISOString()
            },
            {
              conversation_id: conversationData.id,
              sender_type: 'customer',
              content: 'Agradeço a atenção e aceito o convite. Podemos agendar para o próximo sábado?',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 71.7 * 3600000).toISOString()
            },
            {
              conversation_id: conversationData.id,
              sender_type: 'restaurant',
              content: 'Perfeito, Carlos! Está confirmado para sábado. Reservarei uma de nossas melhores mesas para você. Novamente, pedimos desculpas pelo ocorrido e agradecemos a oportunidade de corrigir nossa falha.',
              content_type: 'text',
              is_read: true,
              created_at: new Date(Date.now() - 71.6 * 3600000).toISOString()
            }
          );
        }
        
        // Insert messages
        if (messages.length > 0) {
          const { error: messagesError } = await supabase
            .from('chat_messages')
            .insert(messages);
            
          if (messagesError) {
            console.error('Error creating messages:', messagesError);
          }
        }
      }
      
      // Create templates
      const templates = [
        {
          restaurant_id: restaurantId,
          name: 'Saudação Inicial',
          content: 'Olá! Bem-vindo ao Restaurante Pelegrino. Como posso ajudar você hoje?',
          category: 'general'
        },
        {
          restaurant_id: restaurantId,
          name: 'Informações de Reserva',
          content: 'Para fazer uma reserva, precisamos saber a data, horário e número de pessoas. Poderia nos informar esses detalhes?',
          category: 'reservation'
        },
        {
          restaurant_id: restaurantId,
          name: 'Confirmação de Reserva',
          content: 'Sua reserva está confirmada para [DATA] às [HORÁRIO] para [NÚMERO] pessoas. Agradecemos a preferência e esperamos por você!',
          category: 'reservation'
        },
        {
          restaurant_id: restaurantId,
          name: 'Envio de Cardápio',
          content: 'Segue nosso cardápio completo. Se tiver alguma dúvida ou restrição alimentar, é só nos informar.',
          category: 'menu'
        },
        {
          restaurant_id: restaurantId,
          name: 'Resposta a Reclamação',
          content: 'Lamentamos muito pelo ocorrido. Sua satisfação é nossa prioridade e gostaríamos de resolver essa situação da melhor forma possível. Poderia nos fornecer mais detalhes para que possamos ajudar?',
          category: 'complaint'
        }
      ];
      
      // Insert templates
      const { error: templatesError } = await supabase
        .from('chat_templates')
        .insert(templates);
        
      if (templatesError) {
        console.error('Error creating templates:', templatesError);
      }
      
      // Create analytics data
      const analytics = {
        restaurant_id: restaurantId,
        date: new Date().toISOString().split('T')[0],
        total_conversations: 24,
        new_conversations: 8,
        ai_handled_conversations: 18,
        human_handled_conversations: 6,
        avg_response_time: 120, // seconds
        avg_resolution_time: 480, // seconds
        popular_topics: {
          'reservation': 12,
          'menu': 8,
          'hours': 5,
          'location': 3,
          'prices': 2
        }
      };
      
      // Insert analytics
      const { error: analyticsError } = await supabase
        .from('chat_analytics')
        .insert(analytics);
        
      if (analyticsError) {
        console.error('Error creating analytics:', analyticsError);
      }
      
      fetchContacts();
      
      toast({
        title: 'Dados de exemplo criados',
        description: 'Foram criados contatos, conversas, modelos e análises de exemplo para demonstração.',
      });
    } catch (error) {
      console.error('Error creating dummy data:', error);
      toast({
        title: 'Erro ao criar dados de exemplo',
        description: 'Ocorreu um erro ao criar os dados de exemplo.',
        variant: 'destructive',
      });
    }
  };

  // Handle contact selection on mobile
  const handleContactSelect = (contact: ContactWithConversation) => {
    selectContact(contact);
    setMobileView('conversation');
  };

  // Back to contacts list on mobile
  const handleBackToContacts = () => {
    setMobileView('contacts');
  };

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    // Here you would apply date filtering to your contacts/conversations
    // For now, we'll just show a toast
    if (range?.from) {
      const fromDate = format(range.from, 'dd/MM/yyyy', { locale: ptBR });
      const toDate = range.to ? format(range.to, 'dd/MM/yyyy', { locale: ptBR }) : fromDate;
      
      toast({
        title: 'Filtro de data aplicado',
        description: `Mostrando conversas de ${fromDate} até ${toDate}`,
      });
    }
  };

  // Quick date filters
  const applyQuickDateFilter = (days: number) => {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - days);
    
    setDateRange({ from, to: today });
    
    toast({
      title: 'Filtro de data aplicado',
      description: `Mostrando conversas dos últimos ${days} dias`,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Erro ao carregar o módulo de atendimento</h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          Não foi possível carregar os dados necessários. Por favor, verifique sua conexão e tente novamente.
        </p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <>
      {isDevelopmentMode && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 mb-4 shadow-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="font-bold">Modo de Desenvolvimento</p>
          </div>
          <p className="text-sm">Usando ID de restaurante temporário. Os dados mostrados são simulados.</p>
        </div>
      )}

      <div className="h-full flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold">Atendimento</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {dateRange?.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
                      ) : (
                        format(dateRange.from, 'dd/MM/yyyy')
                      )
                    ) : (
                      'Filtrar por Data'
                    )}
                  </span>
                  <span className="sm:hidden">Data</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 border-b">
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyQuickDateFilter(0)}
                    >
                      Hoje
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyQuickDateFilter(1)}
                    >
                      Ontem
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyQuickDateFilter(7)}
                    >
                      7 dias
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyQuickDateFilter(15)}
                    >
                      15 dias
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyQuickDateFilter(30)}
                    >
                      30 dias
                    </Button>
                  </div>
                </div>
                <DateRangePicker
                  date={dateRange}
                  onSelect={handleDateRangeChange}
                />
              </PopoverContent>
            </Popover>
            
            <Button
              variant={whatsappStatus === 'connected' ? 'default' : 'outline'}
              size="sm"
              onClick={handleOpenQrDialog}
              className="gap-2"
            >
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">
                {whatsappStatus === 'connected' ? 'WhatsApp Conectado' : 
                 whatsappStatus === 'pending' ? 'Aguardando Conexão' : 
                 'Conectar WhatsApp'}
              </span>
              <span className="sm:hidden">WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshContacts}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            {contacts.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateDummyData}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Criar Exemplos</span>
                <span className="inline sm:hidden">Exemplos</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile View */}
        <div className="flex-1 border rounded-lg overflow-hidden md:hidden">
          {mobileView === 'contacts' ? (
            <ChatContactList
              contacts={contacts}
              activeContact={activeContact}
              onSelectContact={handleContactSelect}
              onApplyFilter={applyFilter}
              filter={filter}
            />
          ) : (
            <div className="h-full flex flex-col">
              <div className="p-2 border-b flex items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToContacts}
                  className="mr-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Voltar</span>
                </Button>
                
                {activeContact && (
                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center">
                      <h3 className="font-medium">{activeContact.name}</h3>
                    </div>
                    
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Informações</span>
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right">
                        <SheetHeader>
                          <SheetTitle>Informações do Cliente</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4">
                          <Tabs defaultValue="info">
                            <TabsList className="w-full">
                              <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                              <TabsTrigger value="templates" className="flex-1">Modelos</TabsTrigger>
                              <TabsTrigger value="notifications" className="flex-1">Notif.</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="info" className="mt-4">
                              <ChatCustomerInfo
                                contact={activeContact}
                                onUpdateContact={updateContact}
                                onUpdateConversation={updateConversation}
                              />
                            </TabsContent>
                            
                            <TabsContent value="templates" className="mt-4">
                              <ChatTemplates
                                templates={templates}
                                onCreateTemplate={createTemplate}
                                onDeleteTemplate={deleteTemplate}
                                onSelectTemplate={(content) => {
                                  if (activeContact) {
                                    sendMessage(content);
                                  }
                                }}
                              />
                            </TabsContent>
                            
                            <TabsContent value="notifications" className="mt-4">
                              <ChatNotifications />
                            </TabsContent>
                          </Tabs>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <ChatConversation
                  contact={activeContact}
                  messages={messages}
                  onSendMessage={sendMessage}
                  isAiEnabled={isAiEnabled}
                  onToggleAi={toggleAi}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Desktop View */}
        <div className="hidden md:flex md:flex-1 md:grid md:grid-cols-12 md:gap-0 md:border md:rounded-lg md:overflow-hidden h-[calc(100vh-180px)]">
          {/* Contact list - 3 columns on large screens, 4 on medium */}
          <div className="col-span-4 lg:col-span-3 overflow-hidden">
            <ChatContactList
              contacts={contacts}
              activeContact={activeContact}
              onSelectContact={selectContact}
              onApplyFilter={applyFilter}
              filter={filter}
            />
          </div>
          
          {/* Conversation - 5 columns on large screens, 8 on medium */}
          <div className="col-span-8 lg:col-span-6 border-x overflow-hidden">
            <ChatConversation
              contact={activeContact}
              messages={messages}
              onSendMessage={sendMessage}
              isAiEnabled={isAiEnabled}
              onToggleAi={toggleAi}
            />
          </div>
          
          {/* Right panel - 4 columns on large screens, hidden on medium and below */}
          <div className="hidden lg:block lg:col-span-3 overflow-hidden">
            <Tabs value={rightPanel} onValueChange={(value) => setRightPanel(value as any)} className="h-full flex flex-col">
              <TabsList className="w-full px-2 py-1 flex-shrink-0">
                <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                <TabsTrigger value="templates" className="flex-1">Modelos</TabsTrigger>
                <TabsTrigger value="analytics" className="flex-1">Análise</TabsTrigger>
                <TabsTrigger value="notifications" className="flex-1">Notif.</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="h-[calc(100%-42px)] flex-grow data-[state=active]:flex data-[state=active]:flex-col">
                <ChatCustomerInfo
                  contact={activeContact}
                  onUpdateContact={updateContact}
                  onUpdateConversation={updateConversation}
                />
              </TabsContent>
              
              <TabsContent value="templates" className="h-[calc(100%-42px)] flex-grow data-[state=active]:flex data-[state=active]:flex-col">
                <ChatTemplates
                  templates={templates}
                  onCreateTemplate={createTemplate}
                  onDeleteTemplate={deleteTemplate}
                  onSelectTemplate={(content) => {
                    if (activeContact) {
                      sendMessage(content);
                    }
                  }}
                />
              </TabsContent>
              
              <TabsContent value="analytics" className="h-[calc(100%-42px)] flex-grow data-[state=active]:flex data-[state=active]:flex-col">
                <ChatAnalytics analytics={null} />
              </TabsContent>
              
              <TabsContent value="notifications" className="h-[calc(100%-42px)] flex-grow data-[state=active]:flex data-[state=active]:flex-col">
                <ChatNotifications />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Mobile Analytics Button */}
        <div className="fixed bottom-4 right-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
                <BarChart4 className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Análise de Atendimento</SheetTitle>
              </SheetHeader>
              <div className="mt-4 h-full overflow-auto pb-8">
                <ChatAnalytics analytics={null} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* QR Code Dialog */}
        <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conectar WhatsApp</DialogTitle>
              <DialogDescription>
                Escaneie o QR code abaixo com seu WhatsApp para conectar ao ChefGuio.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center justify-center py-4">
              {qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="WhatsApp QR Code" 
                  className="w-64 h-64 border rounded-lg"
                />
              ) : (
                <div className="w-64 h-64 border rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">QR Code não disponível</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Abra o WhatsApp no seu celular, vá em Configurações &gt; Dispositivos conectados &gt; Conectar um dispositivo
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}