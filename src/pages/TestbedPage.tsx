import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useState } from 'react';
import { DragReorderContainer } from '../components/DragReorderContainer';
import { PlaceholderTile } from '../components/PlaceholderTile';

interface TestbedPageProps {
  sdk: SpotifyApi;
}

interface TestbedItem {
  id: string;
  text: string;
}

const createInitialItems = (): TestbedItem[] => 
  Array.from({ length: 9 }, (_, i) => ({
    id: `item-${i + 1}`,
    text: `Item ${i + 1}`
  }));

export function TestbedPage({}: TestbedPageProps) {
  const [items, setItems] = useState<TestbedItem[]>(createInitialItems);

  const handleReset = () => {
    const initialItems = createInitialItems();
    setItems(initialItems);
  };

  const handleClearAll = () => {
    setItems([]);
  };

  const handleDragItem = (dragData: any): TestbedItem | null => {
    // Handle external drag data - check if it's a new item
    if (dragData && dragData.type === 'external-item') {
      return {
        id: `external-${Date.now()}`, // Generate unique ID
        text: dragData.text || 'Dragged Item'
      };
    }
    return null;
  };

  return (
    <div className="testbed-container">
      {/* Example external drag source */}
      <div style={{ marginBottom: '1rem' }}>
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/json', JSON.stringify({
              type: 'external-item',
              text: 'New Item from Outside'
            }));
          }}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#4CAF50',
            color: 'white',
            borderRadius: '4px',
            cursor: 'grab',
            display: 'inline-block',
            marginBottom: '1rem'
          }}
        >
          Drag me into the list!
        </div>
      </div>
      
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
        items={items}
        setItems={setItems}
        getItemId={(item) => item.id}
        renderItem={(item) => <PlaceholderTile text={item.text} />}
        getDragItem={handleDragItem}
        className="testbed-drag-container"
      />
    </div>
  );
}