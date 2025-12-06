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
  private playlistId: string;
  private currentTracks: Track[] = [];
  private isInitialized = false;

  constructor(sdk: SpotifyApi, playlistId: string) {
    this.sdk = sdk;
    this.playlistId = playlistId;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;

    // Fetch current playlist tracks
    const response = await this.sdk.playlists.getPlaylistItems(
      this.playlistId,
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
        this.playlistId,
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
      await this.sdk.playlists.addItemsToPlaylist(this.playlistId, batch);
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
        this.playlistId,
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
