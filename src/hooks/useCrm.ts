import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CrmStage, 
  CrmCard, 
  CrmCardActivity, 
  CrmCardTag, 
  CrmCardWithDetails,
  ChatContact
} from '@/db/schema';
import { useToast } from '@/hooks/use-toast';

export const useCrm = (restaurantId: string | null) => {
  const [stages, setStages] = useState<CrmStage[]>([]);
  const [cards, setCards] = useState<CrmCardWithDetails[]>([]);
  const [tags, setTags] = useState<CrmCardTag[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<CrmCardWithDetails | null>(null);
  const [filter, setFilter] = useState<{
    search?: string;
    priority?: string;
    status?: string;
    tag?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});
  const { toast } = useToast();

  // Fetch stages
  const fetchStages = async () => {
    if (!restaurantId) return;
    
    try {
      const { data, error } = await supabase
        .from('crm_stages')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('order');
      
      if (error) throw error;
      
      setStages(data || []);
    } catch (error) {
      console.error('Error fetching stages:', error);
      toast({
        title: 'Erro ao carregar etapas',
        description: 'Não foi possível carregar as etapas do CRM.',
        variant: 'destructive',
      });
    }
  };

  // Fetch cards
  const fetchCards = async () => {
    if (!restaurantId) return;
    
    setIsLoading(true);
    try {
      // Fetch all cards
      const { data: cardsData, error: cardsError } = await supabase
        .from('crm_cards')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('updated_at', { ascending: false });
      
      if (cardsError) throw cardsError;
      
      // Fetch contacts for these cards
      const contactIds = cardsData
        ?.filter(card => card.contact_id)
        .map(card => card.contact_id) || [];
      
      let contactsMap = new Map();
      if (contactIds.length > 0) {
        const { data: contactsData, error: contactsError } = await supabase
          .from('chat_contacts')
          .select('*')
          .in('id', contactIds);
        
        if (contactsError) throw contactsError;
        
        contactsData?.forEach(contact => {
          contactsMap.set(contact.id, contact);
        });
      }
      
      // Fetch tags for all cards
      const cardIds = cardsData?.map(card => card.id) || [];
      let cardTagsMap = new Map();
      
      if (cardIds.length > 0) {
        const { data: tagRelationsData, error: tagRelationsError } = await supabase
          .from('crm_card_tag_relations')
          .select('card_id, tag_id')
          .in('card_id', cardIds);
        
        if (tagRelationsError) throw tagRelationsError;
        
        // Group tag IDs by card ID
        tagRelationsData?.forEach(relation => {
          if (!cardTagsMap.has(relation.card_id)) {
            cardTagsMap.set(relation.card_id, []);
          }
          cardTagsMap.get(relation.card_id).push(relation.tag_id);
        });
        
        // Fetch all tags
        const tagIds = Array.from(new Set(tagRelationsData?.map(relation => relation.tag_id) || []));
        
        if (tagIds.length > 0) {
          const { data: tagsData, error: tagsError } = await supabase
            .from('crm_card_tags')
            .select('*')
            .in('id', tagIds);
          
          if (tagsError) throw tagsError;
          
          setTags(tagsData || []);
          
          // Create a map of tag IDs to tag objects
          const tagsMap = new Map();
          tagsData?.forEach(tag => {
            tagsMap.set(tag.id, tag);
          });
          
          // Replace tag IDs with tag objects in cardTagsMap
          cardTagsMap.forEach((tagIds, cardId) => {
            cardTagsMap.set(cardId, tagIds.map(tagId => tagsMap.get(tagId)).filter(Boolean));
          });
        }
      }
      
      // Fetch activities for all cards
      let cardActivitiesMap = new Map();
      
      if (cardIds.length > 0) {
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('crm_card_activities')
          .select('*')
          .in('card_id', cardIds)
          .order('performed_at', { ascending: false });
        
        if (activitiesError) throw activitiesError;
        
        // Group activities by card ID
        activitiesData?.forEach(activity => {
          if (!cardActivitiesMap.has(activity.card_id)) {
            cardActivitiesMap.set(activity.card_id, []);
          }
          cardActivitiesMap.get(activity.card_id).push(activity);
        });
      }
      
      // Combine all data into cards with details
      const cardsWithDetails: CrmCardWithDetails[] = cardsData?.map(card => ({
        ...card,
        contact: card.contact_id ? contactsMap.get(card.contact_id) : undefined,
        tags: cardTagsMap.get(card.id) || [],
        activities: cardActivitiesMap.get(card.id) || []
      })) || [];
      
      // Apply filters if any
      let filteredCards = cardsWithDetails;
      
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredCards = filteredCards.filter(card => 
          card.title.toLowerCase().includes(searchLower) ||
          (card.description && card.description.toLowerCase().includes(searchLower)) ||
          (card.contact && card.contact.name.toLowerCase().includes(searchLower)) ||
          (card.contact && card.contact.phone_number.includes(filter.search!))
        );
      }
      
      if (filter.priority) {
        filteredCards = filteredCards.filter(card => card.priority === filter.priority);
      }
      
      if (filter.status) {
        filteredCards = filteredCards.filter(card => card.status === filter.status);
      }
      
      if (filter.tag) {
        filteredCards = filteredCards.filter(card => 
          card.tags.some(tag => tag.id === filter.tag || tag.name === filter.tag)
        );
      }
      
      if (filter.dateFrom) {
        const fromDate = new Date(filter.dateFrom);
        filteredCards = filteredCards.filter(card => 
          new Date(card.created_at) >= fromDate
        );
      }
      
      if (filter.dateTo) {
        const toDate = new Date(filter.dateTo);
        toDate.setHours(23, 59, 59, 999);
        filteredCards = filteredCards.filter(card => 
          new Date(card.created_at) <= toDate
        );
      }
      
      setCards(filteredCards);
    } catch (error) {
      console.error('Error fetching cards:', error);
      toast({
        title: 'Erro ao carregar cards',
        description: 'Não foi possível carregar os cards do CRM.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch contacts
  const fetchContacts = async () => {
    if (!restaurantId) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_contacts')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name');
      
      if (error) throw error;
      
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  // Fetch tags
  const fetchTags = async () => {
    if (!restaurantId) return;
    
    try {
      const { data, error } = await supabase
        .from('crm_card_tags')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name');
      
      if (error) throw error;
      
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  // Create a new stage
  const createStage = async (stage: Omit<CrmStage, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
    if (!restaurantId) return null;
    
    try {
      const newStage = {
        ...stage,
        restaurant_id: restaurantId
      };
      
      const { data, error } = await supabase
        .from('crm_stages')
        .insert(newStage)
        .select()
        .single();
      
      if (error) throw error;
      
      setStages(prev => [...prev, data]);
      
      toast({
        title: 'Etapa criada',
        description: 'A etapa foi criada com sucesso.',
      });
      
      return data;
    } catch (error) {
      console.error('Error creating stage:', error);
      toast({
        title: 'Erro ao criar etapa',
        description: 'Não foi possível criar a etapa.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update a stage
  const updateStage = async (stageId: string, stageData: Partial<CrmStage>) => {
    try {
      const { data, error } = await supabase
        .from('crm_stages')
        .update(stageData)
        .eq('id', stageId)
        .select()
        .single();
      
      if (error) throw error;
      
      setStages(prev => prev.map(stage => 
        stage.id === stageId ? data : stage
      ));
      
      toast({
        title: 'Etapa atualizada',
        description: 'A etapa foi atualizada com sucesso.',
      });
      
      return data;
    } catch (error) {
      console.error('Error updating stage:', error);
      toast({
        title: 'Erro ao atualizar etapa',
        description: 'Não foi possível atualizar a etapa.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Delete a stage
  const deleteStage = async (stageId: string) => {
    try {
      // Check if there are cards in this stage
      const { count, error: countError } = await supabase
        .from('crm_cards')
        .select('id', { count: 'exact', head: true })
        .eq('stage_id', stageId);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        toast({
          title: 'Não é possível remover',
          description: `Esta etapa contém ${count} cards. Mova os cards para outra etapa primeiro.`,
          variant: 'destructive',
        });
        return false;
      }
      
      const { error } = await supabase
        .from('crm_stages')
        .delete()
        .eq('id', stageId);
      
      if (error) throw error;
      
      setStages(prev => prev.filter(stage => stage.id !== stageId));
      
      toast({
        title: 'Etapa removida',
        description: 'A etapa foi removida com sucesso.',
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast({
        title: 'Erro ao remover etapa',
        description: 'Não foi possível remover a etapa.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Create a new card
  const createCard = async (card: Omit<CrmCard, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>, tagIds?: string[]) => {
    if (!restaurantId) return null;
    
    try {
      const newCard = {
        ...card,
        restaurant_id: restaurantId
      };
      
      const { data, error } = await supabase
        .from('crm_cards')
        .insert(newCard)
        .select()
        .single();
      
      if (error) throw error;
      
      // Add activity for card creation
      const activity = {
        card_id: data.id,
        activity_type: 'note',
        description: 'Card criado'
      };
      
      const { error: activityError } = await supabase
        .from('crm_card_activities')
        .insert(activity);
      
      if (activityError) throw activityError;
      
      // Add tags if provided
      if (tagIds && tagIds.length > 0) {
        const tagRelations = tagIds.map(tagId => ({
          card_id: data.id,
          tag_id: tagId
        }));
        
        const { error: tagError } = await supabase
          .from('crm_card_tag_relations')
          .insert(tagRelations);
        
        if (tagError) throw tagError;
      }
      
      // Fetch the complete card with details
      await fetchCards();
      
      toast({
        title: 'Card criado',
        description: 'O card foi criado com sucesso.',
      });
      
      return data;
    } catch (error) {
      console.error('Error creating card:', error);
      toast({
        title: 'Erro ao criar card',
        description: 'Não foi possível criar o card.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update a card
  const updateCard = async (cardId: string, cardData: Partial<CrmCard>, tagIds?: string[]) => {
    try {
      // If stage is changing, record an activity
      const currentCard = cards.find(c => c.id === cardId);
      if (currentCard && cardData.stage_id && cardData.stage_id !== currentCard.stage_id) {
        const oldStage = stages.find(s => s.id === currentCard.stage_id);
        const newStage = stages.find(s => s.id === cardData.stage_id);
        
        if (oldStage && newStage) {
          const activity = {
            card_id: cardId,
            activity_type: 'stage_change',
            description: `Movido de "${oldStage.name}" para "${newStage.name}"`
          };
          
          const { error: activityError } = await supabase
            .from('crm_card_activities')
            .insert(activity);
          
          if (activityError) throw activityError;
        }
      }
      
      const { data, error } = await supabase
        .from('crm_cards')
        .update(cardData)
        .eq('id', cardId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update tags if provided
      if (tagIds !== undefined) {
        // First remove all existing tag relations
        const { error: deleteError } = await supabase
          .from('crm_card_tag_relations')
          .delete()
          .eq('card_id', cardId);
        
        if (deleteError) throw deleteError;
        
        // Then add the new ones
        if (tagIds.length > 0) {
          const tagRelations = tagIds.map(tagId => ({
            card_id: cardId,
            tag_id: tagId
          }));
          
          const { error: tagError } = await supabase
            .from('crm_card_tag_relations')
            .insert(tagRelations);
          
          if (tagError) throw tagError;
        }
      }
      
      // Update the card in the local state for immediate UI update
      if (currentCard) {
        // Find the updated card's tags
        const updatedTags = currentCard.tags;
        if (tagIds !== undefined) {
          const tagObjects = tags.filter(tag => tagIds.includes(tag.id));
          updatedTags.splice(0, updatedTags.length, ...tagObjects);
        }
        
        // Find the contact if it changed
        let updatedContact = currentCard.contact;
        if (cardData.contact_id !== undefined && cardData.contact_id !== currentCard.contact_id) {
          updatedContact = cardData.contact_id 
            ? contacts.find(c => c.id === cardData.contact_id) 
            : undefined;
        }
        
        // Create an updated card object
        const updatedCard: CrmCardWithDetails = {
          ...currentCard,
          ...data,
          contact: updatedContact,
          tags: updatedTags
        };
        
        // Update the cards array
        setCards(prev => prev.map(c => c.id === cardId ? updatedCard : c));
        
        // Update selected card if this is the one selected
        if (selectedCard && selectedCard.id === cardId) {
          setSelectedCard(updatedCard);
        }
      }
      
      toast({
        title: 'Card atualizado',
        description: 'O card foi atualizado com sucesso.',
      });
      
      return data;
    } catch (error) {
      console.error('Error updating card:', error);
      toast({
        title: 'Erro ao atualizar card',
        description: 'Não foi possível atualizar o card.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Move a card to a new stage (optimistic update)
  const moveCard = async (cardId: string, newStageId: string) => {
    try {
      // Find the current card
      const currentCard = cards.find(c => c.id === cardId);
      if (!currentCard || currentCard.stage_id === newStageId) return null;
      
      // Get stage names for activity description
      const oldStage = stages.find(s => s.id === currentCard.stage_id);
      const newStage = stages.find(s => s.id === newStageId);
      
      if (!oldStage || !newStage) return null;
      
      // Create an updated card object for optimistic update
      const updatedCard: CrmCardWithDetails = {
        ...currentCard,
        stage_id: newStageId
      };
      
      // Update the cards array immediately (optimistic update)
      setCards(prev => prev.map(c => c.id === cardId ? updatedCard : c));
      
      // Update selected card if this is the one selected
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard(updatedCard);
      }
      
      // Create activity for stage change
      const activity = {
        card_id: cardId,
        activity_type: 'stage_change',
        description: `Movido de "${oldStage.name}" para "${newStage.name}"`
      };
      
      // Update the card in the database
      const { data, error } = await supabase
        .from('crm_cards')
        .update({ stage_id: newStageId })
        .eq('id', cardId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Add activity record
      const { error: activityError } = await supabase
        .from('crm_card_activities')
        .insert(activity);
      
      if (activityError) throw activityError;
      
      // Add the new activity to the card's activities
      const newActivity = {
        id: `temp-${Date.now()}`,
        card_id: cardId,
        activity_type: 'stage_change',
        description: `Movido de "${oldStage.name}" para "${newStage.name}"`,
        performed_by: null,
        performed_at: new Date().toISOString()
      };
      
      // Update the card's activities in the local state
      setCards(prev => prev.map(c => {
        if (c.id === cardId) {
          return {
            ...c,
            activities: [newActivity, ...c.activities]
          };
        }
        return c;
      }));
      
      // Update selected card if this is the one selected
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard({
          ...selectedCard,
          stage_id: newStageId,
          activities: [newActivity, ...selectedCard.activities]
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error moving card:', error);
      
      // Revert the optimistic update if there was an error
      await fetchCards();
      
      toast({
        title: 'Erro ao mover card',
        description: 'Não foi possível mover o card para a nova etapa.',
        variant: 'destructive',
      });
      
      return null;
    }
  };

  // Delete a card
  const deleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('crm_cards')
        .delete()
        .eq('id', cardId);
      
      if (error) throw error;
      
      setCards(prev => prev.filter(card => card.id !== cardId));
      
      // If this was the selected card, deselect it
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard(null);
      }
      
      toast({
        title: 'Card removido',
        description: 'O card foi removido com sucesso.',
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        title: 'Erro ao remover card',
        description: 'Não foi possível remover o card.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Add an activity to a card
  const addCardActivity = async (cardId: string, activity: Omit<CrmCardActivity, 'id' | 'card_id' | 'performed_at'>) => {
    try {
      const newActivity = {
        ...activity,
        card_id: cardId
      };
      
      // Create a temporary activity for optimistic update
      const tempActivity = {
        id: `temp-${Date.now()}`,
        ...newActivity,
        performed_by: null,
        performed_at: new Date().toISOString()
      };
      
      // Update the cards array immediately (optimistic update)
      setCards(prev => prev.map(card => {
        if (card.id === cardId) {
          return {
            ...card,
            activities: [tempActivity, ...card.activities]
          };
        }
        return card;
      }));
      
      // Update selected card if this is the one selected
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard({
          ...selectedCard,
          activities: [tempActivity, ...selectedCard.activities]
        });
      }
      
      // Add the activity to the database
      const { data, error } = await supabase
        .from('crm_card_activities')
        .insert(newActivity)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the cards array with the real activity
      setCards(prev => prev.map(card => {
        if (card.id === cardId) {
          return {
            ...card,
            activities: [
              data,
              ...card.activities.filter(a => a.id !== tempActivity.id)
            ]
          };
        }
        return card;
      }));
      
      // Update selected card if this is the one selected
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard({
          ...selectedCard,
          activities: [
            data,
            ...selectedCard.activities.filter(a => a.id !== tempActivity.id)
          ]
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error adding activity:', error);
      
      // Revert the optimistic update
      await fetchCards();
      
      toast({
        title: 'Erro ao adicionar atividade',
        description: 'Não foi possível adicionar a atividade ao card.',
        variant: 'destructive',
      });
      
      return null;
    }
  };

  // Create a new tag
  const createTag = async (tag: Omit<CrmCardTag, 'id' | 'restaurant_id' | 'created_at'>) => {
    if (!restaurantId) return null;
    
    try {
      const newTag = {
        ...tag,
        restaurant_id: restaurantId
      };
      
      const { data, error } = await supabase
        .from('crm_card_tags')
        .insert(newTag)
        .select()
        .single();
      
      if (error) throw error;
      
      setTags(prev => [...prev, data]);
      
      toast({
        title: 'Tag criada',
        description: 'A tag foi criada com sucesso.',
      });
      
      return data;
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: 'Erro ao criar tag',
        description: 'Não foi possível criar a tag.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Delete a tag
  const deleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('crm_card_tags')
        .delete()
        .eq('id', tagId);
      
      if (error) throw error;
      
      setTags(prev => prev.filter(tag => tag.id !== tagId));
      
      // Update cards that had this tag
      setCards(prev => prev.map(card => ({
        ...card,
        tags: card.tags.filter(tag => tag.id !== tagId)
      })));
      
      // If this is the selected card, update it
      if (selectedCard) {
        setSelectedCard(prev => {
          if (!prev) return null;
          return {
            ...prev,
            tags: prev.tags.filter(tag => tag.id !== tagId)
          };
        });
      }
      
      toast({
        title: 'Tag removida',
        description: 'A tag foi removida com sucesso.',
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: 'Erro ao remover tag',
        description: 'Não foi possível remover a tag.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Apply filters to the cards
  const applyFilter = (newFilter: typeof filter) => {
    setFilter(newFilter);
  };

  // Create default stages if none exist
  const createDefaultStages = async () => {
    if (!restaurantId) return;
    
    try {
      const { count, error: countError } = await supabase
        .from('crm_stages')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId);
      
      if (countError) throw countError;
      
      if (count === 0) {
        const defaultStages = [
          { name: 'Primeiro Contato', description: 'Clientes que acabaram de entrar em contato', color: '#3498db', icon: 'MessageSquare', order: 0, is_active: true },
          { name: 'Interesse em Reserva', description: 'Clientes interessados em fazer uma reserva', color: '#2ecc71', icon: 'Calendar', order: 1, is_active: true },
          { name: 'Reserva Efetuada', description: 'Clientes com reserva confirmada', color: '#27ae60', icon: 'CheckCircle', order: 2, is_active: true },
          { name: 'Interesse em Aniversário', description: 'Clientes interessados em comemorar aniversário', color: '#9b59b6', icon: 'Cake', order: 3, is_active: true },
          { name: 'Aniversário Confirmado', description: 'Clientes com aniversário confirmado', color: '#8e44ad', icon: 'Gift', order: 4, is_active: true },
          { name: 'Interesse em Eventos', description: 'Clientes interessados em realizar eventos', color: '#f39c12', icon: 'Users', order: 5, is_active: true },
          { name: 'Evento Confirmado', description: 'Clientes com evento confirmado', color: '#d35400', icon: 'PartyPopper', order: 6, is_active: true },
          { name: 'Dúvidas', description: 'Clientes com dúvidas pendentes', color: '#e74c3c', icon: 'HelpCircle', order: 7, is_active: true },
          { name: 'Reclamações', description: 'Clientes com reclamações a serem resolvidas', color: '#c0392b', icon: 'AlertTriangle', order: 8, is_active: true }
        ];
        
        const stagesWithRestaurantId = defaultStages.map(stage => ({
          ...stage,
          restaurant_id: restaurantId
        }));
        
        const { data, error } = await supabase
          .from('crm_stages')
          .insert(stagesWithRestaurantId)
          .select();
        
        if (error) throw error;
        
        setStages(data || []);
        
        toast({
          title: 'Etapas padrão criadas',
          description: 'As etapas padrão do CRM foram criadas com sucesso.',
        });
      }
    } catch (error) {
      console.error('Error creating default stages:', error);
    }
  };

  // Create example data for demonstration
  const createExampleData = async () => {
    if (!restaurantId || stages.length === 0) return;
    
    try {
      // Create some tags
      const tagColors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
      const tagNames = ['VIP', 'Aniversário', 'Evento', 'Reclamação', 'Fidelidade'];
      
      const tags: CrmCardTag[] = [];
      
      for (let i = 0; i < tagNames.length; i++) {
        const { data, error } = await supabase
          .from('crm_card_tags')
          .insert({
            restaurant_id: restaurantId,
            name: tagNames[i],
            color: tagColors[i]
          })
          .select()
          .single();
        
        if (error) throw error;
        tags.push(data);
      }
      
      // Fetch contacts to associate with cards
      const { data: contactsData, error: contactsError } = await supabase
        .from('chat_contacts')
        .select('id, name')
        .eq('restaurant_id', restaurantId)
        .limit(10);
      
      if (contactsError) throw contactsError;
      
      const contacts = contactsData || [];
      
      // Create example cards for each stage
      for (const stage of stages) {
        const numCards = Math.floor(Math.random() * 3) + 1; // 1-3 cards per stage
        
        for (let i = 0; i < numCards; i++) {
          const contact = contacts[Math.floor(Math.random() * contacts.length)];
          const priority = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 14) + 1); // 1-14 days from now
          
          const cardData = {
            restaurant_id: restaurantId,
            stage_id: stage.id,
            contact_id: contact?.id || null,
            title: contact ? `${contact.name} - ${stage.name}` : `Cliente - ${stage.name}`,
            description: `Exemplo de card para a etapa ${stage.name}`,
            priority: priority as 'low' | 'medium' | 'high',
            status: 'active',
            due_date: dueDate.toISOString(),
            value: Math.floor(Math.random() * 1000) + 100 // Random value between 100-1100
          };
          
          const { data: card, error } = await supabase
            .from('crm_cards')
            .insert(cardData)
            .select()
            .single();
          
          if (error) throw error;
          
          // Add some random tags to the card
          const numTags = Math.floor(Math.random() * 3) + 1; // 1-3 tags per card
          const selectedTags = [...tags].sort(() => 0.5 - Math.random()).slice(0, numTags);
          
          const tagRelations = selectedTags.map(tag => ({
            card_id: card.id,
            tag_id: tag.id
          }));
          
          if (tagRelations.length > 0) {
            const { error: tagError } = await supabase
              .from('crm_card_tag_relations')
              .insert(tagRelations);
            
            if (tagError) throw tagError;
          }
          
          // Add some activities to the card
          const activities = [
            {
              card_id: card.id,
              activity_type: 'note',
              description: 'Card criado para demonstração'
            },
            {
              card_id: card.id,
              activity_type: 'contact',
              description: 'Cliente contatado por WhatsApp'
            }
          ];
          
          const { error: activityError } = await supabase
            .from('crm_card_activities')
            .insert(activities);
          
          if (activityError) throw activityError;
        }
      }
      
      // Refresh data
      await fetchCards();
      await fetchTags();
      
      toast({
        title: 'Dados de exemplo criados',
        description: 'Os dados de exemplo do CRM foram criados com sucesso.',
      });
    } catch (error) {
      console.error('Error creating example data:', error);
      toast({
        title: 'Erro ao criar dados de exemplo',
        description: 'Não foi possível criar os dados de exemplo.',
        variant: 'destructive',
      });
    }
  };

  // Load data on component mount or when restaurantId changes
  useEffect(() => {
    if (restaurantId) {
      fetchStages();
      fetchCards();
      fetchContacts();
      fetchTags();
    }
  }, [restaurantId]);

  // Reload cards when filter changes
  useEffect(() => {
    if (restaurantId) {
      fetchCards();
    }
  }, [filter]);

  return {
    stages,
    cards,
    tags,
    contacts,
    isLoading,
    selectedCard,
    setSelectedCard,
    filter,
    fetchStages,
    fetchCards,
    fetchContacts,
    fetchTags,
    createStage,
    updateStage,
    deleteStage,
    createCard,
    updateCard,
    moveCard,
    deleteCard,
    addCardActivity,
    createTag,
    deleteTag,
    applyFilter,
    createDefaultStages,
    createExampleData
  };
};