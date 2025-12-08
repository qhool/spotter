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
    await this._fillCache(limit < 0 ? -1 : offset + limit);
    const tracks: Track[] = [];
    let end = this._fetchedRawTracks.length;
    end = Math.min(limit < 0 ? end : limit, end);
    console.log(`Getting standardized tracks from ${offset} to ${end}`);
    for (let i = offset; i < end; i++) {
      const track = await this._getStandardizedTrack(i);
      tracks.push(track);
    }
    return tracks;
  }

  async getTracks(limit: number = 50, offset: number = 0): Promise<TrackResponse> {
    const resolvedTracks = await this._getStandardizedTracks(limit, offset);
    return {
      items: resolvedTracks,
      total: resolvedTracks.length,
      next: resolvedTracks.length === limit ? offset + limit : null
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

  constructor(sdk: SpotifyApi, maxItems: number = 1000) {
    super(sdk);
    this._maxItems = maxItems;
    // Use a local image for recent tracks with proper base URL resolution
    this.coverImage = { url: resolveAssetUrl('/images/recent-tracks.png') };
  }

  protected _standardizeTrack(rawTrack: PlayHistory): Track {
    return rawTrack.track;
  }

  protected async _getTracks(limit: number = 50, before: string | 0): Promise<RawTrackResponse<PlayHistory>> {
    const validLimit = Math.min(Math.max(limit, 1), 50) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50;
    const range: any = before === 0 ? undefined : { type: 'before', timestamp: before };

    const response = await this.sdk.player.getRecentlyPlayedTracks(validLimit, range)
    
    return {
      items: response.items,
      total: this._maxItems,
      next: response.cursors?.before
    };
  }
}