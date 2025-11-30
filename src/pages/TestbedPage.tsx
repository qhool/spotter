import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useState, useRef } from 'react';
import { DragReorderContainer, DragReorderContainerRef, DragReorderItem } from '../components/DragReorderContainer';
import { PlaceholderTile } from '../components/PlaceholderTile';

interface TestbedPageProps {
  sdk: SpotifyApi;
}

const createInitialItems = (): DragReorderItem[] => 
  Array.from({ length: 9 }, (_, i) => ({
    id: `item-${i + 1}`,
    content: <PlaceholderTile text={`Item ${i + 1}`} />
  }));

export function TestbedPage({}: TestbedPageProps) {
  const [items, setItems] = useState<DragReorderItem[]>(createInitialItems);
  const dragContainerRef = useRef<DragReorderContainerRef>(null);

  const handleReorder = (newOrder: DragReorderItem[]) => {
    console.log('Items reordered:', newOrder.map(item => item.id));
    setItems(newOrder);
  };

  const handleReset = () => {
    const initialItems = createInitialItems();
    setItems(initialItems);
    handleReorder(initialItems);
  };

  const handleClearAll = () => {
    dragContainerRef.current?.clearItems();
  };

  return (
    <div className="testbed-container">
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={handleReset}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: '#1db954',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset to Original Order
        </button>
        <button 
          onClick={handleClearAll}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear All Items
        </button>
      </div>
      <DragReorderContainer 
        ref={dragContainerRef}
        items={items}
        onReorder={handleReorder}
        className="testbed-drag-container"
      />
    </div>
  );
}