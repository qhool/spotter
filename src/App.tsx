import { useSpotify } from './hooks/useSpotify';
import { Scopes, SpotifyApi, SimplifiedPlaylist, SimplifiedAlbum } from '@spotify/web-api-ts-sdk';
import { useEffect, useState, useCallback } from 'react'
import { ItemTile, ContentType } from './components/ItemTile';
import { ButtonTile } from './components/ButtonTile';
import './App.css'

function App() {
  const sdk = useSpotify(
    import.meta.env.VITE_SPOTIFY_CLIENT_ID, 
    import.meta.env.VITE_REDIRECT_TARGET, 
    Scopes.all
  );

  return sdk ? (<ItemBrowser sdk={sdk} />) : (<></>);
}

function ItemBrowser({ sdk }: { sdk: SpotifyApi }) {
  const [items, setItems] = useState<(SimplifiedPlaylist | SimplifiedAlbum)[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyItems, setShowMyItems] = useState(true);
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('playlist');
  
  // Pagination state
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Selected items state
  const [selectedItems, setSelectedItems] = useState<(SimplifiedPlaylist | SimplifiedAlbum)[]>([]);
  
  // Drag state
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      let results: any[] = [];
      if (showMyItems) {
        if (contentType === 'playlist') {
          const userPlaylists = await sdk.currentUser.playlists.playlists();
          results = userPlaylists.items;
        } else if (contentType === 'album') {
          const savedAlbums = await sdk.currentUser.albums.savedAlbums();
          results = savedAlbums.items.map(item => item.album);
        }
        setItems(results);
        setSearchResults(null); // Clear pagination data for user items
      } else {
        setItems([]);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [sdk, showMyItems, contentType]);

  const performSearch = async (append = false) => {
    if (!searchQuery.trim()) return;
    
    console.log('Performing search for:', searchQuery, 'type:', contentType, 'append:', append);
    
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setItems([]); // Clear previous results for new search
      setSearchResults(null);
    }
    
    try {
      let searchData;
      if (append && searchResults?.next) {
        // Use the SDK's getRequest method for pagination
        searchData = await sdk.search(searchQuery, [contentType], undefined,
          searchResults.limit,
          searchResults.offset + searchResults.limit)
      } else {
        // Perform new search
        searchData = await sdk.search(searchQuery, [contentType], undefined, 50);
      }
      
      console.log('Search results:', searchData);
      
      let results: any[] = [];
      let pageData;
      
      if (contentType === 'playlist') {
        results = (searchData.playlists?.items || []).filter(item => item != null);
        pageData = searchData.playlists;
      } else if (contentType === 'album') {
        results = (searchData.albums?.items || []).filter(item => item != null);
        pageData = searchData.albums;
      }
      
      if (append) {
        setItems(prev => [...prev, ...results]);
      } else {
        setItems(results);
      }
      
      setSearchResults(pageData);
      console.log('Processed results:', results.length, contentType + 's');
      
    } catch (error) {
      console.error('Error searching items:', error);
      if (!append) {
        setItems([]);
        setSearchResults(null);
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadMore = () => {
    performSearch(true);
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMyItems && searchQuery.trim()) {
      performSearch(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, item: SimplifiedPlaylist | SimplifiedAlbum) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    setDraggedItemId(item.id);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const itemData = e.dataTransfer.getData('application/json');
      const item = JSON.parse(itemData);
      
      // Check if item is already in selected list
      if (!selectedItems.find(selected => selected.id === item.id)) {
        setSelectedItems(prev => [...prev, item]);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    } finally {
      setDraggedItemId(null);
    }
  };

  const removeSelectedItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Calculate if there are more items to load
  const hasMoreItems = searchResults && searchResults.next && (searchResults.offset + searchResults.limit < searchResults.total);
  const remainingItems = searchResults ? Math.max(0, searchResults.total - searchResults.offset - searchResults.limit) : 0;

  // generate tiles for the items (filter out already selected items)
  const filteredItems = items
    .filter(item => item != null)
    .filter(item => !selectedItems.find(selected => selected.id === item.id));
    
  const itemTiles = filteredItems.map((item: any) => (
    <ItemTile 
      key={item.id} 
      item={item} 
      contentType={contentType} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      isDragging={draggedItemId === item.id}
    />
  ));

  // Add load more button if needed
  if (!showMyItems && hasMoreItems && !loading) {
    const loadMoreText = loadingMore 
      ? 'Loading...' 
      : `Load More (${remainingItems} remaining)`;
    
    itemTiles.push(
      <ButtonTile 
        key="load-more" 
        name={loadMoreText}
        onClick={loadMore}
        disabled={loadingMore}
      />
    );
  }

  return (
    <div className="app-container">
      <div className="content-area">
        <div className="left-panel">
          <div className="controls">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showMyItems}
                onChange={(e) => setShowMyItems(e.target.checked)}
              />
              My {contentType === 'playlist' ? 'Playlists' : 'Albums'}
            </label>

            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="type-selector"
            >
              <option value="playlist">Playlists</option>
              <option value="album">Albums</option>
            </select>

            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder={`Search ${contentType}s...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                disabled={showMyItems}
              />
              <button type="submit" disabled={showMyItems || !searchQuery.trim()}>
                Search
              </button>
            </form>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="playlist-container">
              {itemTiles.length > 0 ? (
                itemTiles
              ) : (
                <div className="no-results">
                  {!showMyItems 
                    ? `No ${contentType}s found. Try a different search term.` 
                    : `No ${contentType}s found.`
                  }
                </div>
              )}
            </div>
          )}
        </div>

        <div 
          className="right-panel"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="playlist-container">
            {selectedItems.length > 0 ? (
              selectedItems.map(item => (
                <ItemTile
                  key={item.id}
                  item={item}
                  contentType={contentType}
                  showRemoveButton={true}
                  onRemove={removeSelectedItem}
                />
              ))
            ) : (
              <div className="no-results">
                Drag items here to select them
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;