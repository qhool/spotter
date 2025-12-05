import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { ItemTile, ContentType } from '../components/ItemTile';
import { TrackContainer, RemixContainer } from '../data/TrackContainer';
import { DragReorderContainer } from '../components/DragReorderContainer';
import { TrackList } from '../components/TrackList';
import { getRemixFunction, RemixOptions, RemixMethod } from '../data/RemixFunctions';
import { RefreshCircleSolid } from 'iconoir-react';
import { useState, useEffect } from 'react';

interface RemixPageProps {
  sdk: SpotifyApi;
  selectedItems: TrackContainer[];
  setSelectedItems: React.Dispatch<React.SetStateAction<TrackContainer[]>>;
}

export function RemixPage({ sdk, selectedItems, setSelectedItems }: RemixPageProps) {
  const [remixContainer, setRemixContainer] = useState<RemixContainer<RemixOptions> | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [remixMethod, setRemixMethod] = useState<RemixMethod>('shuffle');

  // Create remix container when selectedItems or remixMethod changes
  useEffect(() => {
    if (selectedItems.length > 0) {
      // Convert selectedItems to [TrackContainer, RemixOptions] tuples
      const inputs: [TrackContainer, RemixOptions][] = 
        selectedItems.map(container => [container, {}]);
      console.log("Creating remix container with inputs:", inputs);
      // Create RemixContainer with selected remix function
      const remixFunction = getRemixFunction(remixMethod);
      const container = new RemixContainer(
        sdk,
        inputs,
        remixFunction,
        "Remix",
        `Combined tracks from ${selectedItems.length} source(s) - ${remixMethod}`
      );
      
      setRemixContainer(container);
    } else {
      console.log("No selected items, clearing remix container");
      setRemixContainer(null);
    }
  }, [sdk, selectedItems, remixMethod]);

  // Helper function to refresh remix
  const handleRefreshRemix = async () => {
    if (remixContainer) {
      await remixContainer.clearRemixCache();
      setRefreshCounter(prev => prev + 1);
    }
  };

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
            disableDragToDelete={true}
          />
        </div>

        <div className="right-panel">
          {/* Remix Controls */}
          <div className="remix-controls">
            <div className="remix-controls-group">
              <label htmlFor="remix-method" className="control-label">
                Remix Method
              </label>
              <select 
                id="remix-method"
                className="control-select"
                value={remixMethod}
                onChange={(e) => setRemixMethod(e.target.value as RemixMethod)}
              >
                <option value="shuffle">Shuffle</option>
                <option value="concatenate">Concatenate</option>
              </select>
            </div>

            {remixContainer && (
              <button 
                className="refresh-button"
                onClick={handleRefreshRemix}
                title="Refresh remix"
              >
                <RefreshCircleSolid className="refresh-icon" />
                Refresh
              </button>
            )}
          </div>

          {/* Track List */}
          <div className="track-list-area">
            {remixContainer ? (
              <div className="playlist-container">
                <TrackList trackContainer={remixContainer} refreshTrigger={refreshCounter} />
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
    </div>
  );
}