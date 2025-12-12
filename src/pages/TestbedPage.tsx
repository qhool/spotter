import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useState, useMemo, useCallback } from 'react';
import { Wizard, WizardPane, WizardViewTitles } from '../components/Wizard';
import { SearchPane } from '../components/SearchPane';
import { TrackContainer } from '../data/TrackContainer';
import { PlusCircle } from 'iconoir-react';
import { SelectedItemsPane } from '../components/SelectedItemsPane';

interface TestbedPageProps {
  sdk: SpotifyApi;
}

export function TestbedPage({ sdk }: TestbedPageProps) {
  const [demoWindowSize, setDemoWindowSize] = useState(1);
  const [selectedItems, setSelectedItems] = useState<TrackContainer<any>[]>([]);

  const handleAddSelectedItem = useCallback((item: TrackContainer<any>) => {
    setSelectedItems(prev => {
      if (prev.some(existing => existing.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const handleRemoveSelectedItem = useCallback((itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const renderSearchControls = useCallback(
    (item: TrackContainer<any>) => (
      <button
        className="control-button add-button"
        onClick={() => handleAddSelectedItem(item)}
        aria-label={`Add ${item.name} to selection`}
      >
        <PlusCircle />
      </button>
    ),
    [handleAddSelectedItem]
  );
  const baseViewTitles = useMemo<WizardViewTitles>(
    () => ({
      1: ['Search', 'Selected Items', 'Remix', 'Export'],
      2: ['Search + Selected', 'Selected + Remix', 'Remix + Export'],
      3: ['Search + Selected + Remix', 'Selected + Remix + Export']
    }),
    []
  );

  const wizardViewTitles = useMemo<WizardViewTitles>(() => {
    const titles: WizardViewTitles = {};
    if (baseViewTitles[1]) {
      titles[1] = baseViewTitles[1];
    }
    if (demoWindowSize >= 2 && baseViewTitles[2]) {
      titles[2] = baseViewTitles[2];
    }
    if (demoWindowSize >= 3 && baseViewTitles[3]) {
      titles[3] = baseViewTitles[3];
    }
    return titles;
  }, [baseViewTitles, demoWindowSize]);
  const wizardPanes = useMemo<WizardPane[]>(
    () => [
      {
        id: 'search',
        title: 'Search',
        render: () => (
          <div className="select-items-container">
            <div className="content-area">
              <div className="left-panel">
                <SearchPane
                  sdk={sdk}
                  selectedItems={selectedItems}
                  renderControls={renderSearchControls}
                />
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'selected-items',
        title: 'Selected Items',
        render: () => (
          <div className="select-items-container">
            <div className="content-area">
              <div className="right-panel">
                <SelectedItemsPane
                  items={selectedItems}
                  onRemoveItem={handleRemoveSelectedItem}
                  title="Selected Items"
                  emptyMessage="Add playlists or albums from the search results"
                />
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'remix',
        title: 'Remix',
        render: () => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <h4 style={{ margin: 0 }}>Remix</h4>
              <p style={{ margin: '0.25rem 0 0', color: '#b3b3b3' }}>
                Blend tracks, adjust order, and audition transitions.
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'export',
        title: 'Export',
        render: () => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <h4 style={{ margin: 0 }}>Export</h4>
              <p style={{ margin: '0.25rem 0 0', color: '#b3b3b3' }}>
                Send finished playlists back to Spotify or share externally.
              </p>
            </div>
          </div>
        )
      }
    ],
    [sdk, selectedItems, renderSearchControls, handleRemoveSelectedItem]
  );

  return (
    <div className="testbed-container">
      <div style={{ flex: 1, display: 'flex', gap: '1.5rem', minHeight: 0 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '60px',
            justifyContent: 'center',
            height: '100%'
          }}
        >
          <span style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Panes</span>
          <input
            id="wizard-pane-slider"
            type="range"
            min={1}
            max={3}
            step={1}
            value={demoWindowSize}
            onChange={event => setDemoWindowSize(Number(event.target.value))}
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '180px' }}
          />
          <span style={{ marginTop: '0.5rem', fontWeight: 600 }}>{demoWindowSize}</span>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <Wizard
            className="testbed-wizard"
            panes={wizardPanes}
            visibleRange={1}
            viewTitles={wizardViewTitles}
          />
        </div>
      </div>
    </div>
  );
}
