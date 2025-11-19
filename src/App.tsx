import { useSpotify } from './hooks/useSpotify';
import { Scopes, SpotifyApi, Page, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import { useEffect, useState } from 'react'
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

  useEffect(() => {
    (async () => {
      const results = await sdk.currentUser.playlists.playlists();
      setPlaylists(() => results.items);      
    })();
  }, [sdk]);

  // generate tiles for the playlists
  const playlistTiles = playlists.map((playlist) => {
    return (
      <div key={playlist.id} className="playlist-tile">
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
      <h1>Your Spotify Playlists</h1>
      <div className="playlist-container">
        {playlistTiles}
      </div>
    </>
  )
}

export default App;
