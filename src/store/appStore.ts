import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { RestaurantArea, RestaurantTable, WaitingEntry } from '@/db/schema';
import { format, differenceInMinutes } from 'date-fns';

interface AppState {
  // Areas
  areas: RestaurantArea[];
  isEditMode: boolean;
  selectedArea: RestaurantArea | null;
  selectedTable: RestaurantTable | null;
  tables: RestaurantTable[];
  
  fetchAreas: () => Promise<void>;
  addArea: (newArea: Omit<RestaurantArea, 'id' | 'created_at'>) => Promise<RestaurantArea | null>;
  updateArea: (areaId: string, areaData: Partial<RestaurantArea>) => Promise<RestaurantArea | null>;
  deleteArea: (areaId: string) => Promise<void>;
  fetchTables: () => Promise<void>;
  getTablesByArea: (areaId: string) => RestaurantTable[];
  getActiveAreas: () => RestaurantArea[];
  toggleEditMode: () => void;
  setSelectedTable: (table: RestaurantTable | null) => void;
  setSelectedArea: (area: RestaurantArea | null) => void;
  
  // Waiting List
  entries: WaitingEntry[];
  stats: {
    waitingCount: number;
    notifiedCount: number;
    seatedTodayCount: number;
    noShowTodayCount: number;
    totalPeopleWaiting: number;
    totalPeopleSeatedToday: number;
    averageWaitTime: number;
    todayAverageWaitTime: number;
    noShowPercentage: number;
  };
  
  calculateStats: (entries: WaitingEntry[]) => void;
  addEntry: (entryData: Omit<WaitingEntry, 'id' | 'created_at' | 'status' | 'position'>) => Promise<WaitingEntry | null>;
  updateEntry: (entryId: string, entryData: Partial<WaitingEntry>) => Promise<WaitingEntry | null>;
  removeEntry: (entryId: string) => Promise<void>;
  notifyCustomer: (entryId: string) => Promise<WaitingEntry | null>;
  markAsSeated: (entryId: string, tableId: string) => Promise<WaitingEntry | null>;
  markAsNoShow: (entryId: string) => Promise<WaitingEntry | null>;
  moveEntryUp: (entryId: string) => Promise<void>;
  moveEntryDown: (entryId: string) => Promise<void>;
  refreshEntries: () => Promise<void>;
  createDummyData: () => Promise<void>;
}

