import { useCallback, useEffect, useMemo, useState } from 'react';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { RefreshCircleSolid } from 'iconoir-react';
import { TrackListPane } from './TrackListPane';
import { TrackContainer, RemixContainer } from '../../data/TrackContainer';
import { RemixMethod, RemixOptions, getRemixFunction } from '../../data/RemixFunctions';

interface RemixPaneProps {
  sdk: SpotifyApi;
  selectedItems: TrackContainer<any>[];
  excludedTrackIds: Set<string>;
  setExcludedTrackIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  onRemixContainerChange?: (container: RemixContainer<RemixOptions> | null) => void;
  itemOptionsById?: Partial<Record<string, RemixOptions>>;
  className?: string;
}

const REMIX_METHOD_OPTIONS: RemixMethod[] = ['shuffle', 'concatenate'];

export function RemixPane({
  sdk,
  selectedItems,
  excludedTrackIds,
  setExcludedTrackIds,
  onRemixContainerChange,
  itemOptionsById = {} as Partial<Record<string, RemixOptions>>,
  className
}: RemixPaneProps) {
  const [remixMethod, setRemixMethod] = useState<RemixMethod>('shuffle');
  const [remixContainer, setRemixContainer] = useState<RemixContainer<RemixOptions> | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const hasRemix = useMemo(() => Boolean(remixContainer), [remixContainer]);

  const handleMethodChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setRemixMethod(event.target.value as RemixMethod);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!remixContainer) {
      return;
    }
    await remixContainer.clearRemixCache();
    setRefreshCounter(prev => prev + 1);
  }, [remixContainer]);

  useEffect(() => {
    if (selectedItems.length === 0) {
      setRemixContainer(null);
      onRemixContainerChange?.(null);
      return;
    }

    const inputs: [TrackContainer<any>, RemixOptions][] = selectedItems.map(item => [
      item,
      itemOptionsById[item.id] ?? ({} as RemixOptions)
    ]);
    const remixFunction = getRemixFunction(remixMethod);
    const container = new RemixContainer(
      sdk,
      inputs,
      remixFunction,
      'Spotter Remix',
      `Combined tracks from ${selectedItems.length} source(s) - ${remixMethod}`
    );
    setRemixContainer(container);
    onRemixContainerChange?.(container);
  }, [sdk, selectedItems, remixMethod, onRemixContainerChange, itemOptionsById]);

  const controls = (
    <>
      <div className="track-list-pane__method-group">
        <label htmlFor="remix-method" className="control-label">
          Remix Method
        </label>
        <select
          id="remix-method"
          className="control-select"
          value={remixMethod}
          onChange={handleMethodChange}
        >
          {REMIX_METHOD_OPTIONS.map(option => (
            <option key={option} value={option}>
              {option === 'shuffle' ? 'Shuffle' : 'Concatenate'}
            </option>
          ))}
        </select>
      </div>

      {hasRemix && (
        <button
          type="button"
          className="track-list-pane__refresh-button"
          onClick={handleRefresh}
          title="Refresh remix"
        >
          <RefreshCircleSolid className="refresh-icon" />
          Refresh
        </button>
      )}
    </>
  );

  return (
    <TrackListPane
      remixContainer={remixContainer}
      excludedTrackIds={excludedTrackIds}
      setExcludedTrackIds={setExcludedTrackIds}
      refreshTrigger={refreshCounter}
      controls={controls}
      className={className}
    />
  );
}
