import { useState, useRef, useEffect } from 'react';
import { CrmStage, CrmCardWithDetails, CrmCardTag } from '@/db/schema';
import { CrmColumn } from './CrmColumn';
import { CrmCardDetails } from './CrmCardDetails';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  RefreshCw, 
  Filter, 
  X,
  Calendar,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Utensils,
  Users,
  Search
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Define stage categories
type StageCategory = 'all' | 'restaurant' | 'events' | 'support';

// Define category structure
interface Category {
  id: StageCategory;
  name: string;
  icon: React.ReactNode;
  stages: string[]; // Stage IDs that belong to this category
}

interface CrmBoardProps {
  stages: CrmStage[];
  cards: CrmCardWithDetails[];
  selectedCard: CrmCardWithDetails | null;
  onSelectCard: (card: CrmCardWithDetails | null) => void;
  onMoveCard: (cardId: string, newStageId: string) => Promise<any>;
  onAddCard: () => void;
  onApplyFilter: (filter: { 
    search?: string; 
    priority?: string; 
    status?: string; 
    tag?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => void;
  filter: { 
    search?: string; 
    priority?: string; 
    status?: string; 
    tag?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  tags: CrmCardTag[];
}

export function CrmBoard({
  stages,
  cards,
  selectedCard,
  onSelectCard,
  onMoveCard,
  onAddCard,
  onApplyFilter,
  filter,
  tags
}: CrmBoardProps) {
  const [searchQuery, setSearchQuery] = useState(filter.search || '');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    filter.dateFrom && filter.dateTo 
      ? { 
          from: new Date(filter.dateFrom), 
          to: new Date(filter.dateTo) 
        } 
      : undefined
  );
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState<StageCategory>('all');
  const [draggedCard, setDraggedCard] = useState<CrmCardWithDetails | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Define categories
  const categories: Category[] = [
    {
      id: 'all',
      name: 'Todos',
      icon: <Utensils className="h-4 w-4 mr-1" />,
      stages: stages.map(s => s.id)
    },
    {
      id: 'restaurant',
      name: 'Restaurante',
      icon: <Utensils className="h-4 w-4 mr-1" />,
      stages: stages
        .filter(s => ['Primeiro Contato', 'Interesse em Reserva', 'Reserva Efetuada', 'Interesse em Aniversário', 'Aniversário Confirmado']
          .includes(s.name))
        .map(s => s.id)
    },
    {
      id: 'events',
      name: 'Eventos',
      icon: <Users className="h-4 w-4 mr-1" />,
      stages: stages
        .filter(s => ['Primeiro Contato', 'Interesse em Eventos', 'Evento Confirmado']
          .includes(s.name))
        .map(s => s.id)
    },
    {
      id: 'support',
      name: 'Suporte',
      icon: <MessageSquare className="h-4 w-4 mr-1" />,
      stages: stages
        .filter(s => ['Primeiro Contato', 'Dúvidas', 'Reclamações']
          .includes(s.name))
        .map(s => s.id)
    }
  ];

  // Filter stages based on active category
  const filteredStages = stages.filter(stage => 
    activeCategory === 'all' || categories.find(c => c.id === activeCategory)?.stages.includes(stage.id)
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilter({ ...filter, search: searchQuery });
  };

  // Handle filter by priority
  const handleFilterByPriority = (priority: string | undefined) => {
    onApplyFilter({ ...filter, priority });
  };

  // Handle filter by status
  const handleFilterByStatus = (status: string | undefined) => {
    onApplyFilter({ ...filter, status });
  };

  // Handle filter by tag
  const handleFilterByTag = (tag: string | undefined) => {
    onApplyFilter({ ...filter, tag });
  };

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    
    if (range?.from) {
      onApplyFilter({
        ...filter,
        dateFrom: range.from.toISOString(),
        dateTo: range.to ? range.to.toISOString() : range.from.toISOString()
      });
    } else {
      onApplyFilter({
        ...filter,
        dateFrom: undefined,
        dateTo: undefined
      });
    }
  };

  // Quick date filters
  const applyQuickDateFilter = (days: number) => {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - days);
    
    setDateRange({ from, to: today });
    
    onApplyFilter({
      ...filter,
      dateFrom: from.toISOString(),
      dateTo: today.toISOString()
    });
  };

  // Get cards for a specific stage
  const getCardsForStage = (stageId: string) => {
    return cards.filter(card => card.stage_id === stageId);
  };

