import { useCallback, useMemo, useState } from 'react';
import { RefreshCircleSolid } from 'iconoir-react';
import { ItemTile, ContentType } from '../components/ItemTile';
import { TrackContainer, RemixContainer } from '../data/TrackContainer';
import { DragReorderContainer } from '../components/DragReorderContainer';
import { RemixOptions, RemixMethod } from '../data/RemixFunctions';
import { TrackListPane } from '../components/TrackListPane';

interface RemixPageProps {
  selectedItems: TrackContainer[];
  setSelectedItems: React.Dispatch<React.SetStateAction<TrackContainer[]>>;
  remixContainer: RemixContainer<RemixOptions> | null;
  remixMethod: RemixMethod;
  setRemixMethod: React.Dispatch<React.SetStateAction<RemixMethod>>;
  excludedTrackIds: Set<string>;
  setExcludedTrackIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function RemixPage({ selectedItems, setSelectedItems, remixContainer, remixMethod, setRemixMethod, excludedTrackIds, setExcludedTrackIds }: RemixPageProps) {
  const [refreshCounter, setRefreshCounter] = useState(0);
  const hasRemix = useMemo(() => Boolean(remixContainer), [remixContainer]);

  const handleMethodChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setRemixMethod(event.target.value as RemixMethod);
    },
    [setRemixMethod]
  );

  const handleRefresh = useCallback(async () => {
    if (!remixContainer) {
      return;
    }
    await remixContainer.clearRemixCache();
    setRefreshCounter(prev => prev + 1);
  }, [remixContainer]);

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
          <TrackListPane
            remixContainer={remixContainer}
            excludedTrackIds={excludedTrackIds}
            setExcludedTrackIds={setExcludedTrackIds}
            refreshTrigger={refreshCounter}
            controls={
              <>
                <div className="track-list-pane__method-group">
                  <label htmlFor="remix-method" className="control-label">
                    Remix Method
                  </label>
                  <select
                    id="remix-method"
                    className="control-select"
                    value={remixMethod}
                    onChange={handleMethodChange}
                  >
                    <option value="shuffle">Shuffle</option>
                    <option value="concatenate">Concatenate</option>
                  </select>
                </div>

                {hasRemix && (
                  <button
                    type="button"
                    className="track-list-pane__refresh-button"
                    onClick={handleRefresh}
                    title="Refresh remix"
                  >
                    <RefreshCircleSolid className="refresh-icon" />
                    Refresh
                  </button>
                )}
              </>
            }
          />
        </div>
      </div>
    </div>
  );
}