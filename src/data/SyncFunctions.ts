import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { RecentTracksContainer } from './TrackContainer';
import { SyncOperationConfig, SyncResult } from './SyncController';

export interface RecentTracksSyncValue {
  container: RecentTracksContainer;
  trackCount: number;
}

export interface RecentTracksSyncOptions {
  name?: string;
  sdk: SpotifyApi;
  maxItems?: number;
  onscreenIntervalMs?: number;
  offscreenIntervalMs?: number;
  runOnRegister?: boolean;
  onUpdate: (result: SyncResult<RecentTracksSyncValue>) => void;
  onError?: (error: unknown) => void;
}

export const RECENT_TRACKS_SYNC_NAME = 'recent-tracks-sync';
export const DEFAULT_RECENT_TRACKS_MAX_ITEMS = 1000;

/**
 * Builds a SyncOperationConfig for keeping Recently Played tracks up to date.
 */
export function createRecentTracksSyncOperation({
  name = RECENT_TRACKS_SYNC_NAME,
  sdk,
  maxItems = DEFAULT_RECENT_TRACKS_MAX_ITEMS,
  onscreenIntervalMs,
  offscreenIntervalMs,
  runOnRegister = true,
  onUpdate,
  onError
}: RecentTracksSyncOptions): SyncOperationConfig<RecentTracksSyncValue> {
  let lastKnownPlayedAt: string | null = null;
  let hasSyncedAtLeastOnce = false;

  const syncFn = async (): Promise<SyncResult<RecentTracksSyncValue>> => {
    const container = new RecentTracksContainer(sdk, maxItems);
    const playHistory = await container.getAllRawTracks();
    const latestPlayedAt = playHistory[0]?.played_at ?? null;
    const lastUpdated = latestPlayedAt ? new Date(latestPlayedAt) : null;
    const updated = hasSyncedAtLeastOnce ? latestPlayedAt !== lastKnownPlayedAt : true;

    hasSyncedAtLeastOnce = true;
    lastKnownPlayedAt = latestPlayedAt;

    return {
      updated,
      lastUpdated,
      value: {
        container,
        trackCount: playHistory.length
      }
    };
  };

  return {
    name,
    syncFn,
    onUpdate,
    onError,
    onscreenIntervalMs,
    offscreenIntervalMs,
    runOnRegister
  };
}
