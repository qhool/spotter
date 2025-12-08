import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useEffect, useState, useCallback } from 'react'
import { ItemTile, ContentType } from '../components/ItemTile';
import { ButtonTile } from '../components/ButtonTile';
import { TrashSolid, PlusCircle } from 'iconoir-react';
import { LikedSongsContainer, PlaylistContainer, AlbumContainer, TrackContainer } from '../data/TrackContainer';
import { DragReorderContainer } from '../components/DragReorderContainer';

interface SelectItemsPageProps {
  sdk: SpotifyApi;
  selectedItems: TrackContainer[];
  setSelectedItems: React.Dispatch<React.SetStateAction<TrackContainer[]>>;
}

export function SelectItemsPage({ sdk, selectedItems, setSelectedItems }: SelectItemsPageProps) {
  const [items, setItems] = useState<TrackContainer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyItems, setShowMyItems] = useState(true);
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('playlist');
  
  // Pagination state
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Helper functions for DragReorderContainer
  const getItemId = (item: TrackContainer) => item.id;
  const renderSelectedItem = (item: TrackContainer) => (
    <ItemTile
      item={item}
      contentType={contentType}
      controls={
        <button 
          className="control-button remove-button"
          onClick={() => removeSelectedItem(item.id)}
          aria-label="Remove item"
        >
          <TrashSolid />
        </button>
      }
    />
  );
  
  // Handle external drag-ins (from the search results)
  const getDragItem = (dragData: any): TrackContainer | null => {
    if (dragData && dragData.id) {
      // Find the item in the current items list
      const foundItem = items.find(item => item.id === dragData.id);
      return foundItem || null;
    }
    return null;
  };

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
          results = [likedSongsContainer as any, ...playlistContainers as any];
        } else if (contentType === 'album') {
          const savedAlbums = await sdk.currentUser.albums.savedAlbums();
          results = savedAlbums.items.map(savedAlbum => 
            new AlbumContainer(sdk, savedAlbum.album as any) as any // Cast for compatibility
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
        results = rawPlaylists.map(playlist => new PlaylistContainer(sdk, playlist as any) as any); // Cast for compatibility
        pageData = searchData.playlists;
      } else if (contentType === 'album') {
        const rawAlbums = (searchData.albums?.items || []).filter(item => item != null);
        results = rawAlbums.map(album => new AlbumContainer(sdk, album as any) as any); // Cast for compatibility
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

  const removeSelectedItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const addSelectedItem = (item: TrackContainer) => {
    // Check if item is already selected to avoid duplicates
    if (!selectedItems.find(selected => selected.id === item.id)) {
      setSelectedItems(prev => [...prev, item]);
    }
  };

  // Handle dragging items from search results to add them
  const handleSearchItemDragStart = (e: React.DragEvent, item: TrackContainer) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id }));
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
      onDragStart={handleSearchItemDragStart}
      controls={
        <button 
          className="control-button add-button"
          onClick={() => addSelectedItem(item)}
          aria-label="Add item to selection"
        >
          <PlusCircle />
        </button>
      }
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

        <div className="right-panel">
          <DragReorderContainer
            items={selectedItems}
            setItems={setSelectedItems}
            getItemId={getItemId}
            renderItem={renderSelectedItem}
            getDragItem={getDragItem}
            emptyMessage="Drag items here to select them"
            className="playlist-container"
          />
        </div>
      </div>
    </div>
  );
}