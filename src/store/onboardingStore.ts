import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export interface RestaurantInfo {
  name: string;
  description: string;
  logo_url: string | null;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  email: string;
  website: string;
  opening_hours: { [key: string]: { open: string; close: string } };
  max_capacity: number;
}

export interface AreaInfo {
  id?: string;
  name: string;
  description: string;
  max_capacity: number;
  max_tables: number;
  is_active: boolean;
  order: number;
}

export interface MenuCategory {
  id?: string;
  name: string;
  description: string;
  order: number;
  is_active: boolean;
  temp_id?: string; // For local reference only
}

export interface MenuItem {
  id?: string;
  category_id?: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  temp_id?: string; // For local reference only
  image_url?: string; // URL to the image of the menu item
}

export interface WhatsAppInfo {
  instance_name: string;
  phone_number: string;
}

interface OnboardingState {
  currentStep: number;
  restaurantId: string | null;
  restaurantInfo: Partial<RestaurantInfo>;
  areas: AreaInfo[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  whatsAppInfo: Partial<WhatsAppInfo>;
  isCompleted: boolean;
  menuPhotos: string[]; // Base64 encoded photos of the menu
  
  // Actions
  setCurrentStep: (step: number) => void;
  setRestaurantId: (id: string) => void;
  setRestaurantInfo: (info: Partial<RestaurantInfo>) => void;
  setAreas: (areas: AreaInfo[]) => void;
  addArea: (area: AreaInfo) => void;
  removeArea: (index: number) => void;
  updateArea: (index: number, area: AreaInfo) => void;
  setMenuCategories: (categories: MenuCategory[]) => void;
  addMenuCategory: (category: MenuCategory) => void;
  removeMenuCategory: (index: number) => void;
  updateMenuCategory: (index: number, category: MenuCategory) => void;
  setMenuItems: (items: MenuItem[]) => void;
  addMenuItem: (item: MenuItem) => void;
  removeMenuItem: (index: number) => void;
  updateMenuItem: (index: number, item: MenuItem) => void;
  setWhatsAppInfo: (info: Partial<WhatsAppInfo>) => void;
  setIsCompleted: (completed: boolean) => Promise<void>;
  saveProgress: () => Promise<void>;
  resetOnboarding: () => void;
  addMenuPhoto: (photo: string) => void;
  removeMenuPhoto: (index: number) => void;
  clearMenuPhotos: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      restaurantId: null,
      restaurantInfo: {},
      areas: [],
      menuCategories: [],
      menuItems: [],
      whatsAppInfo: {},
      isCompleted: false,
      menuPhotos: [],
      
      setCurrentStep: (step) => set({ currentStep: step }),
      setRestaurantId: (id) => set({ restaurantId: id }),
      setRestaurantInfo: (info) => set({ restaurantInfo: { ...get().restaurantInfo, ...info } }),
      setAreas: (areas) => set({ areas }),
      addArea: (area) => set({ areas: [...get().areas, area] }),
      removeArea: (index) => set({ 
        areas: get().areas.filter((_, i) => i !== index) 
      }),
      updateArea: (index, area) => set({
        areas: get().areas.map((a, i) => i === index ? area : a)
      }),
      setMenuCategories: (categories) => set({ menuCategories: categories }),
      addMenuCategory: (category) => set({ 
        menuCategories: [...get().menuCategories, {
          ...category,
          temp_id: `temp-category-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }] 
      }),
      removeMenuCategory: (index) => {
        const categoryToRemove = get().menuCategories[index];
        if (!categoryToRemove) return;
        
        // Also remove all items associated with this category
        const tempId = categoryToRemove.temp_id;
        set({
          menuCategories: get().menuCategories.filter((_, i) => i !== index),
          menuItems: get().menuItems.filter(item => item.category_id !== tempId)
        });
      },
      updateMenuCategory: (index, category) => set({
        menuCategories: get().menuCategories.map((c, i) => i === index ? {
          ...category,
          temp_id: c.temp_id // Preserve the temp_id
        } : c)
      }),
      setMenuItems: (items) => set({ menuItems: items }),
      addMenuItem: (item) => set({ 
        menuItems: [...get().menuItems, {
          ...item,
          temp_id: `temp-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }] 
      }),
      removeMenuItem: (index) => set({
        menuItems: get().menuItems.filter((_, i) => i !== index)
      }),
      updateMenuItem: (index, item) => set({
        menuItems: get().menuItems.map((i, idx) => idx === index ? {
          ...item,
          temp_id: i.temp_id // Preserve the temp_id
        } : i)
      }),
      setWhatsAppInfo: (info) => set({ whatsAppInfo: { ...get().whatsAppInfo, ...info } }),
      setIsCompleted: async (completed) => {
        try {
          set({ isCompleted: completed });
        } catch (error) {
          console.error('Error setting completion status:', error);
          throw error;
        }
      },
      
      // Menu photos management
      addMenuPhoto: (photo) => set({ menuPhotos: [...get().menuPhotos, photo] }),
      removeMenuPhoto: (index) => set({ 
        menuPhotos: get().menuPhotos.filter((_, i) => i !== index) 
      }),
      clearMenuPhotos: () => set({ menuPhotos: [] }),
      
      saveProgress: async () => {
        const state = get();
        try {
          if (!state.restaurantId) {
            // Create new restaurant
            const { data: restaurant, error: restaurantError } = await supabase
              .from('restaurants')
              .insert({
                ...state.restaurantInfo,
                onboarding_completed: state.isCompleted,
                onboarding_step: state.currentStep
              })
              .select('id')
              .single();
              
            if (restaurantError) throw restaurantError;
            
            if (restaurant) {
              set({ restaurantId: restaurant.id });
              
              // Save areas if any
              if (state.areas.length > 0) {
                const areasWithRestaurantId = state.areas.map(area => ({
                  ...area,
                  restaurant_id: restaurant.id
                }));
                
                const { error: areasError } = await supabase
                  .from('restaurant_areas')
                  .insert(areasWithRestaurantId);
                  
                if (areasError) throw areasError;
              }
              
              // Save menu categories and items if any
              if (state.menuCategories.length > 0) {
                // Prepare categories for insertion - remove temp_id and id fields
                const categoriesWithRestaurantId = state.menuCategories.map(category => ({
                  name: category.name,
                  description: category.description,
                  order: category.order,
                  is_active: category.is_active,
                  restaurant_id: restaurant.id
                }));
                
                const { data: savedCategories, error: categoriesError } = await supabase
                  .from('menu_categories')
                  .insert(categoriesWithRestaurantId)
                  .select('id, name');
                  
                if (categoriesError) throw categoriesError;
                
                // Map local category temp_ids to database IDs
                const categoryIdMap = new Map();
                if (savedCategories) {
                  state.menuCategories.forEach((cat, index) => {
                    if (savedCategories[index]) {
                      categoryIdMap.set(cat.temp_id, savedCategories[index].id);
                    }
                  });
                }
                
                // Save menu items if any
                if (state.menuItems.length > 0) {
                  // Prepare items for insertion - map category_id using the map
                  const itemsWithRestaurantId = state.menuItems.map(item => ({
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    is_active: item.is_active,
                    image_url: item.image_url || null,
                    restaurant_id: restaurant.id,
                    category_id: item.category_id ? categoryIdMap.get(item.category_id) : null
                  }));
                  
                  const { error: itemsError } = await supabase
                    .from('menu_items')
                    .insert(itemsWithRestaurantId);
                    
                  if (itemsError) throw itemsError;
                }
              }
              
              // Save WhatsApp integration if configured
              if (state.whatsAppInfo.instance_name || state.whatsAppInfo.phone_number) {
                const { error: whatsappError } = await supabase
                  .from('whatsapp_integrations')
                  .insert({
                    instance_name: state.whatsAppInfo.instance_name || 'Default Instance',
                    phone_number: state.whatsAppInfo.phone_number || '',
                    restaurant_id: restaurant.id,
                    status: 'pending'
                  });
                  
                if (whatsappError) throw whatsappError;
              }
              
              // Save onboarding steps
              const steps = [
                { step_name: 'restaurant_info', step_number: 1, is_completed: state.currentStep > 1 },
                { step_name: 'areas', step_number: 2, is_completed: state.currentStep > 2 },
                { step_name: 'menu', step_number: 3, is_completed: state.currentStep > 3 },
                { step_name: 'whatsapp', step_number: 4, is_completed: state.currentStep > 4 },
                { step_name: 'completion', step_number: 5, is_completed: state.currentStep > 5 }
              ];
              
              const stepsWithRestaurantId = steps.map(step => ({
                ...step,
                restaurant_id: restaurant.id,
                completed_at: step.is_completed ? new Date().toISOString() : null
              }));
              
              const { error: stepsError } = await supabase
                .from('onboarding_steps')
                .insert(stepsWithRestaurantId);
                
              if (stepsError) throw stepsError;
            }
          } else {
            // Update existing restaurant
            const { error: restaurantError } = await supabase
              .from('restaurants')
              .update({
                ...state.restaurantInfo,
                onboarding_completed: state.isCompleted,
                onboarding_step: state.currentStep
              })
              .eq('id', state.restaurantId);
              
            if (restaurantError) throw restaurantError;
            
            // Update areas - more complex as we need to handle create/update/delete
            // For simplicity, we'll delete all and re-create
            if (state.areas.length > 0) {
              const { error: deleteError } = await supabase
                .from('restaurant_areas')
                .delete()
                .eq('restaurant_id', state.restaurantId);
                
              if (deleteError) throw deleteError;
              
              const areasWithRestaurantId = state.areas.map(area => ({
                ...area,
                restaurant_id: state.restaurantId
              }));
              
              const { error: areasError } = await supabase
                .from('restaurant_areas')
                .insert(areasWithRestaurantId);
                
              if (areasError) throw areasError;
            }
            
            // Update menu categories and items
            if (state.menuCategories.length > 0) {
              // Delete existing categories and items
              const { error: deleteMenuItemsError } = await supabase
                .from('menu_items')
                .delete()
                .eq('restaurant_id', state.restaurantId);
                
              if (deleteMenuItemsError) throw deleteMenuItemsError;
              
              const { error: deleteMenuCategoriesError } = await supabase
                .from('menu_categories')
                .delete()
                .eq('restaurant_id', state.restaurantId);
                
              if (deleteMenuCategoriesError) throw deleteMenuCategoriesError;
              
              // Prepare categories for insertion - remove temp_id and id fields
              const categoriesWithRestaurantId = state.menuCategories.map(category => ({
                name: category.name,
                description: category.description,
                order: category.order,
                is_active: category.is_active,
                restaurant_id: state.restaurantId
              }));
              
              const { data: savedCategories, error: categoriesError } = await supabase
                .from('menu_categories')
                .insert(categoriesWithRestaurantId)
                .select('id, name');
                
              if (categoriesError) throw categoriesError;
              
              // Map local category temp_ids to database IDs
              const categoryIdMap = new Map();
              if (savedCategories) {
                state.menuCategories.forEach((cat, index) => {
                  if (savedCategories[index]) {
                    categoryIdMap.set(cat.temp_id, savedCategories[index].id);
                  }
                });
              }
              
              // Insert new items
              if (state.menuItems.length > 0) {
                // Prepare items for insertion - map category_id using the map
                const itemsWithRestaurantId = state.menuItems.map(item => ({
                  name: item.name,
                  description: item.description,
                  price: item.price,
                  is_active: item.is_active,
                  image_url: item.image_url || null,
                  restaurant_id: state.restaurantId,
                  category_id: item.category_id ? categoryIdMap.get(item.category_id) : null
                }));
                
                const { error: itemsError } = await supabase
                  .from('menu_items')
                  .insert(itemsWithRestaurantId);
                  
                if (itemsError) throw itemsError;
              }
            }
            
            // Update WhatsApp integration
            if (state.whatsAppInfo.instance_name || state.whatsAppInfo.phone_number) {
              const { data, error: checkError } = await supabase
                .from('whatsapp_integrations')
                .select('id')
                .eq('restaurant_id', state.restaurantId)
                .maybeSingle();
                
              if (checkError) throw checkError;
              
              if (data) {
                const { error: updateError } = await supabase
                  .from('whatsapp_integrations')
                  .update({
                    instance_name: state.whatsAppInfo.instance_name || 'Default Instance',
                    phone_number: state.whatsAppInfo.phone_number || ''
                  })
                  .eq('id', data.id);
                  
                if (updateError) throw updateError;
              } else {
                const { error: insertError } = await supabase
                  .from('whatsapp_integrations')
                  .insert({
                    instance_name: state.whatsAppInfo.instance_name || 'Default Instance',
                    phone_number: state.whatsAppInfo.phone_number || '',
                    restaurant_id: state.restaurantId,
                    status: 'pending'
                  });
                  
                if (insertError) throw insertError;
              }
            }
            
            // Update onboarding steps
            const { error: stepUpdateError } = await supabase
              .from('onboarding_steps')
              .update({ 
                is_completed: true,
                completed_at: new Date().toISOString()
              })
              .eq('restaurant_id', state.restaurantId)
              .eq('step_number', state.currentStep - 1);
              
            if (stepUpdateError) throw stepUpdateError;
          }
        } catch (error) {
          console.error('Error saving onboarding progress:', error);
          throw error;
        }
      },
      
      resetOnboarding: () => set({
        currentStep: 1,
        restaurantId: null,
        restaurantInfo: {},
        areas: [],
        menuCategories: [],
        menuItems: [],
        whatsAppInfo: {},
        isCompleted: false,
        menuPhotos: []
      })
    }),
    {
      name: 'chefguio-onboarding',
    }
  )
);