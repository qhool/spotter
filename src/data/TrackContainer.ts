import { SpotifyApi, Track, SimplifiedPlaylist, Album, PlaylistedTrack, SimplifiedTrack, SavedTrack, PlayHistory } from '@spotify/web-api-ts-sdk';
import { RemixFunction, RemixInput, RemixOptions } from './RemixFunctions';
import { resolveLocalTrack, ResolvedLocalTrack } from './TrackUtilities';
import { resolveAssetUrl } from '../utils/assetUtils';
// Standard format for tracks returned by all containers
export type Next = number | string | null;

export interface TrackResponse {
  items: Track[];
  total: number;
  next: Next;
}

// Raw format for tracks returned by containers (before standardization)
export interface RawTrackResponse<TrackType> {
  items: TrackType[];
  total: number;
  next: Next;
}

// Types for RemixContainer



// Abstract base class for all track containers
export abstract class TrackContainer<TrackType = Track> {
  abstract id: string;
  abstract name: string;
  abstract description?: string;
  abstract coverImage?: { url: string; width?: number; height?: number };
  abstract type: 'playlist' | 'album' | 'liked-songs';

  protected sdk: SpotifyApi;
  protected totalCount: number | undefined = undefined;
  protected _fetchedRawTracks: TrackType[] = [];
  protected _nextOffset: Next = 0;
  
  // Cache for resolved local tracks: maps raw track index to resolved track promise
  private _resolvedLocalTrackPromises: Map<number, Promise<ResolvedLocalTrack | null>> = new Map();
  // Cache for resolved local tracks: maps raw track index to resolved track
  private _resolvedLocalTracks: Map<number, Track> = new Map();
  
  constructor(sdk: SpotifyApi) {
    this.sdk = sdk;
  }

  public getTrackCount(): number | null {
    return this.totalCount ?? null;
  }

  // Abstract method to standardize raw track to Spotify Track format
  protected abstract _standardizeTrack(rawTrack: TrackType): Track;

  // Abstract method that all subclasses must implement
  protected abstract _getTracks(limit?: number, start?: Next): Promise<RawTrackResponse<TrackType>>;

  protected async _fillCache(upTo: number): Promise<void> {
    if( this.totalCount !== undefined && ( upTo == -1 || upTo > this.totalCount) ) {
      upTo = this.totalCount;
    }
    while (this._fetchedRawTracks.length < upTo || upTo === -1) {
      const response = await this._getTracks(50, this._nextOffset || 0);
      const startIndex = this._fetchedRawTracks.length;
      this._fetchedRawTracks.push(...response.items);
      
      // Check for local tracks in the newly fetched items and start resolution
      for (let i = 0; i < response.items.length; i++) {
        const rawTrack = response.items[i];
        const standardizedTrack = this._standardizeTrack(rawTrack);
        const trackIndex = startIndex + i;
        
        if (standardizedTrack.is_local) {
          // Store the resolution promise in cache (don't await it)
          console.log(`Starting resolution for local track at index ${trackIndex}`);
          const resolvePromise = resolveLocalTrack(this.sdk, standardizedTrack);
          this._resolvedLocalTrackPromises.set(trackIndex, resolvePromise);
        }
      }
      
      this.totalCount = response.total;
      if (upTo !== -1 && this.totalCount !== undefined && upTo < this.totalCount) {
        upTo = this.totalCount;
      }
      if( upTo === -1 ) {
        upTo = this.totalCount;
      }
      this._nextOffset = response.next;
      if (!response.next) {
        break;
      }
    }
  }

  async getRawTracks(limit: number = 50, offset: number = 0): Promise<RawTrackResponse<TrackType>> {
    await this._fillCache(offset + limit);
    const end = Math.min(offset + limit, this._fetchedRawTracks.length);
    const items = this._fetchedRawTracks.slice(offset, end);
    return {
      items,
      total: this.totalCount || 0,
      next: end < (this.totalCount || 0) ? end : null
    };
  }

  async getAllRawTracks(): Promise<TrackType[]> {
    await this._fillCache(-1);
    return this._fetchedRawTracks;
  }

