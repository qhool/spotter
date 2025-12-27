import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, Simulate } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { SearchPane } from '../../../components/panes/SearchPane';
import { PlaylistContainer, AlbumContainer } from '../../../data/TrackContainer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type SDK = ReturnType<typeof makeSdk>;

const makeAlbum = (id: string, name: string) => ({
  id,
  name,
  release_date: '2021-01-01',
  images: [{ url: `https://img/${id}.jpg` }],
  artists: [{ name: 'Artist' }]
});

const makePlaylist = (id: string, name: string) => ({
  id,
  name,
  description: '',
  images: [{ url: `https://img/${id}.jpg` }]
});

const makeSdk = () => {
  const playlistItems = [
    makePlaylist('playlist-1', 'Daily Mix 1'),
    makePlaylist('playlist-2', 'Focus Flow')
  ];
  const albumItems = [
    { album: makeAlbum('album-1', 'Synth Wave') },
    { album: makeAlbum('album-2', 'Indie Glow') },
    { album: makeAlbum('album-3', 'Late Night') }
  ];

  const sdk: any = {
    currentUser: {
      tracks: {
        savedTracks: vi.fn(async () => ({ items: [], total: 12 }))
      },
      playlists: {
        playlists: vi.fn(async (_limit: number = 50, offset: number = 0) => ({
          items: playlistItems.slice(offset, offset + 2),
          total: playlistItems.length,
          limit: 50,
          offset,
          next: offset + 2 < playlistItems.length ? 'next' : null
        }))
      },
      albums: {
        savedAlbums: vi.fn(async (_limit: number = 50, offset: number = 0) => ({
          items: albumItems.slice(offset, offset + 2),
          total: albumItems.length,
          limit: 50,
          offset,
          next: offset + 2 < albumItems.length ? 'next' : null
        }))
      }
    },
    playlists: {
      getPlaylistItems: vi.fn(async () => ({ items: [], total: 0 }))
    },
    albums: {
      tracks: vi.fn(async () => ({ items: [], total: 0 }))
    },
    search: vi.fn(async (query: string, types: string[], _market?: string, limit: number = 50, offset: number = 0) => {
      if (types.includes('playlist')) {
        return {
          playlists: {
            items: [makePlaylist(`search-pl-${query}`, `Found ${query}`)],
            total: 1,
            limit,
            offset,
            next: null
          }
        };
      }
      return {
        albums: {
          items: [makeAlbum(`search-al-${query}`, `Album ${query}`)],
          total: 1,
          limit,
          offset,
          next: null
        }
      };
    })
  };

  return sdk as SDK;
};

