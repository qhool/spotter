import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useState, useMemo, useCallback } from 'react';
import { Wizard, WizardPane, WizardViewTitles } from '../components/Wizard';
import { SearchPane } from '../components/SearchPane';
import { TrackContainer, RemixContainer } from '../data/TrackContainer';
import { SelectedItemsPane } from '../components/SelectedItemsPane';
import { RemixPane } from '../components/RemixPane';
import { RemixOptions } from '../data/RemixFunctions';
import { ExportPane } from '../components/ExportPane';

interface TestbedPageProps {
  sdk: SpotifyApi;
}

export function TestbedPage({ sdk }: TestbedPageProps) {
  const [demoWindowSize, setDemoWindowSize] = useState(1);
  const [selectedItems, setSelectedItems] = useState<TrackContainer<any>[]>([]);
  const [remixContainer, setRemixContainer] = useState<RemixContainer<RemixOptions> | null>(
    null
  );
  const [excludedTrackIds, setExcludedTrackIds] = useState<Set<string>>(() => new Set());

  const handleRemixContainerChange = useCallback(
    (container: RemixContainer<RemixOptions> | null) => {
      setRemixContainer(container);
    },
    []
  );

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
  const baseViewTitles = useMemo<WizardViewTitles>(
    () => ({
      1: ['Search', 'Selected Items', 'Remix', 'Export'],
      2: ['Search', 'Remix', 'Export'],
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
          <SearchPane sdk={sdk} selectedItems={selectedItems} onAddItem={handleAddSelectedItem} />
        )
      },
      {
        id: 'selected-items',
        title: 'Selected Items',
        render: ({ panes }) => {
          return (
            <SelectedItemsPane
              items={selectedItems}
              setItems={setSelectedItems}
              onRemoveItem={handleRemoveSelectedItem}
              title="Selected Items"
              emptyMessage="Add playlists or albums from the search results"
              disableDragToDelete={!panes.get('search')?.isVisible}
            />
          );
        }
      },
      {
        id: 'track-list',
        title: 'Track List',
        render: () => (
          <RemixPane
            sdk={sdk}
            selectedItems={selectedItems}
            excludedTrackIds={excludedTrackIds}
            setExcludedTrackIds={setExcludedTrackIds}
            onRemixContainerChange={handleRemixContainerChange}
          />
        )
      },
      {
        id: 'export',
        title: 'Export',
        render: () => (
          <div className="select-items-container">
            <div className="content-area">
              <div className="right-panel">
                <ExportPane
                  sdk={sdk}
                  remixContainer={remixContainer}
                  excludedTrackIds={excludedTrackIds}
                  initialPlaylistName="Spotter Demo Playlist"
                  initialPlaylistDescription="Generated inside the Testbed wizard"
                />
              </div>
            </div>
          </div>
        )
      }
    ],
    [
      sdk,
      selectedItems,
      handleAddSelectedItem,
      setSelectedItems,
      handleRemoveSelectedItem,
      excludedTrackIds,
      setExcludedTrackIds,
      handleRemixContainerChange,
      remixContainer
    ]
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
  <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', overflow: 'hidden' }}>
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
