import { describe, it, expect, vi } from 'vitest';
import { Track } from '@spotify/web-api-ts-sdk';
import { JSONExportTarget, PlaylistExportTarget, QueueExportTarget } from '../../data/Exporters';
import { MockSpotifySdk } from '../helpers/mockSpotifySdk';

const track = (id: string): Track => ({ id, uri: `spotify:track:${id}`, type: 'track', is_local: false } as Track);

describe('JSONExportTarget & InMemoryExportTarget', () => {
  it('adds, removes, and serializes tracks', async () => {
    const target = new JSONExportTarget();
    await target.initialize();
    await target.addTracks([track('a'), track('b'), track('c')]);
    expect(await target.getCurrentTrackIDs()).toEqual(['a', 'b', 'c']);

    await target.removeTracks(1, undefined);
    expect(await target.getCurrentTrackIDs()).toEqual(['a']);
    await target.addTracks([track('b'), track('c')]);
    await target.removeTracks(1, 2);
    expect(await target.getCurrentTrackIDs()).toEqual(['a', 'c']);
    expect(target.getData()).toContain('"id": "a"');
    expect(target.getOverallDescription()).toBe('Exporting to JSON format');
    expect(target.getInitializationDescription()).toBe('Preparing JSON export');
  });
});

describe('PlaylistExportTarget', () => {
  it('creates new playlist on initialize and adds/removes tracks', async () => {
    const sdk = new MockSpotifySdk();
    const target = new PlaylistExportTarget(sdk as any, { name: 'New List' });
    expect(target.getInitializationDescription()).toBe('Creating playlist');
    expect(target.getOverallDescription()).toBe('Creating Spotify playlist "New List"');
    await target.initialize();
    const id = target.getPlaylistId();
    expect(id).toMatch(/playlist-/);

    await target.addTracks([track('a'), track('b')]);
    expect(await target.getCurrentTrackIDs()).toEqual(['a', 'b']);

    await target.removeTracks(0, 1);
    expect(await target.getCurrentTrackIDs()).toEqual(['b']);
  });

  it('skips addTracks when URIs missing', async () => {
    const sdk = new MockSpotifySdk();
    const target = new PlaylistExportTarget(sdk as any, { name: 'Empty' });
    await target.initialize();
    await target.addTracks([{ id: 'x', type: 'track', is_local: false } as Track]);
    expect(await target.getCurrentTrackIDs()).toEqual([]);
  });

  it('throws when no playlist id or name is provided', async () => {
    const sdk = new MockSpotifySdk();
    const target = new PlaylistExportTarget(sdk as any, { name: '' as any });
    await expect(target.initialize()).rejects.toThrow('No playlist ID or name provided');
  });

  it('falls back to generic description when no id or name provided', () => {
    const target = new PlaylistExportTarget(new MockSpotifySdk() as any, { name: '' as any });
    expect(target.getOverallDescription()).toBe('Creating Spotify playlist');
  });

  it('passes through a custom description when creating playlists', async () => {
    const sdk = new MockSpotifySdk();
    const spy = vi.spyOn(sdk.playlists, 'createPlaylist');
    const target = new PlaylistExportTarget(sdk as any, { name: 'Custom', description: 'My picks' });

    await target.initialize();
    expect(spy).toHaveBeenCalledWith('test-user-id', expect.objectContaining({ description: 'My picks' }));
  });

  it('falls back to default description when playlistDescription is falsy at creation', async () => {
    const sdk = new MockSpotifySdk();
    const spy = vi.spyOn(sdk.playlists, 'createPlaylist');
    const target = new PlaylistExportTarget(sdk as any, { name: 'Default Desc' });
    (target as any).playlistDescription = undefined;

    await target.initialize();
    expect(spy).toHaveBeenCalledWith('test-user-id', expect.objectContaining({ description: 'Created by Spotter' }));
  });

  it('reports descriptions and batch size for existing playlist', async () => {
    const sdk = new MockSpotifySdk();
    const target = new PlaylistExportTarget(sdk as any, { id: 'existing' });

    expect(target.getOverallDescription()).toBe('Updating existing Spotify playlist');
    expect(target.getInitializationDescription()).toBe('Preparing playlist');
    expect(target.getMaxAddBatchSize()).toBe(10);
  });

  it('does not call update when removal is out of bounds', async () => {
    const sdk = new MockSpotifySdk();
    sdk.setExistingTracks([track('keep')]);
    const target = new PlaylistExportTarget(sdk as any, { id: 'existing' });
    const spy = vi.spyOn(sdk.playlists, 'updatePlaylistItems');

    await target.removeTracks(5, 10);
    await target.removeTracks(0, 0);

    expect(spy).not.toHaveBeenCalled();
  });

  it('fetches paginated playlist tracks and filters falsy ids', async () => {
    const sdk = new MockSpotifySdk();
    const tracks = Array.from({ length: 55 }, (_, i) => track(`t${i + 1}`));
    tracks[10] = { ...tracks[10], id: '' } as Track;
    sdk.setExistingTracks(tracks as Track[]);

    const target = new PlaylistExportTarget(sdk as any, { id: 'existing' });
    const fetched = await target.getCurrentTracks();
    expect(fetched).toHaveLength(55);

    const ids = await target.getCurrentTrackIDs();
    expect(ids).toHaveLength(54);
    expect(ids).not.toContain('');
  });

  it('throws when accessing playlist before initialization', async () => {
    const target = new PlaylistExportTarget(new MockSpotifySdk() as any, { name: 'Later' });
    await expect(target.addTracks([track('x')])).rejects.toThrow('Playlist not initialized. Call initialize() first.');
    await expect(() => target.getPlaylistId()).toThrow('Playlist not initialized');
  });
});

