import { describe, it, expect, vi } from 'vitest';
import { SyncController, SyncResult } from '../../data/SyncController';
import { registerRecentTracksSync } from '../../data/registerSyncOperations';
import { RecentTracksSyncValue } from '../../data/SyncFunctions';
import { MockSpotifySdk } from '../helpers/mockSpotifySdk';

const createTrack = (id: string) => ({
  id,
  name: id,
  artists: [{ name: 'Artist' } as any],
  album: { name: 'Album' } as any,
  duration_ms: 1000,
  explicit: false,
  external_urls: { spotify: '' },
  href: '',
  is_local: false,
  popularity: 0,
  preview_url: null,
  track_number: 1,
  disc_number: 1,
  type: 'track' as const,
  uri: `spotify:track:${id}`,
  is_playable: true,
  external_ids: { upc: '', isrc: '', ean: '' },
  available_markets: [],
  episode: false,
  track: true
});

describe('RecentTracks sync registration', () => {
  it('runs initial sync and responds to manual trigger', async () => {
    const sdk = new MockSpotifySdk(undefined, { recentLimit: 10 });
    sdk.addRecentTrack(createTrack('t1'), new Date('2023-01-01T00:00:00Z'));
    const controller = new SyncController();

    const onUpdate = vi.fn<(result: SyncResult<RecentTracksSyncValue>) => void>();
    const onReadyChange = vi.fn();

    const unregister = registerRecentTracksSync({
      controller,
      sdk: sdk as any,
      onUpdate,
      onReadyChange
    });

    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    expect(onReadyChange).toHaveBeenCalledWith(true);

    // Add another track and trigger manually
    sdk.addRecentTrack(createTrack('t2'), new Date('2023-01-02T00:00:00Z'));
    await controller.triggerSync('recent-tracks-sync');

    expect(onUpdate).toHaveBeenCalledTimes(2);
    const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0];
    expect(lastCall.value.trackCount).toBe(2);

    unregister();
    expect(onReadyChange).toHaveBeenCalledWith(false);
    controller.dispose();
  });
});
