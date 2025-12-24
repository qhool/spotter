import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { SyncController, SyncResult } from './SyncController';
import {
  createRecentTracksSyncOperation,
  DEFAULT_RECENT_TRACKS_MAX_ITEMS,
  RecentTracksSyncValue,
  RECENT_TRACKS_SYNC_NAME
} from './SyncFunctions';

export interface RecentTracksSyncCallbacks {
  onUpdate: (result: SyncResult<RecentTracksSyncValue>) => void;
  onReadyChange?: (ready: boolean) => void;
  onError?: (error: unknown) => void;
}

export interface RegisterRecentTracksOptions extends RecentTracksSyncCallbacks {
  sdk: SpotifyApi;
  controller: SyncController;
  maxItems?: number;
  onscreenIntervalMs?: number;
  offscreenIntervalMs?: number;
}

/**
 * Registers the recent-tracks sync operation on a provided SyncController.
 * Returns a disposer to unregister/mark not-ready.
 */
export function registerRecentTracksSync({
  controller,
  sdk,
  onUpdate,
  onReadyChange,
  onError = error => console.error('Recent tracks sync failed', error),
  maxItems = DEFAULT_RECENT_TRACKS_MAX_ITEMS,
  onscreenIntervalMs = 2 * 60_000,
  offscreenIntervalMs = 10 * 60_000
}: RegisterRecentTracksOptions): () => void {
  const config = createRecentTracksSyncOperation({
    name: RECENT_TRACKS_SYNC_NAME,
    sdk,
    maxItems,
    onscreenIntervalMs,
    offscreenIntervalMs,
    runOnRegister: true,
    onUpdate,
    onError
  });

  try {
    controller.registerOperation(config);
    onReadyChange?.(true);
  } catch (error) {
    console.error('Failed to register recent tracks sync:', error);
  }

  return () => {
    onReadyChange?.(false);
    controller.unregisterOperation(config.name);
  };
}
