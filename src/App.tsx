import { useSpotify } from './hooks/useSpotify';
import { Scopes, SpotifyApi, Page, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import { useEffect, useState, useCallback } from 'react'
import './App.css'

function App() {
  
  const sdk = useSpotify(
    import.meta.env.VITE_SPOTIFY_CLIENT_ID, 
    import.meta.env.VITE_REDIRECT_TARGET, 
    Scopes.playlistRead
  );

  return sdk
    ? (<PlaylistDisplay sdk={sdk} />) 
    : (<></>);
}

function PlaylistDisplay({ sdk }: { sdk: SpotifyApi}) {
  const [playlists, setPlaylists] = useState<SimplifiedPlaylist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyPlaylists, setShowMyPlaylists] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      let results: any[] = [];
      if (showMyPlaylists) {
        // Fetch user's own playlists
        const userPlaylists = await sdk.currentUser.playlists.playlists();
        results = userPlaylists.items;
        setPlaylists(results);
      } else {
        // In search mode - clear the list and wait for manual search
        setPlaylists([]);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  }, [sdk, showMyPlaylists]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    
    console.log('Performing search for:', searchQuery);
    setLoading(true);
    try {
      const searchResults = await sdk.search(searchQuery, ['playlist'], undefined, 20);
      console.log('Search results:', searchResults);
      const results = (searchResults.playlists?.items || []).filter(item => item != null);
      console.log('Processed results:', results.length, 'playlists');
      setPlaylists(results as any);
    } catch (error) {
      console.error('Error searching playlists:', error);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMyPlaylists && searchQuery.trim()) {
      performSearch();
    }
  };

  // generate tiles for the playlists
  const playlistTiles = playlists
    .filter(playlist => playlist != null) // Filter out null/undefined items
    .map((playlist) => {
      const coverImage = playlist.images && playlist.images.length > 0 ? playlist.images[0] : null;
      
      return (
        <div key={playlist.id} className="playlist-tile">
          <div className="playlist-image">
            {coverImage ? (
            <img 
              src={coverImage.url} 
              alt={`${playlist.name} cover`}
              className="cover-image"
            />
          ) : (
            <div className="placeholder-image">♪</div>
          )}
        </div>
        <div className="playlist-content">
          <h3 className="playlist-title">{playlist.name}</h3>
          {playlist.description && (
            <p className="playlist-description">{playlist.description}</p>
          )}
        </div>
        <div className="playlist-meta">
          <span className="track-count">{playlist.tracks?.total || 0} tracks</span>
        </div>
      </div>
    );
  });

  return (
    <>
      <h1>Spotify Playlists</h1>
      
      <div className="controls">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showMyPlaylists}
            onChange={(e) => setShowMyPlaylists(e.target.checked)}
          />
          My Playlists
        </label>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            disabled={showMyPlaylists}
          />
          <button type="submit" disabled={showMyPlaylists || !searchQuery.trim()}>
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="playlist-container">
          {playlistTiles.length > 0 ? (
            playlistTiles
          ) : (
            <div className="no-results">
              {!showMyPlaylists 
                ? "No playlists found. Try a different search term." 
                : "No playlists found."
              }
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default App;
