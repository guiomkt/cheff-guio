import { RestaurantArea } from '@/db/schema';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AreaSelectorProps {
  areas: RestaurantArea[];
  activeAreaId: string | null;
  onAreaChange: (areaId: string) => void;
}

export function AreaSelector({
  areas,
  activeAreaId,
  onAreaChange
}: AreaSelectorProps) {
  // Filter only active areas
  const activeAreas = areas.filter(area => area.is_active);
  
  return (
    <ScrollArea className="w-full" orientation="horizontal">
      <div className="flex items-center space-x-2 pb-2">
        {activeAreas.map(area => (
          <button
            key={area.id}
            className={cn(
              "px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors",
              activeAreaId === area.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
            onClick={() => onAreaChange(area.id)}
          >
            {area.name}
          </button>
        ))}
        
        {activeAreas.length === 0 && (
          <div className="text-muted-foreground text-sm px-2">
            Nenhuma área disponível. Adicione uma área para começar.
          </div>
        )}
      </div>
    </ScrollArea>
  );
}