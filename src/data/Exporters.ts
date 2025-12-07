import { Track, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { RemovableExportTarget } from './ExportController';

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
      return `Exporting to existing playlist (ID: ${this.playlistId})`;
    } else if (this.playlistName) {
      return `Exporting to new playlist "${this.playlistName}"`;
    } else {
      return 'Exporting to playlist';
    }
  }

  getInitializationDescription(): string {
    if (this.playlistId) {
      return 'Verifying playlist access';
    } else {
      return 'Creating playlist';
    }
  }

  async addTracks(tracks: Track[]): Promise<void> {
    await this.ensurePlaylistExists();

    if (tracks.length === 0) return;

    // Add tracks to Spotify playlist (ExportController handles batching)
    const trackUris = tracks.map(track => track.uri);
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
