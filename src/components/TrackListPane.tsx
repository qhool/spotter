import { ReactNode, useMemo } from 'react';
import { TrackList } from './TrackList';
import { RemixContainer } from '../data/TrackContainer';
import { RemixOptions } from '../data/RemixFunctions';
import './TrackListPane.css';

interface TrackListPaneProps {
  remixContainer: RemixContainer<RemixOptions> | null;
  excludedTrackIds: Set<string>;
  setExcludedTrackIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  emptyMessage?: ReactNode;
  className?: string;
  controls?: ReactNode;
  refreshTrigger?: number;
}

export function TrackListPane({
  remixContainer,
  excludedTrackIds,
  setExcludedTrackIds,
  emptyMessage = 'Select items to see remixed output',
  className,
  controls,
  refreshTrigger = 0
}: TrackListPaneProps) {
  const hasRemix = Boolean(remixContainer);

  const containerClassName = useMemo(() => {
    return ['track-list-pane', className].filter(Boolean).join(' ');
  }, [className]);

  return (
    <div className="select-items-container remix-page">
      <div className="content-area">
        <div className="right-panel">
          <div className={containerClassName}>
            {controls && <div className="track-list-pane__controls">{controls}</div>}

            <div className="track-list-pane__list">
              {hasRemix ? (
                <div className="playlist-container">
                  <TrackList
                    trackContainer={remixContainer!}
                    refreshTrigger={refreshTrigger}
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
        </div>
      </div>
    </div>
  );
}
