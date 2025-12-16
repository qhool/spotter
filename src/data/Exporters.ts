import { Track, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { ExportTarget, RemovableExportTarget } from './ExportController';

/**
 * Base class for export targets that store tracks in memory
 */
export abstract class InMemoryExportTarget implements RemovableExportTarget {
  protected tracks: Track[] = [];

  async initialize(): Promise<void> {
    // Base implementation - no initialization needed for in-memory targets
    this.tracks = [];
  }

  async addTracks(tracks: Track[]): Promise<void> {
    this.tracks.push(...tracks);
  }

  async getCurrentTrackIDs(): Promise<string[]> {
    return this.tracks.map(track => track.id).filter(Boolean) as string[];
  }

  async removeTracks(start: number, end: number | undefined): Promise<void> {
    if (end === undefined) {
      // Remove from start to end of array
      this.tracks.splice(start);
    } else {
      // Remove from start to end (exclusive)
      this.tracks.splice(start, end - start);
    }
  }

  getMaxAddBatchSize(): number {
    return 1000; // Large batch size for in-memory operations
  }

  /**
   * Abstract method to get the exported data
   * @returns The tracks in the desired export format
   */
  abstract getData(): any;

  /**
   * Abstract method to get description of the overall export purpose
   */
  abstract getOverallDescription(): string;

  /**
   * Abstract method to get description of the initialization step
   */
  abstract getInitializationDescription(): string;
}

/**
 * Export target that provides tracks as JSON
 */
export class JSONExportTarget extends InMemoryExportTarget {
  getData(): string {
    return JSON.stringify(this.tracks, null, 2);
  }

  getOverallDescription(): string {
    return 'Exporting to JSON format';
  }

  getInitializationDescription(): string {
    return 'Preparing JSON export';
  }
}

/**
 * Export target that manages a Spotify playlist
 */
export class PlaylistExportTarget implements RemovableExportTarget {
  private sdk: SpotifyApi;
  private playlistId: string | null;
  private playlistName?: string;
  private playlistDescription?: string;

  /**
   * Create a PlaylistExportTarget
   * @param sdk Spotify API instance
   * @param options Either { id: string } for existing playlist or { name: string, description?: string } for new playlist
   */
  constructor(sdk: SpotifyApi, options: { id: string } | { name: string; description?: string }) {
    this.sdk = sdk;
    
    if ('id' in options) {
      // Existing playlist
      this.playlistId = options.id;
    } else {
      // New playlist to be created
      this.playlistId = null;
      this.playlistName = options.name;
      this.playlistDescription = options.description || 'Created by Spotter';
    }
  }

  async initialize(): Promise<void> {
    // If we don't have a playlist ID, create a new playlist
    if (!this.playlistId) {
      if (!this.playlistName) {
        throw new Error('No playlist ID or name provided');
      }

      const user = await this.sdk.currentUser.profile();
      const playlist = await this.sdk.playlists.createPlaylist(
        user.id,
        {
          name: this.playlistName,
          description: this.playlistDescription || 'Created by Spotter',
          public: false
        }
      );
      this.playlistId = playlist.id;
    }
  }

  private async ensurePlaylistExists(): Promise<void> {
    // The initialization should have already handled playlist creation
    if (!this.playlistId) {
      throw new Error('Playlist not initialized. Call initialize() first.');
    }
  }

  getOverallDescription(): string {
    if (this.playlistId) {
      return 'Updating existing Spotify playlist';
    }

    if (this.playlistName) {
      return `Creating Spotify playlist "${this.playlistName}"`;
    }

    return 'Creating Spotify playlist';
  }

  getInitializationDescription(): string {
    return this.playlistId ? 'Preparing playlist' : 'Creating playlist';
  }

  async addTracks(tracks: Track[]): Promise<void> {
    await this.ensurePlaylistExists();

    const trackUris = tracks
      .map(track => track.uri)
      .filter((uri): uri is string => Boolean(uri));

    if (trackUris.length === 0) {
      return;
    }

    await this.sdk.playlists.addItemsToPlaylist(this.playlistId!, trackUris);
  }

  async getCurrentTrackIDs(): Promise<string[]> {
    const tracks = await this.getCurrentTracks();
    return tracks.map(track => track.id).filter(Boolean) as string[];
  }

  async removeTracks(start: number, end: number | undefined): Promise<void> {
    await this.ensurePlaylistExists();

    const currentTracks = await this.getCurrentTracks();
    const endIndex = end ?? currentTracks.length;
    if (start >= currentTracks.length || start >= endIndex) return;

    if (endIndex - start === 0) return;

    // Use Spotify's updatePlaylistItems endpoint to remove range
    // Set range_start, range_length, uris=[] and omit insert_before to remove
    await this.sdk.playlists.updatePlaylistItems(
      this.playlistId!,
      {
        range_start: start,
        range_length: endIndex - start,
        uris: [] // Empty array to remove tracks
        // insert_before is omitted to remove the range
      }
    );
  }

  getMaxAddBatchSize(): number {
    return 10; // Spotify API limit for adding tracks to playlists
  }

  /**
   * Get the playlist ID
   */
  getPlaylistId(): string {
    if (!this.playlistId) {
      throw new Error('Playlist not initialized');
    }
    return this.playlistId;
  }

  /**
   * Get current tracks from Spotify
   */
  async getCurrentTracks(): Promise<Track[]> {
    await this.ensurePlaylistExists();

    // Fetch current playlist tracks from Spotify
    const response = await this.sdk.playlists.getPlaylistItems(
      this.playlistId!,
      'US',
      undefined, // fields
      50, // limit
      0 // offset
    );

    let tracks = response.items
      .filter(item => item.track && item.track.type === 'track')
      .map(item => item.track as Track);

    // If there are more tracks, fetch them all
    let offset = 50;
    while (response.total > offset) {
      const nextResponse = await this.sdk.playlists.getPlaylistItems(
        this.playlistId!,
        'US',
        undefined,
        50,
        offset
      );
      
      const nextTracks = nextResponse.items
        .filter(item => item.track && item.track.type === 'track')
        .map(item => item.track as Track);
      
      tracks.push(...nextTracks);
      offset += 50;
    }

    return tracks;
  }
}

export class QueueExportTarget implements ExportTarget {
  private sdk: SpotifyApi;
  private deviceId: string;
  private deviceName?: string;

  constructor(sdk: SpotifyApi, options: { deviceId: string; deviceName?: string }) {
    if (!options.deviceId) {
      throw new Error('QueueExportTarget requires a device ID');
    }
    this.sdk = sdk;
    this.deviceId = options.deviceId;
    this.deviceName = options.deviceName;
  }

  private static isTrack(item: Track | { type?: string } | null | undefined): item is Track {
    return Boolean(item && (item as Track).type === 'track');
  }

  async initialize(): Promise<void> {
    const deviceLabel = this.deviceName ?? this.deviceId;

    try {
      const devices = await this.sdk.player.getAvailableDevices();
      const isKnownDevice = devices.devices?.some(device => device.id === this.deviceId);

      if (!isKnownDevice) {
        console.warn(
          `QueueExportTarget: selected device "${deviceLabel}" was not returned by Spotify's device list during initialization. Proceeding with queued export anyway.`
        );
      }
    } catch (error) {
      console.warn('QueueExportTarget: failed to refresh Spotify devices during initialization', error);
    }

    try {
      await this.sdk.player.getUsersQueue();
    } catch (error) {
      throw new Error(
        `Unable to access your Spotify queue. Make sure the device "${deviceLabel}" is active in Spotify, then try again.`
      );
    }
  }

  getOverallDescription(): string {
    const label = this.deviceName ?? this.deviceId;
    return `Adding tracks to your Spotify queue on ${label}`;
  }

  getInitializationDescription(): string {
    return 'Checking your current playback queue';
  }

  getMaxAddBatchSize(): number {
    return 1;
  }

  async addTracks(tracks: Track[]): Promise<void> {
    const deviceLabel = this.deviceName ?? this.deviceId;

    for (const track of tracks) {
      if (!track?.uri) {
        continue;
      }
      try {
        await this.sdk.player.addItemToPlaybackQueue(track.uri, this.deviceId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const looksLikeParseError =
          error instanceof SyntaxError || message.includes('Unexpected token');

        if (looksLikeParseError) {
          console.warn('QueueExportTarget: parse error ignored (Spotify queue endpoint returned invalid JSON)', {
            track: track.name ?? track.id ?? track.uri,
            deviceId: this.deviceId,
            error: message
          });
          continue;
        }

        const trackLabel = track.name ?? track.id ?? track.uri;
        console.error('QueueExportTarget: failed to queue track', {
          track: trackLabel,
          deviceId: this.deviceId,
          error: message
        });
        throw new Error(
          `Spotify couldn't queue "${trackLabel}" on ${deviceLabel}. Make sure the device is active in Spotify and try again.`
        );
      }
    }
  }

  async getCurrentTrackIDs(): Promise<string[]> {
    try {
      const queue = await this.sdk.player.getUsersQueue();
      const ids: string[] = [];

      if (QueueExportTarget.isTrack(queue.currently_playing) && queue.currently_playing.id) {
        ids.push(queue.currently_playing.id);
      }

      for (const item of queue.queue) {
        if (QueueExportTarget.isTrack(item) && item.id) {
          ids.push(item.id);
        }
      }

      return ids;
    } catch (error) {
      console.warn('QueueExportTarget: failed to read queue state', error);
      return [];
    }
  }
}
