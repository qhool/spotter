import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { ItemTile, ContentType } from '../components/ItemTile';
import { TrackContainer, RemixContainer } from '../data/TrackContainer';
import { DragReorderContainer } from '../components/DragReorderContainer';
import { TrackList } from '../components/TrackList';
import { concatenateRemix, shuffleRemix } from '../data/RemixFunctions';
import { RefreshCircleSolid } from 'iconoir-react';
import { useState, useEffect } from 'react';

interface RemixPageProps {
  sdk: SpotifyApi;
  selectedItems: TrackContainer[];
  setSelectedItems: React.Dispatch<React.SetStateAction<TrackContainer[]>>;
}

export function RemixPage({ sdk, selectedItems, setSelectedItems }: RemixPageProps) {
  const [remixContainer, setRemixContainer] = useState<RemixContainer<undefined> | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [activeTab, setActiveTab] = useState<'Options' | 'Preview' | 'Create'>('Preview');

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
          <div className="tabbed-container">
            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button 
                className={`tab-button ${activeTab === 'Options' ? 'active' : ''}`}
                onClick={() => setActiveTab('Options')}
              >
                Options
              </button>
              <button 
                className={`tab-button ${activeTab === 'Preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('Preview')}
              >
                {activeTab === 'Preview' && remixContainer && (
                  <RefreshCircleSolid 
                    className="refresh-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRefreshRemix();
                    }}
                  />
                )}
                Preview
              </button>
              <button 
                className={`tab-button ${activeTab === 'Create' ? 'active' : ''}`}
                onClick={() => setActiveTab('Create')}
              >
                Create
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {/* Options Tab */}
              <div className={`tab-pane ${activeTab === 'Options' ? 'active' : 'hidden'}`}>
                <div className="playlist-container">
                  <div className="no-results">
                    Remix options coming soon...
                  </div>
                </div>
              </div>

              {/* Preview Tab */}
              <div className={`tab-pane ${activeTab === 'Preview' ? 'active' : 'hidden'}`}>
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

              {/* Create Tab */}
              <div className={`tab-pane ${activeTab === 'Create' ? 'active' : 'hidden'}`}>
                <div className="playlist-container">
                  <div className="no-results">
                    Create playlist coming soon...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}