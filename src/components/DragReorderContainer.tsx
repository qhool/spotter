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
  getDragItem?: (dragData: any) => T | null;
  emptyMessage?: string;
  className?: string;
  disableDragToDelete?: boolean;
}

export function DragReorderContainer<T>({ items, setItems, getItemId, renderItem, getDragItem, emptyMessage, className = '', disableDragToDelete = false }: DragReorderContainerProps<T>) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropOccurred, setDropOccurred] = useState<boolean>(false);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: itemId }));
    setDraggedItemId(itemId);
    setDropOccurred(false); // Reset flag at start of drag
  };

  const handleDragEnd = () => {
    // If no drop occurred inside the container, delete the item (unless disabled)
    if (draggedItemId && !dropOccurred && !disableDragToDelete) {
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
    setIsDragActive(false);
  };

  const handleContainerDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleContainerDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if we're actually leaving the container (not entering a child)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragActive(false);
      setDragOverIndex(null);
    }
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
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
      const dragDataText = e.dataTransfer.getData('application/json');
      
      // If no internal drag is happening, check for external drag-in
      if (!draggedItemId && getDragItem) {
        let dragData;
        try {
          dragData = JSON.parse(dragDataText);
        } catch {
          // If JSON parsing fails, use the raw text or other data types
          dragData = dragDataText || e.dataTransfer.getData('text/plain');
        }
        
        if (dragData) {
          const newItem = getDragItem(dragData);
          if (newItem) {
            const insertIndex = dragOverIndex ?? items.length;
            const newItems = [...items];
            newItems.splice(insertIndex, 0, newItem);
            setItems(newItems);
            
            // Clear drag state immediately for external drops
            setIsDragActive(false);
            setDragOverIndex(null);
            return;
          }
        }
      }
      
      // Handle internal reordering
      if (!dragDataText) return;
      
      const { id } = JSON.parse(dragDataText);
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
    // Note: For internal drags, let dragEnd handle the cleanup
  };

  return (
    <div 
      className={`drag-reorder-container ${className}`}
      onDragOver={handleDragOver}
      onDragEnter={handleContainerDragEnter}
      onDragLeave={handleContainerDragLeave}
      onDrop={handleDrop}
    >
      {items.length === 0 && emptyMessage ? (
        <div className="no-results">
          {emptyMessage}
        </div>
      ) : (
        <>
          {items.map((item, index) => {
            const isDragging = draggedItemId === getItemId(item);
            
            return (
              <div key={getItemId(item)}>
                {/* Insert drop indicator */}
                {dragOverIndex === index && isDragActive && (
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
          {dragOverIndex === items.length && isDragActive && (
            <div className="drop-indicator">
              <div className="drop-line" />
            </div>
          )}
        </>
      )}
    </div>
  );
};