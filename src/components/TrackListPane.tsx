import { ReactNode, useCallback, useMemo, useState } from 'react';
import { RefreshCircleSolid } from 'iconoir-react';
import { TrackList } from './TrackList';
import { RemixContainer } from '../data/TrackContainer';
import { RemixMethod, RemixOptions } from '../data/RemixFunctions';
import './TrackListPane.css';

interface TrackListPaneProps {
  remixContainer: RemixContainer<RemixOptions> | null;
  remixMethod: RemixMethod;
  setRemixMethod: React.Dispatch<React.SetStateAction<RemixMethod>>;
  excludedTrackIds: Set<string>;
  setExcludedTrackIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  emptyMessage?: ReactNode;
  className?: string;
}

const REMIX_METHOD_OPTIONS: RemixMethod[] = ['shuffle', 'concatenate'];

export function TrackListPane({
  remixContainer,
  remixMethod,
  setRemixMethod,
  excludedTrackIds,
  setExcludedTrackIds,
  emptyMessage = 'Select items to see remixed output',
  className
}: TrackListPaneProps) {
  const [refreshCounter, setRefreshCounter] = useState(0);

  const hasRemix = Boolean(remixContainer);

  const containerClassName = useMemo(() => {
    return ['track-list-pane', className].filter(Boolean).join(' ');
  }, [className]);

  const handleMethodChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setRemixMethod(event.target.value as RemixMethod);
    },
    [setRemixMethod]
  );

  const handleRefresh = useCallback(async () => {
    if (!remixContainer) {
      return;
    }
    await remixContainer.clearRemixCache();
    setRefreshCounter(prev => prev + 1);
  }, [remixContainer]);

  return (
    <div className={containerClassName}>
      <div className="track-list-pane__controls">
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
      </div>

      <div className="track-list-pane__list">
        {hasRemix ? (
          <div className="playlist-container">
            <TrackList
              trackContainer={remixContainer!}
              refreshTrigger={refreshCounter}
              excludedTrackIds={excludedTrackIds}
              setExcludedTrackIds={setExcludedTrackIds}
            />
          </div>
        ) : (
          <div className="playlist-container">
            <div className="no-results">{emptyMessage}</div>
          </div>
        )}
      </div>
    </div>
  );
}
