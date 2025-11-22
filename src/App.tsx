import { useSpotify } from './hooks/useSpotify';
import { Scopes, SpotifyApi, SimplifiedPlaylist, SimplifiedAlbum } from '@spotify/web-api-ts-sdk';
import { useEffect, useState, useCallback } from 'react'
import { ItemTile, ContentType } from './components/ItemTile';
import './App.css'

function App() {
  
  const sdk = useSpotify(
    import.meta.env.VITE_SPOTIFY_CLIENT_ID, 
    import.meta.env.VITE_REDIRECT_TARGET, 
    Scopes.all
);

  return sdk
    ? (<ItemBrowser sdk={sdk} />) 
    : (<></>);
}

function ItemBrowser({ sdk }: { sdk: SpotifyApi}) {
  const [items, setItems] = useState<(SimplifiedPlaylist | SimplifiedAlbum)[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyItems, setShowMyItems] = useState(true);
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('playlist');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      let results: any[] = [];
      if (showMyItems) {
        // Fetch user's own items
        if (contentType === 'playlist') {
          const userPlaylists = await sdk.currentUser.playlists.playlists();
          results = userPlaylists.items;
        } else if (contentType === 'album') {
          const savedAlbums = await sdk.currentUser.albums.savedAlbums();
          results = savedAlbums.items.map(item => item.album);
        }
        setItems(results);
      } else {
        // In search mode - clear the list and wait for manual search
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

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    
    console.log('Performing search for:', searchQuery, 'type:', contentType);
    setLoading(true);
    try {
      const searchResults = await sdk.search(searchQuery, [contentType], undefined, 20);
      console.log('Search results:', searchResults);
      
      let results: any[] = [];
      if (contentType === 'playlist') {
        results = (searchResults.playlists?.items || []).filter(item => item != null);
      } else if (contentType === 'album') {
        results = (searchResults.albums?.items || []).filter(item => item != null);
      }
      
      console.log('Processed results:', results.length, contentType + 's');
      setItems(results as any);
    } catch (error) {
      console.error('Error searching items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMyItems && searchQuery.trim()) {
      performSearch();
    }
  };

  // generate tiles for the items
  const itemTiles = items
    .filter(item => item != null) // Filter out null/undefined items
    .map((item: any) => (
      <ItemTile key={item.id} item={item} contentType={contentType} />
    ));  return (
    <>
      <h1>Spotify Browser</h1>
      
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
    </>
  )
}

export default App;
