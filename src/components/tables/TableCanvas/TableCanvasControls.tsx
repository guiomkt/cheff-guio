import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

interface TableCanvasControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPanStart?: (e: React.MouseEvent) => void;
  onResetView: () => void;
  isPanning?: boolean;
  isEditMode?: boolean;
}

export function TableCanvasControls({
  onZoomIn,
  onZoomOut,
  onPanStart,
  onResetView,
  isPanning,
  isEditMode
}: TableCanvasControlsProps) {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
      <Button 
        size="icon"
        variant="default"
        className="h-8 w-8 bg-primary hover:bg-primary/90 shadow-md"
        onClick={onZoomIn}
        title="Aumentar zoom"
      >
        <ZoomIn className="h-4 w-4 text-white" />
      </Button>
      <Button 
        size="icon"
        variant="default"
        className="h-8 w-8 bg-primary hover:bg-primary/90 shadow-md"
        onClick={onZoomOut}
        title="Diminuir zoom"
      >
        <ZoomOut className="h-4 w-4 text-white" />
      </Button>
      <Button 
        size="icon"
        variant="default"
        className="h-8 w-8 bg-primary hover:bg-primary/90 shadow-md" 
        onClick={onResetView}
        title="Centralizar visualização"
      >
        <Move className="h-4 w-4 text-white" />
      </Button>
      {isEditMode && onPanStart && (
        <Button 
          size="icon"
          variant="default"
          className={`h-8 w-8 ${isPanning ? 'bg-green-600 text-white' : 'bg-primary hover:bg-primary/90'} shadow-md`}
          onMouseDown={onPanStart}
          title="Modo de movimentação"
        >
          <Move className="h-4 w-4 text-white" />
        </Button>
      )}
    </div>
  );
}