import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Table, RestaurantArea } from '@/db/schema';
import { useToast } from '@/hooks/use-toast';

export type TableShape = 'round' | 'square' | 'rectangle';
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'blocked';

export interface TableWithArea extends Table {
  area: RestaurantArea;
}

export const useTables = (restaurantId: string | null) => {
  const [tables, setTables] = useState<TableWithArea[]>([]);
  const [areas, setAreas] = useState<RestaurantArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableWithArea | null>(null);
  const [selectedArea, setSelectedArea] = useState<RestaurantArea | null>(null);
  const { toast } = useToast();

  // Fetch tables and areas
  const fetchTablesAndAreas = async () => {
    if (!restaurantId) return;
    
    setIsLoading(true);
    try {
      // Fetch areas first
      const { data: areasData, error: areasError } = await supabase
        .from('restaurant_areas')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('order');
      
      if (areasError) throw areasError;
      
      // Fetch tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId);
      
      if (tablesError) throw tablesError;
      
      // If we have tables, fetch the area details for each table
      const tablesWithAreas: TableWithArea[] = [];
      
      if (tablesData && tablesData.length > 0 && areasData) {
        // Create a map of area IDs to area objects for quick lookup
        const areaMap = new Map<string, RestaurantArea>();
        areasData.forEach(area => {
          areaMap.set(area.id, area);
        });
        
        // Add area details to each table
        for (const table of tablesData) {
          const area = areaMap.get(table.area_id);
          if (area) {
            tablesWithAreas.push({
              ...table,
              area
            });
          }
        }
      }
      
      setAreas(areasData || []);
      setTables(tablesWithAreas);
    } catch (error) {
      console.error('Error fetching tables and areas:', error);
      toast({
        title: 'Erro ao carregar mesas',
        description: 'Não foi possível carregar as mesas e áreas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new table
  const addTable = async (tableData: Partial<Table>) => {
    if (!restaurantId) return null;
    
    try {
      // Get the highest table number in the area to auto-increment
      const { data: maxNumberData } = await supabase
        .from('tables')
        .select('number')
        .eq('restaurant_id', restaurantId)
        .eq('area_id', tableData.area_id)
        .order('number', { ascending: false })
        .limit(1);
      
      const nextNumber = maxNumberData && maxNumberData.length > 0 
        ? maxNumberData[0].number + 1 
        : 1;
      
      const newTable = {
        restaurant_id: restaurantId,
        number: nextNumber,
        capacity: 2,
        shape: 'square' as TableShape,
        width: 80,
        height: 80,
        position_x: 100,
        position_y: 100,
        status: 'available' as TableStatus,
        is_active: true,
        ...tableData
      };
      
      const { data, error } = await supabase
        .from('tables')
        .insert(newTable)
        .select()
        .single();
      
      if (error) throw error;
      
      // Get the area for this table
      const { data: areaData, error: areaError } = await supabase
        .from('restaurant_areas')
        .select('*')
        .eq('id', data.area_id)
        .single();
      
      if (areaError) throw areaError;
      
      const tableWithArea: TableWithArea = {
        ...data,
        area: areaData
      };
      
      setTables(prev => [...prev, tableWithArea]);
      
      toast({
        title: 'Mesa adicionada',
        description: `Mesa ${data.number} adicionada com sucesso.`,
      });
      
      return tableWithArea;
    } catch (error) {
      console.error('Error adding table:', error);
      toast({
        title: 'Erro ao adicionar mesa',
        description: 'Não foi possível adicionar a mesa.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update a table
  const updateTable = async (tableId: string, tableData: Partial<Table>) => {
    try {
      // Extract area property from tableData if it exists
      // We need to remove it because it's not a column in the tables table
      const { area, ...dataToUpdate } = tableData as any;
      
      const { data, error } = await supabase
        .from('tables')
        .update(dataToUpdate)
        .eq('id', tableId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Get the area for this table
      const { data: areaData, error: areaError } = await supabase
        .from('restaurant_areas')
        .select('*')
        .eq('id', data.area_id)
        .single();
      
      if (areaError) throw areaError;
      
      const tableWithArea: TableWithArea = {
        ...data,
        area: areaData
      };
      
      setTables(prev => prev.map(table => 
        table.id === tableId ? tableWithArea : table
      ));
      
      // If this is the selected table, update it
      if (selectedTable && selectedTable.id === tableId) {
        setSelectedTable(tableWithArea);
      }
      
      toast({
        title: 'Mesa atualizada',
        description: `Mesa ${data.number} atualizada com sucesso.`,
      });
      
      return tableWithArea;
    } catch (error) {
      console.error('Error updating table:', error);
      toast({
        title: 'Erro ao atualizar mesa',
        description: 'Não foi possível atualizar a mesa.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update table position
  const updateTablePosition = async (tableId: string, x: number, y: number) => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .update({
          position_x: x,
          position_y: y
        })
        .eq('id', tableId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Find the current table to get its area
      const currentTable = tables.find(t => t.id === tableId);
      if (!currentTable) return null;
      
      const tableWithArea: TableWithArea = {
        ...data,
        area: currentTable.area
      };
      
      setTables(prev => prev.map(table => 
        table.id === tableId ? tableWithArea : table
      ));
      
      // If this is the selected table, update it
      if (selectedTable && selectedTable.id === tableId) {
        setSelectedTable(tableWithArea);
      }
      
      return tableWithArea;
    } catch (error) {
      console.error('Error updating table position:', error);
      return null;
    }
  };

  // Delete a table
  const deleteTable = async (tableId: string) => {
    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId);
      
      if (error) throw error;
      
      setTables(prev => prev.filter(table => table.id !== tableId));
      
      // If this was the selected table, deselect it
      if (selectedTable && selectedTable.id === tableId) {
        setSelectedTable(null);
      }
      
      toast({
        title: 'Mesa removida',
        description: 'Mesa removida com sucesso.',
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting table:', error);
      toast({
        title: 'Erro ao remover mesa',
        description: 'Não foi possível remover a mesa.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Change table status
  const changeTableStatus = async (tableId: string, newStatus: TableStatus, notes?: string) => {
    try {
      // Get current status first
      const tableToUpdate = tables.find(t => t.id === tableId);
      if (!tableToUpdate) return null;
      
      const previousStatus = tableToUpdate.status;
      
      // Update table status
      const { data, error } = await supabase
        .from('tables')
        .update({ status: newStatus })
        .eq('id', tableId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Record status change in history
      const { error: historyError } = await supabase
        .from('table_status_history')
        .insert({
          table_id: tableId,
          previous_status: previousStatus,
          new_status: newStatus,
          notes: notes || null
        });
      
      if (historyError) throw historyError;
      
      const tableWithArea: TableWithArea = {
        ...data,
        area: tableToUpdate.area
      };
      
      setTables(prev => prev.map(table => 
        table.id === tableId ? tableWithArea : table
      ));
      
      // If this is the selected table, update it
      if (selectedTable && selectedTable.id === tableId) {
        setSelectedTable(tableWithArea);
      }
      
      toast({
        title: 'Status atualizado',
        description: `Mesa ${data.number} agora está ${getStatusLabel(newStatus)}.`,
      });
      
      return tableWithArea;
    } catch (error) {
      console.error('Error changing table status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status da mesa.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Add a new area
  const addArea = async (areaData: Partial<RestaurantArea>) => {
    if (!restaurantId) return null;
    
    try {
      const newArea = {
        restaurant_id: restaurantId,
        name: '',
        is_active: true,
        order: areas.length,
        ...areaData
      };
      
      const { data, error } = await supabase
        .from('restaurant_areas')
        .insert(newArea)
        .select()
        .single();
      
      if (error) throw error;
      
      setAreas(prev => [...prev, data]);
      toast({
        title: 'Área adicionada',
        description: `Área "${data.name}" adicionada com sucesso.`,
      });
      
      return data;
    } catch (error) {
      console.error('Error adding area:', error);
      toast({
        title: 'Erro ao adicionar área',
        description: 'Não foi possível adicionar a área.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update an area
  const updateArea = async (areaId: string, areaData: Partial<RestaurantArea>) => {
    try {
      const { data, error } = await supabase
        .from('restaurant_areas')
        .update(areaData)
        .eq('id', areaId)
        .select()
        .single();
      
      if (error) throw error;
      
      setAreas(prev => prev.map(area => 
        area.id === areaId ? data : area
      ));
      
      // Update area in tables that use this area
      setTables(prev => prev.map(table => 
        table.area_id === areaId ? { ...table, area: data } : table
      ));
      
      // If this is the selected area, update it
      if (selectedArea && selectedArea.id === areaId) {
        setSelectedArea(data);
      }
      
      toast({
        title: 'Área atualizada',
        description: `Área "${data.name}" atualizada com sucesso.`,
      });
      
      return data;
    } catch (error) {
      console.error('Error updating area:', error);
      toast({
        title: 'Erro ao atualizar área',
        description: 'Não foi possível atualizar a área.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Delete an area
  const deleteArea = async (areaId: string) => {
    try {
      // Check if there are tables in this area
      const tablesInArea = tables.filter(table => table.area_id === areaId);
      if (tablesInArea.length > 0) {
        toast({
          title: 'Não é possível remover',
          description: `Esta área contém ${tablesInArea.length} mesas. Remova as mesas primeiro.`,
          variant: 'destructive',
        });
        return false;
      }
      
      const { error } = await supabase
        .from('restaurant_areas')
        .delete()
        .eq('id', areaId);
      
      if (error) throw error;
      
      setAreas(prev => prev.filter(area => area.id !== areaId));
      
      // If this was the selected area, deselect it
      if (selectedArea && selectedArea.id === areaId) {
        setSelectedArea(null);
      }
      
      toast({
        title: 'Área removida',
        description: 'Área removida com sucesso.',
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting area:', error);
      toast({
        title: 'Erro ao remover área',
        description: 'Não foi possível remover a área.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Helper function to get status label
  const getStatusLabel = (status: TableStatus): string => {
    switch (status) {
      case 'available': return 'disponível';
      case 'occupied': return 'ocupada';
      case 'reserved': return 'reservada';
      case 'blocked': return 'bloqueada';
      default: return status;
    }
  };

  // Get tables for a specific area
  const getTablesByArea = (areaId: string): TableWithArea[] => {
    return tables.filter(table => table.area_id === areaId);
  };

  // Get active areas
  const getActiveAreas = (): RestaurantArea[] => {
    return areas.filter(area => area.is_active);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(prev => !prev);
  };

  // Load data on component mount or when restaurantId changes
  useEffect(() => {
    if (restaurantId) {
      fetchTablesAndAreas();
    }
  }, [restaurantId]);

  return {
    tables,
    areas,
    isLoading,
    isEditMode,
    selectedTable,
    selectedArea,
    setSelectedTable,
    setSelectedArea,
    fetchTablesAndAreas,
    addTable,
    updateTable,
    updateTablePosition,
    deleteTable,
    changeTableStatus,
    addArea,
    updateArea,
    deleteArea,
    getTablesByArea,
    getActiveAreas,
    toggleEditMode,
    getStatusLabel
  };
};