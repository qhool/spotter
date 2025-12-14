import { useSpotify } from './hooks/useSpotify';
import { useControlsSlot } from './hooks/useControlsSlot';
import { Scopes, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useState } from 'react';
import { TestbedPage } from './pages/TestbedPage';
import { RemixWizardPage } from './pages/RemixWizardPage';
import { HamburgerMenu } from './components/HamburgerMenu';
import './App.css';

type Page = 'remix-wizard' | 'testbed';

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
  const titleId = 'nav-title-portal-slot';
  const navId = 'wizard-nav-slot';
  const titleSlot = useControlsSlot(titleId);
  const navSlot = useControlsSlot(navId);

  return (
    <div className="app-container">
      <nav className="navigation">
        <div className="nav-left">
          <HamburgerMenu 
            sdk={sdk}
            onTestbedClick={() => setCurrentPage('testbed')}
            onMainAppClick={() => setCurrentPage('remix-wizard')}
          />
          <div className="nav-title">
            Spotter
            <span className="nav-title-portal" id={titleId} />
          </div>
        </div>
        <div className="nav-center">
          <span className="nav-center-portal" id={navId} />
        </div>
      </nav>
      
      <main className="main-content">
        {currentPage === 'remix-wizard' && (
          <RemixWizardPage 
            sdk={sdk}
            titleSlot={titleSlot}
            navSlot={navSlot}
          />
        )}
        {currentPage === 'testbed' && (
          <TestbedPage 
            sdk={sdk}
            titleSlot={titleSlot}
          />
        )}
      </main>
    </div>
  );
}

export default App;
