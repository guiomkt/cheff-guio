import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableCanvas } from '@/components/tables/TableCanvas';
import { TableList } from '@/components/tables/TableList';
import { TableSidebar } from '@/components/tables/TableSidebar';
import { RestaurantOverview } from '@/components/tables/RestaurantOverview';
import { useTables, TableWithArea } from '@/hooks/useTables';
import { RestaurantArea } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Edit, Save, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AreaSelector } from '@/components/tables/AreaSelector';
import { supabase } from '@/lib/supabase';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function TableManagement() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('canvas');
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();
  
  const {
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
    toggleEditMode
  } = useTables(restaurantId);

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

  // Set active area to first area when areas are loaded
  useEffect(() => {
    if (areas.length > 0 && !activeAreaId) {
      setActiveAreaId(areas[0].id);
      setSelectedArea(areas[0]);
    }
  }, [areas]);

  // Open sidebar when a table or area is selected on mobile
  useEffect(() => {
    if ((selectedTable || selectedArea) && window.innerWidth < 768) {
      setIsSidebarOpen(true);
    }
  }, [selectedTable, selectedArea]);

  // Handle area change
  const handleAreaChange = (areaId: string) => {
    setActiveAreaId(areaId);
    const area = areas.find(a => a.id === areaId) || null;
    setSelectedArea(area);
    setSelectedTable(null);
  };

  // Handle table selection
  const handleTableSelect = (table: TableWithArea | null) => {
    setSelectedTable(table);
    if (table) {
      setSelectedArea(null);
    }
  };

  // Handle area selection
  const handleAreaSelect = (area: RestaurantArea | null) => {
    setSelectedArea(area);
    if (area) {
      setActiveAreaId(area.id);
      setSelectedTable(null);
    }
  };

  // Handle adding a new table
  const handleAddTable = async () => {
    if (!activeAreaId) {
      toast({
        title: 'Selecione uma área',
        description: 'Selecione uma área para adicionar a mesa.',
        variant: 'destructive',
      });
      return;
    }
    
    const newTable = await addTable({
      area_id: activeAreaId,
      position_x: Math.floor(Math.random() * 300) + 50,
      position_y: Math.floor(Math.random() * 200) + 50
    });
    
    if (newTable) {
      setSelectedTable(newTable);
    }
  };

  // Handle adding a new area
  const handleAddArea = async () => {
    const newAreaName = `Nova Área ${areas.length + 1}`;
    const newArea = await addArea({
      name: newAreaName,
      description: 'Descrição da nova área',
      max_capacity: 20,
      max_tables: 5,
      is_active: true,
      order: areas.length
    });
    
    if (newArea) {
      setActiveAreaId(newArea.id);
      setSelectedArea(newArea);
      setSelectedTable(null);
    }
  };

  // Get tables for the active area
  const activeAreaTables = activeAreaId 
    ? getTablesByArea(activeAreaId)
    : [];

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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Gestão de Mesas</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleEditMode}
          >
            {isEditMode ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Layout
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Editar Layout
              </>
            )}
          </Button>
          
          {isEditMode && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddTable}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nova Mesa</span>
                <span className="sm:hidden">Mesa</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddArea}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nova Área</span>
                <span className="sm:hidden">Área</span>
              </Button>
            </>
          )}
          
          {/* Mobile sidebar trigger */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="md:hidden"
              >
                {selectedTable || selectedArea ? 'Detalhes' : 'Selecionar'}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-[90%] sm:w-[350px] md:hidden">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>
                  {selectedTable ? `Mesa ${selectedTable.number}` : 
                   selectedArea ? `Área: ${selectedArea.name}` : 
                   'Detalhes'}
                </SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto" style={{ height: 'calc(100% - 57px)' }}>
                <TableSidebar 
                  selectedTable={selectedTable}
                  selectedArea={selectedArea}
                  onUpdateTable={updateTable}
                  onDeleteTable={deleteTable}
                  onChangeStatus={changeTableStatus}
                  onUpdateArea={updateArea}
                  onDeleteArea={deleteArea}
                  onSelectArea={handleAreaSelect}
                  isEditMode={isEditMode}
                  areas={areas}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="h-full flex flex-col">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="detailed">Detalhada</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="flex-1 overflow-auto">
          <RestaurantOverview 
            areas={areas}
            tables={tables}
            onTableSelect={handleTableSelect}
            onAreaSelect={handleAreaSelect}
            onChangeStatus={changeTableStatus}
          />
        </TabsContent>
        
        <TabsContent value="detailed" className="flex-1 overflow-hidden">
          <div className="flex items-center mb-4 overflow-x-auto pb-2">
            <AreaSelector 
              areas={areas} 
              activeAreaId={activeAreaId} 
              onAreaChange={handleAreaChange} 
            />
          </div>
          
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <Tabs 
                defaultValue="canvas" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="h-full flex flex-col"
              >
                <TabsList className="mb-4 w-full justify-start">
                  <TabsTrigger value="canvas">Visualização em Mapa</TabsTrigger>
                  <TabsTrigger value="list">Visualização em Lista</TabsTrigger>
                </TabsList>
                
                <TabsContent value="canvas" className="flex-1 overflow-hidden">
                  <TableCanvas 
                    tables={activeAreaTables}
                    selectedTable={selectedTable}
                    onSelectTable={handleTableSelect}
                    onUpdateTablePosition={updateTablePosition}
                    isEditMode={isEditMode}
                  />
                </TabsContent>
                
                <TabsContent value="list" className="flex-1 overflow-auto">
                  <TableList 
                    tables={activeAreaTables}
                    selectedTable={selectedTable}
                    onSelectTable={handleTableSelect}
                    onChangeStatus={changeTableStatus}
                  />
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Desktop sidebar */}
            <div className="hidden md:block">
              <TableSidebar 
                selectedTable={selectedTable}
                selectedArea={selectedArea}
                onUpdateTable={updateTable}
                onDeleteTable={deleteTable}
                onChangeStatus={changeTableStatus}
                onUpdateArea={updateArea}
                onDeleteArea={deleteArea}
                onSelectArea={handleAreaSelect}
                isEditMode={isEditMode}
                areas={areas}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}