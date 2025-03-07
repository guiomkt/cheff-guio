import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthContext'

export const useOnboarding = () => {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user, checkOnboardingStatus } = useAuth()

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
    setRestaurantId,
    menuPhotos,
    addMenuPhoto,
    removeMenuPhoto,
    clearMenuPhotos,
  } = useOnboardingStore()

  const totalSteps = 5 // Adjust based on actual number of steps

  // Função modificada para salvar o progresso
  const saveOnboardingProgress = async () => {
    try {
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      let currentRestaurantId = restaurantId

      // Se não tiver um restaurante, criar um novo
      if (!currentRestaurantId) {
        const { data, error } = await supabase
          .from('restaurants')
          .insert({
            name: restaurantInfo.name || 'Meu Restaurante',
            description: restaurantInfo.description,
            address: restaurantInfo.address,
            city: restaurantInfo.city,
            state: restaurantInfo.state,
            postal_code: restaurantInfo.postal_code,
            phone: restaurantInfo.phone,
            email: restaurantInfo.email,
            website: restaurantInfo.website,
            max_capacity: restaurantInfo.max_capacity,
            onboarding_step: currentStep,
            onboarding_completed: false,
            user_id: user.id,
          })
          .select('id')
          .single()

        if (error) throw error

        currentRestaurantId = data.id
        setRestaurantId(data.id)
      } else {
        // Atualizar o restaurante existente
        const { error } = await supabase
          .from('restaurants')
          .update({
            name: restaurantInfo.name,
            description: restaurantInfo.description,
            address: restaurantInfo.address,
            city: restaurantInfo.city,
            state: restaurantInfo.state,
            postal_code: restaurantInfo.postal_code,
            phone: restaurantInfo.phone,
            email: restaurantInfo.email,
            website: restaurantInfo.website,
            max_capacity: restaurantInfo.max_capacity,
            onboarding_step: currentStep,
            user_id: user.id,
          })
          .eq('id', currentRestaurantId)

        if (error) throw error
      }

      // Salvar o progresso usando a função original do store
      await saveProgress()

      // Atualizar o status do onboarding no contexto de autenticação
      await checkOnboardingStatus()
    } catch (error) {
      console.error('Erro ao salvar progresso:', error)
      throw error
    }
  }

  const goToNextStep = async () => {
    try {
      setIsLoading(true)

      // Save current progress
      await saveOnboardingProgress()

      // If this is the last step, mark as completed
      if (currentStep === totalSteps) {
        // This is handled in the CompletionStep component now
        navigate('/')
        toast({
          title: 'Onboarding concluído!',
          description: 'Seu restaurante foi configurado com sucesso.',
          variant: 'default',
        })
      } else {
        // Move to next step
        setCurrentStep(currentStep + 1)
      }
    } catch (error) {
      console.error('Error saving progress:', error)
      toast({
        title: 'Erro ao salvar progresso',
        description: 'Ocorreu um erro ao salvar seu progresso. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const goToPreviousStep = () => {
    console.log('entrou aqui')
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    console.log('entrou aqui23213')
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step)
    }
  }

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Restaurant Info
        return !!restaurantInfo.name && !!restaurantInfo.address && !!restaurantInfo.phone

      case 2: // Areas
        return areas.length > 0

      case 3: // Menu
        return menuCategories.length > 0

      case 4: // WhatsApp
        return !!whatsAppInfo.phone_number

      case 5: // Completion
        return true

      default:
        return false
    }
  }

  const canProceed = validateCurrentStep()

  // Function to directly set completion status in the database
  const setIsCompleted = async (completed: boolean) => {
    try {
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      if (restaurantId) {
        const { error } = await supabase
          .from('restaurants')
          .update({
            onboarding_completed: completed,
            onboarding_step: currentStep,
            user_id: user.id,
          })
          .eq('id', restaurantId)

        if (error) throw error

        // Atualizar o status do onboarding no contexto de autenticação
        await checkOnboardingStatus()
      }
    } catch (error) {
      console.error('Error setting completion status:', error)
      throw error
    }
  }

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
    setIsLoading,
    saveProgress: saveOnboardingProgress,
  }
}