  /**
   * Get a standardized track by index, handling local track resolution
   * @param index Index in the _fetchedRawTracks array
   * @returns Promise resolving to the standardized track (resolved if local)
   */
  private async _getStandardizedTrack(index: number): Promise<Track> {
    console.log(`Getting standardized track at index ${index}`);
    // Check if we have a cached resolved track
    if (this._resolvedLocalTracks.has(index)) {
      return this._resolvedLocalTracks.get(index)!;
    }
    if (this._resolvedLocalTrackPromises.has(index)) {
      const promise = this._resolvedLocalTrackPromises.get(index)!;
      this._resolvedLocalTrackPromises.delete(index);
      try {
        const resolvedTrack = await promise;
        if (resolvedTrack) {
          // Cache the resolved track and clean up the promise
          this._resolvedLocalTracks.set(index, resolvedTrack);
          return resolvedTrack;
        }
      } catch (error) {
        console.warn(`Failed to resolve local track at index ${index}:`, error);
      }
    }

    // Get the standardized version of the raw track
    const rawTrack = this._fetchedRawTracks[index];
    return this._standardizeTrack(rawTrack);
  }

  /**
   * Private helper method to resolve local tracks from raw tracks
   * @param rawTracks Array of raw tracks
   * @param startIndex Starting index in the raw tracks array
   * @returns Array of resolved tracks (with local tracks replaced if resolution succeeded)
   */
  private async _getStandardizedTracks(
    limit: number = -1,
    offset: number = 0
  ): Promise<Track[]> {
    const targetCount = limit < 0 ? -1 : offset + limit;
    await this._fillCache(targetCount);

    const totalAvailable = this._fetchedRawTracks.length;
    const start = Math.min(Math.max(offset, 0), totalAvailable);
    const end = limit < 0 ? totalAvailable : Math.min(offset + limit, totalAvailable);

    if (start >= end) {
      return [];
    }

    const tracks: Track[] = [];
    console.log(`Getting standardized tracks from ${start} to ${end}`);
    for (let i = start; i < end; i++) {
      const track = await this._getStandardizedTrack(i);
      tracks.push(track);
    }
    return tracks;
  }

  async getTracks(limit: number = 50, offset: number = 0): Promise<TrackResponse> {
    const resolvedTracks = await this._getStandardizedTracks(limit, offset);
    const total = this.totalCount ?? this._fetchedRawTracks.length;
    const next =
      limit < 0
        ? null
        : offset + resolvedTracks.length < total
        ? offset + resolvedTracks.length
        : null;
    return {
      items: resolvedTracks,
      total,
      next
    };
  }

  // Method to get all tracks by fetching in batches
  async getAllTracks(): Promise<Track[]> {
    return await this._getStandardizedTracks(-1, 0);
  }
}

// Container for playlists
export class PlaylistContainer extends TrackContainer<PlaylistedTrack> {
  public id: string;
  public name: string;
  public description?: string;
  public coverImage?: { url: string; width?: number; height?: number };
  public type: 'playlist' | 'album' | 'liked-songs' = 'playlist';

  constructor(sdk: SpotifyApi, playlist: SimplifiedPlaylist) {
    super(sdk);
    this.id = playlist.id;
    this.name = playlist.name;
    this.description = playlist.description || undefined;
    this.coverImage = playlist.images?.[0];
    this.totalCount = playlist.tracks?.total ?? this.totalCount;
  }

  protected _standardizeTrack(rawTrack: PlaylistedTrack): Track {
    // Handle the case where the track could be an Episode or Track
    const track = rawTrack.track;
    if (track.type !== 'track') {
      throw new Error(`Unsupported track type: ${track.type}`);
    }
    return track as Track;
  }

  protected async _getTracks(limit: number = 50, offset: number = 0): Promise<RawTrackResponse<PlaylistedTrack>> {
    // Constrain limit to valid values for the API
    const validLimit = Math.min(Math.max(limit, 1), 50) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50;
    
    const response = await this.sdk.playlists.getPlaylistItems(
      this.id, 
      'US', 
      undefined, 
      validLimit, 
      offset
    );

    const nextOffset = offset + response.items.length; 

    return {
      items: response.items,
      total: response.total,
      next: nextOffset < response.total ? nextOffset : null
    };
  }
}

