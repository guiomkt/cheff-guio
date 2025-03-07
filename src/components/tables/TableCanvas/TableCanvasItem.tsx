import { cn } from '@/lib/utils';
import { TableWithArea } from '@/hooks/useTables';

interface TableCanvasItemProps {
  table: TableWithArea;
  isSelected: boolean;
  isDragging: boolean;
  isEditMode: boolean;
  onMouseDown: (e: React.MouseEvent, table: TableWithArea) => void;
  onTouchStart: (e: React.TouchEvent, table: TableWithArea) => void;
}

export function TableCanvasItem({
  table,
  isSelected,
  isDragging,
  isEditMode,
  onMouseDown,
  onTouchStart
}: TableCanvasItemProps) {
  // Get table status color
  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-red-500';
      case 'reserved': return 'bg-blue-500';
      case 'blocked': return 'bg-gray-500';
      default: return 'bg-green-500';
    }
  };
  
  // Get table shape class
  const getTableShapeClass = (shape: string) => {
    switch (shape) {
      case 'round': return 'rounded-full';
      case 'square': return 'rounded-md';
      case 'rectangle': return 'rounded-md';
      default: return 'rounded-md';
    }
  };

  return (
    <div
      id={`table-${table.id}`}
      className={cn(
        "absolute flex flex-col items-center justify-center",
        getTableShapeClass(table.shape),
        getTableStatusColor(table.status),
        isSelected ? "ring-4 ring-primary" : "",
        isDragging ? "opacity-85 scale-105" : "",
        isEditMode ? "cursor-move" : "cursor-pointer"
      )}
      style={{
        width: table.width,
        height: table.shape === 'rectangle' ? table.height : table.width,
        transform: `translate(${table.position_x}px, ${table.position_y}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s, box-shadow 0.2s, opacity 0.2s, scale 0.2s',
        zIndex: isSelected || isDragging ? 10 : 1,
        willChange: isDragging ? 'transform' : 'auto',
        boxShadow: isDragging ? '0 16px 32px rgba(0,0,0,0.3)' : (isSelected ? '0 8px 16px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)')
      }}
      onMouseDown={(e) => onMouseDown(e, table)}
      onTouchStart={(e) => onTouchStart(e, table)}
    >
      <span className="font-bold text-white drop-shadow-sm">{table.number}</span>
      <span className="text-xs text-white drop-shadow-sm">{table.capacity} lugares</span>
      {isDragging && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-white opacity-10 animate-pulse rounded-full"></div>
      )}
    </div>
  );
}