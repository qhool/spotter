import { SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Refresh } from 'iconoir-react';
import { TrackList } from '../components/containers/TrackList';
import { RecentTracksContainer } from '../data/TrackContainer';
import './RecentTracksPage.css';

interface RecentTracksPageProps {
  sdk: SpotifyApi;
  navSlot: Element | null;
}

const RECENT_TRACKS_LIMIT = 1000;

export function RecentTracksPage({ sdk, navSlot }: RecentTracksPageProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [trackCount, setTrackCount] = useState<number | null>(null);

  const recentTracksContainer = useMemo(
    () => new RecentTracksContainer(sdk, RECENT_TRACKS_LIMIT),
    [sdk, refreshTrigger]
  );

  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(
    () => recentTracksContainer.getLastUpdated()
  );

  useEffect(() => {
    setLastUpdatedAt(recentTracksContainer.getLastUpdated());
  }, [recentTracksContainer]);

  const handleRefresh = useCallback(() => {
    setTrackCount(null);
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const formattedTimestamp = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Never';

  const trackSummary = trackCount === null
    ? 'Loading tracks…'
    : `${trackCount} most recent tracks (limit ${RECENT_TRACKS_LIMIT})`;

  const handleTracksLoaded = useCallback((tracks: Track[]) => {
    setTrackCount(tracks.length);
    setLastUpdatedAt(recentTracksContainer.getLastUpdated());
  }, [recentTracksContainer]);

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
          <button type="button" className="recent-tracks-refresh" onClick={handleRefresh}>
            <Refresh className="recent-tracks-refresh__icon" />
            Refresh feed
          </button>
          <span className="recent-tracks-toolbar__meta">Updated {formattedTimestamp}</span>
        </div>
      </section>

      <section className="recent-tracks-panel" aria-live="polite">
        <div className="recent-tracks-panel__body">
          <TrackList
            trackContainer={recentTracksContainer}
            refreshTrigger={refreshTrigger}
            onTracksLoaded={handleTracksLoaded}
          />
        </div>
      </section>
    </div>
  );
}