describe('QueueExportTarget', () => {
  it('queues tracks and reads back queue IDs', async () => {
    const sdk = new MockSpotifySdk();
    sdk.setAvailableDevices([{ id: 'dev1', name: 'Device 1' }]);
    const target = new QueueExportTarget(sdk as any, { deviceId: 'dev1', deviceName: 'Device 1' });

    await target.initialize();
    await target.addTracks([track('q1'), track('q2')]);
    const ids = await target.getCurrentTrackIDs();
    expect(ids).toEqual(['q1', 'q2']);
  });

  it('throws when device id missing', () => {
    expect(() => new QueueExportTarget(new MockSpotifySdk() as any, { deviceId: '' as any })).toThrow();
  });

  it('warns when device lookup fails but still checks queue access', async () => {
    const sdk = new MockSpotifySdk();
    sdk.player.getAvailableDevices = vi.fn(async () => {
      throw new Error('device fetch failed');
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sdk.setAvailableDevices([{ id: 'dev1', name: 'Device 1' }]);
    const target = new QueueExportTarget(sdk as any, { deviceId: 'dev1', deviceName: 'Device 1' });

    await target.initialize();
    expect(warnSpy).toHaveBeenCalledWith(
      'QueueExportTarget: failed to refresh Spotify devices during initialization',
      expect.any(Error)
    );
    warnSpy.mockRestore();
  });

  it('throws user-friendly error when queue is inaccessible', async () => {
    const sdk = new MockSpotifySdk();
    sdk.player.getUsersQueue = vi.fn(async () => {
      throw new Error('queue down');
    });
    const target = new QueueExportTarget(sdk as any, { deviceId: 'dev2', deviceName: 'Device 2' });

    await expect(target.initialize()).rejects.toThrow(
      'Unable to access your Spotify queue. Make sure the device "Device 2" is active in Spotify, then try again.'
    );
  });

  it('skips missing URIs and continues after parse errors', async () => {
    const sdk = new MockSpotifySdk();
    sdk.setAvailableDevices([{ id: 'dev1', name: 'Device 1' }]);
    const addSpy = vi
      .fn()
      .mockRejectedValueOnce(new SyntaxError('Unexpected token'))
      .mockResolvedValueOnce(undefined);
    sdk.player.addItemToPlaybackQueue = addSpy as any;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const target = new QueueExportTarget(sdk as any, { deviceId: 'dev1', deviceName: 'Device 1' });

    await target.initialize();
    await target.addTracks(
      [
        { id: 'no-uri', type: 'track', is_local: false } as Track,
        track('parse-error'),
        track('ok')
      ]
    );

    expect(addSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('throws friendly error when queueing fails for a track', async () => {
    const sdk = new MockSpotifySdk();
    sdk.setAvailableDevices([{ id: 'dev1', name: 'Device 1' }]);
    const addSpy = vi.fn().mockRejectedValue(new Error('network broke'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    sdk.player.addItemToPlaybackQueue = addSpy as any;
    const target = new QueueExportTarget(sdk as any, { deviceId: 'dev1', deviceName: 'Device 1' });

    await target.initialize();
    await expect(target.addTracks([track('bad')])).rejects.toThrow(
      'Spotify couldn\'t queue "bad" on Device 1. Make sure the device is active in Spotify and try again.'
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('returns queue IDs and filters non-track items; falls back to empty when fetch fails', async () => {
    const sdk = new MockSpotifySdk();
    sdk.player.getUsersQueue = vi.fn(async () => ({
      currently_playing: track('current'),
      queue: [track('next'), { type: 'episode' } as any, null as any]
    }));
    const target = new QueueExportTarget(sdk as any, { deviceId: 'dev1' });

    await target.initialize();
    expect(await target.getCurrentTrackIDs()).toEqual(['current', 'next']);

    sdk.player.getUsersQueue = vi.fn(async () => {
      throw new Error('queue read failed');
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await target.getCurrentTrackIDs()).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('treats string parse errors as retryable warnings', async () => {
    const sdk = new MockSpotifySdk();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sdk.player.addItemToPlaybackQueue = vi.fn().mockRejectedValue('Unexpected token <html>');
    const target = new QueueExportTarget(sdk as any, { deviceId: 'dev1' });

    await target.addTracks([{ uri: 'spotify:track:onlyuri', type: 'track', is_local: false } as Track]);
    expect(warnSpy).toHaveBeenCalledWith(
      'QueueExportTarget: parse error ignored (Spotify queue endpoint returned invalid JSON)',
      expect.objectContaining({ track: 'spotify:track:onlyuri', error: 'Unexpected token <html>' })
    );
    warnSpy.mockRestore();
  });

  it('logs parse errors using the track name when provided', async () => {
    const sdk = new MockSpotifySdk();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sdk.player.addItemToPlaybackQueue = vi.fn().mockRejectedValue(new SyntaxError('Unexpected token ?'));
    const target = new QueueExportTarget(sdk as any, { deviceId: 'dev1' });

    await target.addTracks([{ name: 'Named track', uri: 'spotify:track:named', type: 'track', is_local: false } as Track]);
    expect(warnSpy).toHaveBeenCalledWith(
      'QueueExportTarget: parse error ignored (Spotify queue endpoint returned invalid JSON)',
      expect.objectContaining({ track: 'Named track' })
    );
    warnSpy.mockRestore();
  });

  it('surfaces URI when id/name are missing in error cases', async () => {
    const sdk = new MockSpotifySdk();
    sdk.player.addItemToPlaybackQueue = vi.fn().mockRejectedValue(new Error('fail'));
    const target = new QueueExportTarget(sdk as any, { deviceId: 'dev1' });

    await expect(
      target.addTracks([{ uri: 'spotify:track:nolid', type: 'track', is_local: false } as Track])
    ).rejects.toThrow(
      'Spotify couldn\'t queue "spotify:track:nolid" on dev1. Make sure the device is active in Spotify and try again.'
    );
  });

  it('reports descriptions and batch size', async () => {
    const sdk = new MockSpotifySdk();
    const target = new QueueExportTarget(sdk as any, { deviceId: 'dev1', deviceName: 'Kitchen' });
    expect(target.getOverallDescription()).toBe('Adding tracks to your Spotify queue on Kitchen');
    expect(target.getInitializationDescription()).toBe('Checking your current playback queue');
    expect(target.getMaxAddBatchSize()).toBe(1);

    const targetNoName = new QueueExportTarget(sdk as any, { deviceId: 'dev2' });
    expect(targetNoName.getOverallDescription()).toBe('Adding tracks to your Spotify queue on dev2');
  });
});
