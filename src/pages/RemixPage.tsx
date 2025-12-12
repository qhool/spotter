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
  console.log("RemixPage render - remixContainer:", remixContainer, "selectedItems:", selectedItems.length);

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
            remixMethod={remixMethod}
            setRemixMethod={setRemixMethod}
            excludedTrackIds={excludedTrackIds}
            setExcludedTrackIds={setExcludedTrackIds}
          />
        </div>
      </div>
    </div>
  );
}