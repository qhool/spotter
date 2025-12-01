import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { ItemTile, ContentType } from '../components/ItemTile';
import { TrackContainer, RemixContainer } from '../data/TrackContainer';
import { DragReorderContainer } from '../components/DragReorderContainer';
import { TrackList } from '../components/TrackList';
import { concatenateRemix, shuffleRemix } from '../data/RemixFunctions';
import { useState, useEffect } from 'react';

interface RemixPageProps {
  sdk: SpotifyApi;
  selectedItems: TrackContainer[];
  setSelectedItems: React.Dispatch<React.SetStateAction<TrackContainer[]>>;
}

export function RemixPage({ sdk, selectedItems, setSelectedItems }: RemixPageProps) {
  const [remixContainer, setRemixContainer] = useState<RemixContainer<undefined> | null>(null);

  // Create remix container when selectedItems changes
  useEffect(() => {
    if (selectedItems.length > 0) {
      // Convert selectedItems to [TrackContainer, undefined] tuples
      const inputs: [TrackContainer, undefined][] = selectedItems.map(container => [container, undefined]);
      console.log("Creating remix container with inputs:", inputs);
      // Create RemixContainer with concatenateRemix
      const container = new RemixContainer(
        sdk,
        inputs,
        shuffleRemix,
        "Remix",
        `Combined tracks from ${selectedItems.length} source(s)`
      );
      
      setRemixContainer(container);
    } else {
      console.log("No selected items, clearing remix container");
      setRemixContainer(null);
    }
  }, [sdk, selectedItems]);

  // Helper functions for DragReorderContainer
  const getItemId = (item: TrackContainer) => item.id;
  const renderSelectedItem = (item: TrackContainer) => (
    <ItemTile
      item={item}
      contentType={'playlist' as ContentType}
    />
  );

  return (
    <div className="select-items-container remix-page">
      <div className="content-area">
        <div className="left-panel">
          <DragReorderContainer
            items={selectedItems}
            setItems={setSelectedItems}
            getItemId={getItemId}
            renderItem={renderSelectedItem}
            emptyMessage="No items selected"
            className="playlist-container"
          />
        </div>

        <div className="right-panel">
          {remixContainer ? (
            <div className="playlist-container">
              <TrackList trackContainer={remixContainer} />
            </div>
          ) : (
            <div className="playlist-container">
              <div className="no-results">
                Select items to see remixed output
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}