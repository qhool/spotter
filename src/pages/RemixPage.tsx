import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { ItemTile, ContentType } from '../components/ItemTile';
import { TrackContainer, RemixContainer } from '../data/TrackContainer';
import { DragReorderContainer } from '../components/DragReorderContainer';
import { TrackList } from '../components/TrackList';
import { RemixOptions, RemixMethod } from '../data/RemixFunctions';
import { RefreshCircleSolid } from 'iconoir-react';
import { useState } from 'react';

interface RemixPageProps {
  sdk: SpotifyApi;
  selectedItems: TrackContainer[];
  setSelectedItems: React.Dispatch<React.SetStateAction<TrackContainer[]>>;
  remixContainer: RemixContainer<RemixOptions> | null;
  remixMethod: RemixMethod;
  setRemixMethod: React.Dispatch<React.SetStateAction<RemixMethod>>;
  excludedTrackIds: Set<string>;
  setExcludedTrackIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function RemixPage({ sdk, selectedItems, setSelectedItems, remixContainer, remixMethod, setRemixMethod, excludedTrackIds, setExcludedTrackIds }: RemixPageProps) {
  const [refreshCounter, setRefreshCounter] = useState(0);

  console.log("RemixPage render - remixContainer:", remixContainer, "selectedItems:", selectedItems.length);

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
                <TrackList 
                  trackContainer={remixContainer} 
                  refreshTrigger={refreshCounter}
                  excludedTrackIds={excludedTrackIds}
                  setExcludedTrackIds={setExcludedTrackIds}
                />
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