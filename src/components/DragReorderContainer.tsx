import { useState, ReactNode, forwardRef, useImperativeHandle, useEffect } from 'react';
import './DragReorderContainer.css';

export interface DragReorderItem {
  id: string;
  content: ReactNode;
}

interface DragReorderContainerProps<T> {
  items: T[];
  setItems: (items: T[]) => void;
  getItemId: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  className?: string;
}

export interface DragReorderContainerRef {
  clearItems: () => void;
}

export function DragReorderContainer<T>({ items, setItems, getItemId, renderItem, className = '' }: DragReorderContainerProps<T>) {
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

  // Shared logic to determine drop destination based on cursor position
  const getDropDestination = (e: React.DragEvent): number => {
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Find all draggable items in the container
    const draggableItems = container.querySelectorAll('.drag-item:not(.dragging)');
    
    for (let i = 0; i < draggableItems.length; i++) {
      const itemRect = draggableItems[i].getBoundingClientRect();
      const itemY = itemRect.top - rect.top;
      const itemMiddle = itemY + itemRect.height / 2;
      
      if (y < itemMiddle) {
        return i;
      }
    }
    
    // If we get here, cursor is below all items - insert at end
    return items.length;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const insertIndex = getDropDestination(e);
    setDragOverIndex(insertIndex);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const dragData = e.dataTransfer.getData('application/json');
      const { id } = JSON.parse(dragData);
      
      const draggedItem = items.find(item => getItemId(item) === id);
      if (!draggedItem) return;
      
      const currentIndex = items.findIndex(item => getItemId(item) === id);
      const newIndex = getDropDestination(e);
      
      if (currentIndex === newIndex || (newIndex > currentIndex && newIndex === currentIndex + 1)) {
        return; // No change needed
      }
      
      const newItems = [...items];
      // Remove item from current position
      newItems.splice(currentIndex, 1);
      // Insert at new position (adjust if removing from before insertion point)
      const adjustedIndex = currentIndex < newIndex ? newIndex - 1 : newIndex;
      newItems.splice(adjustedIndex, 0, draggedItem);
      
      setItems(newItems);
    } catch (error) {
      console.error('Error handling drop:', error);
    } finally {
      setDraggedItemId(null);
      setDragOverIndex(null);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div 
        className={`drag-reorder-container ${className}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {items.map((item, index) => {
          const isDragging = draggedItemId === getItemId(item);
          
          return (
            <div key={getItemId(item)}>
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
                onDragStart={(e) => handleDragStart(e, getItemId(item))}
                onDragEnd={handleDragEnd}
              >
                {renderItem(item)}
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
      
      {/* Debug text box */}
      <div className="debug-box">
        <h4>Drag State</h4>
        <div className="debug-content">
          <div>Dragging: {draggedItemId || 'None'}</div>
          <div>Drop Index: {dragOverIndex ?? 'None'}</div>
          <div>Total Items: {items.length}</div>
        </div>
      </div>
    </div>
  );
};