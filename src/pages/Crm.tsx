import { useState, useEffect } from 'react';
import { CrmBoard } from '@/components/crm/CrmBoard';
import { CrmCardDetails } from '@/components/crm/CrmCardDetails';
import { CrmCardForm } from '@/components/crm/CrmCardForm';
import { Button } from '@/components/ui/button';
import { useCrm } from '@/hooks/useCrm';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  RefreshCw, 
  Settings, 
  Filter, 
  Calendar,
  Database
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CrmCardWithDetails } from '@/db/schema';

export function Crm() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isCardFormOpen, setIsCardFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CrmCardWithDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const {
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
    createCard,
    updateCard,
    moveCard,
    deleteCard,
    addCardActivity,
    applyFilter,
    createDefaultStages,
    createExampleData
  } = useCrm(restaurantId);

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
      }
    }
    
    getRestaurantId();
  }, []);

  // Create default stages if none exist
  useEffect(() => {
    if (restaurantId) {
      createDefaultStages();
    }
  }, [restaurantId]);

  // Listen for edit card event
  useEffect(() => {
    const handleEditCard = () => {
      if (selectedCard) {
        setEditingCard(selectedCard);
        setIsCardFormOpen(true);
      }
    };
    
    window.addEventListener('editCard', handleEditCard);
    
    return () => {
      window.removeEventListener('editCard', handleEditCard);
    };
  }, [selectedCard]);

  // Handle card selection
  const handleCardSelect = (card: CrmCardWithDetails | null) => {
    setSelectedCard(card);
  };

  // Handle card movement between stages
  const handleMoveCard = async (cardId: string, newStageId: string) => {
    return await moveCard(cardId, newStageId);
  };

  // Open card form for creating a new card
  const handleAddCard = () => {
    setEditingCard(null);
    setIsCardFormOpen(true);
  };

  // Open card form for editing an existing card
  const handleEditCard = () => {
    if (selectedCard) {
      setEditingCard(selectedCard);
      setIsCardFormOpen(true);
    }
  };

  // Handle card form submission
  const handleCardFormSubmit = async (cardData: any, selectedTagIds: string[]) => {
    try {
      setIsSubmitting(true);
      
      if (editingCard) {
        // Update existing card
        await updateCard(editingCard.id, cardData, selectedTagIds);
        toast({
          title: 'Card atualizado',
          description: 'O card foi atualizado com sucesso.',
        });
      } else {
        // Create new card
        const newCard = await createCard(cardData, selectedTagIds);
        if (newCard) {
          toast({
            title: 'Card criado',
            description: 'O card foi criado com sucesso.',
          });
        }
      }
      
      setIsCardFormOpen(false);
      setEditingCard(null);
    } catch (error) {
      console.error('Error submitting card form:', error);
      toast({
        title: 'Erro ao salvar card',
        description: 'Ocorreu um erro ao salvar o card.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle card deletion
  const handleDeleteCard = async () => {
    if (!selectedCard) return;
    
    try {
      const success = await deleteCard(selectedCard.id);
      if (success) {
        setSelectedCard(null);
        toast({
          title: 'Card excluído',
          description: 'O card foi excluído com sucesso.',
        });
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        title: 'Erro ao excluir card',
        description: 'Ocorreu um erro ao excluir o card.',
        variant: 'destructive',
      });
    }
  };

  // Handle adding an activity to a card
  const handleAddActivity = async (activity: { activity_type: string; description: string }) => {
    if (!selectedCard) return null;
    
    try {
      const newActivity = await addCardActivity(selectedCard.id, activity);
      return newActivity;
    } catch (error) {
      console.error('Error adding activity:', error);
      toast({
        title: 'Erro ao adicionar atividade',
        description: 'Ocorreu um erro ao adicionar a atividade.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchStages();
    fetchCards();
    toast({
      title: 'Dados atualizados',
      description: 'Os dados do CRM foram atualizados.',
    });
  };

  // Handle creating example data
  const handleCreateExampleData = async () => {
    await createExampleData();
  };

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
        <h1 className="text-2xl font-bold">CRM</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          
          {cards.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateExampleData}
              className="gap-2"
            >
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Criar Exemplos</span>
              <span className="sm:hidden">Exemplos</span>
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 border rounded-lg overflow-hidden">
        <CrmBoard
          stages={stages}
          cards={cards}
          selectedCard={selectedCard}
          onSelectCard={handleCardSelect}
          onMoveCard={handleMoveCard}
          onAddCard={handleAddCard}
          onApplyFilter={applyFilter}
          filter={filter}
          tags={tags}
        />
      </div>
      
      {/* Card Form Dialog */}
      <Dialog open={isCardFormOpen} onOpenChange={setIsCardFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingCard ? 'Editar Card' : 'Novo Card'}
            </DialogTitle>
          </DialogHeader>
          
          <CrmCardForm
            card={editingCard || undefined}
            stages={stages}
            contacts={contacts}
            tags={tags}
            onSubmit={handleCardFormSubmit}
            onCancel={() => {
              setIsCardFormOpen(false);
              setEditingCard(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}