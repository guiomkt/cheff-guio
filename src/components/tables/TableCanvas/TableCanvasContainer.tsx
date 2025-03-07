import { useState, useRef, useEffect } from 'react';
import { TableWithArea } from '@/hooks/useTables';
import { TableCanvasControls } from './TableCanvasControls';
import { TableCanvasGrid } from './TableCanvasGrid';
import { TableCanvasItem } from './TableCanvasItem';

interface TableCanvasContainerProps {
  tables: TableWithArea[];
  selectedTable: TableWithArea | null;
  onSelectTable: (table: TableWithArea | null) => void;
  onUpdateTablePosition: (tableId: string, x: number, y: number) => Promise<any>;
  isEditMode: boolean;
}

export function TableCanvasContainer({
  tables,
  selectedTable,
  onSelectTable,
  onUpdateTablePosition,
  isEditMode
}: TableCanvasContainerProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [isHoldingMesa, setIsHoldingMesa] = useState(false);
  
  // Initialize canvas size
  useEffect(() => {
    if (canvasRef.current) {
      const { width, height } = canvasRef.current.getBoundingClientRect();
      setCanvasSize({ width, height });
    }
    
    const handleResize = () => {
      if (canvasRef.current) {
        const { width, height } = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width, height });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle mouse down on a table
  const handleMouseDown = (e: React.MouseEvent, table: TableWithArea) => {
    if (!isEditMode) {
      e.preventDefault();
      e.stopPropagation();
      setIsHoldingMesa(true);
      onSelectTable(table);
      return;
    }
    
    e.stopPropagation();
    e.preventDefault();
    
    // Obter a posição exata do clique em relação à mesa
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    
    // Armazenar o deslocamento (offset) do clique em relação ao canto superior esquerdo da mesa
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    setDraggingTable(table.id);
    onSelectTable(table);
  };
  
  // Handle touch start on a table
  const handleTouchStart = (e: React.TouchEvent, table: TableWithArea) => {
    if (!isEditMode) {
      e.stopPropagation();
      setIsHoldingMesa(true);
      onSelectTable(table);
      return;
    }
    
    e.stopPropagation();
    e.preventDefault();
    
    // Obter a posição exata do toque em relação à mesa
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const touch = e.touches[0];
    
    // Armazenar o deslocamento (offset) do toque em relação ao canto superior esquerdo da mesa
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
    
    setDraggingTable(table.id);
    onSelectTable(table);
  };
  
  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && containerRef.current) {
      // Handle panning
      e.preventDefault();
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      
      setCanvasPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setPanStart({
        x: e.clientX,
        y: e.clientY
      });
      
      return;
    }
    
    if (!draggingTable || !canvasRef.current) return;
    
    e.preventDefault();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Calcular a nova posição mantendo o ponto onde o usuário clicou fixo sob o cursor
    const x = (e.clientX - canvasRect.left - dragOffset.x) / scale;
    const y = (e.clientY - canvasRect.top - dragOffset.y) / scale;
    
    // Atualizar a posição da mesa no DOM para movimento suave
    const tableElement = document.getElementById(`table-${draggingTable}`);
    if (tableElement) {
      tableElement.style.transform = `translate(${x}px, ${y}px)`;
    }
  };
  
  // Handle touch move for dragging
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning && containerRef.current) {
      // Handle panning via touch
      const touch = e.touches[0];
      const dx = touch.clientX - panStart.x;
      const dy = touch.clientY - panStart.y;
      
      setCanvasPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setPanStart({
        x: touch.clientX,
        y: touch.clientY
      });
      
      return;
    }
    
    if (!draggingTable || !canvasRef.current) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Calcular a nova posição mantendo o ponto onde o usuário tocou fixo sob o dedo
    const x = (touch.clientX - canvasRect.left - dragOffset.x) / scale;
    const y = (touch.clientY - canvasRect.top - dragOffset.y) / scale;
    
    // Atualizar a posição da mesa no DOM para movimento suave
    const tableElement = document.getElementById(`table-${draggingTable}`);
    if (tableElement) {
      tableElement.style.transform = `translate(${x}px, ${y}px)`;
    }
  };
  
  // Handle mouse up to end dragging
  const handleMouseUp = async (e: React.MouseEvent) => {
    if (isHoldingMesa) {
      setIsHoldingMesa(false);
      return;
    }
    
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (!draggingTable || !canvasRef.current) {
      setDraggingTable(null);
      return;
    }
    
    e.preventDefault(); // Prevenir comportamento padrão que pode causar redimensionamento
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - canvasRect.left - dragOffset.x) / scale);
    const y = Math.round((e.clientY - canvasRect.top - dragOffset.y) / scale);
    
    // Ensure the table stays within the canvas - usado valor mínimo de 10 em vez de 0 para evitar colisão com as bordas
    const boundedX = Math.max(10, Math.min(x, canvasSize.width - 100));
    const boundedY = Math.max(10, Math.min(y, canvasSize.height - 100));
    
    try {
      // Update the table position in the database
      await onUpdateTablePosition(draggingTable, boundedX, boundedY);
      
      // Restaurar a visualização se necessário
      if (canvasRef.current) {
        const newRect = canvasRef.current.getBoundingClientRect();
        if (newRect.width !== canvasSize.width || newRect.height !== canvasSize.height) {
          setCanvasSize({
            width: newRect.width,
            height: newRect.height
          });
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar posição da mesa:', error);
      // Em caso de erro, restaure a posição original
      const tableElement = document.getElementById(`table-${draggingTable}`);
      if (tableElement) {
        const originalTable = tables.find(t => t.id === draggingTable);
        if (originalTable) {
          tableElement.style.transform = `translate(${originalTable.position_x}px, ${originalTable.position_y}px)`;
        }
      }
    }
    
    setDraggingTable(null);
  };
  
  // Handle touch end to end dragging
  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (isHoldingMesa) {
      setIsHoldingMesa(false);
      return;
    }
    
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (!draggingTable || !canvasRef.current) {
      setDraggingTable(null);
      return;
    }
    
    e.preventDefault(); // Prevenir comportamento padrão
    
    const touch = e.changedTouches[0];
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = Math.round((touch.clientX - canvasRect.left - dragOffset.x) / scale);
    const y = Math.round((touch.clientY - canvasRect.top - dragOffset.y) / scale);
    
    // Ensure the table stays within the canvas
    const boundedX = Math.max(10, Math.min(x, canvasSize.width - 100));
    const boundedY = Math.max(10, Math.min(y, canvasSize.height - 100));
    
    try {
      // Update the table position in the database
      await onUpdateTablePosition(draggingTable, boundedX, boundedY);
      
      // Restaurar a visualização se necessário
      if (canvasRef.current) {
        const newRect = canvasRef.current.getBoundingClientRect();
        if (newRect.width !== canvasSize.width || newRect.height !== canvasSize.height) {
          setCanvasSize({
            width: newRect.width,
            height: newRect.height
          });
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar posição da mesa:', error);
      // Em caso de erro, restaure a posição original
      const tableElement = document.getElementById(`table-${draggingTable}`);
      if (tableElement) {
        const originalTable = tables.find(t => t.id === draggingTable);
        if (originalTable) {
          tableElement.style.transform = `translate(${originalTable.position_x}px, ${originalTable.position_y}px)`;
        }
      }
    }
    
    setDraggingTable(null);
  };
  
  // Handle canvas click to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Não deselecionar se estiver em modo de panning
    if (isPanning) return;
    
    // Somente deselecionar quando clicar diretamente no canvas (não em uma mesa)
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('grid-cell')) {
      onSelectTable(null);
    }
  };
  
  // Handle canvas pan start - agora funciona mesmo sem estar em modo de edição
  const handleCanvasPanStart = (e: React.MouseEvent) => {
    // Apenas inicia panning se clicar diretamente no canvas ou em uma célula de grid
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('grid-cell')) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX,
        y: e.clientY
      });
    }
  };
  
  // Handle touch pan start
  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    // Apenas inicia panning se tocar diretamente no canvas ou em uma célula de grid
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('grid-cell')) {
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({
        x: touch.clientX,
        y: touch.clientY
      });
    }
  };
  
  // Handle zoom in/out
  const handleZoom = (zoomIn: boolean) => {
    setScale(prev => {
      const increment = prev < 1 ? 0.05 : 0.1;
      const newScale = zoomIn ? prev + increment : prev - increment;
      return Math.max(0.2, Math.min(3, newScale)); // Permite mais zoom out e zoom in
    });
  };
  
  // Centralizar a visualização
  const handleResetView = () => {
    setScale(1);
    setCanvasPosition({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={containerRef}
      className="relative h-full border rounded-md bg-muted/20 overflow-hidden"
    >
      {/* Zoom and pan controls */}
      <TableCanvasControls 
        onZoomIn={() => handleZoom(true)}
        onZoomOut={() => handleZoom(false)}
        onResetView={handleResetView}
      />
      
      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing"
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasPanStart}
        onTouchStart={handleCanvasTouchStart}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ minHeight: '400px' }} // Garantir altura mínima para evitar redução
      >
        <div 
          className="absolute top-0 left-0 w-[2000px] h-[1500px] transform-origin-top-left"
          style={{ 
            transform: `scale(${scale}) translate(${canvasPosition.x}px, ${canvasPosition.y}px)`,
            touchAction: 'none',
            willChange: 'transform', // Otimização de performance
            transition: isPanning || draggingTable ? 'none' : 'transform 0.15s ease-out'
          }}
        >
          {/* Grid lines for reference */}
          <TableCanvasGrid />
          
          {/* Tables */}
          {tables.map(table => (
            <TableCanvasItem
              key={table.id}
              table={table}
              isSelected={selectedTable?.id === table.id}
              isDragging={draggingTable === table.id}
              isEditMode={isEditMode}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            />
          ))}
        </div>
      </div>
      
      {/* Empty state */}
      {tables.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-6">
            <p className="text-muted-foreground mb-2">
              Nenhuma mesa nesta área.
            </p>
            {isEditMode && (
              <p className="text-sm text-muted-foreground">
                Clique em "Nova Mesa" para adicionar uma mesa.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}