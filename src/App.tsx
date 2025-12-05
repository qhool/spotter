import { useSpotify } from './hooks/useSpotify';
import { Scopes, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useState } from 'react'
import { SelectItemsPage } from './pages/SelectItemsPage';
import { TestbedPage } from './pages/TestbedPage';
import { RemixPage } from './pages/RemixPage';
import { TestTubeSolid, PageRightSolid, PageLeftSolid } from 'iconoir-react';
import { TrackContainer } from './data/TrackContainer';
import './App.css'

type Page = 'select-items' | 'remix' | 'testbed';

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
  const [selectedItems, setSelectedItems] = useState<TrackContainer[]>([]);

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
        <div className={`nav-links ${currentPage === 'select-items' ? 'select-active' : currentPage === 'remix' ? 'remix-active' : ''}`}>
          <button 
            className={`nav-link ${currentPage === 'select-items' ? 'active' : ''}`}
            onClick={() => setCurrentPage('select-items')}
          >
            {currentPage === 'remix' && <PageLeftSolid className="page-icon" />}
            Select Items
          </button>
          <button 
            className={`nav-link ${currentPage === 'remix' ? 'active' : ''}`}
            onClick={() => setCurrentPage('remix')}
          >
            Remix
            {currentPage === 'select-items' && <PageRightSolid className="page-icon" />}
          </button>
        </div>
      </nav>
      
      <main className="main-content">
        {currentPage === 'select-items' && (
          <SelectItemsPage 
            sdk={sdk} 
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
          />
        )}
        {currentPage === 'remix' && (
          <RemixPage 
            sdk={sdk} 
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
          />
        )}
        {currentPage === 'testbed' && <TestbedPage sdk={sdk} />}
      </main>
    </div>
  );
}

export default App;
