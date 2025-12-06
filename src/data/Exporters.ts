import { Track, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { RemovableExportTarget } from './ExportController';

/**
 * Base class for export targets that store tracks in memory
 */
export abstract class InMemoryExportTarget implements RemovableExportTarget {
  protected tracks: Track[] = [];

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
}

/**
 * Export target that provides tracks as JSON
 */
export class JSONExportTarget extends InMemoryExportTarget {
  getData(): string {
    return JSON.stringify(this.tracks, null, 2);
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
  private currentTracks: Track[] = [];
  private isInitialized = false;

  /**
   * Create a PlaylistExportTarget
   * @param sdk Spotify API instance
   * @param playlistIdOrName Either an existing playlist ID or a name for a new playlist
   * @param description Description for new playlist (only used if playlistIdOrName is a name)
   */
  constructor(sdk: SpotifyApi, playlistIdOrName: string, description?: string) {
    this.sdk = sdk;
    
    // If it looks like a Spotify ID (contains alphanumeric), treat as ID, otherwise as name
    if (playlistIdOrName.match(/^[a-zA-Z0-9]+$/)) {
      this.playlistId = playlistIdOrName;
    } else {
      this.playlistId = null;
      this.playlistName = playlistIdOrName;
      this.playlistDescription = description || 'Created by Spotter';
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;

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
      this.currentTracks = []; // New playlist starts empty
      this.isInitialized = true;
      return;
    }

    // Fetch current playlist tracks for existing playlist
    const response = await this.sdk.playlists.getPlaylistItems(
      this.playlistId!,
      'US',
      undefined, // fields
      50, // limit
      0 // offset
    );

    this.currentTracks = response.items
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
      
      this.currentTracks.push(...nextTracks);
      offset += 50;
    }

    this.isInitialized = true;
  }

  async addTracks(tracks: Track[]): Promise<void> {
    await this.ensureInitialized();

    if (tracks.length === 0) return;

    // Add tracks to Spotify playlist
    const trackUris = tracks.map(track => track.uri);
    const batchSize = 100; // Spotify API limit

    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize);
      await this.sdk.playlists.addItemsToPlaylist(this.playlistId!, batch);
    }

    // Update our local cache
    this.currentTracks.push(...tracks);
  }

  async getCurrentTrackIDs(): Promise<string[]> {
    await this.ensureInitialized();
    return this.currentTracks.map(track => track.id).filter(Boolean) as string[];
  }

  async removeTracks(start: number, end: number | undefined): Promise<void> {
    await this.ensureInitialized();

    const endIndex = end ?? this.currentTracks.length;
    if (start >= this.currentTracks.length || start >= endIndex) return;

    // Get tracks to remove
    const tracksToRemove = this.currentTracks.slice(start, endIndex);
    
    if (tracksToRemove.length === 0) return;

    // Use Spotify's playlist update endpoint to remove tracks
    // We need to specify tracks by URI and position
    const trackReferences = tracksToRemove.map((track, index) => ({
      uri: track.uri,
      positions: [start + index]
    }));

    // Spotify API requires us to remove tracks in batches
    const batchSize = 100;
    for (let i = 0; i < trackReferences.length; i += batchSize) {
      const batch = trackReferences.slice(i, i + batchSize);
      
      await this.sdk.playlists.removeItemsFromPlaylist(
        this.playlistId!,
        { tracks: batch.map(ref => ({ uri: ref.uri, positions: ref.positions })) }
      );
    }

    // Update our local cache
    this.currentTracks.splice(start, endIndex - start);
  }

  getMaxAddBatchSize(): number {
    return 100; // Spotify API limit for adding tracks
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
   * Get current tracks (refreshes from Spotify if needed)
   */
  async getCurrentTracks(): Promise<Track[]> {
    await this.ensureInitialized();
    return [...this.currentTracks]; // Return copy to prevent external mutation
  }

  /**
   * Force refresh the track list from Spotify
   */
  async refresh(): Promise<void> {
    this.isInitialized = false;
    await this.ensureInitialized();
  }
}