const useAppStore = create<AppState>((set, get) => ({
  // Areas
  areas: [],
  isEditMode: false,
  selectedArea: null,
  selectedTable: null,
  tables: [],
  
  fetchAreas: async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_areas')
        .select();
      
      if (error) throw error;
      
      set({ areas: data });
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  },
  
  addArea: async (newArea) => {
    try {
      const { data, error } = await supabase
        .from('restaurant_areas')
        .insert(newArea)
        .select()
        .single();
      
      if (error) throw error;
      
      set({ areas: [...get().areas, data] });
      
      return data;
    } catch (error) {
      console.error('Error adding area:', error);
      return null;
    }
  },
  
  updateArea: async (areaId, areaData) => {
    try {
      const { data, error } = await supabase
        .from('restaurant_areas')
        .update(areaData)
        .eq('id', areaId)
        .select()
        .single();
      
      if (error) throw error;
      
      set({ 
        areas: get().areas.map(area => 
          area.id === areaId ? data : area
        ),
        // Update area in tables that use this area
        tables: get().tables.map(table => 
          table.area_id === areaId ? { ...table, area: data } : table
        ),
        selectedArea: get().selectedArea?.id === areaId ? data : get().selectedArea
      });
      
      return data;
    } catch (error) {
      console.error('Error updating area:', error);
      return null;
    }
  },
  
  deleteArea: async (areaId) => {
    try {
      // Check if there are tables in this area
      const tablesInArea = get().tables.filter(table => table.area_id === areaId);
      if (tablesInArea.length > 0) {
        return false;
      }
      
      const { error } = await supabase
        .from('restaurant_areas')
        .delete()
        .eq('id', areaId);
      
      if (error) throw error;
      
      set({ 
        areas: get().areas.filter(area => area.id !== areaId),
        selectedArea: get().selectedArea?.id === areaId ? null : get().selectedArea
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting area:', error);
      return false;
    }
  },
  
  fetchTables: async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select();
      
      if (error) throw error;
      
      set({ tables: data });
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  },
  
  getTablesByArea: (areaId) => {
    return get().tables.filter(table => table.area_id === areaId);
  },
  
  getActiveAreas: () => {
    return get().areas.filter(area => area.is_active);
  },
  
  toggleEditMode: () => {
    set({ isEditMode: !get().isEditMode });
  },
  
  setSelectedTable: (table) => {
    set({ selectedTable: table });
  },
  
  setSelectedArea: (area) => {
    set({ selectedArea: area });
  },

  // Waiting List state
  entries: [],
  stats: {
    waitingCount: 0,
    notifiedCount: 0,
    seatedTodayCount: 0,
    noShowTodayCount: 0,
    totalPeopleWaiting: 0,
    totalPeopleSeatedToday: 0,
    averageWaitTime: 0,
    todayAverageWaitTime: 0,
    noShowPercentage: 0
  },
  
  calculateStats: (entries: WaitingEntry[]) => {
    const today = new Date().toDateString();
    
    // Filter entries by status and date
    const waitingEntries = entries.filter(entry => entry.status === 'waiting');
    const notifiedEntries = entries.filter(entry => entry.status === 'notified');
    const seatedTodayEntries = entries.filter(
      entry => entry.status === 'seated' && new Date(entry.updated_at).toDateString() === today
    );
    const noShowTodayEntries = entries.filter(
      entry => entry.status === 'no_show' && new Date(entry.updated_at).toDateString() === today
    );
    
    // Calculate total people waiting
    const totalPeopleWaiting = [...waitingEntries, ...notifiedEntries].reduce(
      (sum, entry) => sum + entry.party_size, 0
    );
    
    // Calculate total people seated today
    const totalPeopleSeatedToday = seatedTodayEntries.reduce(
      (sum, entry) => sum + entry.party_size, 0
    );
    
    // Calculate average wait time (in minutes)
    const calculateAverageWaitTime = (entries: WaitingEntry[]) => {
      if (entries.length === 0) return 0;
      
      const totalWaitTime = entries.reduce((sum, entry) => {
        const waitTime = (new Date(entry.updated_at).getTime() - new Date(entry.created_at).getTime()) / (1000 * 60);
        return sum + waitTime;
      }, 0);
      
      return Math.round(totalWaitTime / entries.length);
    };
    
    const averageWaitTime = calculateAverageWaitTime([...seatedTodayEntries, ...noShowTodayEntries]);
    const todayAverageWaitTime = calculateAverageWaitTime(seatedTodayEntries);
    
    // Calculate no-show percentage
    const totalFinishedToday = seatedTodayEntries.length + noShowTodayEntries.length;
    const noShowPercentage = totalFinishedToday > 0 
      ? Math.round((noShowTodayEntries.length / totalFinishedToday) * 100) 
      : 0;
    
    set({
      stats: {
        waitingCount: waitingEntries.length,
        notifiedCount: notifiedEntries.length,
        seatedTodayCount: seatedTodayEntries.length,
        noShowTodayCount: noShowTodayEntries.length,
        totalPeopleWaiting,
        totalPeopleSeatedToday,
        averageWaitTime,
        todayAverageWaitTime,
        noShowPercentage
      }
    });
  },
  
  addEntry: async (entryData) => {
    const restaurantId = get().restaurantId;
    if (!restaurantId) return null;
    
    try {
      // Get the next queue number
      const { data: maxQueueNumber, error: maxQueueError } = await supabase
        .from('waiting_list')
        .select('queue_number')
        .eq('restaurant_id', restaurantId)
        .order('queue_number', { ascending: false })
        .limit(1)
        .single();
      
      const nextQueueNumber = maxQueueError ? 1 : (maxQueueNumber?.queue_number || 0) + 1;
      
      // Create the new entry
      const newEntry = {
        restaurant_id: restaurantId,
        customer_name: entryData.customer_name,
        phone_number: entryData.phone_number,
        party_size: entryData.party_size,
        queue_number: nextQueueNumber,
        status: 'waiting',
        priority: entryData.priority || 'low',
        area_preference: entryData.area_preference || null,
        estimated_wait_time: entryData.estimated_wait_time || null,
        notes: entryData.notes || null
      };
      
      const { data, error } = await supabase
        .from('waiting_list')
        .insert(newEntry)
        .select()
        .single();
      
      if (error) throw error;
      
      // Send notification if requested
      if (entryData.send_notification) {
        // In a real app, this would send a WhatsApp message
        console.log(`Sending confirmation message to ${entryData.phone_number}`);
      }
      
      // Update the local state
      const entries = [...get().entries, data].sort((a, b) => {
        // First sort by status (waiting first, then notified)
        if (a.status === 'waiting' && b.status !== 'waiting') return -1;
        if (a.status !== 'waiting' && b.status === 'waiting') return 1;
        
        // Then sort by priority (high first, then medium, then low)
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        
        // Finally sort by created_at
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      
      set({ entries });
      
      // Update statistics
      get().calculateStats(entries);
      
      return data;
    } catch (error) {
      console.error('Error adding waiting list entry:', error);
      return null;
    }
  },
  
  updateEntry: async (entryId, entryData) => {
    try {
      const { data, error } = await supabase
        .from('waiting_list')
        .update(entryData)
        .eq('id', entryId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the local state
      const entries = get().entries.map(entry => entry.id === entryId ? data : entry);
      set({ entries });
      
      // Update statistics
      get().calculateStats(entries);
      
      return data;
    } catch (error) {
      console.error('Error updating waiting list entry:', error);
      return null;
    }
  },
  
  removeEntry: async (entryId) => {
    try {
      const { error } = await supabase
        .from('waiting_list')
        .delete()
        .eq('id', entryId);
      
      if (error) throw error;
      
      // Update the local state
      const entries = get().entries.filter(entry => entry.id !== entryId);
      set({ entries });
      
      // Update statistics
      get().calculateStats(entries);
    } catch (error) {
      console.error('Error removing waiting list entry:', error);
      throw error;
    }
  },
  
  notifyCustomer: async (entryId) => {
    try {
      const entry = get().entries.find(e => e.id === entryId);
      if (!entry) throw new Error('Entry not found');
      
      // Update the entry status
      const { data, error } = await supabase
        .from('waiting_list')
        .update({
          status: 'notified',
          notification_time: new Date().toISOString()
        })
        .eq('id', entryId)
        .select()
        .single();
      
      if (error) throw error;
      
      // In a real app, this would send a WhatsApp message
      console.log(`Sending notification to ${entry.phone_number}`);
      
      // Update the local state
      const entries = get().entries.map(entry => entry.id === entryId ? data : entry);
      set({ entries });
      
      // Update statistics
      get().calculateStats(entries);
    } catch (error) {
      console.error('Error notifying customer:', error);
      throw error;
    }
  },
  
  markAsSeated: async (entryId, tableId) => {
    try {
      // Update the entry status
      const { data, error } = await supabase
        .from('waiting_list')
        .update({
          status: 'seated',
          table_id: tableId || null
        })
        .eq('id', entryId)
        .select()
        .single();
      
      if (error) throw error;
      
      // If a table was selected, update its status
      if (tableId) {
        const { error: tableError } = await supabase
          .from('tables')
          .update({ status: 'occupied' })
          .eq('id', tableId);
        
        if (tableError) throw tableError;
        
        // Update the tables in state
        const tables = get().tables.map(table => {
          if (table.id === tableId) {
            return { ...table, status: 'occupied' };
          }
          return table;
        });
        
        set({ tables });
      }
      
      // Update the local state
      const entries = get().entries.map(entry => entry.id === entryId ? data : entry);
      set({ entries });
      
      // Update statistics
      get().calculateStats(entries);
    } catch (error) {
      console.error('Error marking customer as seated:', error);
      throw error;
    }
  },
  
  markAsNoShow: async (entryId) => {
    try {
      // Update the entry status
      const { data, error } = await supabase
        .from('waiting_list')
        .update({ status: 'no_show' })
        .eq('id', entryId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the local state
      const entries = get().entries.map(entry => entry.id === entryId ? data : entry);
      set({ entries });
      
      // Update statistics
      get().calculateStats(entries);
    } catch (error) {
      console.error('Error marking customer as no-show:', error);
      throw error;
    }
  },
  
  moveEntryUp: async (entryId) => {
    try {
      // Find the entry and the one before it
      const entries = get().entries;
      const entryIndex = entries.findIndex(e => e.id === entryId);
      if (entryIndex <= 0) return; // Already at the top or not found
      
      const currentEntry = entries[entryIndex];
      const previousEntry = entries[entryIndex - 1];
      
      // Swap their positions in the local state
      const newEntries = [...entries];
      newEntries[entryIndex - 1] = currentEntry;
      newEntries[entryIndex] = previousEntry;
      
      set({ entries: newEntries });
      
      // In a real app with a more complex queue system, you might need to update
      // some sort of order field in the database here
    } catch (error) {
      console.error('Error moving entry up:', error);
      throw error;
    }
  },
  
  moveEntryDown: async (entryId) => {
    try {
      // Find the entry and the one after it
      const entries = get().entries;
      const entryIndex = entries.findIndex(e => e.id === entryId);
      if (entryIndex === -1 || entryIndex >= entries.length - 1) return; // Not found or already at the bottom
      
      const currentEntry = entries[entryIndex];
      const nextEntry = entries[entryIndex + 1];
      
      // Swap their positions in the local state
      const newEntries = [...entries];
      newEntries[entryIndex] = nextEntry;
      newEntries[entryIndex + 1] = currentEntry;
      
      set({ entries: newEntries });
      
      // In a real app with a more complex queue system, you might need to update
      // some sort of order field in the database here
    } catch (error) {
      console.error('Error moving entry down:', error);
      throw error;
    }
  },
  
  refreshEntries: async () => {
    await get().fetchEntries();
  },
  
  createDummyData: async () => {
    const restaurantId = get().restaurantId;
    if (!restaurantId) return;
    
    try {
      // Create some dummy entries
      const dummyEntries = [
        {
          restaurant_id: restaurantId,
          customer_name: 'João Silva',
          phone_number: '(11) 99999-1111',
          party_size: 4,
          queue_number: 1,
          status: 'waiting',
          priority: 'medium',
          estimated_wait_time: 20,
          notes: 'Prefere mesa próxima à janela'
        },
        {
          restaurant_id: restaurantId,
          customer_name: 'Maria Oliveira',
          phone_number: '(11) 99999-2222',
          party_size: 2,
          queue_number: 2,
          status: 'waiting',
          priority: 'low',
          estimated_wait_time: 15
        },
        {
          restaurant_id: restaurantId,
          customer_name: 'Carlos Santos',
          phone_number: '(11) 99999-3333',
          party_size: 6,
          queue_number: 3,
          status: 'notified',
          priority: 'medium',
          estimated_wait_time: 30,
          notification_time: new Date(Date.now() - 5 * 60000).toISOString()
        },
        {
          restaurant_id: restaurantId,
          customer_name: 'Ana Ferreira',
          phone_number: '(11) 99999-4444',
          party_size: 3,
          queue_number: 4,
          status: 'waiting',
          priority: 'high',
          estimated_wait_time: 10,
          notes: 'Cliente VIP - Aniversariante'
        },
        {
          restaurant_id: restaurantId,
          customer_name: 'Pedro Souza',
          phone_number: '(11) 99999-5555',
          party_size: 2,
          queue_number: 5,
          status: 'seated',
          priority: 'low',
          table_id: null,
          created_at: new Date(Date.now() - 45 * 60000).toISOString(),
          updated_at: new Date(Date.now() - 15 * 60000).toISOString()
        },
        {
          restaurant_id: restaurantId,
          customer_name: 'Juliana Costa',
          phone_number: '(11) 99999-6666',
          party_size: 4,
          queue_number: 6,
          status: 'no_show',
          priority: 'low',
          created_at: new Date(Date.now() - 60 * 60000).toISOString(),
          updated_at: new Date(Date.now() - 30 * 60000).toISOString()
        }
      ];
      
      // Insert the dummy entries
      const { data, error } = await supabase
        .from('waiting_list')
        .insert(dummyEntries)
        .select();
      
      if (error) throw error;
      
      // Refresh the entries
      await get().fetchEntries();
    } catch (error) {
      console.error('Error creating dummy data:', error);
      throw error;
    }
  }
}),
{
  name: 'chefguio-app-store',
  partialize: (state) => ({
    restaurantId: state.restaurantId
  })
});