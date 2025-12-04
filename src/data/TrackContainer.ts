import { SpotifyApi, Track, SimplifiedPlaylist, Album, PlaylistedTrack, SimplifiedTrack, SavedTrack, PlayHistory } from '@spotify/web-api-ts-sdk';
import { RemixFunction, RemixInput, RemixOptions } from './RemixFunctions';
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
  constructor(sdk: SpotifyApi) {
    this.sdk = sdk;
  }

  // Abstract method to standardize raw track to Spotify Track format
  protected abstract _standardizeTrack(rawTrack: TrackType): Track;

  // Abstract method that all subclasses must implement
  protected abstract _getTracks(limit?: number, start?: Next): Promise<RawTrackResponse<TrackType>>;

  protected async _fillCache(upTo: number): Promise<void> {
    while (this._fetchedRawTracks.length < upTo || upTo === -1) {
      const response = await this._getTracks(50, this._nextOffset || 0);
      this._fetchedRawTracks.push(...response.items);
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

  async getTracks(limit: number = 50, offset: number = 0): Promise<TrackResponse> {
    const rawResponse = await this.getRawTracks(limit, offset);
    const standardizedItems = rawResponse.items.map(rawTrack => this._standardizeTrack(rawTrack));
    return {
      items: standardizedItems,
      total: rawResponse.total,
      next: rawResponse.next
    };
  }

  // Method to get all tracks by fetching in batches
  async getAllTracks(): Promise<Track[]> {
    const rawTracks = await this.getAllRawTracks();
    return rawTracks.map(rawTrack => this._standardizeTrack(rawTrack));
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
    // Use a local image for liked songs
    this.coverImage = { url: '/images/liked-songs.png' };
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
    this.coverImage = { url: '/images/remix-default.png' };
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
    // Use a local image for recent tracks
    this.coverImage = { url: '/images/recent-tracks.png' };
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