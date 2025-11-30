import { useState, ReactNode } from 'react';
import './DragReorderContainer.css';

interface DragReorderItem {
  id: string;
  content: ReactNode;
}

interface DragReorderContainerProps {
  items: DragReorderItem[];
  onReorder?: (newOrder: DragReorderItem[]) => void;
  className?: string;
}

export function DragReorderContainer({ items: initialItems, onReorder, className = '' }: DragReorderContainerProps) {
  const [items, setItems] = useState<DragReorderItem[]>(initialItems);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: itemId }));
    setDraggedItemId(itemId);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Find all draggable items in the container
    const draggableItems = container.querySelectorAll('.drag-item:not(.dragging)');
    let insertIndex = items.length;
    
    for (let i = 0; i < draggableItems.length; i++) {
      const itemRect = draggableItems[i].getBoundingClientRect();
      const itemY = itemRect.top - rect.top;
      const itemMiddle = itemY + itemRect.height / 2;
      
      if (y < itemMiddle) {
        insertIndex = i;
        break;
      }
    }
    
    setDragOverIndex(insertIndex);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const dragData = e.dataTransfer.getData('application/json');
      const { id } = JSON.parse(dragData);
      
      const draggedItem = items.find(item => item.id === id);
      if (!draggedItem) return;
      
      const currentIndex = items.findIndex(item => item.id === id);
      const newIndex = dragOverIndex ?? items.length;
      
      if (currentIndex === newIndex) return;
      
      const newItems = [...items];
      // Remove item from current position
      newItems.splice(currentIndex, 1);
      // Insert at new position (adjust if removing from before insertion point)
      const adjustedIndex = currentIndex < newIndex ? newIndex - 1 : newIndex;
      newItems.splice(adjustedIndex, 0, draggedItem);
      
      setItems(newItems);
      onReorder?.(newItems);
    } catch (error) {
      console.error('Error handling drop:', error);
    } finally {
      setDraggedItemId(null);
      setDragOverIndex(null);
    }
  };

  return (
    <div 
      className={`drag-reorder-container ${className}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {items.map((item, index) => {
        const isDragging = draggedItemId === item.id;
        
        return (
          <div key={item.id}>
            {/* Insert drop indicator */}
            {dragOverIndex === index && draggedItemId && (
              <div className="drop-indicator">
                <div className="drop-line" />
              </div>
            )}
            
            {/* Draggable item */}
            <div
              className={`drag-item ${isDragging ? 'dragging' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragEnd={handleDragEnd}
            >
              {item.content}
            </div>
          </div>
        );
      })}
      
      {/* Drop indicator at end */}
      {dragOverIndex === items.length && draggedItemId && (
        <div className="drop-indicator">
          <div className="drop-line" />
        </div>
      )}
    </div>
  );
}