import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useState, useMemo, useCallback } from 'react';
import { Wizard, WizardPane, WizardViewTitles } from '../components/Wizard';
import { SearchPane } from '../components/SearchPane';
import { TrackContainer, RemixContainer } from '../data/TrackContainer';
import { SelectedItemsPane } from '../components/SelectedItemsPane';
import { RemixPane } from '../components/RemixPane';
import { RemixOptions } from '../data/RemixFunctions';
import { ExportPane } from '../components/ExportPane';
import './RemixWizardPage.css';

interface RemixWizardPageProps {
  sdk: SpotifyApi;
  navSlot: Element | null;
}

export function RemixWizardPage({ sdk, navSlot }: RemixWizardPageProps) {
  const [selectedItems, setSelectedItems] = useState<TrackContainer<any>[]>([]);
  const [remixContainer, setRemixContainer] = useState<RemixContainer<RemixOptions> | null>(null);
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

  const wizardViewTitles = useMemo<WizardViewTitles>(
    () => ({
      1: ['Search', 'Selected', 'Remix', 'Export'],
      2: ['Select Items', 'Remix', 'Export']
    }),
    []
  );

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
        render: ({ panes }) => (
          <SelectedItemsPane
            items={selectedItems}
            setItems={setSelectedItems}
            onRemoveItem={handleRemoveSelectedItem}
            title="Selected Items"
            emptyMessage="Add playlists or albums from the search results"
            disableDragToDelete={!panes.get('search')?.isVisible}
          />
        )
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
                  initialPlaylistName="Spotter Remix Playlist"
                  initialPlaylistDescription="Generated with the Remix Wizard"
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
    <div className="remix-wizard-page">
      <div className="remix-wizard-content">
        <Wizard
          className="remix-wizard"
          panes={wizardPanes}
          visibleRange={1}
          viewTitles={wizardViewTitles}
          navSlot={navSlot}
          responsiveBreakpoints={[
            { minWidth: 1440, panes: 3 },
            { minWidth: 820, panes: 2 },
            { minWidth: 0, panes: 1 }
          ]}
        />
      </div>
    </div>
  );
}
