import { SpotifyApi, Track, SimplifiedPlaylist, Album } from '@spotify/web-api-ts-sdk';

// Standard format for tracks returned by all containers
export interface TrackResponse {
  items: Track[];
  total: number;
  next: string | null;
}

// Abstract base class for all track containers
export abstract class TrackContainer {
  abstract id: string;
  abstract name: string;
  abstract description?: string;
  abstract coverImage?: { url: string; width?: number; height?: number };
  abstract type: 'playlist' | 'album' | 'liked-songs';

  protected sdk: SpotifyApi;

  constructor(sdk: SpotifyApi) {
    this.sdk = sdk;
  }

  // Abstract method that all subclasses must implement
  abstract getTracks(limit?: number, offset?: number): Promise<TrackResponse>;
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

  async getTracks(limit: number = 50, offset: number = 0): Promise<TrackResponse> {
    // Constrain limit to valid values for the API
    const validLimit = Math.min(Math.max(limit, 1), 50) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50;
    
    const response = await this.sdk.playlists.getPlaylistItems(
      this.id, 
      'US', 
      undefined, 
      validLimit, 
      offset
    );

    return {
      items: response.items
        .filter(item => item.track && item.track.type === 'track')
        .map(item => item.track as Track),
      total: response.total,
      next: response.next
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

  async getTracks(limit: number = 50, offset: number = 0): Promise<TrackResponse> {
    const validLimit = Math.min(Math.max(limit, 1), 50) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50;
    const response = await this.sdk.albums.tracks(this.id, 'US', validLimit, offset);
    
    // Convert simplified tracks to full tracks by adding album info
    const tracks: Track[] = response.items.map((track: any) => ({
      ...track,
      album: this.album,
      type: 'track' as const
    } as Track));

    return {
      items: tracks,
      total: response.total,
      next: response.next
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

  async getTracks(limit: number = 50, offset: number = 0): Promise<TrackResponse> {
    const validLimit = Math.min(Math.max(limit, 1), 50) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50;
    const response = await this.sdk.currentUser.tracks.savedTracks(validLimit, offset);

    return {
      items: response.items.map(item => item.track),
      total: response.total,
      next: response.next
    };
  }
}