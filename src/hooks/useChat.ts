import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ChatContact, 
  ChatConversation, 
  ChatMessage, 
  ChatTemplate 
} from '@/db/schema';
import { useToast } from '@/hooks/use-toast';

export interface ContactWithConversation extends ChatContact {
  conversation: ChatConversation;
  last_message?: ChatMessage;
}

export const useChat = (restaurantId: string | null, onLoadingComplete?: () => void) => {
  console.log("useChat chamado com restaurantId:", restaurantId);
  const [contacts, setContacts] = useState<ContactWithConversation[]>([]);
  const [activeContact, setActiveContact] = useState<ContactWithConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [templates, setTemplates] = useState<ChatTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [filter, setFilter] = useState<{
    status?: string;
    intent?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});
  const { toast } = useToast();

  // Fetch contacts with their conversations
  const fetchContacts = async () => {
    if (!restaurantId) {
      console.log("fetchContacts: restaurantId é nulo, não carregando contatos");
      toast({
        title: "Erro de carregamento",
        description: "Não foi possível carregar os contatos. ID do restaurante não disponível.",
        variant: "destructive"
      });
      return [];
    }
    
    setIsLoading(true);
    try {
      console.log("Iniciando carregamento de contatos para restaurantId:", restaurantId);
      // In a real implementation, this would be a join query
      // For now, we'll simulate the data structure
      
      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('chat_contacts')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('last_message_at', { ascending: false });
      
      if (contactsError) {
        console.error('Error fetching contacts:', contactsError);
        throw contactsError;
      }
      
      // For each contact, fetch their active conversation
      const contactsWithConversations: ContactWithConversation[] = [];
      
      if (contactsData && contactsData.length > 0) {
        for (const contact of contactsData) {
          // Fetch the active conversation for this contact
          const { data: conversationData, error: conversationError } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('contact_id', contact.id)
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (conversationError && conversationError.code !== 'PGRST116') {
            // PGRST116 is "Results contain 0 rows" - not an error for us
            console.error('Error fetching conversation:', conversationError);
            continue;
          }
          
          // Fetch the last message for this conversation
          let lastMessage = null;
          if (conversationData) {
            const { data: messageData, error: messageError } = await supabase
              .from('chat_messages')
              .select('*')
              .eq('conversation_id', conversationData.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (messageError && messageError.code !== 'PGRST116') {
              console.error('Error fetching last message:', messageError);
            } else {
              lastMessage = messageData;
            }
          }
          
          contactsWithConversations.push({
            ...contact,
            conversation: conversationData || {
              id: '',
              restaurant_id: restaurantId,
              contact_id: contact.id,
              status: 'open',
              intent: 'general',
              sentiment: 'neutral',
              ai_enabled: true,
              assigned_to: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            last_message: lastMessage
          });
        }
      }
      
      // Apply filters if any
      let filteredContacts = contactsWithConversations;
      
      if (filter.status) {
        filteredContacts = filteredContacts.filter(
          contact => contact.status === filter.status
        );
      }
      
      if (filter.intent) {
        filteredContacts = filteredContacts.filter(
          contact => contact.conversation.intent === filter.intent
        );
      }
      
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredContacts = filteredContacts.filter(
          contact => 
            contact.name.toLowerCase().includes(searchLower) ||
            contact.phone_number.includes(filter.search!)
        );
      }
      
      if (filter.dateFrom) {
        const fromDate = new Date(filter.dateFrom);
        filteredContacts = filteredContacts.filter(
          contact => new Date(contact.last_message_at) >= fromDate
        );
      }
      
      if (filter.dateTo) {
        const toDate = new Date(filter.dateTo);
        // Set to end of day
        toDate.setHours(23, 59, 59, 999);
        filteredContacts = filteredContacts.filter(
          contact => new Date(contact.last_message_at) <= toDate
        );
      }
      
      setContacts(filteredContacts);
      
      // If we have contacts and no active contact, set the first one as active
      if (filteredContacts.length > 0 && !activeContact) {
        setActiveContact(filteredContacts[0]);
        await fetchMessages(filteredContacts[0].conversation.id);
      }
      
      return filteredContacts;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: 'Erro ao carregar contatos',
        description: 'Não foi possível carregar a lista de contatos.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    if (!conversationId) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setMessages(data || []);
      
      // Mark messages as read
      if (data && data.length > 0) {
        const unreadMessages = data.filter(
          msg => !msg.is_read && msg.sender_type === 'customer'
        );
        
        if (unreadMessages.length > 0) {
          await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .in('id', unreadMessages.map(msg => msg.id));
          
          // Update unread count for the contact
          if (activeContact) {
            const updatedContact = { ...activeContact, unread_count: 0 };
            setActiveContact(updatedContact);
            setContacts(prev => 
              prev.map(c => c.id === updatedContact.id ? updatedContact : c)
            );
            
            await supabase
              .from('chat_contacts')
              .update({ unread_count: 0 })
              .eq('id', activeContact.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Erro ao carregar mensagens',
        description: 'Não foi possível carregar as mensagens da conversa.',
        variant: 'destructive',
      });
    }
  };

  // Fetch message templates
  const fetchTemplates = async () => {
    if (!restaurantId) {
      console.log("fetchTemplates: restaurantId é nulo, não carregando templates");
      toast({
        title: "Erro de carregamento",
        description: "Não foi possível carregar os templates. ID do restaurante não disponível.",
        variant: "destructive"
      });
      return [];
    }
    
    try {
      console.log("Iniciando carregamento de templates para restaurantId:", restaurantId);
      const { data, error } = await supabase
        .from('chat_templates')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching templates:', error);
        console.error('Detalhes do erro:', JSON.stringify(error));
        toast({
          title: "Erro ao carregar templates",
          description: "Não foi possível carregar os templates de mensagem.",
          variant: "destructive"
        });
        throw error;
      }
      
      console.log(`${data?.length || 0} templates carregados com sucesso`);
      setTemplates(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      console.error('Detalhes do erro:', JSON.stringify(error));
      toast({
        title: "Erro ao carregar templates",
        description: "Ocorreu um erro ao carregar os templates de mensagem.",
        variant: "destructive"
      });
      return [];
    }
  };

  // Send a message
  const sendMessage = async (content: string, contentType: 'text' | 'image' | 'file' = 'text', mediaUrl?: string) => {
    if (!activeContact || !content.trim()) return null;
    
    try {
      const conversationId = activeContact.conversation.id;
      
      // Create a new conversation if needed
      let actualConversationId = conversationId;
      if (!conversationId) {
        const { data: newConversation, error: conversationError } = await supabase
          .from('chat_conversations')
          .insert({
            restaurant_id: restaurantId,
            contact_id: activeContact.id,
            status: 'open',
            intent: 'general',
            sentiment: 'neutral',
            ai_enabled: isAiEnabled
          })
          .select()
          .single();
        
        if (conversationError) throw conversationError;
        
        actualConversationId = newConversation.id;
        
        // Update the active contact with the new conversation
        const updatedContact = {
          ...activeContact,
          conversation: newConversation
        };
        setActiveContact(updatedContact);
        setContacts(prev => 
          prev.map(c => c.id === updatedContact.id ? updatedContact : c)
        );
      }
      
      // Send the message
      const newMessage = {
        conversation_id: actualConversationId,
        sender_type: 'restaurant',
        sender_id: null, // In a real app, this would be the user ID
        content,
        content_type: contentType,
        media_url: mediaUrl || null,
        is_read: true
      };
      
      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert(newMessage)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the messages list
      setMessages(prev => [...prev, message]);
      
      // Update // Update the last message for the contact
      const updatedContact = {
        ...activeContact,
        last_message_at: new Date().toISOString()
      };
      setActiveContact(updatedContact);
      setContacts(prev => 
        prev.map(c => c.id === updatedContact.id ? updatedContact : c)
      );
      
      // Update the contact's last message timestamp
      await supabase
        .from('chat_contacts')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', activeContact.id);
      
      // Simulate AI response if AI is enabled
      if (isAiEnabled) {
        simulateAiResponse(actualConversationId);
      }
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Simulate AI response (in a real app, this would call an AI service)
  const simulateAiResponse = async (conversationId: string) => {
    // Wait a bit to simulate AI thinking
    setTimeout(async () => {
      try {
        // Generate a simple response
        const aiResponses = [
          "Olá! Como posso ajudar você hoje?",
          "Obrigado por entrar em contato com nosso restaurante.",
          "Temos mesas disponíveis para reserva hoje. Gostaria de fazer uma reserva?",
          "Nosso cardápio está disponível online. Posso enviar o link para você.",
          "Estamos abertos das 11h às 23h todos os dias.",
          "Posso ajudar com mais alguma coisa?"
        ];
        
        const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
        
        const aiMessage = {
          conversation_id: conversationId,
          sender_type: 'ai',
          sender_id: null,
          content: randomResponse,
          content_type: 'text',
          media_url: null,
          is_read: true
        };
        
        const { data: message, error } = await supabase
          .from('chat_messages')
          .insert(aiMessage)
          .select()
          .single();
        
        if (error) throw error;
        
        // Update the messages list
        setMessages(prev => [...prev, message]);
      } catch (error) {
        console.error('Error simulating AI response:', error);
      }
    }, 1500);
  };

  // Toggle AI for the current conversation
  const toggleAi = async () => {
    if (!activeContact) return;
    
    try {
      const newAiEnabled = !isAiEnabled;
      setIsAiEnabled(newAiEnabled);
      
      if (activeContact.conversation.id) {
        await supabase
          .from('chat_conversations')
          .update({ ai_enabled: newAiEnabled })
          .eq('id', activeContact.conversation.id);
        
        // Update the active contact
        const updatedContact = {
          ...activeContact,
          conversation: {
            ...activeContact.conversation,
            ai_enabled: newAiEnabled
          }
        };
        setActiveContact(updatedContact);
        setContacts(prev => 
          prev.map(c => c.id === updatedContact.id ? updatedContact : c)
        );
        
        // Show toast notification
        toast({
          title: newAiEnabled ? 'IA Ativada' : 'IA Desativada',
          description: newAiEnabled 
            ? 'O assistente de IA agora responderá automaticamente.' 
            : 'O assistente de IA foi pausado.',
        });
      }
    } catch (error) {
      console.error('Error toggling AI:', error);
      toast({
        title: 'Erro ao alterar configuração de IA',
        description: 'Não foi possível alterar o status da IA.',
        variant: 'destructive',
      });
    }
  };

  // Set active contact and load their messages
  const selectContact = async (contact: ContactWithConversation) => {
    setActiveContact(contact);
    if (contact.conversation.id) {
      await fetchMessages(contact.conversation.id);
      setIsAiEnabled(contact.conversation.ai_enabled);
    } else {
      setMessages([]);
      setIsAiEnabled(true);
    }
  };

  // Update contact information
  const updateContact = async (contactId: string, data: Partial<ChatContact>) => {
    try {
      const { data: updatedContact, error } = await supabase
        .from('chat_contacts')
        .update(data)
        .eq('id', contactId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the contacts list
      setContacts(prev => 
        prev.map(c => c.id === contactId ? { ...c, ...updatedContact } : c)
      );
      
      // Update active contact if needed
      if (activeContact && activeContact.id === contactId) {
        setActiveContact({ ...activeContact, ...updatedContact });
      }
      
      toast({
        title: 'Contato atualizado',
        description: 'As informações do contato foram atualizadas com sucesso.',
      });
      
      return updatedContact;
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: 'Erro ao atualizar contato',
        description: 'Não foi possível atualizar as informações do contato.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update conversation information
  const updateConversation = async (conversationId: string, data: Partial<ChatConversation>) => {
    try {
      const { data: updatedConversation, error } = await supabase
        .from('chat_conversations')
        .update(data)
        .eq('id', conversationId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the active contact if needed
      if (activeContact && activeContact.conversation.id === conversationId) {
        const updatedContact = {
          ...activeContact,
          conversation: {
            ...activeContact.conversation,
            ...updatedConversation
          }
        };
        setActiveContact(updatedContact);
        setContacts(prev => 
          prev.map(c => c.id === updatedContact.id ? updatedContact : c)
        );
      }
      
      return updatedConversation;
    } catch (error) {
      console.error('Error updating conversation:', error);
      toast({
        title: 'Erro ao atualizar conversa',
        description: 'Não foi possível atualizar as informações da conversa.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Create a new message template
  const createTemplate = async (template: Omit<ChatTemplate, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
    if (!restaurantId) return null;
    
    try {
      const newTemplate = {
        ...template,
        restaurant_id: restaurantId
      };
      
      const { data, error } = await supabase
        .from('chat_templates')
        .insert(newTemplate)
        .select()
        .single();
      
      if (error) throw error;
      
      setTemplates(prev => [...prev, data]);
      
      toast({
        title: 'Modelo criado',
        description: 'O modelo de mensagem foi criado com sucesso.',
      });
      
      return data;
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Erro ao criar modelo',
        description: 'Não foi possível criar o modelo de mensagem.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Delete a message template
  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('chat_templates')
        .delete()
        .eq('id', templateId);
      
      if (error) throw error;
      
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      toast({
        title: 'Modelo excluído',
        description: 'O modelo de mensagem foi excluído com sucesso.',
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Erro ao excluir modelo',
        description: 'Não foi possível excluir o modelo de mensagem.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Apply filters to the contacts list
  const applyFilter = (newFilter: typeof filter) => {
    setFilter(newFilter);
  };

  // Create dummy data for demonstration
  const createDummyData = async (restaurantId: string) => {
    // This function is implemented in the Chat.tsx component
    // It's just a placeholder here for the interface
    return true;
  };

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      console.log("loadData sendo executado para restaurantId:", restaurantId);
      setIsLoading(true);
      
      try {
        if (!restaurantId) {
          console.log("loadData: restaurantId é nulo, não carregando dados");
          setIsLoading(false);
          if (onLoadingComplete) {
            console.log("Chamando onLoadingComplete após falha no carregamento (restaurantId nulo)");
            onLoadingComplete();
          }
          toast({
            title: "Aviso de carregamento",
            description: "Aguardando identificação do restaurante...",
            variant: "default"
          });
          return;
        }

        console.log("Carregando contatos e templates para restaurantId:", restaurantId);
        const loadedContacts = await fetchContacts();
        console.log(`${loadedContacts.length} contatos carregados`);
        
        const loadedTemplates = await fetchTemplates();
        console.log(`${loadedTemplates.length} templates carregados`);
        
        console.log("Todos os dados carregados com sucesso");
        setIsLoading(false);
        
        if (onLoadingComplete) {
          console.log("Chamando onLoadingComplete após carregamento bem-sucedido");
          onLoadingComplete();
        }
      } catch (error) {
        console.error("Erro no carregamento de dados:", error);
        console.error("Detalhes do erro:", JSON.stringify(error));
        toast({
          title: "Erro de carregamento",
          description: "Não foi possível carregar os dados. Por favor, tente novamente.",
          variant: "destructive"
        });
        setIsLoading(false);
        if (onLoadingComplete) {
          console.log("Chamando onLoadingComplete após erro no carregamento");
          onLoadingComplete();
        }
      }
    };
    
    loadData();
  }, [restaurantId]);

  return {
    contacts,
    activeContact,
    messages,
    templates,
    isLoading,
    isAiEnabled,
    filter,
    fetchContacts,
    fetchMessages,
    sendMessage,
    toggleAi,
    selectContact,
    updateContact,
    updateConversation,
    createTemplate,
    deleteTemplate,
    applyFilter,
    createDummyData
  };
};