// Container for albums
export class AlbumContainer extends TrackContainer<SimplifiedTrack> {
  public id: string;
  public name: string;
  public description?: string;
  public coverImage?: { url: string; width?: number; height?: number };
  public type: 'playlist' | 'album' | 'liked-songs' = 'album';

  private album: Album;

  constructor(sdk: SpotifyApi, album: Album) {
    super(sdk);
    this.album = album;
    this.id = album.id;
    this.name = album.name;
    this.description = `${album.artists.map(artist => artist.name).join(', ')} • ${album.release_date.substring(0, 4)}`;
    this.coverImage = album.images?.[0];
    this.totalCount = album.total_tracks ?? this.totalCount;
  }

  protected _standardizeTrack(rawTrack: SimplifiedTrack): Track {
    // Convert simplified track to full track by adding album info and missing properties
    return {
      ...rawTrack,
      album: this.album as any, // Album type compatibility issue - cast to any
      type: 'track' as const,
      external_ids: {}, // Default empty external IDs
      popularity: 0 // Default popularity since it's not available in simplified tracks
    } as unknown as Track;
  }

  protected async _getTracks(limit: number = 50, offset: number = 0): Promise<RawTrackResponse<SimplifiedTrack>> {
    const validLimit = Math.min(Math.max(limit, 1), 50) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50;
    const response = await this.sdk.albums.tracks(this.id, 'US', validLimit, offset);
    
    const nextOffset = offset + response.items.length;

    return {
      items: response.items,
      total: response.total,
      next: nextOffset < response.total ? nextOffset : null
    };
  }
}

// Container for liked songs
export class LikedSongsContainer extends TrackContainer<SavedTrack> {
  public id: string = 'liked-songs';
  public name: string = 'Liked Songs';
  public description?: string = 'Your liked songs';
  public coverImage?: { url: string; width?: number; height?: number };
  public type: 'playlist' | 'album' | 'liked-songs' = 'liked-songs';

  constructor(sdk: SpotifyApi, _totalCount: number = 0) {
    super(sdk);
    // Use a local image for liked songs with proper base URL resolution
    this.coverImage = { url: resolveAssetUrl('/images/liked-songs.png') };
    this.totalCount = _totalCount;
  }

  protected _standardizeTrack(rawTrack: SavedTrack): Track {
    return rawTrack.track;
  }

  protected async _getTracks(limit: number = 50, offset: number = 0): Promise<RawTrackResponse<SavedTrack>> {
    const validLimit = Math.min(Math.max(limit, 1), 50) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50;
    const response = await this.sdk.currentUser.tracks.savedTracks(validLimit, offset);

    const nextOffset = offset + response.items.length;

    return {
      items: response.items,
      total: response.total,
      next: nextOffset < response.total ? nextOffset : null
    };
  }
}

// Container for remixed tracks
// Container for remixed tracks
export class RemixContainer<RemixOptionsType extends RemixOptions> extends TrackContainer<Track> {
  public id: string;
  public name: string;
  public description?: string;
  public coverImage?: { url: string; width?: number; height?: number };
  public type: 'playlist' | 'album' | 'liked-songs' = 'playlist';

  private inputs: [TrackContainer, RemixOptionsType][];
  private remixFunction: RemixFunction<RemixOptionsType>;
  private remixedTracks: Track[] | null = null;
  private isLoading: boolean = false;

  constructor(
    sdk: SpotifyApi,
    inputs: [TrackContainer, RemixOptionsType][],
    remixFunction: RemixFunction<RemixOptionsType>,
    name: string = 'Remixed Playlist',
    description?: string
  ) {
    super(sdk);
    this.inputs = inputs;
    this.remixFunction = remixFunction;
    this.id = `remix-${Date.now()}`;
    this.name = name;
    this.description = description || `Remix of ${inputs.length} source(s)`;
    this.coverImage = { url: resolveAssetUrl('/images/remix-default.png') };
  }

