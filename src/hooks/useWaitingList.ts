import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Table, RestaurantArea } from '@/db/schema';

export interface WaitingEntry {
  id: string;
  restaurant_id: string;
  customer_name: string;
  phone_number: string;
  party_size: number;
  queue_number: number;
  status: 'waiting' | 'notified' | 'seated' | 'no_show';
  priority: 'low' | 'medium' | 'high';
  area_preference: string | null;
  estimated_wait_time: number | null;
  notification_time: string | null;
  notes: string | null;
  table_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaitingListStats {
  activeCount: number;
  notifiedCount: number;
  seatedTodayCount: number;
  noShowTodayCount: number;
  totalPeopleWaiting: number;
  totalPeopleSeatedToday: number;
  averageWaitTime: number;
  todayAverageWaitTime: number;
  noShowPercentage: number;
}

export interface TableWithArea extends Table {
  area: RestaurantArea;
}

export const useWaitingList = (restaurantId: string | null) => {
  const [waitingEntries, setWaitingEntries] = useState<WaitingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<WaitingListStats>({
    activeCount: 0,
    notifiedCount: 0,
    seatedTodayCount: 0,
    noShowTodayCount: 0,
    totalPeopleWaiting: 0,
    totalPeopleSeatedToday: 0,
    averageWaitTime: 0,
    todayAverageWaitTime: 0,
    noShowPercentage: 0
  });
  const { toast } = useToast();

  // Fetch waiting list entries
  const fetchEntries = async () => {
    if (!restaurantId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('waiting_list')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Sort entries by priority and then by created_at
      const sortedEntries = (data || []).sort((a, b) => {
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
      
      setWaitingEntries(sortedEntries);
      calculateStats(sortedEntries);
    } catch (error) {
      console.error('Error fetching waiting list entries:', error);
      toast({
        title: 'Erro ao carregar fila de espera',
        description: 'Não foi possível carregar os clientes na fila de espera.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (entries: WaitingEntry[]) => {
    const today = new Date().toDateString();
    
    // Filter entries by status and date
    const activeEntries = entries.filter(entry => entry.status === 'waiting');
    const notifiedEntries = entries.filter(entry => entry.status === 'notified');
    const seatedTodayEntries = entries.filter(
      entry => entry.status === 'seated' && new Date(entry.updated_at).toDateString() === today
    );
    const noShowTodayEntries = entries.filter(
      entry => entry.status === 'no_show' && new Date(entry.updated_at).toDateString() === today
    );
    
    // Calculate total people waiting
    const totalPeopleWaiting = [...activeEntries, ...notifiedEntries].reduce(
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
    
    setStats({
      activeCount: activeEntries.length,
      notifiedCount: notifiedEntries.length,
      seatedTodayCount: seatedTodayEntries.length,
      noShowTodayCount: noShowTodayEntries.length,
      totalPeopleWaiting,
      totalPeopleSeatedToday,
      averageWaitTime,
      todayAverageWaitTime,
      noShowPercentage
    });
  };

  // Add a new entry to the waiting list
  const addEntry = async (entryData: any) => {
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
      setWaitingEntries(prev => {
        const newEntries = [...prev, data];
        // Sort entries by priority and then by created_at
        return newEntries.sort((a, b) => {
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
      });
      
      // Update statistics
      calculateStats([...waitingEntries, data]);
      
      return data;
    } catch (error) {
      console.error('Error adding waiting list entry:', error);
      throw error;
    }
  };

  // Update an existing entry
  const updateEntry = async (entryId: string, entryData: Partial<WaitingEntry>) => {
    try {
      const { data, error } = await supabase
        .from('waiting_list')
        .update(entryData)
        .eq('id', entryId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the local state
      setWaitingEntries(prev => 
        prev.map(entry => entry.id === entryId ? data : entry)
      );
      
      // Update statistics
      calculateStats(waitingEntries.map(entry => entry.id === entryId ? data : entry));
      
      return data;
    } catch (error) {
      console.error('Error updating waiting list entry:', error);
      throw error;
    }
  };

  // Remove an entry from the waiting list
  const removeEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('waiting_list')
        .delete()
        .eq('id', entryId);
      
      if (error) throw error;
      
      // Update the local state
      const updatedEntries = waitingEntries.filter(entry => entry.id !== entryId);
      setWaitingEntries(updatedEntries);
      
      // Update statistics
      calculateStats(updatedEntries);
      
      toast({
        title: 'Cliente removido',
        description: 'Cliente removido da fila de espera com sucesso.',
      });
    } catch (error) {
      console.error('Error removing waiting list entry:', error);
      throw error;
    }
  };

  // Notify a customer
  const notifyCustomer = async (entryId: string) => {
    try {
      const entry = waitingEntries.find(e => e.id === entryId);
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
      setWaitingEntries(prev => 
        prev.map(entry => entry.id === entryId ? data : entry)
      );
      
      // Update statistics
      calculateStats(waitingEntries.map(entry => entry.id === entryId ? data : entry));
      
      toast({
        title: 'Cliente notificado',
        description: 'Cliente notificado com sucesso.',
      });
    } catch (error) {
      console.error('Error notifying customer:', error);
      toast({
        title: 'Erro ao notificar cliente',
        description: 'Não foi possível notificar o cliente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Mark a customer as seated
  const markAsSeated = async (entryId: string, tableId?: string) => {
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
      }
      
      // Update the local state
      setWaitingEntries(prev => 
        prev.map(entry => entry.id === entryId ? data : entry)
      );
      
      // Update statistics
      calculateStats(waitingEntries.map(entry => entry.id === entryId ? data : entry));
      
      toast({
        title: 'Cliente acomodado',
        description: 'Cliente marcado como acomodado com sucesso.',
      });
    } catch (error) {
      console.error('Error marking customer as seated:', error);
      toast({
        title: 'Erro ao acomodar cliente',
        description: 'Não foi possível marcar o cliente como acomodado.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Mark a customer as no-show
  const markAsNoShow = async (entryId: string) => {
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
      setWaitingEntries(prev => 
        prev.map(entry => entry.id === entryId ? data : entry)
      );
      
      // Update statistics
      calculateStats(waitingEntries.map(entry => entry.id === entryId ? data : entry));
      
      toast({
        title: 'Cliente não compareceu',
        description: 'Cliente marcado como não comparecido.',
      });
    } catch (error) {
      console.error('Error marking customer as no-show:', error);
      toast({
        title: 'Erro ao marcar cliente',
        description: 'Não foi possível marcar o cliente como não comparecido.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Move an entry up in the queue
  const moveEntryUp = async (entryId: string) => {
    try {
      // Find the entry and the one before it
      const entryIndex = waitingEntries.findIndex(e => e.id === entryId);
      if (entryIndex <= 0) return; // Already at the top or not found
      
      const currentEntry = waitingEntries[entryIndex];
      const previousEntry = waitingEntries[entryIndex - 1];
      
      // Swap their positions in the local state
      const newEntries = [...waitingEntries];
      newEntries[entryIndex - 1] = currentEntry;
      newEntries[entryIndex] = previousEntry;
      
      setWaitingEntries(newEntries);
      
      // In a real app with a more complex queue system, you might need to update
      // some sort of order field in the database here
      
      toast({
        title: 'Posição atualizada',
        description: 'Cliente movido para cima na fila.',
      });
    } catch (error) {
      console.error('Error moving entry up:', error);
      toast({
        title: 'Erro ao mover cliente',
        description: 'Não foi possível mover o cliente na fila.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Move an entry down in the queue
  const moveEntryDown = async (entryId: string) => {
    try {
      // Find the entry and the one after it
      const entryIndex = waitingEntries.findIndex(e => e.id === entryId);
      if (entryIndex === -1 || entryIndex >= waitingEntries.length - 1) return; // Not found or already at the bottom
      
      const currentEntry = waitingEntries[entryIndex];
      const nextEntry = waitingEntries[entryIndex + 1];
      
      // Swap their positions in the local state
      const newEntries = [...waitingEntries];
      newEntries[entryIndex] = nextEntry;
      newEntries[entryIndex + 1] = currentEntry;
      
      setWaitingEntries(newEntries);
      
      // In a real app with a more complex queue system, you might need to update
      // some sort of order field in the database here
      
      toast({
        title: 'Posição atualizada',
        description: 'Cliente movido para baixo na fila.',
      });
    } catch (error) {
      console.error('Error moving entry down:', error);
      toast({
        title: 'Erro ao mover cliente',
        description: 'Não foi possível mover o cliente na fila.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Refresh entries
  const refreshEntries = async () => {
    await fetchEntries();
  };

  // Create dummy data for demonstration
  const createDummyData = async () => {
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
      await fetchEntries();
      
      return data;
    } catch (error) {
      console.error('Error creating dummy data:', error);
      toast({
        title: 'Erro ao criar dados de exemplo',
        description: 'Não foi possível criar os dados de exemplo.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Load data on component mount or when restaurantId changes
  useEffect(() => {
    if (restaurantId) {
      fetchEntries();
    }
  }, [restaurantId]);

  return {
    waitingEntries,
    isLoading,
    stats,
    addEntry,
    updateEntry,
    removeEntry,
    notifyCustomer,
    markAsSeated,
    markAsNoShow,
    moveEntryUp,
    moveEntryDown,
    refreshEntries,
    createDummyData
  };
};