import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useWaitingList } from '@/hooks/useWaitingList';
import { WaitingListTable } from '@/components/waiting-list/WaitingListTable';
import { WaitingListForm } from '@/components/waiting-list/WaitingListForm';
import { WaitingListStats } from '@/components/waiting-list/WaitingListStats';
import { WaitingListQrCode } from '@/components/waiting-list/WaitingListQrCode';
import { WaitingListHistory } from '@/components/waiting-list/WaitingListHistory';
import { WaitingListConfig } from '@/components/waiting-list/WaitingListConfig';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  QrCode, 
  History, 
  RefreshCw, 
  Settings,
  Download
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTables } from '@/hooks/useTables';

export function WaitingList() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isQrCodeOpen, setIsQrCodeOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const { toast } = useToast();
  
  const {
    waitingEntries,
    isLoading,
    addEntry,
    updateEntry,
    removeEntry,
    notifyCustomer,
    markAsSeated,
    markAsNoShow,
    moveEntryUp,
    moveEntryDown,
    refreshEntries,
    createDummyData,
    stats
  } = useWaitingList(restaurantId);
  
  const { tables, areas, isLoading: tablesLoading } = useTables(restaurantId);
  
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

  // Handle adding a new entry
  const handleAddEntry = async (entryData) => {
    try {
      await addEntry(entryData);
      setIsFormOpen(false);
      toast({
        title: 'Cliente adicionado',
        description: 'Cliente adicionado à fila de espera com sucesso.',
      });
    } catch (error) {
      console.error('Error adding entry:', error);
      toast({
        title: 'Erro ao adicionar cliente',
        description: 'Não foi possível adicionar o cliente à fila de espera.',
        variant: 'destructive',
      });
    }
  };

  // Handle refreshing the list
  const handleRefresh = async () => {
    await refreshEntries();
    toast({
      title: 'Lista atualizada',
      description: 'A fila de espera foi atualizada.',
    });
  };

  // Handle creating dummy data
  const handleCreateDummyData = async () => {
    await createDummyData();
    toast({
      title: 'Dados de exemplo criados',
      description: 'Foram criados dados de exemplo para a fila de espera.',
    });
  };

  // Handle downloading QR code
  const handleDownloadQrCode = () => {
    const canvas = document.getElementById('waiting-list-qrcode') as HTMLCanvasElement;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'chefguio-fila-espera-qrcode.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    toast({
      title: 'QR Code baixado',
      description: 'O QR Code foi baixado com sucesso.',
    });
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
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold">Fila de Espera</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsFormOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar Cliente</span>
            <span className="sm:hidden">Adicionar</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsQrCodeOpen(true)}
            className="gap-2"
          >
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">QR Code</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHistoryOpen(true)}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {waitingEntries.length === 0 && (
                <DropdownMenuItem onClick={handleCreateDummyData}>
                  Criar dados de exemplo
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setIsConfigOpen(true)}>
                Configurações da fila
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <WaitingListStats stats={stats} />
      </div>
      
      <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <div className="border-b px-4 py-2">
            <TabsList>
              <TabsTrigger value="active" className="relative">
                Ativos
                {stats.activeCount > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground rounded-full text-xs px-2 py-0.5">
                    {stats.activeCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="notified">
                Notificados
                {stats.notifiedCount > 0 && (
                  <span className="ml-2 bg-yellow-500 text-white rounded-full text-xs px-2 py-0.5">
                    {stats.notifiedCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="seated">
                Acomodados
                {stats.seatedTodayCount > 0 && (
                  <span className="ml-2 bg-green-500 text-white rounded-full text-xs px-2 py-0.5">
                    {stats.seatedTodayCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="noshow">
                No-Shows
                {stats.noShowTodayCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white rounded-full text-xs px-2 py-0.5">
                    {stats.noShowTodayCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-auto">
            <TabsContent value="active" className="p-0 h-full">
              <WaitingListTable 
                entries={waitingEntries.filter(entry => entry.status === 'waiting')}
                onNotify={notifyCustomer}
                onSeat={markAsSeated}
                onNoShow={markAsNoShow}
                onMoveUp={moveEntryUp}
                onMoveDown={moveEntryDown}
                onEdit={(entry) => {
                  // Implement edit functionality
                  toast({
                    title: 'Editar cliente',
                    description: 'Funcionalidade de edição será implementada em breve.',
                  });
                }}
                onRemove={removeEntry}
                tables={tables}
                areas={areas}
                tablesLoading={tablesLoading}
              />
            </TabsContent>
            
            <TabsContent value="notified" className="p-0 h-full">
              <WaitingListTable 
                entries={waitingEntries.filter(entry => entry.status === 'notified')}
                onNotify={notifyCustomer}
                onSeat={markAsSeated}
                onNoShow={markAsNoShow}
                onEdit={(entry) => {
                  // Implement edit functionality
                  toast({
                    title: 'Editar cliente',
                    description: 'Funcionalidade de edição será implementada em breve.',
                  });
                }}
                onRemove={removeEntry}
                tables={tables}
                areas={areas}
                tablesLoading={tablesLoading}
              />
            </TabsContent>
            
            <TabsContent value="seated" className="p-0 h-full">
              <WaitingListTable 
                entries={waitingEntries.filter(entry => entry.status === 'seated' && new Date(entry.updated_at).toDateString() === new Date().toDateString())}
                onNotify={notifyCustomer}
                onSeat={markAsSeated}
                onNoShow={markAsNoShow}
                onEdit={(entry) => {
                  // Implement edit functionality
                  toast({
                    title: 'Editar cliente',
                    description: 'Funcionalidade de edição será implementada em breve.',
                  });
                }}
                onRemove={removeEntry}
                tables={tables}
                areas={areas}
                tablesLoading={tablesLoading}
                isHistoryView={true}
              />
            </TabsContent>
            
            <TabsContent value="noshow" className="p-0 h-full">
              <WaitingListTable 
                entries={waitingEntries.filter(entry => entry.status === 'no_show' && new Date(entry.updated_at).toDateString() === new Date().toDateString())}
                onNotify={notifyCustomer}
                onSeat={markAsSeated}
                onNoShow={markAsNoShow}
                onEdit={(entry) => {
                  // Implement edit functionality
                  toast({
                    title: 'Editar cliente',
                    description: 'Funcionalidade de edição será implementada em breve.',
                  });
                }}
                onRemove={removeEntry}
                tables={tables}
                areas={areas}
                tablesLoading={tablesLoading}
                isHistoryView={true}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
      
      {/* Add Entry Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Cliente à Fila</DialogTitle>
          </DialogHeader>
          <WaitingListForm 
            onSubmit={handleAddEntry}
            onCancel={() => setIsFormOpen(false)}
            areas={areas}
          />
        </DialogContent>
      </Dialog>
      
      {/* QR Code Dialog */}
      <Dialog open={isQrCodeOpen} onOpenChange={setIsQrCodeOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>QR Code para Fila de Espera</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <WaitingListQrCode restaurantId={restaurantId} />
            <div className="flex justify-center mt-4">
              <Button onClick={handleDownloadQrCode}>
                <Download className="h-4 w-4 mr-2" />
                Baixar QR Code
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Coloque este QR Code na entrada do restaurante para que os clientes possam entrar na fila de espera.
            </p>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Histórico da Fila de Espera</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <WaitingListHistory 
              entries={waitingEntries.filter(entry => 
                entry.status === 'seated' || entry.status === 'no_show'
              )}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Config Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Configurações da Fila de Espera</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <WaitingListConfig 
              restaurantId={restaurantId}
              onClose={() => setIsConfigOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}