  // Handle card selection
  const handleCardSelect = (card: CrmCardWithDetails) => {
    onSelectCard(card);
    setIsMobileDetailsOpen(true);
  };

  // Handle close details
  const handleCloseDetails = () => {
    onSelectCard(null);
    setIsMobileDetailsOpen(false);
  };

  // Handle horizontal scrolling
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (card: CrmCardWithDetails) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedCard && draggedCard.stage_id !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
    setDragOverStageId(null);
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    
    if (draggedCard && draggedCard.stage_id !== stageId) {
      try {
        // Get stage names for activity description
        const sourceStage = stages.find(s => s.id === draggedCard.stage_id);
        const targetStage = stages.find(s => s.id === stageId);
        
        // Move the card to the new stage
        await onMoveCard(draggedCard.id, stageId);
        
        // Show success toast
        if (sourceStage && targetStage) {
          toast({
            title: 'Card movido',
            description: `Card movido de "${sourceStage.name}" para "${targetStage.name}"`,
          });
        }
      } catch (error) {
        console.error('Error moving card:', error);
        toast({
          title: 'Erro ao mover card',
          description: 'Não foi possível mover o card para a nova etapa.',
          variant: 'destructive',
        });
      }
    }
    
    setDraggedCard(null);
    setDragOverStageId(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="p-4 border-b">
        <div className="flex flex-col sm:flex-row gap-2">
          <form onSubmit={handleSearchSubmit} className="flex space-x-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar cards..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <Button type="submit" variant="secondary" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtrar</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Prioridade</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        variant={filter.priority === undefined ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleFilterByPriority(undefined)}
                      >
                        Todas
                      </Badge>
                      <Badge 
                        variant={filter.priority === "high" ? "default" : "outline"}
                        className="cursor-pointer bg-red-100 text-red-800 hover:bg-red-200"
                        onClick={() => handleFilterByPriority("high")}
                      >
                        Alta
                      </Badge>
                      <Badge 
                        variant={filter.priority === "medium" ? "default" : "outline"}
                        className="cursor-pointer bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        onClick={() => handleFilterByPriority("medium")}
                      >
                        Média
                      </Badge>
                      <Badge 
                        variant={filter.priority === "low" ? "default" : "outline"}
                        className="cursor-pointer bg-green-100 text-green-800 hover:bg-green-200"
                        onClick={() => handleFilterByPriority("low")}
                      >
                        Baixa
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Status</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        variant={filter.status === undefined ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleFilterByStatus(undefined)}
                      >
                        Todos
                      </Badge>
                      <Badge 
                        variant={filter.status === "active" ? "default" : "outline"}
                        className="cursor-pointer bg-blue-100 text-blue-800 hover:bg-blue-200"
                        onClick={() => handleFilterByStatus("active")}
                      >
                        Ativo
                      </Badge>
                      <Badge 
                        variant={filter.status === "completed" ? "default" : "outline"}
                        className="cursor-pointer bg-green-100 text-green-800 hover:bg-green-200"
                        onClick={() => handleFilterByStatus("completed")}
                      >
                        Concluído
                      </Badge>
                      <Badge 
                        variant={filter.status === "archived" ? "default" : "outline"}
                        className="cursor-pointer bg-gray-100 text-gray-800 hover:bg-gray-200"
                        onClick={() => handleFilterByStatus("archived")}
                      >
                        Arquivado
                      </Badge>
                    </div>
                  </div>
                  
                  {tags.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge 
                          variant={filter.tag === undefined ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleFilterByTag(undefined)}
                        >
                          Todas
                        </Badge>
                        {tags.map(tag => (
                          <Badge 
                            key={tag.id} 
                            variant={filter.tag === tag.id ? "default" : "outline"}
                            className="cursor-pointer"
                            style={{ 
                              backgroundColor: filter.tag === tag.id ? tag.color || undefined : undefined,
                              borderColor: tag.color || undefined,
                              color: filter.tag === tag.id ? 'white' : tag.color || undefined
                            }}
                            onClick={() => handleFilterByTag(tag.id)}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Data</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyQuickDateFilter(0)}
                      >
                        Hoje
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyQuickDateFilter(7)}
                      >
                        7 dias
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyQuickDateFilter(30)}
                      >
                        30 dias
                      </Button>
                    </div>
                    <div className="pt-2">
                      <DateRangePicker
                        date={dateRange}
                        onSelect={handleDateRangeChange}
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="default" size="sm" onClick={onAddCard} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Card</span>
            </Button>
          </div>
        </div>
        
        {/* Active filters display */}
        {(filter.priority || filter.status || filter.tag || filter.dateFrom) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filter.priority && (
              <Badge variant="outline" className="flex items-center gap-1">
                Prioridade: {filter.priority === 'high' ? 'Alta' : filter.priority === 'medium' ? 'Média' : 'Baixa'}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => handleFilterByPriority(undefined)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {filter.status && (
              <Badge variant="outline" className="flex items-center gap-1">
                Status: {filter.status === 'active' ? 'Ativo' : filter.status === 'completed' ? 'Concluído' : 'Arquivado'}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => handleFilterByStatus(undefined)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {filter.tag && (
              <Badge variant="outline" className="flex items-center gap-1">
                Tag: {tags.find(t => t.id === filter.tag)?.name || filter.tag}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => handleFilterByTag(undefined)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {filter.dateFrom && (
              <Badge variant="outline" className="flex items-center gap-1">
                Data: {format(new Date(filter.dateFrom), 'dd/MM/yyyy', { locale: ptBR })}
                {filter.dateTo && filter.dateTo !== filter.dateFrom && (
                  <> - {format(new Date(filter.dateTo), 'dd/MM/yyyy', { locale: ptBR })}</>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => handleDateRangeChange(undefined)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => onApplyFilter({})}
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </div>
      
      {/* Category Tabs */}
      <div className="px-4 py-2 border-b">
        <Tabs 
          value={activeCategory} 
          onValueChange={(value) => setActiveCategory(value as StageCategory)}
          className="w-full"
        >
          <TabsList className="w-full justify-start overflow-x-auto">
            {categories.map(category => (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="flex items-center gap-1"
              >
                {category.icon}
                <span>{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      {/* Board */}
      <div className="flex-1 overflow-hidden">
        {filteredStages.length > 0 ? (
          <div className="h-full flex flex-col">
            {/* Scroll controls */}
            <div className="flex justify-between px-4 py-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleScrollLeft}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleScrollRight}
                className="flex items-center gap-1"
              >
                <span className="hidden sm:inline">Próximo</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 relative">
              <div 
                ref={scrollContainerRef}
                className="absolute inset-0 overflow-x-auto"
              >
                <div 
                  ref={boardRef}
                  className="flex gap-4 p-4 h-full"
                  style={{ minWidth: `${filteredStages.length * 320}px` }}
                >
                  {filteredStages.map((stage) => (
                    <CrmColumn
                      key={stage.id}
                      stage={stage}
                      cards={getCardsForStage(stage.id)}
                      onCardSelect={handleCardSelect}
                      onMoveCard={onMoveCard}
                      isDraggingOver={dragOverStageId === stage.id}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDrop={handleDrop}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Desktop details sidebar */}
            {selectedCard && (
              <div className="hidden md:block w-80 border-l">
                <CrmCardDetails
                  card={selectedCard}
                  onClose={handleCloseDetails}
                  onEdit={() => window.dispatchEvent(new CustomEvent('editCard'))}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8">
              <h3 className="text-lg font-medium mb-2">Nenhuma etapa encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {activeCategory !== 'all' 
                  ? 'Não há etapas nesta categoria. Selecione outra categoria ou crie novas etapas.'
                  : 'Você precisa criar etapas para começar a usar o CRM.'}
              </p>
              <Button onClick={onAddCard}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Card
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile details sheet */}
      <Sheet open={isMobileDetailsOpen && !!selectedCard} onOpenChange={setIsMobileDetailsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Detalhes do Card</SheetTitle>
          </SheetHeader>
          {selectedCard && (
            <div className="overflow-y-auto" style={{ height: 'calc(100% - 57px)' }}>
              <CrmCardDetails
                card={selectedCard}
                onClose={() => setIsMobileDetailsOpen(false)}
                isMobile={true}
                onEdit={() => window.dispatchEvent(new CustomEvent('editCard'))}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Status Dialog - Adding DialogTitle for accessibility */}
      {showStatusDialog && (
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Status</DialogTitle>
            </DialogHeader>
            {/* Dialog content would go here */}
            <DialogFooter>
              <Button onClick={() => setShowStatusDialog(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}