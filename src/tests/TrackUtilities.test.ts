import { describe, it, expect } from 'vitest';
import { resolveLocalTrack } from '../data/TrackUtilities';
import { Track } from '@spotify/web-api-ts-sdk';

describe('TrackUtilities', () => {
  describe('resolveLocalTrack', () => {
    const createMockLocalTrack = (uri: string, name: string = 'Local Track'): Track => ({
      id: 'local-id',
      name,
      artists: [{ name: 'Local Artist' } as any],
      album: { name: 'Local Album' } as any,
      duration_ms: 273000,
      is_local: true,
      uri,
      popularity: 0,
      explicit: false,
      external_urls: { spotify: '' },
      href: '',
      preview_url: null,
      track_number: 1,
      disc_number: 1,
      type: 'track',
      is_playable: true,
      external_ids: { upc: '', isrc: '', ean: '' },
      available_markets: [],
      episode: false,
      track: true
    });

    it('should return null for non-local tracks', async () => {
      const mockSdk = {
        search: () => Promise.resolve({ tracks: { items: [] } })
      } as any;
      
      const nonLocalTrack = createMockLocalTrack('spotify:track:4iV5W9uYEdYUVa79Axb7Rh', 'Regular Track');
      nonLocalTrack.is_local = false;
      
      const result = await resolveLocalTrack(mockSdk, nonLocalTrack);
      expect(result).toBeNull();
    });

    it('should return null for malformed local URIs', async () => {
      const mockSdk = {
        search: () => Promise.resolve({ tracks: { items: [] } })
      } as any;
      
      const localTrack = createMockLocalTrack('spotify:local:invalid');
      const result = await resolveLocalTrack(mockSdk, localTrack);
      expect(result).toBeNull();
    });

    it('should decode and search for local track components', async () => {
      const mockTrack = {
        id: 'test123',
        name: 'Joy To You Baby',
        artists: [{ name: 'Josh Ritter' }],
        album: { name: 'The Beast In Its Tracks' },
        popularity: 65,
        is_local: false,
        uri: 'spotify:track:test123'
      };

      const mockSdk = {
        search: (query: string, types: string[], _market?: string, limit?: number) => {
          expect(query).toContain('track:"Joy To You Baby"');
          expect(query).toContain('artist:"Josh Ritter"');
          expect(types).toEqual(['track']);
          expect(limit).toBe(20);
          
          return Promise.resolve({
            tracks: {
              items: [mockTrack]
            }
          });
        }
      } as any;
      
      const localTrack = createMockLocalTrack('spotify:local:Josh+Ritter:The+Beast+In+Its+Tracks:Joy+To+You+Baby:273', 'Joy To You Baby');
      const result = await resolveLocalTrack(mockSdk, localTrack);
      
      expect(result).toBeTruthy();
      expect(result!.id).toBe('test123');
      expect(result!.name).toBe('Joy To You Baby');
      expect(result!.original_local).toEqual(localTrack);
    });

    it('should handle URL encoding in local URIs', async () => {
      const mockTrack = {
        id: 'test456',
        name: 'Track With Spaces',
        artists: [{ name: 'Artist Name' }],
        album: { name: 'Album Title' },
        popularity: 45,
        is_local: false,
        uri: 'spotify:track:test456'
      };

      const mockSdk = {
        search: (query: string) => {
          expect(query).toContain('Track With Spaces');
          expect(query).toContain('Artist Name');
          
          return Promise.resolve({
            tracks: {
              items: [mockTrack]
            }
          });
        }
      } as any;
      
      const localTrack = createMockLocalTrack('spotify:local:Artist%20Name:Album%20Title:Track%20With%20Spaces:180', 'Track With Spaces');
      const result = await resolveLocalTrack(mockSdk, localTrack);
      
      expect(result).toBeTruthy();
      expect(result!.id).toBe('test456');
      expect(result!.original_local).toEqual(localTrack);
    });

    it('should return null when no suitable matches are found', async () => {
      const poorMatch = {
        id: 'poor123',
        name: 'Completely Different Song',
        artists: [{ name: 'Different Artist' }],
        album: { name: 'Different Album' },
        popularity: 20,
        is_local: false,
        uri: 'spotify:track:poor123'
      };

      const mockSdk = {
        search: () => Promise.resolve({
          tracks: {
            items: [poorMatch]
          }
        })
      } as any;
      
      const localTrack = createMockLocalTrack('spotify:local:Josh+Ritter:The+Beast+In+Its+Tracks:Joy+To+You+Baby:273', 'Joy To You Baby');
      const result = await resolveLocalTrack(mockSdk, localTrack);
      
      expect(result).toBeNull();
    });

    it('should prefer exact matches over partial matches', async () => {
      const exactMatch = {
        id: 'exact123',
        name: 'Joy To You Baby',
        artists: [{ name: 'Josh Ritter' }],
        album: { name: 'The Beast In Its Tracks' },
        popularity: 65,
        is_local: false,
        uri: 'spotify:track:exact123'
      };

      const partialMatch = {
        id: 'partial123',
        name: 'Joy To You Baby (Live Version)',
        artists: [{ name: 'Josh Ritter' }],
        album: { name: 'Live Album' },
        popularity: 45,
        is_local: false,
        uri: 'spotify:track:partial123'
      };

      const mockSdk = {
        search: () => Promise.resolve({
          tracks: {
            items: [partialMatch, exactMatch] // Exact match comes second to test scoring
          }
        })
      } as any;
      
      const localTrack = createMockLocalTrack('spotify:local:Josh+Ritter:The+Beast+In+Its+Tracks:Joy+To+You+Baby:273', 'Joy To You Baby');
      const result = await resolveLocalTrack(mockSdk, localTrack);
      
      expect(result?.id).toBe('exact123'); // Should prefer exact match
      expect(result?.original_local).toEqual(localTrack);
    });
  });
});