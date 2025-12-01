import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useState, useEffect } from 'react';
import { TrackList } from '../components/TrackList';
import { LikedSongsContainer } from '../data/TrackContainer';

interface TestbedPageProps {
  sdk: SpotifyApi;
}

export function TestbedPage({ sdk }: TestbedPageProps) {
  const [likedSongsContainer, setLikedSongsContainer] = useState<LikedSongsContainer | null>(null);

  // Create the liked songs container when sdk is available
  useEffect(() => {
    if (sdk) {
      setLikedSongsContainer(new LikedSongsContainer(sdk));
    }
  }, [sdk]);

  return (
    <div className="testbed-container">
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ color: '#1db954', marginBottom: '1rem' }}>Your Liked Songs</h3>
        {likedSongsContainer ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #333', borderRadius: '8px', padding: '8px' }}>
            <TrackList trackContainer={likedSongsContainer} />
          </div>
        ) : (
          <div style={{ color: '#888888', textAlign: 'center', padding: '2rem' }}>
            Initializing...
          </div>
        )}
      </div>
    </div>
  );
}