  protected _standardizeTrack(rawTrack: Track): Track {
    // RemixContainer already works with standardized Track objects
    return rawTrack;
  }

  private async loadRemixedTracks(): Promise<Track[]> {
    if (this.remixedTracks !== null) {
      return this.remixedTracks;
    }

    if (this.isLoading) {
      // Wait for existing load to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.remixedTracks || [];
    }

    this.isLoading = true;
    
    try {
      // Check if we have cached remix inputs
      let remixInputs: RemixInput<RemixOptionsType>[] = await Promise.all(
        this.inputs.map(async ([container, options]): Promise<RemixInput<RemixOptionsType>> => {
          const tracks = await container.getAllTracks();
          return [tracks, options];
        })
      );
        
      // Apply the remix function
      this.remixedTracks = this.remixFunction(remixInputs);
      this.totalCount = this.remixedTracks.length;
      return this.remixedTracks;
    } finally {
      this.isLoading = false;
    }
  }

  protected async _getTracks(_limit: number = 50, _offset: number = 0): Promise<RawTrackResponse<Track>> {
    throw new Error('_getTracks is not implemented for RemixContainer');
  }
  
  async getTracks(limit: number = 50, offset: number = 0): Promise<TrackResponse> {
    const allTracks = await this.loadRemixedTracks();
    
    // Apply pagination to the cached tracks
    const paginatedTracks = allTracks.slice(offset, offset + limit);
    const nextOffset = offset + paginatedTracks.length;

    return {
      items: paginatedTracks,
      total: allTracks.length,
      next: nextOffset < allTracks.length ? nextOffset : null
    };
  }

  async getAllTracks(): Promise<Track[]> {
    return this.loadRemixedTracks();
  }

  clearRemixCache() {
    this.remixedTracks = null;
  }

}

// Container for recently played tracks
export class RecentTracksContainer extends TrackContainer<PlayHistory> {
  public id: string = 'recent-tracks';
  public name: string = 'Recently Played';
  public description?: string = 'Your recently played tracks';
  public coverImage?: { url: string; width?: number; height?: number };
  public type: 'playlist' | 'album' | 'liked-songs' = 'playlist';
  private _maxItems: number;
  private static readonly STORAGE_KEY = 'spotter-recent-tracks-cache';
  private static readonly LOCAL_CURSOR_PREFIX = 'local:';
  private _storedTracks: PlayHistory[] = [];
  private _storageLoaded = false;
  private _lastUpdated: Date | null = null;

  constructor(sdk: SpotifyApi, maxItems: number = 1000) {
    super(sdk);
    this._maxItems = maxItems;
    // Use a local image for recent tracks with proper base URL resolution
    this.coverImage = { url: resolveAssetUrl('/images/recent-tracks.png') };
    this._ensureStoredTracksLoaded();
    if (this._storedTracks.length > 0) {
      this.totalCount = this._storedTracks.length;
    }
  }

  public getLastUpdated(): Date | null {
    return this._lastUpdated;
  }

