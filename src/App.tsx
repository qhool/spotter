import { useSpotify } from './hooks/useSpotify';
import { Scopes, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useState } from 'react'
import { SelectItemsPage } from './pages/SelectItemsPage';
import { TestbedPage } from './pages/TestbedPage';
import { TestTubeSolid } from 'iconoir-react';
import './App.css'

type Page = 'select-items' | 'testbed';

function App() {
  const sdk = useSpotify(
    import.meta.env.VITE_SPOTIFY_CLIENT_ID, 
    import.meta.env.VITE_REDIRECT_TARGET, 
    Scopes.all
  );

  return sdk ? (<AppWithNavigation sdk={sdk} />) : (<></>);
}

function AppWithNavigation({ sdk }: { sdk: SpotifyApi }) {
  const [currentPage, setCurrentPage] = useState<Page>('select-items');

  return (
    <div className="app-container">
      <nav className="navigation">
        <div className="nav-left">
          <button 
            className={`testbed-link ${currentPage === 'testbed' ? 'active' : ''}`}
            onClick={() => setCurrentPage('testbed')}
            aria-label="Testbed"
          >
            <TestTubeSolid />
          </button>
          <div className="nav-title">Spotter</div>
        </div>
        <div className="nav-links">
          <button 
            className={`nav-link ${currentPage === 'select-items' ? 'active' : ''}`}
            onClick={() => setCurrentPage('select-items')}
          >
            Select Items
          </button>
        </div>
      </nav>
      
      <main className="main-content">
        {currentPage === 'select-items' && <SelectItemsPage sdk={sdk} />}
        {currentPage === 'testbed' && <TestbedPage sdk={sdk} />}
      </main>
    </div>
  );
}

export default App;
