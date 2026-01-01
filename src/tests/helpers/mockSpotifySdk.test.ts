import { describe, it, expect } from 'vitest';
import { MockSpotifySdk } from './mockSpotifySdk';

describe('MockSpotifySdk defaults', () => {
  it('paginates user playlists', async () => {
    const sdk = new MockSpotifySdk();
    const page1 = await sdk.currentUser.playlists.playlists(5, 0);
    expect(page1.items).toHaveLength(5);
    expect(page1.total).toBeGreaterThan(5);
    expect(page1.next).toBe(5);

    const page2 = await sdk.currentUser.playlists.playlists(5, page1.next as number);
    expect(page2.offset).toBe(5);
    expect(page2.items.length).toBeGreaterThan(0);
  });

  it('paginates saved albums', async () => {
    const sdk = new MockSpotifySdk();
    const page1 = await sdk.currentUser.albums.savedAlbums(3, 0);
    expect(page1.items.length).toBe(3);
    expect(page1.total).toBeGreaterThan(3);
    expect(page1.next).toBe(3);

    const page2 = await sdk.currentUser.albums.savedAlbums(3, page1.next as number);
    expect(page2.offset).toBe(3);
    expect(page2.items.length).toBeGreaterThan(0);
  });

  it('provides default search results with pagination', async () => {
    const sdk = new MockSpotifySdk();
    const res = await sdk.search('anything', ['playlist']);
    expect(res.playlists.items.length).toBeGreaterThan(0);
    expect(res.playlists.total).toBeGreaterThan(res.playlists.items.length);
    expect(res.playlists.next).not.toBeNull();
  });
});

describe('MockSpotifySdk customization', () => {
  it('uses search selector to control ids and counts', async () => {
    const sdk = new MockSpotifySdk();
    sdk.setSearchTracks([{ id: 't1' }, { id: 't2' }, { id: 't3' }]);
    sdk.setSearchSelector((_q, types) => (types.includes('track') ? { tracks: ['t2'] } : {}));
    const res = await sdk.search('q', ['track']);
    expect(res.tracks.items.map((t: any) => t.id)).toEqual(['t2']);
  });

  it('allows post-filter to mangle results', async () => {
    const sdk = new MockSpotifySdk();
    sdk.setSearchPostFilter(res => {
      res.flagged = true;
      return res;
    });
    const res = await sdk.search('q', ['playlist']);
    expect(res.flagged).toBe(true);
  });

  it('supports setter overrides and reset', async () => {
    const sdk = new MockSpotifySdk();
    sdk.setUserPlaylists([{ id: 'custom', name: 'Custom', tracks: { total: 1 }, type: 'playlist' }]);
    const page = await sdk.currentUser.playlists.playlists(10, 0);
    expect(page.total).toBe(1);

    sdk.reset();
    const resetPage = await sdk.currentUser.playlists.playlists(10, 0);
    expect(resetPage.total).toBeGreaterThan(1);
  });

  it('can force failures on operations', async () => {
    const sdk = new MockSpotifySdk();
    sdk.failOn('search', 'boom');
    await expect(sdk.search('q', ['playlist'])).rejects.toThrow('boom');
    sdk.clearFailures();
    await expect(sdk.search('q', ['playlist'])).resolves.toBeTruthy();
  });
});
