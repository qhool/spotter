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
  const [activeTab, setActiveTab] = useState<'Options' | 'Preview' | 'Create'>('Preview');
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
                  <div className="remix-options">
                    <div className="option-group">
                      <label htmlFor="remix-method" className="option-label">
                        Remix Method
                      </label>
                      <select 
                        id="remix-method"
                        className="option-select"
                        value={remixMethod}
                        onChange={(e) => setRemixMethod(e.target.value as RemixMethod)}
                      >
                        <option value="shuffle">Shuffle</option>
                        <option value="concatenate">Concatenate</option>
                      </select>
                    </div>
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