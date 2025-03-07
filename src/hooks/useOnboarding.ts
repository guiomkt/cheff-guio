import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export const useOnboarding = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    currentStep,
    setCurrentStep,
    saveProgress,
    restaurantInfo,
    setRestaurantInfo,
    areas,
    setAreas,
    addArea,
    removeArea,
    updateArea,
    menuCategories,
    setMenuCategories,
    addMenuCategory,
    removeMenuCategory,
    updateMenuCategory,
    menuItems,
    setMenuItems,
    addMenuItem,
    removeMenuItem,
    updateMenuItem,
    whatsAppInfo,
    setWhatsAppInfo,
    resetOnboarding,
    restaurantId,
    menuPhotos,
    addMenuPhoto,
    removeMenuPhoto,
    clearMenuPhotos
  } = useOnboardingStore();
  
  const totalSteps = 5; // Adjust based on actual number of steps
  
  const goToNextStep = async () => {
    try {
      setIsLoading(true);
      
      // Save current progress
      await saveProgress();
      
      // If this is the last step, mark as completed
      if (currentStep === totalSteps) {
        // This is handled in the CompletionStep component now
        navigate('/');
        toast({
          title: 'Onboarding concluído!',
          description: 'Seu restaurante foi configurado com sucesso.',
          variant: 'default',
        });
      } else {
        // Move to next step
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: 'Erro ao salvar progresso',
        description: 'Ocorreu um erro ao salvar seu progresso. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };
  
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Restaurant Info
        return !!restaurantInfo.name && !!restaurantInfo.address && !!restaurantInfo.phone;
      
      case 2: // Areas
        return areas.length > 0;
      
      case 3: // Menu
        return menuCategories.length > 0;
      
      case 4: // WhatsApp
        return !!whatsAppInfo.phone_number;
      
      case 5: // Completion
        return true;
      
      default:
        return false;
    }
  };
  
  const canProceed = validateCurrentStep();
  
  // Function to directly set completion status in the database
  const setIsCompleted = async (completed: boolean) => {
    try {
      if (restaurantId) {
        const { error } = await supabase
          .from('restaurants')
          .update({ 
            onboarding_completed: completed,
            onboarding_step: currentStep
          })
          .eq('id', restaurantId);
          
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error setting completion status:', error);
      throw error;
    }
  };
  
  return {
    currentStep,
    totalSteps,
    isLoading,
    canProceed,
    restaurantInfo,
    setRestaurantInfo,
    areas,
    setAreas,
    addArea,
    removeArea,
    updateArea,
    menuCategories,
    setMenuCategories,
    addMenuCategory,
    removeMenuCategory,
    updateMenuCategory,
    menuItems,
    setMenuItems,
    addMenuItem,
    removeMenuItem,
    updateMenuItem,
    whatsAppInfo,
    setWhatsAppInfo,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetOnboarding,
    restaurantId,
    menuPhotos,
    addMenuPhoto,
    removeMenuPhoto,
    clearMenuPhotos,
    setIsCompleted,
    saveProgress
  };
};