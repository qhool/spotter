import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Wizard, WizardPane, WizardViewTitles } from '../components/Wizard';
import { SearchPane } from '../components/SearchPane';
import { TrackContainer, RemixContainer } from '../data/TrackContainer';
import { SelectedItemsPane } from '../components/SelectedItemsPane';
import { RemixPane } from '../components/RemixPane';
import { RemixOptions } from '../data/RemixFunctions';
import { ExportPane, ExportPaneExportType } from '../components/ExportPane';
import { ExportProgressOverlay } from '../components/ExportProgressOverlay';
import { ExportController, ProgressHandler } from '../data/ExportController';
import { JSONExportTarget, PlaylistExportTarget } from '../data/Exporters';

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
  const [demoExportType, setDemoExportType] = useState<ExportPaneExportType>('playlist');
  const [demoPlaylistName, setDemoPlaylistName] = useState('Spotter Demo Playlist');
  const [demoPlaylistDescription, setDemoPlaylistDescription] = useState(
    'Generated inside the Testbed wizard'
  );
  const [demoFilteredTrackCount, setDemoFilteredTrackCount] = useState<number | null>(null);
  const [isDemoExporting, setIsDemoExporting] = useState(false);
  const [demoLastCreatedPlaylistId, setDemoLastCreatedPlaylistId] = useState<string | null>(null);
  const [demoProgressDescription, setDemoProgressDescription] = useState('');
  const [demoProgressCompleted, setDemoProgressCompleted] = useState(0);
  const [demoProgressTracksProcessed, setDemoProgressTracksProcessed] = useState(0);
  const [demoProgressTotalTracks, setDemoProgressTotalTracks] = useState(0);
  const [isDemoExportCompleted, setIsDemoExportCompleted] = useState(false);
  const [demoCompletionMessage, setDemoCompletionMessage] = useState('');
  const [demoCompletionSpotifyId, setDemoCompletionSpotifyId] = useState<string | null>(null);

  const handleRemixContainerChange = useCallback(
    (container: RemixContainer<RemixOptions> | null) => {
      setRemixContainer(container);
    },
    []
  );

  const getDemoFilteredTracks = useCallback(async () => {
    if (!remixContainer) {
      return [];
    }
    const response = await remixContainer.getTracks(-1);
    return response.items.filter(track => !excludedTrackIds.has(track.id));
  }, [excludedTrackIds, remixContainer]);

  useEffect(() => {
    let cancelled = false;
    const updateFilteredTrackCount = async () => {
      if (!remixContainer) {
        if (!cancelled) {
          setDemoFilteredTrackCount(null);
        }
        return;
      }
      try {
        const filteredTracks = await getDemoFilteredTracks();
        if (!cancelled) {
          setDemoFilteredTrackCount(filteredTracks.length);
        }
      } catch (error) {
        console.error('Testbed: failed to count filtered tracks', error);
        if (!cancelled) {
          setDemoFilteredTrackCount(null);
        }
      }
    };
    updateFilteredTrackCount();
    return () => {
      cancelled = true;
    };
  }, [getDemoFilteredTracks, remixContainer]);

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

  const createDemoProgressHandler = useCallback(
    (totalTracks: number): ProgressHandler => {
      return (description: string, completed: number, numberProcessed: number) => {
        setDemoProgressDescription(description);
        setDemoProgressCompleted(completed);
        setDemoProgressTracksProcessed(numberProcessed);
        setDemoProgressTotalTracks(totalTracks);
      };
    },
    []
  );

  const handleDemoDismissCompletion = useCallback(() => {
    setIsDemoExportCompleted(false);
    setIsDemoExporting(false);
    setDemoCompletionMessage('');
    setDemoCompletionSpotifyId(null);
    setDemoProgressDescription('');
    setDemoProgressCompleted(0);
    setDemoProgressTracksProcessed(0);
    setDemoProgressTotalTracks(0);
  }, []);

  const handleDemoPlaylistNameChange = useCallback((value: string) => {
    setDemoPlaylistName(value);
    setDemoLastCreatedPlaylistId(null);
  }, []);

  const handleDemoPlaylistDescriptionChange = useCallback((value: string) => {
    setDemoPlaylistDescription(value);
  }, []);

  const demoExportActionLabel = useMemo(() => {
    if (isDemoExporting) {
      return 'Exporting...';
    }
    return demoExportType === 'json' ? 'Download JSON' : 'Create Playlist';
  }, [demoExportType, isDemoExporting]);

  const handleDemoExport = useCallback(async () => {
    if (!remixContainer) {
      return;
    }

    setIsDemoExporting(true);
    try {
      const filteredTracks = await getDemoFilteredTracks();
      const progressHandler = createDemoProgressHandler(filteredTracks.length);

      if (demoExportType === 'json') {
        const jsonTarget = new JSONExportTarget();
        const controller = new ExportController(jsonTarget, 3, progressHandler);

        await controller.append(filteredTracks);
        const jsonData = await jsonTarget.getData();

        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${demoPlaylistName.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

        setDemoCompletionMessage(`Successfully exported ${filteredTracks.length} tracks to JSON file`);
        setDemoCompletionSpotifyId(null);
        setIsDemoExportCompleted(true);
      } else {
        const playlistTarget = new PlaylistExportTarget(sdk, {
          name: demoPlaylistName,
          description: demoPlaylistDescription
        });
        const controller = new ExportController(playlistTarget, 5, progressHandler);

        await controller.append(filteredTracks);
        const playlistId = playlistTarget.getPlaylistId();
        setDemoLastCreatedPlaylistId(playlistId);
        setDemoCompletionMessage(
          `Created playlist "${demoPlaylistName}" with ${filteredTracks.length} tracks`
        );
        setDemoCompletionSpotifyId(playlistId);
        setIsDemoExportCompleted(true);
      }
    } catch (error) {
      console.error('Testbed export failed:', error);
      let errorMessage = 'Export failed. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('playlist')) {
          errorMessage = 'Failed to create playlist. Please check your Spotify permissions and try again.';
        } else if (error.message.includes('track')) {
          errorMessage = 'Failed to add tracks to playlist. Some tracks may not be available.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        }
      }
      alert(errorMessage);
      setIsDemoExporting(false);
      setIsDemoExportCompleted(false);
      setDemoProgressDescription('');
      setDemoProgressCompleted(0);
      setDemoProgressTracksProcessed(0);
      setDemoProgressTotalTracks(0);
    }
  }, [
    createDemoProgressHandler,
    demoExportType,
    demoPlaylistDescription,
    demoPlaylistName,
    getDemoFilteredTracks,
    remixContainer,
    sdk
  ]);
  const baseViewTitles = useMemo<WizardViewTitles>(
    () => ({
      1: ['Search', 'Selected Items', 'Track List', 'Export'],
      2: ['Search + Selected', 'Selected + Track List', 'Track List + Export'],
      3: ['Search + Selected + Track List', 'Selected + Track List + Export']
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
                  hasRemix={Boolean(remixContainer)}
                  filteredTrackCount={demoFilteredTrackCount}
                  exportType={demoExportType}
                  playlistName={demoPlaylistName}
                  playlistDescription={demoPlaylistDescription}
                  lastCreatedPlaylistId={demoLastCreatedPlaylistId}
                  isExporting={isDemoExporting}
                  actionButtonLabel={demoExportActionLabel}
                  disableExportButton={demoFilteredTrackCount === 0}
                  onExportTypeChange={setDemoExportType}
                  onPlaylistNameChange={handleDemoPlaylistNameChange}
                  onPlaylistDescriptionChange={handleDemoPlaylistDescriptionChange}
                  onExport={handleDemoExport}
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
      demoFilteredTrackCount,
      demoExportType,
      demoPlaylistName,
      demoPlaylistDescription,
      isDemoExporting,
      demoExportActionLabel,
      handleDemoExport,
      demoLastCreatedPlaylistId,
      handleDemoPlaylistNameChange,
      handleDemoPlaylistDescriptionChange
    ]
  );

  return (
    <div className="testbed-container">
      <ExportProgressOverlay
        description={demoProgressDescription}
        completed={demoProgressCompleted}
        tracksProcessed={demoProgressTracksProcessed}
        totalTracks={demoProgressTotalTracks}
        isVisible={isDemoExporting || isDemoExportCompleted}
        isCompleted={isDemoExportCompleted}
        completionMessage={demoCompletionMessage}
        spotifyPlaylistId={demoCompletionSpotifyId ?? undefined}
        onDismiss={handleDemoDismissCompletion}
      />
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
