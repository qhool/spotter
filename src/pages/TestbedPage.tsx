import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useState, useEffect } from 'react';
import { TrackList } from '../components/TrackList';
import { RecentTracksContainer } from '../data/TrackContainer';
import { SlideNav } from '../components/SlideNav';
import { ArrowLeft } from 'iconoir-react';

interface TestbedPageProps {
  sdk: SpotifyApi;
  onBackToApp?: () => void;
}

export function TestbedPage({ sdk, onBackToApp }: TestbedPageProps) {
  const [recentTracksContainer, setRecentTracksContainer] = useState<RecentTracksContainer | null>(null);
  const [selectedNavIndex, setSelectedNavIndex] = useState(0);

  // Create the recent tracks container when sdk is available
  useEffect(() => {
    if (sdk) {
      setRecentTracksContainer(new RecentTracksContainer(sdk));
    }
  }, [sdk]);

  // Test navigation items
  const navItems = [
    { text: 'Dashboard', onClick: () => setSelectedNavIndex(0) },
    { text: 'Library', onClick: () => setSelectedNavIndex(1) },
    { text: 'Search', onClick: () => setSelectedNavIndex(2) },
    { text: 'Settings', onClick: () => setSelectedNavIndex(3) },
    { text: 'Profile', onClick: () => setSelectedNavIndex(4) }
  ];

  return (
    <div className="testbed-container">
      {/* Back to App Navigation */}
      {onBackToApp && (
        <div className="testbed-header">
          <button className="back-to-app-button" onClick={onBackToApp}>
            <ArrowLeft />
            Back to App
          </button>
          <h1>Scary Testing Page</h1>
        </div>
      )}
      
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#1db954', marginBottom: '1rem' }}>SlideNav Test</h3>
        <SlideNav items={navItems} selectedIndex={selectedNavIndex} />
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ color: '#1db954', marginBottom: '1rem' }}>Recently Played Tracks</h3>
        {recentTracksContainer ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #333', borderRadius: '8px', padding: '8px' }}>
            <TrackList trackContainer={recentTracksContainer} refreshTrigger={0} />
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