  private _storage(): Storage | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage;
  }

  private _ensureStoredTracksLoaded(): void {
    if (this._storageLoaded) {
      return;
    }
    this._storageLoaded = true;
    const storage = this._storage();
    if (!storage) {
      return;
    }
    const raw = storage.getItem(RecentTracksContainer.STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        this._storedTracks = parsed;
      } else if (parsed && Array.isArray(parsed.tracks)) {
        this._storedTracks = parsed.tracks;
        if (parsed.updatedAt) {
          const parsedDate = new Date(parsed.updatedAt);
          if (!isNaN(parsedDate.getTime())) {
            this._lastUpdated = parsedDate;
          }
        }
      }

      this._trimStoredTracks();
    } catch (error) {
      console.warn('Failed to parse recent tracks cache:', error);
    }
  }

  private _persistStoredTracks(): void {
    const storage = this._storage();
    if (!storage) {
      return;
    }
    try {
      const payload = {
        tracks: this._storedTracks,
        updatedAt: this._lastUpdated ? this._lastUpdated.toISOString() : null
      };
      storage.setItem(RecentTracksContainer.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('Failed to persist recent tracks cache:', error);
    }
  }

  private _trimStoredTracks(): void {
    if (this._storedTracks.length > this._maxItems) {
      this._storedTracks.length = this._maxItems;
    }
  }

  private _trackKey(entry: PlayHistory): string {
    const playedAt = entry.played_at ?? 'unknown';
    const contextUri = entry.context?.uri ?? 'none';
    return `${playedAt}|${contextUri}`;
  }

  private _isLocalCursor(cursor: Next): cursor is string {
    return typeof cursor === 'string' && cursor.startsWith(RecentTracksContainer.LOCAL_CURSOR_PREFIX);
  }

  private _parseLocalCursor(cursor: string): number {
    const value = Number(cursor.slice(RecentTracksContainer.LOCAL_CURSOR_PREFIX.length));
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }

  private _localCursor(index: number): string {
    return `${RecentTracksContainer.LOCAL_CURSOR_PREFIX}${index}`;
  }

  private _getStoredSlice(limit: number, startIndex: number): RawTrackResponse<PlayHistory> {
    const boundedStart = Math.max(0, startIndex);
    const end = Math.min(boundedStart + limit, this._storedTracks.length);
    const items = this._storedTracks.slice(boundedStart, end);
    const nextIndex = end < this._storedTracks.length ? end : null;
    return {
      items,
      total: this._storedTracks.length,
      next: nextIndex === null ? null : this._localCursor(nextIndex)
    };
  }

  private _mergeFetchedTracks(fetched: PlayHistory[]): { items: PlayHistory[]; nextCursor: Next } {
    if (!fetched.length) {
      this._lastUpdated = new Date();
      this._persistStoredTracks();
      return { items: [], nextCursor: this._storedTracks.length ? this._localCursor(0) : null };
    }

    const keyToIndex = new Map<string, number>();
    for (let i = 0; i < this._storedTracks.length; i++) {
      keyToIndex.set(this._trackKey(this._storedTracks[i]), i);
    }

    const newTracks: PlayHistory[] = [];
    let matchIndex: number | null = null;

    for (let i = 0; i < fetched.length; i++) {
      const entry = fetched[i];
      const key = this._trackKey(entry);
      if (keyToIndex.has(key)) {
        matchIndex = keyToIndex.get(key)!;
        break;
      }
      newTracks.push(entry);
    }

    if (newTracks.length) {
      for (let i = newTracks.length - 1; i >= 0; i--) {
        this._storedTracks.unshift(newTracks[i]);
      }
      this._trimStoredTracks();
    }

    if (!this._storedTracks.length) {
      this._storedTracks = [...fetched];
      this._trimStoredTracks();
    }

    this._lastUpdated = new Date();
    this._persistStoredTracks();

    if (matchIndex !== null) {
      const shiftedIndex = matchIndex + newTracks.length;
      if (shiftedIndex < this._storedTracks.length) {
        return { items: newTracks, nextCursor: this._localCursor(shiftedIndex) };
      }
    }

    return { items: newTracks.length ? newTracks : fetched, nextCursor: null };
  }

  protected _standardizeTrack(rawTrack: PlayHistory): Track {
    return rawTrack.track;
  }

  protected async _getTracks(limit: number = 50, before: string | 0): Promise<RawTrackResponse<PlayHistory>> {
    this._ensureStoredTracksLoaded();

    if (this._isLocalCursor(before)) {
      const startIndex = this._parseLocalCursor(before);
      return this._getStoredSlice(limit, startIndex);
    }

    const validLimit = Math.min(Math.max(limit, 1), 50) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50;
    const apiCursor = before === 0 ? undefined : before;
    const range = apiCursor ? { type: 'before', timestamp: apiCursor } : undefined;

    const response = await this.sdk.player.getRecentlyPlayedTracks(validLimit, range as any);
    const { items, nextCursor } = this._mergeFetchedTracks(response.items);
    const total = this._storedTracks.length || this._maxItems;

    return {
      items,
      total,
      next: nextCursor ?? response.cursors?.before ?? null
    };
  }
}
