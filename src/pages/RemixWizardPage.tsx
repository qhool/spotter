import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Substract } from 'iconoir-react';
import { SyncController } from '../data/SyncController';
import { Wizard, WizardPane, WizardViewTitles } from '../components/navigation/Wizard';
import { SearchPane } from '../components/panes/SearchPane';
import { TrackContainer, RemixContainer, RecentTracksContainer } from '../data/TrackContainer';
import { SelectedItemsPane } from '../components/panes/SelectedItemsPane';
import { RemixPane } from '../components/panes/RemixPane';
import { RemixMethod, RemixOptions } from '../data/RemixFunctions';
import { ExportPane } from '../components/panes/ExportPane';
import { RemixControls } from '../components/widgets/RemixControls';
import './RemixWizardPage.css';

interface RemixWizardPageProps {
  sdk: SpotifyApi;
  navSlot: Element | null;
  syncController: SyncController;
  recentTracksContainer?: RecentTracksContainer | null;
}

export function RemixWizardPage({ sdk, navSlot, recentTracksContainer }: RemixWizardPageProps) {
  const [selectedItems, setSelectedItems] = useState<TrackContainer<any>[]>([]);
  const [remixContainer, setRemixContainer] = useState<RemixContainer<RemixOptions> | null>(null);
  const [excludedTrackIds, setExcludedTrackIds] = useState<Set<string>>(() => new Set());
  const [itemOptionsById, setItemOptionsById] = useState<Partial<Record<string, RemixOptions>>>({});
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [remixMethod, setRemixMethod] = useState<RemixMethod>('shuffle');

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

  const handleToggleExcludeItem = useCallback((itemId: string) => {
    setItemOptionsById(prev => {
      const current = prev[itemId];
      const nextIsExcluded = !(current?.excludeFromRemix);
      const nextOptions = { ...(current ?? {}) };

      if (nextIsExcluded) {
        nextOptions.excludeFromRemix = true;
      } else {
        delete nextOptions.excludeFromRemix;
      }

      const nextMap = { ...prev } as Partial<Record<string, RemixOptions>>;
      if (Object.keys(nextOptions).length === 0) {
        delete nextMap[itemId];
      } else {
        nextMap[itemId] = nextOptions;
      }

      return nextMap;
    });
  }, []);

  const handleRemoveSelectedItem = useCallback((itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
    setItemOptionsById(prev => {
      if (!prev[itemId]) {
        return prev;
      }
      const next = { ...prev } as Partial<Record<string, RemixOptions>>;
      delete next[itemId];
      return next;
    });
  }, []);

  useEffect(() => {
    setItemOptionsById(prev => {
      const selectedIds = new Set(selectedItems.map(item => item.id));
      let changed = false;
      const next: Partial<Record<string, RemixOptions>> = {};

      for (const [itemId, options] of Object.entries(prev)) {
        if (selectedIds.has(itemId)) {
          next[itemId] = options;
        } else {
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [selectedItems]);

  const renderItemControls = useCallback(
    (item: TrackContainer<any>) => {
      const isExcluded = Boolean(itemOptionsById[item.id]?.excludeFromRemix);
      const classNames = ['control-button', 'exclude-button'];
      if (isExcluded) {
        classNames.push('is-active');
      }

      return (
        <button
          type="button"
          className={classNames.join(' ')}
          onClick={() => handleToggleExcludeItem(item.id)}
          aria-pressed={isExcluded}
          aria-label={isExcluded ? `Include ${item.name}` : `Exclude ${item.name}`}
          title={isExcluded ? 'Include in remix' : 'Exclude from remix'}
        >
          <Substract />
        </button>
      );
    },
    [itemOptionsById, handleToggleExcludeItem]
  );

  const wizardViewTitles = useMemo<WizardViewTitles>(
    () => ({
      1: ['Search', 'Selected', 'Remix', 'Export'],
      2: ['Select Items', 'Remix', 'Export']
    }),
    []
  );

  const selectedTrackCount = useMemo(
    () =>
      selectedItems.reduce((sum, item) => {
        const count =
          typeof (item as any).getTrackCount === 'function'
            ? (item as any).getTrackCount()
            : (item as any).totalCount;
        return sum + (typeof count === 'number' && isFinite(count) ? count : 0);
      }, 0),
    [selectedItems]
  );

  const remixTrackCount = remixContainer?.getTrackCount?.();
  const remixCount = typeof remixTrackCount === 'number' && isFinite(remixTrackCount) ? remixTrackCount : selectedTrackCount;

  const handleRefreshRemix = useCallback(async () => {
    if (remixContainer) {
      await remixContainer.clearRemixCache();
    }
    setRefreshCounter(prev => prev + 1);
  }, [remixContainer]);

  const remixControls = useMemo(
    () => (
      <RemixControls
        trackCount={remixCount}
        onRefresh={handleRefreshRemix}
        buttonClassName="track-list-pane__refresh-button"
        disabled={!remixContainer}
        remixMethod={remixMethod}
        methodOptions={['shuffle', 'concatenate']}
        onMethodChange={value => setRemixMethod(value as RemixMethod)}
      />
    ),
    [handleRefreshRemix, remixContainer, remixCount, remixMethod]
  );

  const wizardPanes = useMemo<WizardPane[]>(
    () => [
      {
        id: 'search',
        title: 'Search',
        render: () => (
          <SearchPane
            sdk={sdk}
            selectedItems={selectedItems}
            onAddItem={handleAddSelectedItem}
            recentTracksContainer={recentTracksContainer ?? undefined}
          />
        )
      },
      {
        id: 'selected-items',
        title: 'Selected Items',
        render: ({ panes }) => {
          const remixVisible = panes.get('track-list')?.isVisible ?? false;
          return (
            <SelectedItemsPane
              items={selectedItems}
              setItems={setSelectedItems}
              onRemoveItem={handleRemoveSelectedItem}
              emptyMessage="Add playlists or albums from the search results"
              disableDragToDelete={!panes.get('search')?.isVisible}
              renderItemControls={renderItemControls}
              headerControls={!remixVisible ? remixControls : null}
            />
          );
        }
      },
      {
        id: 'track-list',
        title: 'Track List',
        render: ({ panes }) => (
          <RemixPane
            sdk={sdk}
            selectedItems={selectedItems}
            excludedTrackIds={excludedTrackIds}
            setExcludedTrackIds={setExcludedTrackIds}
            onRemixContainerChange={handleRemixContainerChange}
            itemOptionsById={itemOptionsById}
            refreshTrigger={refreshCounter}
            onRefresh={handleRefreshRemix}
            trackCount={remixCount}
            showControls={panes.get('track-list')?.isVisible ?? false}
            remixMethod={remixMethod}
            setRemixMethod={setRemixMethod}
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
      remixContainer,
      recentTracksContainer,
      renderItemControls,
      itemOptionsById,
      refreshCounter,
      handleRefreshRemix,
      remixCount,
      remixControls,
      remixMethod,
      setRemixMethod
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
