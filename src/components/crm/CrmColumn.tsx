import { useState } from 'react';
import { CrmStage, CrmCardWithDetails } from '@/db/schema';
import { CrmCard } from './CrmCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CrmColumnProps {
  stage: CrmStage;
  cards: CrmCardWithDetails[];
  onCardSelect: (card: CrmCardWithDetails) => void;
  onMoveCard: (cardId: string, newStageId: string) => Promise<any>;
  isDraggingOver?: boolean;
  onDragStart?: (card: CrmCardWithDetails) => void;
  onDragOver?: (e: React.DragEvent, stageId: string) => void;
  onDragEnd?: () => void;
  onDrop?: (e: React.DragEvent, stageId: string) => void;
}

export function CrmColumn({
  stage,
  cards,
  onCardSelect,
  onMoveCard,
  isDraggingOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop
}: CrmColumnProps) {
  // Get stage header color based on stage color
  const getStageHeaderColor = () => {
    if (!stage.color) return {};
    
    // Convert hex to rgba with low opacity for background
    const hexToRgba = (hex: string, alpha = 0.2) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    try {
      return { backgroundColor: hexToRgba(stage.color) };
    } catch (e) {
      return {};
    }
  };
  
  return (
    <div 
      className="flex flex-col w-80 h-full"
      onDragOver={(e) => onDragOver?.(e, stage.id)}
      onDrop={(e) => onDrop?.(e, stage.id)}
    >
      <div 
        className={cn(
          "p-3 border-b rounded-t-md flex items-center justify-between",
          isDraggingOver ? "bg-accent/50" : ""
        )}
        style={getStageHeaderColor()}
      >
        <div className="flex items-center">
          <h3 className="font-medium">{stage.name}</h3>
          <Badge variant="outline" className="ml-2">
            {cards.length}
          </Badge>
        </div>
      </div>
      
      <div 
        className={cn(
          "flex-1 border rounded-b-md overflow-hidden bg-muted/20",
          isDraggingOver ? "bg-accent/20 border-dashed" : ""
        )}
      >
        <ScrollArea className="h-full p-2">
          <div className="space-y-2">
            {cards.length > 0 ? (
              cards.map(card => (
                <div 
                  key={card.id} 
                  className="relative"
                  draggable
                  onDragStart={() => onDragStart?.(card)}
                  onDragEnd={onDragEnd}
                >
                  <CrmCard
                    card={card}
                    onSelect={onCardSelect}
                  />
                </div>
              ))
            ) : (
              <div className="h-20 border border-dashed rounded-md flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum card nesta etapa
                </p>
              </div>
            )}
            
            {/* Drop indicator when dragging */}
            {isDraggingOver && cards.length === 0 && (
              <div className="h-20 border-2 border-dashed border-primary/50 rounded-md flex items-center justify-center bg-primary/5">
                <p className="text-sm text-primary/70">
                  Solte aqui para mover
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}