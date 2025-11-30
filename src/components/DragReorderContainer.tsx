import { useState, ReactNode, forwardRef, useImperativeHandle } from 'react';
import './DragReorderContainer.css';

export interface DragReorderItem {
  id: string;
  content: ReactNode;
}

interface DragReorderContainerProps {
  items: DragReorderItem[];
  onReorder?: (newOrder: DragReorderItem[]) => void;
  className?: string;
}

export interface DragReorderContainerRef {
  clearItems: () => void;
}

export const DragReorderContainer = forwardRef<DragReorderContainerRef, DragReorderContainerProps>(
  ({ items: initialItems, onReorder, className = '' }, ref) => {
  const [items, setItems] = useState<DragReorderItem[]>(initialItems);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hoveredItemIndexes, setHoveredItemIndexes] = useState<Set<number>>(new Set());
  const [dragCoordinates, setDragCoordinates] = useState<{[key: number]: {x: number, y: number}}>({})

  useImperativeHandle(ref, () => ({
    clearItems: () => {
      setItems([]);
      setDraggedItemId(null);
      setDragOverIndex(null);
      setHoveredItemIndexes(new Set());
      setDragCoordinates({});
      onReorder?.([]);
    }
  }), [onReorder]);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: itemId }));
    setDraggedItemId(itemId);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverIndex(null);
    setHoveredItemIndexes(new Set());
    setDragCoordinates({});
  };

  const handleItemDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemId && items[index].id !== draggedItemId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const relativeX = e.clientX - centerX;
      const relativeY = e.clientY - centerY;
      
      setHoveredItemIndexes(prev => new Set([...prev, index]));
      setDragCoordinates(prev => ({
        ...prev,
        [index]: { x: relativeX, y: relativeY }
      }));
    }
  };

  const handleItemDragLeave = (e: React.DragEvent, index: number) => {
    // Only process if we're actually leaving the item (not entering a child element)
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    
    if (relatedTarget && currentTarget.contains(relatedTarget)) {
      return; // Still inside the item
    }
    
    setHoveredItemIndexes(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    
    setDragCoordinates(prev => {
      const newCoords = { ...prev };
      delete newCoords[index];
      return newCoords;
    });
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
      
      // Determine drop position based on hovered items and their coordinates
      let newIndex = items.length; // Default to end
      
      if (hoveredItemIndexes.size > 0) {
        // Get the hovered item with coordinates
        const hoveredIndexes = Array.from(hoveredItemIndexes);
        
        // Find the primary hovered item (could be multiple due to overlapping events)
        // Use the one with the most recent coordinates
        const primaryIndex = hoveredIndexes.find(index => dragCoordinates[index]);
        
        if (primaryIndex !== undefined && dragCoordinates[primaryIndex]) {
          const coords = dragCoordinates[primaryIndex];
          
          // If y < 0, cursor is above center, insert before
          // If y >= 0, cursor is below center, insert after
          if (coords.y < 0) {
            newIndex = primaryIndex;
          } else {
            newIndex = primaryIndex + 1;
          }
        } else {
          // Fallback to first hovered item
          newIndex = Math.min(...hoveredIndexes);
        }
      }
      
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
      onReorder?.(newItems);
    } catch (error) {
      console.error('Error handling drop:', error);
    } finally {
      setDraggedItemId(null);
      setDragOverIndex(null);
      setHoveredItemIndexes(new Set());
      setDragCoordinates({});
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
                onDragEnter={(e) => handleItemDragEnter(e, index)}
                onDragLeave={(e) => handleItemDragLeave(e, index)}
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
      
      {/* Debug text box */}
      <div className="debug-box">
        <h4>Hovered Items & Coordinates</h4>
        <div className="debug-content">
          {hoveredItemIndexes.size === 0 
            ? 'None' 
            : Array.from(hoveredItemIndexes).sort().map(index => {
                const coords = dragCoordinates[index];
                return (
                  <div key={index}>
                    Item {index}: {coords ? `(${coords.x.toFixed(1)}, ${coords.y.toFixed(1)})` : 'No coords'}
                  </div>
                );
              })
          }
        </div>
      </div>
    </div>
  );
});