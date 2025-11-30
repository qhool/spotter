import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useState } from 'react';
import { DragReorderContainer } from '../components/DragReorderContainer';
import { PlaceholderTile } from '../components/PlaceholderTile';

interface TestbedItem {
  id: string;
  content: React.ReactNode;
}

interface TestbedPageProps {
  sdk: SpotifyApi;
}

export function TestbedPage({}: TestbedPageProps) {
  const [items, setItems] = useState<TestbedItem[]>(() => 
    Array.from({ length: 9 }, (_, i) => ({
      id: `item-${i + 1}`,
      content: <PlaceholderTile text={`Item ${i + 1}`} />
    }))
  );

  const handleReorder = (newOrder: TestbedItem[]) => {
    console.log('Items reordered:', newOrder.map(item => item.id));
    setItems(newOrder);
  };

  return (
    <div className="testbed-container">
      <DragReorderContainer 
        items={items}
        onReorder={handleReorder}
        className="testbed-drag-container"
      />
    </div>
  );
}