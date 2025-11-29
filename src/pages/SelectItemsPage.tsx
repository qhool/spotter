import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useEffect, useState, useCallback } from 'react'
import { ItemTile, ContentType } from '../components/ItemTile';
import { ButtonTile } from '../components/ButtonTile';
import { PlaceholderTile } from '../components/PlaceholderTile';
import { LikedSongsContainer, PlaylistContainer, AlbumContainer, TrackContainer } from '../data/TrackContainer';

interface SelectItemsPageProps {
  sdk: SpotifyApi;
}

export function SelectItemsPage({ sdk }: SelectItemsPageProps) {
  const [items, setItems] = useState<TrackContainer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyItems, setShowMyItems] = useState(true);
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('playlist');
  
  // Pagination state
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Selected items state
  const [selectedItems, setSelectedItems] = useState<TrackContainer[]>([]);
  
  // Drag state
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      let results: TrackContainer[] = [];
      if (showMyItems) {
        if (contentType === 'playlist') {
          // Get user's saved tracks count for liked songs
          const savedTracksResponse = await sdk.currentUser.tracks.savedTracks(1, 0);
          const likedSongsContainer = new LikedSongsContainer(sdk, savedTracksResponse.total);
          
          // Get user playlists and wrap them in PlaylistContainer
          const userPlaylists = await sdk.currentUser.playlists.playlists();
          const playlistContainers = userPlaylists.items.map(playlist => 
            new PlaylistContainer(sdk, playlist)
          );
          
          // Add liked songs as first item, then playlists
          results = [likedSongsContainer, ...playlistContainers];
        } else if (contentType === 'album') {
          const savedAlbums = await sdk.currentUser.albums.savedAlbums();
          results = savedAlbums.items.map(savedAlbum => 
            new AlbumContainer(sdk, savedAlbum.album as any) // Cast since Album and SimplifiedAlbum are compatible for our use
          );
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
      
      let results: TrackContainer[] = [];
      let pageData;
      
      if (contentType === 'playlist') {
        const rawPlaylists = (searchData.playlists?.items || []).filter(item => item != null);
        results = rawPlaylists.map(playlist => new PlaylistContainer(sdk, playlist as any)); // Cast for compatibility
        pageData = searchData.playlists;
      } else if (contentType === 'album') {
        const rawAlbums = (searchData.albums?.items || []).filter(item => item != null);
        results = rawAlbums.map(album => new AlbumContainer(sdk, album as any)); // Cast for compatibility
        pageData = searchData.albums;
      }
      
      if (append) {
        setItems(prev => [...prev, ...results]);
      } else {
        setItems(results);
      }
      setSearchResults(pageData); // Store pagination data
      
      console.log('Updated items:', append ? 'appended' : 'replaced', results.length, 'items');
    } catch (error) {
      console.error('Error performing search:', error);
      setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (searchResults && searchResults.next) {
      performSearch(true);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMyItems && searchQuery.trim()) {
      performSearch(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, item: TrackContainer) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id }));
    setDraggedItemId(item.id);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
    
    // Calculate drop position based on mouse position
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Find all item tiles in the container (excluding the dragged one for position calc)
    const items = container.querySelectorAll('.item-tile:not(.dragging)');
    let insertIndex = selectedItems.length; // Default to end
    
    for (let i = 0; i < items.length; i++) {
      const itemRect = items[i].getBoundingClientRect();
      const itemY = itemRect.top - rect.top;
      const itemMiddle = itemY + itemRect.height / 2;
      
      if (y < itemMiddle) {
        insertIndex = i;
        break;
      }
    }
    
    setDragOverIndex(insertIndex);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dragData = e.dataTransfer.getData('application/json');
      const { id } = JSON.parse(dragData);
      
      // Find the actual TrackContainer object by ID
      const item = items.find(item => item.id === id);
      if (!item) {
        console.error('Could not find item with id:', id);
        return;
      }
      
      const existingIndex = selectedItems.findIndex(selected => selected.id === item.id);
      const insertIndex = dragOverIndex ?? selectedItems.length;
      
      if (existingIndex !== -1) {
        // Item is already in selected list - reorder it
        setSelectedItems(prev => {
          const newItems = [...prev];
          // Remove from old position
          newItems.splice(existingIndex, 1);
          // Insert at new position (adjust index if removing from before insertion point)
          const adjustedIndex = existingIndex < insertIndex ? insertIndex - 1 : insertIndex;
          newItems.splice(adjustedIndex, 0, item);
          return newItems;
        });
      } else {
        // New item - add to selected list
        setSelectedItems(prev => {
          const newItems = [...prev];
          newItems.splice(insertIndex, 0, item);
          return newItems;
        });
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    } finally {
      setDraggedItemId(null);
      setDragOverIndex(null);
    }
  };

  const removeSelectedItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Left panel drop handlers (for removing from selected list)
  const handleLeftPanelDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
  };

  const handleLeftPanelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dragData = e.dataTransfer.getData('application/json');
      const { id } = JSON.parse(dragData);
      
      // Check if item is in selected list
      const selectedIndex = selectedItems.findIndex(selected => selected.id === id);
      if (selectedIndex !== -1) {
        // Remove from selected list
        setSelectedItems(prev => prev.filter(selected => selected.id !== id));
      }
    } catch (error) {
      console.error('Error handling left panel drop:', error);
    } finally {
      setDraggedItemId(null);
      setDragOverIndex(null);
    }
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
    <div className="select-items-container">
      <div className="content-area">
        <div 
          className="left-panel"
          onDragOver={handleLeftPanelDragOver}
          onDrop={handleLeftPanelDrop}
        >
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
            {selectedItems.length > 0 || dragOverIndex !== null ? (
              (() => {
                const tiles = [];
                
                for (let i = 0; i <= selectedItems.length; i++) {
                  // Insert placeholder at dragOverIndex
                  if (dragOverIndex === i && draggedItemId !== null) {
                    tiles.push(<PlaceholderTile key={`placeholder-${i}`} />);
                  }
                  
                  // Insert actual item if it exists at this index
                  if (i < selectedItems.length) {
                    const item = selectedItems[i];
                    tiles.push(
                      <ItemTile
                        key={item.id}
                        item={item}
                        contentType={contentType}
                        showRemoveButton={true}
                        onRemove={removeSelectedItem}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedItemId === item.id}
                      />
                    );
                  }
                }
                
                return tiles;
              })()
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