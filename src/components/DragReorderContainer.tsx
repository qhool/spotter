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

export function DragReorderContainer<T>({ items, setItems, getItemId, renderItem, className = '' }: DragReorderContainerProps<T>) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropOccurred, setDropOccurred] = useState<boolean>(false);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: itemId }));
    setDraggedItemId(itemId);
    setDropOccurred(false); // Reset flag at start of drag
  };

  const handleDragEnd = () => {
    // If no drop occurred inside the container, delete the item
    if (draggedItemId && !dropOccurred) {
      const currentIndex = items.findIndex(item => getItemId(item) === draggedItemId);
      if (currentIndex !== -1) {
        const newItems = [...items];
        newItems.splice(currentIndex, 1);
        setItems(newItems);
      }
    }
    
    setDraggedItemId(null);
    setDragOverIndex(null);
    setDropOccurred(false);
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (!draggedItemId) return;
    
    // Get the relative Y position within the item
    const rect = e.currentTarget.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const relativeY = e.clientY - centerY;
    
    // If cursor is above center, insert before (at index)
    // If cursor is below center, insert after (at index + 1)
    const insertIndex = relativeY < 0 ? index : index + 1;
    setDragOverIndex(insertIndex);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropOccurred(true); // Mark that a drop occurred inside the container
    
    try {
      const dragData = e.dataTransfer.getData('application/json');
      const { id } = JSON.parse(dragData);
      
      const draggedItem = items.find(item => getItemId(item) === id);
      if (!draggedItem) return;
      
      const currentIndex = items.findIndex(item => getItemId(item) === id);
      const newIndex = dragOverIndex ?? items.length;
      
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
    }
    // Note: Don't reset state here - let dragEnd handle it
  };

  return (
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
              onDragOver={(e) => handleItemDragOver(e, index)}
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
  );
};