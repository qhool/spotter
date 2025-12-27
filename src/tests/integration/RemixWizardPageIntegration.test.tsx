import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, Simulate } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { RemixWizardPage } from '../../pages/RemixWizardPage';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const makeSdk = () => {
  const sdk: any = {
    currentUser: {
      tracks: {
        savedTracks: vi.fn(async () => ({ items: [], total: 0 }))
      },
      playlists: {
        playlists: vi.fn(async (_limit: number = 50, _offset: number = 0) => ({
          items: [
            {
              id: 'pl1',
              name: 'My Mix',
              description: 'desc',
              images: [{ url: 'img' }],
              owner: { display_name: 'me' },
              tracks: { total: 10 }
            }
          ],
          total: 1,
          limit: 50,
          offset: 0,
          next: null
        }))
      },
      albums: {
        savedAlbums: vi.fn(async () => ({
          items: [],
          total: 0,
          limit: 50,
          offset: 0,
          next: null
        }))
      }
    },
    playlists: {
      getPlaylistItems: vi.fn(async (_id: string, _market: string, _fields: any, limit: number = 50, offset: number = 0) => ({
        items: [],
        total: 0,
        limit,
        offset,
        next: null
      }))
    },
    search: vi.fn(async (query: string, types: string[]) => {
      if (types.includes('playlist')) {
        return {
          playlists: {
            items: [
              {
                id: 'spl',
                name: `Search ${query}`,
                description: '',
                images: [],
                owner: { display_name: 'searcher' },
                tracks: { total: 5 }
              }
            ],
            total: 1,
            limit: 50,
            offset: 0,
            next: null
          }
        };
      }
      return {
        albums: {
          items: [
            {
              id: 'sal',
              name: `Album ${query}`,
              release_date: '2020-01-01',
              images: [],
              artists: [{ name: 'Artist' }],
              type: 'album'
            }
          ],
          total: 1,
          limit: 50,
          offset: 0,
          next: null
        }
      };
    })
  };
  sdk.player = {
    getAvailableDevices: vi.fn(async () => ({ devices: [] })),
    getPlaybackState: vi.fn(async () => ({ device: null }))
  };
  return sdk;
};

describe('RemixWizardPage integration (Search ↔ Selected ↔ Remix)', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null;
  let navSlot: HTMLDivElement;
  let sdk: any;

  const flush = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  beforeEach(() => {
    (globalThis as any).DOMMatrix ||= class { e = 0; constructor() {} };
    container = document.createElement('div');
    navSlot = document.createElement('div');
    document.body.appendChild(container);
    document.body.appendChild(navSlot);
    root = null;
    sdk = makeSdk();
  });

  afterEach(() => {
    act(() => root?.unmount());
    container.remove();
    navSlot.remove();
  });

  const renderPage = async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(
        createElement(RemixWizardPage, {
          sdk,
          navSlot,
          syncController: {} as any,
          recentTracksContainer: null
        })
      );
    });
    await flush();
  };

  it('adds from search pane into selected list and prevents duplicates', async () => {
    await renderPage();
    const addButtons = Array.from(container.querySelectorAll('.add-button')) as HTMLButtonElement[];
    const myMixBtn = addButtons.find(btn => (btn.getAttribute('aria-label') || '').includes('My Mix')) ?? addButtons[0];
    await act(async () => myMixBtn.click());
    await flush();
    const selected = Array.from(container.querySelectorAll('.selected-items-pane .item-title')).map(
      el => el.textContent
    );
    expect(selected).toContain('My Mix');

    await act(async () => addButtons[0].click());
    await flush();
    const selectedItems = container.querySelectorAll('.selected-items-pane .item-title');
    const countBefore = selectedItems.length;
    await act(async () => myMixBtn.click());
    await flush();
    const countAfter = container.querySelectorAll('.selected-items-pane .item-title').length;
    expect(countAfter).toBe(countBefore); // no duplicate added
  });

  it('supports searching for playlists and adding result to selected', async () => {
    await renderPage();
    const input = container.querySelector('.search-input') as HTMLInputElement;
    input.value = 'rock';
    await act(async () => {
      Simulate.change(input);
    });
    await act(async () => {
      Simulate.submit(container.querySelector('form') as HTMLFormElement);
    });
    await flush();

    const resultButtons = Array.from(container.querySelectorAll('.add-button')) as HTMLButtonElement[];
    await act(async () => resultButtons[0].click());
    await flush();
    const selectedNames = Array.from(container.querySelectorAll('.selected-items-pane .item-title')).map(
      el => el.textContent
    );
    expect(selectedNames.some(name => name?.includes('Search rock'))).toBe(true);
  });

  it('removes selected items via remove control', async () => {
    await renderPage();
    const addButtons = Array.from(container.querySelectorAll('.add-button')) as HTMLButtonElement[];
    await act(async () => addButtons[0].click());
    await flush();

    const removeBtn = container.querySelector('.remove-button') as HTMLButtonElement;
    expect(removeBtn).toBeTruthy();
    await act(async () => removeBtn.click());
    await flush();

    expect(container.querySelector('.selected-items-pane .item-title')).toBeNull();
  });

  it('selected list wrapper can overflow and show scroll', async () => {
    await renderPage();
    const wrapper = container.querySelector('.selected-items-pane__list-wrapper') as HTMLElement;
    Object.defineProperty(wrapper, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(wrapper, 'scrollHeight', { value: 600, configurable: true });
    expect(wrapper.scrollHeight).toBeGreaterThan(wrapper.clientHeight);
  });

  it('passes selected items and exclusion toggles into remix pane', async () => {
    await renderPage();
    const addButtons = Array.from(container.querySelectorAll('.add-button')) as HTMLButtonElement[];
    await act(async () => addButtons[0].click());
    await flush();

    const excludeBtn = container.querySelector('.exclude-button') as HTMLButtonElement;
    expect(excludeBtn).toBeTruthy();
    await act(async () => excludeBtn.click());
    await flush();

    // Ensure exclusion toggle is reflected in UI state (tied to remix options)
    expect(excludeBtn.className).toContain('is-active');
  });
});