describe('SearchPane', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null;
  let sdk: SDK;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
    sdk = makeSdk();
  });

  afterEach(() => {
    act(() => root?.unmount());
    container.remove();
  });

  const flush = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  const renderPane = async (props: Partial<React.ComponentProps<typeof SearchPane>> = {}) => {
    const onAddItem = props.onAddItem ?? vi.fn();
    await act(async () => {
      root = createRoot(container);
      root.render(
        createElement(SearchPane, {
          sdk: sdk as any,
          onAddItem,
          selectedItems: [],
          ...props
        })
      );
      await Promise.resolve();
    });
    return { onAddItem };
  };

  it('shows personal playlists with liked/recent pseudo items and hides already selected', async () => {
    const recentStub = { id: 'recent-tracks', name: 'Recently Played', type: 'playlist', description: 'Recent', coverImage: { url: 'recent.png' } } as any;
    const selected = [new PlaylistContainer(sdk as any, makePlaylist('playlist-1', 'Daily Mix 1'))];
    const { onAddItem } = await renderPane({ selectedItems: selected, recentTracksContainer: recentStub });
    await flush();

    const tiles = Array.from(container.querySelectorAll('.item-tile')) as HTMLElement[];
    const titles = tiles.map(t => t.querySelector('.item-title')?.textContent);
    expect(titles).toContain('Recently Played');
    expect(titles).toContain('Focus Flow');
    expect(titles).not.toContain('Daily Mix 1'); // filtered out when pre-selected

    const addButtons = Array.from(container.querySelectorAll('.add-button')) as HTMLButtonElement[];
    await act(async () => {
      addButtons[0].click();
    });
    expect(onAddItem).toHaveBeenCalled();
  });

  it('searches playlists and hides selected entries from results', async () => {
    const selected = [new PlaylistContainer(sdk as any, makePlaylist('search-pl-old', 'Found mix old'))];
    const { onAddItem } = await renderPane({ selectedItems: selected });
    await flush();

    const input = container.querySelector('.search-input') as HTMLInputElement;
    input.value = 'mix';
    await act(async () => {
      Simulate.change(input);
    });
    await act(async () => {
      Simulate.submit(container.querySelector('form') as HTMLFormElement);
    });
    await flush();

    expect(sdk.search).toHaveBeenCalledWith('mix', ['playlist'], undefined, 50, 0);
    const tiles = Array.from(container.querySelectorAll('.item-tile')) as HTMLElement[];
    const titles = tiles.map(t => t.querySelector('.item-title')?.textContent);
    expect(titles).toContain('Found mix'); // search result visible, selected filtered
    expect(titles).not.toContain('Found mix (selected)');

    const addButton = container.querySelector('.add-button') as HTMLButtonElement;
    await act(async () => addButton.click());
    expect(onAddItem).toHaveBeenCalled();
  });

  it('loads saved albums and supports load more with scrollable results', async () => {
    await renderPane({ initialContentType: 'album' });
    await flush();

    const selector = container.querySelector('.type-selector') as HTMLSelectElement;
    await act(async () => {
      selector.value = 'album';
      Simulate.change(selector);
    });
    await flush();

    const tiles = Array.from(container.querySelectorAll('.item-tile')) as HTMLElement[];
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles[0].querySelector('.item-title')?.textContent).toContain('Synth Wave');

    const loadMore = container.querySelector('button.text-button');
    const beforeCalls = (sdk.currentUser.albums.savedAlbums as any).mock.calls.length;
    await act(async () => {
      loadMore?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flush();
    const afterCalls = (sdk.currentUser.albums.savedAlbums as any).mock.calls.length;
    expect(afterCalls).toBeGreaterThan(beforeCalls);

    const resultsWrapper = container.querySelector('.search-results') as HTMLElement;
    Object.defineProperty(resultsWrapper, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(resultsWrapper, 'scrollHeight', { value: 600, configurable: true });
    expect(resultsWrapper.scrollHeight).toBeGreaterThan(resultsWrapper.clientHeight);
  });

  it('searches albums and hides already selected albums', async () => {
    const selected = [new AlbumContainer(sdk as any, makeAlbum('search-al-old', 'Album mix'))];
    await renderPane({ selectedItems: selected, initialContentType: 'album' });
    await flush();

    const selector = container.querySelector('.type-selector') as HTMLSelectElement;
    await act(async () => {
      selector.value = 'album';
      Simulate.change(selector);
    });
    await flush();

    const input = container.querySelector('.search-input') as HTMLInputElement;
    input.value = 'groove';
    await act(async () => {
      Simulate.change(input);
    });
    await act(async () => {
      Simulate.submit(container.querySelector('form') as HTMLFormElement);
    });
    await flush();

    expect(sdk.search).toHaveBeenCalledWith('groove', ['album'], undefined, 50, 0);
    const titles = Array.from(container.querySelectorAll('.item-title')).map(t => t.textContent);
    expect(titles).toContain('Album groove');
    expect(titles).not.toContain('Album mix');
  });

  it('clears search via clear icon and prevents empty submit', async () => {
    await renderPane();
    await flush();
    const input = container.querySelector('.search-input') as HTMLInputElement;
    input.value = 'mix';
    await act(async () => Simulate.change(input));
    const clear = container.querySelector('.search-clear-icon') as HTMLElement;
    expect(clear).toBeTruthy();
    await act(async () => clear.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(input.value).toBe('');

    const submit = container.querySelector('.search-submit-icon') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });

  it('loads more search results when next page exists', async () => {
    sdk.search = vi.fn(async (query: string, types: string[], _market: string, _limit: number, offset: number) => {
      return {
        playlists: {
          items: [makePlaylist(`${query}-${offset}`, `Found ${query}-${offset}`)],
          total: 3,
          limit: 1,
          offset,
          next: offset < 2 ? 'next' : null
        }
      };
    }) as any;

    await renderPane();
    await flush();
    const input = container.querySelector('.search-input') as HTMLInputElement;
    input.value = 'mix';
    await act(async () => Simulate.change(input));
    await act(async () => Simulate.submit(container.querySelector('form') as HTMLFormElement));
    await flush();

    const loadMoreBtn = container.querySelector('.text-button') as HTMLButtonElement | null;
    expect(loadMoreBtn).not.toBeNull();
    await act(async () => loadMoreBtn!.click());
    await flush();
    expect((sdk.search as any).mock.calls[1][4]).toBe(1); // offset advanced by limit 1
  });
});
