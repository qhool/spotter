import { useSpotify } from './hooks/useSpotify';
import { Scopes, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useState, useEffect } from 'react'
import { SelectItemsPage } from './pages/SelectItemsPage';
import { TestbedPage } from './pages/TestbedPage';
import { RemixPage } from './pages/RemixPage';
import { ExportPage } from './pages/ExportPage';
import { HamburgerMenu } from './components/HamburgerMenu';
import { TrackContainer, RemixContainer } from './data/TrackContainer';
import { getRemixFunction, RemixOptions, RemixMethod } from './data/RemixFunctions';
import { SlideNav } from './components/SlideNav';
import './App.css'

type Page = 'select-items' | 'remix' | 'export' | 'testbed';

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
  const [remixContainer, setRemixContainer] = useState<RemixContainer<RemixOptions> | null>(null);
  const [remixMethod, setRemixMethod] = useState<RemixMethod>('shuffle');
  const [excludedTrackIds, setExcludedTrackIds] = useState<Set<string>>(new Set());

  // Create remix container when selectedItems or remixMethod changes
  useEffect(() => {
    console.log("useEffect triggered - selectedItems:", selectedItems.length, "remixMethod:", remixMethod);
    if (selectedItems.length > 0) {
      // Convert selectedItems to [TrackContainer, RemixOptions] tuples
      const inputs: [TrackContainer, RemixOptions][] = 
        selectedItems.map(container => [container, {}]);
      console.log("Creating remix container with inputs:", inputs);
      // Create RemixContainer with selected remix function
      const remixFunction = getRemixFunction(remixMethod);
      const container = new RemixContainer(
        sdk,
        inputs,
        remixFunction,
        "Remix",
        `Combined tracks from ${selectedItems.length} source(s) - ${remixMethod}`
      );
      
      console.log("Successfully created remix container:", container);
      setRemixContainer(container);
    } else {
      console.log("No selected items, clearing remix container");
      setRemixContainer(null);
    }
  }, [sdk, selectedItems, remixMethod]);

  const getPageIndex = (page: Page): number => {
    switch (page) {
      case 'select-items': return 0;
      case 'remix': return 1;
      case 'export': return 2;
      default: return 0; // Default to select-items for testbed
    }
  };

  // Only show SlideNav for main navigation pages, not testbed
  const showSlideNav = currentPage !== 'testbed';

  const navItems = [
    {
      text: 'Select Items',
      onClick: () => setCurrentPage('select-items')
    },
    {
      text: 'Remix',
      onClick: () => setCurrentPage('remix')
    },
    {
      text: 'Export',
      onClick: () => setCurrentPage('export')
    }
  ];

  return (
    <div className="app-container">
      <nav className="navigation">
        <div className="nav-left">
          <HamburgerMenu 
            sdk={sdk}
            onTestbedClick={() => setCurrentPage('testbed')}
            onMainAppClick={() => setCurrentPage('select-items')}
          />
          <div className="nav-title">Spotter</div>
        </div>
        <div className="nav-center">
          {showSlideNav && (
            <SlideNav 
              items={navItems}
              selectedIndex={getPageIndex(currentPage)}
            />
          )}
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
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            remixContainer={remixContainer}
            remixMethod={remixMethod}
            setRemixMethod={setRemixMethod}
            excludedTrackIds={excludedTrackIds}
            setExcludedTrackIds={setExcludedTrackIds}
          />
        )}
        {currentPage === 'export' && (
          <ExportPage 
            sdk={sdk} 
            remixContainer={remixContainer}
            excludedTrackIds={excludedTrackIds}
            setExcludedTrackIds={setExcludedTrackIds}
          />
        )}
        {currentPage === 'testbed' && (
          <TestbedPage sdk={sdk} />
        )}
      </main>
    </div>
  );
}

export default App;
