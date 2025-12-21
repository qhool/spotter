import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Refresh } from 'iconoir-react';
import { TrackList } from '../components/containers/TrackList';
import { RecentTracksContainer } from '../data/TrackContainer';
import { SyncController, SyncResult } from '../data/SyncController';
import { RecentTracksSyncValue, RECENT_TRACKS_SYNC_NAME, DEFAULT_RECENT_TRACKS_MAX_ITEMS } from '../data/SyncFunctions';
import { LoadingAnimation } from '../components/widgets/LoadingAnimation';
import './RecentTracksPage.css';

interface RecentTracksPageProps {
  navSlot: Element | null;
  syncController: SyncController;
  recentTracksState: SyncResult<RecentTracksSyncValue> | null;
  recentTracksSyncReady: boolean;
}

export function RecentTracksPage({
  navSlot,
  syncController,
  recentTracksState,
  recentTracksSyncReady
}: RecentTracksPageProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const previousContainerRef = useRef<RecentTracksContainer | null>(null);

  const recentTracksContainer = recentTracksState?.value.container ?? null;
  const trackCount = recentTracksState?.value.trackCount ?? null;
  const lastUpdatedAt = recentTracksState?.lastUpdated ?? recentTracksContainer?.getLastUpdated() ?? null;

  useEffect(() => {
    if (recentTracksContainer && previousContainerRef.current !== recentTracksContainer) {
      previousContainerRef.current = recentTracksContainer;
      setRefreshKey(prev => prev + 1);
    }
  }, [recentTracksContainer]);

  const handleRefresh = useCallback(() => {
    if (isRefreshing || !recentTracksSyncReady) {
      return;
    }
    setIsRefreshing(true);
    syncController
      .triggerSync(RECENT_TRACKS_SYNC_NAME)
      .catch(error => {
        console.error('Failed to refresh recent tracks:', error);
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, [isRefreshing, recentTracksSyncReady, syncController]);

  const formattedTimestamp = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Never';

  const trackSummary = trackCount === null
    ? 'Loading tracks…'
    : `${trackCount} most recent tracks (limit ${DEFAULT_RECENT_TRACKS_MAX_ITEMS})`;

  return (
    <div className="recent-tracks-page">
      {navSlot
        ? createPortal(
            <div className="nav-slot-content nav-slot-recent-tracks">
              <Clock className="nav-slot-recent-tracks__icon" />
              Recently Played
            </div>,
            navSlot
          )
        : null}

      <section className="recent-tracks-toolbar" aria-live="polite">
        <p className="recent-tracks-toolbar__count">{trackSummary}</p>
        <div className="recent-tracks-toolbar__actions">
          <button
            type="button"
            className="recent-tracks-refresh"
            onClick={handleRefresh}
            disabled={isRefreshing || !recentTracksSyncReady}
          >
            <Refresh className="recent-tracks-refresh__icon" />
            {isRefreshing ? 'Refreshing…' : 'Refresh feed'}
          </button>
          <span className="recent-tracks-toolbar__meta">
            {isRefreshing ? 'Updating…' : `Updated ${formattedTimestamp}`}
          </span>
        </div>
      </section>

      <section className="recent-tracks-panel" aria-live="polite">
        <div className="recent-tracks-panel__body">
          {recentTracksContainer ? (
            <TrackList
              trackContainer={recentTracksContainer}
              refreshTrigger={refreshKey}
            />
          ) : (
            <LoadingAnimation label="Loading recent tracks…" />
          )}
        </div>
      </section>
    </div>
  );
}
