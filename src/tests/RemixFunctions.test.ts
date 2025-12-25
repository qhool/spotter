import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Track } from '@spotify/web-api-ts-sdk';
import {
  getIncludedTracks,
  concatenateRemix,
  shuffleRemix,
  getRemixFunction,
  RemixInput,
  RemixOptions
} from '../data/RemixFunctions';

const createTrack = (id: string, name = id, overrides: Partial<Track> = {}): Track => ({
  id,
  name,
  artists: [{ name: 'Test Artist' }] as any,
  album: { name: 'Test Album' } as any,
  duration_ms: 200000,
  explicit: false,
  external_ids: { isrc: '', ean: '', upc: '' },
  external_urls: { spotify: `https://open.spotify.com/track/${id}` },
  href: '',
  is_local: false,
  popularity: 0,
  preview_url: null,
  track_number: 1,
  disc_number: 1,
  type: 'track',
  uri: `spotify:track:${id}`,
  available_markets: [],
  is_playable: true,
  episode: false,
  track: true,
  ...overrides
});

const createInput = (
  ids: string[],
  options: RemixOptions = {}
): RemixInput<RemixOptions> => [ids.map(id => createTrack(id)), options];

describe('RemixFunctions', () => {
  describe('getIncludedTracks', () => {
    it('flattens all tracks when no exclusions are set', () => {
      const inputs: RemixInput<RemixOptions>[] = [
        createInput(['a1', 'a2']),
        createInput(['b1'])
      ];

      const result = getIncludedTracks(inputs);

      expect(result.map(track => track.id)).toEqual(['a1', 'a2', 'b1']);
    });

    it('removes overlapping tracks that appear in excluded inputs', () => {
      const shared = createTrack('shared');
      const clone = createTrack('shared');
      const inputs: RemixInput<RemixOptions>[] = [
        [[shared, createTrack('unique')], {}],
        [[clone], { excludeFromRemix: true }]
      ];
      const result = getIncludedTracks(inputs);
      expect(result.map(track => track.id)).toEqual(['unique']);
    });

    it('subtracts tracks from large collections and multiple exclude lists (programmatic)', () => {
      // Create 10 tracks, ids t1-t10
      const allTracks = Array.from({ length: 10 }, (_, i) => createTrack(`t${i+1}`));

      // Helper to create input with given track indices and options
      const makeInput = (indices: number[], options: RemixOptions = {}) => [indices.map(i => allTracks[i]), options] as RemixInput<RemixOptions>;

      // Generate 5 input lists, each with 2 tracks, and up to 5 exclude lists
      const inputIndices = [
        [0, 1], // t1, t2
        [2, 3], // t3, t4
        [4, 5], // t5, t6
        [6, 7], // t7, t8
        [8, 9]  // t9, t10
      ];

      // Test all combinations of exclude lists (from 1 to 5)
      for (let excludeCount = 1; excludeCount <= 5; excludeCount++) {
        // Inputs: first excludeCount lists are exclude, rest are normal
        const inputs: RemixInput<RemixOptions>[] = [];
        for (let i = 0; i < 5; i++) {
          const options = i < excludeCount ? { excludeFromRemix: true } : {};
          inputs.push(makeInput(inputIndices[i], options));
        }
        // The expected result: all tracks in non-exclude lists, minus any that appear in exclude lists
        const excludedIds = new Set(
          inputIndices.slice(0, excludeCount).flat().map(i => `t${i+1}`)
        );
        const includedIds = inputIndices.slice(excludeCount).flat().map(i => `t${i+1}`);
        const expected = includedIds.filter(id => !excludedIds.has(id));

        const result = getIncludedTracks(inputs);
        expect(result.map(track => track.id)).toEqual(expected);
      }
    });

    it('uses URI/name fallbacks when tracks lack stable ids', () => {
      const localKeep = createTrack('', 'Local Keep', {
        id: '',
        uri: 'spotify:local:artist:album:keep:123',
        is_local: true
      });
      const localExclude = createTrack('', 'Local Keep', {
        id: '',
        uri: 'spotify:local:artist:album:keep:123',
        is_local: true
      });

      const inputs: RemixInput<RemixOptions>[] = [
        [[localKeep], {}],
        [[localExclude], { excludeFromRemix: true }]
      ];

      const result = getIncludedTracks(inputs);

      expect(result).toHaveLength(0);
    });
  });

  describe('concatenateRemix', () => {
    it('concatenates tracks while applying subtraction rules', () => {
      const inputs: RemixInput<RemixOptions>[] = [
        createInput(['first', 'shared']),
        createInput(['shared'], { excludeFromRemix: true }),
        createInput(['third'])
      ];

      const result = concatenateRemix(inputs);

      expect(result.map(track => track.id)).toEqual(['first', 'third']);
    });
  });

  describe('shuffleRemix', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('shuffles deterministically after subtracting excluded tracks', () => {
      const inputs: RemixInput<RemixOptions>[] = [
        createInput(['A', 'shared']),
        createInput(['shared'], { excludeFromRemix: true }),
        createInput(['C']),
        createInput(['D'])
      ];

      const randomSequence = [0.9, 0.3, 0.1];
      let callIndex = 0;
      vi.spyOn(Math, 'random').mockImplementation(() => randomSequence[callIndex++] ?? 0);

      const result = shuffleRemix(inputs);

      // Expected order after Fisher-Yates with the above sequence: shared is subtracted.
      // Steps:
      // i=2 (track D) random=0.9 -> swap with itself (index 2)
      // i=1 (track C) random=0.3 -> swap indices 1 and 0
      // Resulting order: C, A, D
      expect(result.map(track => track.id)).toEqual(['C', 'A', 'D']);
      expect(result).toHaveLength(3);
    });

    it('returns empty array when every input is excluded', () => {
      const inputs: RemixInput<RemixOptions>[] = [
        createInput(['foo'], { excludeFromRemix: true }),
        createInput(['bar'], { excludeFromRemix: true })
      ];

      const result = shuffleRemix(inputs);

      expect(result).toEqual([]);
    });
  });

  describe('getRemixFunction', () => {
    it('returns shuffle function by default and for shuffle method', () => {
      expect(getRemixFunction('shuffle')).toBe(shuffleRemix);
      // @ts-expect-error intentional invalid method to exercise default
      expect(getRemixFunction('unknown')).toBe(shuffleRemix);
    });

    it('returns concatenate function for concatenate method', () => {
      expect(getRemixFunction('concatenate')).toBe(concatenateRemix);
    });
  });
});
