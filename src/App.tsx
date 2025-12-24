import { useSpotify } from './hooks/useSpotify';
import { useControlsSlot } from './hooks/useControlsSlot';
import { Scopes, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useEffect, useMemo, useState } from 'react';
import { TestbedPage } from './pages/TestbedPage';
import { RemixWizardPage } from './pages/RemixWizardPage';
import { RecentTracksPage } from './pages/RecentTracksPage';
import { HamburgerMenu } from './components/navigation/HamburgerMenu';
import { SyncController } from './data/SyncController';
import { RecentTracksSyncValue } from './data/SyncFunctions';
import { registerRecentTracksSync } from './data/registerSyncOperations';
import type { SyncResult } from './data/SyncController';
import './App.css';

type Page = 'remix-wizard' | 'recent-tracks' | 'testbed';

function App() {
  const sdk = useSpotify(
    import.meta.env.VITE_SPOTIFY_CLIENT_ID, 
    import.meta.env.VITE_REDIRECT_TARGET, 
    Scopes.all
  );

  return sdk ? (<AppWithNavigation sdk={sdk} />) : (<></>);
}

function AppWithNavigation({ sdk }: { sdk: SpotifyApi }) {

  const [currentPage, setCurrentPage] = useState<Page>('remix-wizard');
  const navId = 'wizard-nav-slot';
  const navSlot = useControlsSlot(navId);
  const syncController = useMemo(() => new SyncController(), []);
  const [recentTracksState, setRecentTracksState] = useState<SyncResult<RecentTracksSyncValue> | null>(null);
  const [recentTracksSyncReady, setRecentTracksSyncReady] = useState(false);
  const recentTracksContainer = recentTracksState?.value?.container ?? null;

  useEffect(() => {
    return () => {
      syncController.dispose();
    };
  }, [syncController]);

  useEffect(() => {
    const unregister = registerRecentTracksSync({
      controller: syncController,
      sdk,
      onUpdate: result => setRecentTracksState(result),
      onReadyChange: ready => setRecentTracksSyncReady(ready)
    });

    return unregister;
  }, [sdk, syncController]);

  return (
    <div className="app-container">
      <nav className="navigation">
        <div className="nav-left">
          <HamburgerMenu 
            sdk={sdk}
            onTestbedClick={() => setCurrentPage('testbed')}
            onRemixWizardClick={() => setCurrentPage('remix-wizard')}
            onRecentTracksClick={() => setCurrentPage('recent-tracks')}
          />
        </div>
        <div className="nav-center">
          <span className="nav-center-portal" id={navId} />
        </div>
        <div className="nav-right" />
      </nav>
      
      <main className="main-content">
        {currentPage === 'remix-wizard' && (
          <RemixWizardPage 
            sdk={sdk}
            navSlot={navSlot}
            syncController={syncController}
            recentTracksContainer={recentTracksContainer}
          />
        )}
        {currentPage === 'recent-tracks' && (
          <RecentTracksPage 
            navSlot={navSlot}
            syncController={syncController}
            recentTracksState={recentTracksState}
            recentTracksSyncReady={recentTracksSyncReady}
          />
        )}
        {currentPage === 'testbed' && (
          <TestbedPage 
            navSlot={navSlot} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
