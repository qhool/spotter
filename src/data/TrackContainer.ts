import { SpotifyApi, Track, SimplifiedPlaylist, Album } from '@spotify/web-api-ts-sdk';

// Standard format for tracks returned by all containers
export interface TrackResponse {
  items: Track[];
  total: number;
  next: number | null;
}

// Types for RemixContainer
export type RemixInput<T> = [Track[], T];
export type RemixFunction<T> = (inputs: RemixInput<T>[]) => Track[];


// Abstract base class for all track containers
export abstract class TrackContainer {
  abstract id: string;
  abstract name: string;
  abstract description?: string;
  abstract coverImage?: { url: string; width?: number; height?: number };
  abstract type: 'playlist' | 'album' | 'liked-songs';

  protected sdk: SpotifyApi;
  protected totalCount: number | undefined = undefined;
  protected _fetchedTracks: Track[] = [];

  constructor(sdk: SpotifyApi) {
    this.sdk = sdk;
  }

  // Abstract method that all subclasses must implement
  protected abstract _getTracks(limit?: number, offset?: number): Promise<TrackResponse>;

  protected async _fillCache(upTo: number): Promise<void> {
    while (this._fetchedTracks.length < upTo || upTo === -1) {
      const response = await this._getTracks(50, this._fetchedTracks.length);
      this._fetchedTracks.push(...response.items);
      this.totalCount = response.total;
      if( upTo === -1 ) {
        upTo = this.totalCount;
      }
      if (!response.next) {
        break;
      }
    }
  }

  async getTracks(limit: number = 50, offset: number = 0): Promise<TrackResponse> {
    await this._fillCache(offset + limit);
    const end = Math.min(offset + limit, this._fetchedTracks.length);
    const items = this._fetchedTracks.slice(offset, end);
    return {
      items,
      total: this.totalCount || 0,
      next: end < (this.totalCount || 0) ? end : null
    };
  }

  // Method to get all tracks by fetching in batches
  async getAllTracks(): Promise<Track[]> {
    await this._fillCache(-1);
    return this._fetchedTracks; 
  }
}

// Container for playlists
export class PlaylistContainer extends TrackContainer {
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

  protected async _getTracks(limit: number = 50, offset: number = 0): Promise<TrackResponse> {
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
      items: response.items.map(item => item.track),
      total: response.total,
      next: nextOffset < response.total ? nextOffset : null
    };
  }
}

// Container for albums
export class AlbumContainer extends TrackContainer {
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

  protected async _getTracks(limit: number = 50, offset: number = 0): Promise<TrackResponse> {
    const validLimit = Math.min(Math.max(limit, 1), 50) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50;
    const response = await this.sdk.albums.tracks(this.id, 'US', validLimit, offset);
    
    // Convert simplified tracks to full tracks by adding album info
    const tracks: Track[] = response.items.map((track: any) => ({
      ...track,
      album: this.album,
      type: 'track' as const
    } as Track));

    const nextOffset = offset + tracks.length;

    return {
      items: tracks,
      total: response.total,
      next: nextOffset < response.total ? nextOffset : null
    };
  }
}

// Container for liked songs
export class LikedSongsContainer extends TrackContainer {
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

  protected async _getTracks(limit: number = 50, offset: number = 0): Promise<TrackResponse> {
    const validLimit = Math.min(Math.max(limit, 1), 50) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50;
    const response = await this.sdk.currentUser.tracks.savedTracks(validLimit, offset);

    const tracks = response.items.map(item => item.track);
    const nextOffset = offset + tracks.length;

    return {
      items: tracks,
      total: response.total,
      next: nextOffset < response.total ? nextOffset : null
    };
  }
}

// Container for remixed tracks
export class RemixContainer<RemixOptionsType> extends TrackContainer {
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

  private async loadRemixedTracks(force: boolean = false): Promise<Track[]> {
    if (this.remixedTracks !== null && !force) {
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

  protected async _getTracks(_limit: number = 50, _offset: number = 0): Promise<TrackResponse> {
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

}