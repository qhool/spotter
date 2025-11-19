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

  // generate a table for the playlists
  const tableRows = playlists.map((playlist) => {
    return (
      <tr key={playlist.id}>
        <td>{playlist.name}</td>
        <td>{playlist.description || 'No description'}</td>
        <td>{playlist.tracks?.total || 0}</td>
        <td>{playlist.public ? 'Public' : 'Private'}</td>
      </tr>
    );
  });

  return (
    <>
      <h1>Your Spotify Playlists</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Track Count</th>
            <th>Visibility</th>
          </tr>
        </thead>
        <tbody>
          {tableRows}
        </tbody>
      </table>
    </>
  )
}

export default App;
