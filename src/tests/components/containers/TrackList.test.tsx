import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement, useState } from 'react';
import { TrackList } from '../../../components/containers/TrackList';
import { TrackContainer } from '../../../data/TrackContainer';
import type { Track } from '@spotify/web-api-ts-sdk';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class StubTrackContainer extends TrackContainer<Track> {
  id = 'stub';
  name = 'stub';
  description = '';
  coverImage = { url: '' };
  type: 'playlist' = 'playlist';
  constructor(private tracks: Track[], private shouldFail = false, private delayMs = 0) {
    super({} as any);
  }

  protected _standardizeTrack(raw: Track): Track {
    return raw;
  }

  // Not used in these tests
  protected async _getTracks(): Promise<any> {
    return { items: [], total: 0, next: null };
  }

  async getAllTracks(): Promise<Track[]> {
    if (this.delayMs) {
      await new Promise(resolve => setTimeout(resolve, this.delayMs));
    }
    if (this.shouldFail) {
      throw new Error('fail');
    }
    return this.tracks;
  }
}

const createTrack = (id: string, name: string): Track =>
  ({
    id,
    name,
    artists: [{ name: 'Artist' }] as any,
    album: { name: 'Album' } as any,
    duration_ms: 120000,
    is_local: false,
    uri: `spotify:track:${id}`,
    type: 'track'
  } as Track);

describe('TrackList', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container.remove();
    root = null;
  });

  it('renders loading, error, and empty states', async () => {
    const slowContainer = new StubTrackContainer([createTrack('a', 'A')], false, 10);
    await act(async () => {
      root = createRoot(container);
      root.render(
        createElement(TrackList, {
          trackContainer: slowContainer,
          refreshTrigger: 0
        })
      );
    });
    expect(container.textContent).toContain('Loading tracks');

    const failing = new StubTrackContainer([], true);
    await act(async () => {
      root?.render(
        createElement(TrackList, {
          trackContainer: failing,
          refreshTrigger: 1
        })
      );
    });
    expect(container.textContent).toContain('Failed to load tracks');

    const empty = new StubTrackContainer([]);
    await act(async () => {
      root?.render(
        createElement(TrackList, {
          trackContainer: empty,
          refreshTrigger: 2
        })
      );
    });
    expect(container.textContent).toContain('No tracks available');
  });

  it('toggles exclusions and preserves scroll position in long list', async () => {
    const tracks = Array.from({ length: 5 }, (_, i) => createTrack(`t${i + 1}`, `Track ${i + 1}`));
    const containerRef = new StubTrackContainer(tracks);

    const Harness = () => {
      const [excluded, setExcluded] = useState<Set<string>>(new Set());
      return createElement(TrackList, {
        trackContainer: containerRef,
        refreshTrigger: 0,
        excludedTrackIds: excluded,
        setExcludedTrackIds: setExcluded
      });
    };

    await act(async () => {
      root = createRoot(container);
      root.render(createElement(Harness));
    });

    const list = container.querySelector('.track-list') as HTMLElement;
    list.style.height = '50px';
    list.style.overflowY = 'auto';
    Object.defineProperty(list, 'clientHeight', { value: 50, configurable: true });
    Object.defineProperty(list, 'scrollHeight', { value: 300, configurable: true });
    list.scrollTop = 20;

    const items = Array.from(container.querySelectorAll('.track-item')) as HTMLElement[];
    expect(items.length).toBe(5);

    await act(async () => {
      items[0].click(); // exclude first track
    });
    expect(items[0].className).toContain('excluded');
    expect(list.scrollTop).toBe(20);
    expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
  });

  it('invokes onTracksLoaded callback with fetched tracks', async () => {
    const tracks = [createTrack('x', 'X')];
    const spy = vi.fn();
    const stub = new StubTrackContainer(tracks);

    await act(async () => {
      root = createRoot(container);
      root.render(
        createElement(TrackList, {
          trackContainer: stub,
          refreshTrigger: 0,
          onTracksLoaded: spy
        })
      );
    });

    expect(spy).toHaveBeenCalledWith(tracks);
  });
});
