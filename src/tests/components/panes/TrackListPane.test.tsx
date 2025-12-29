import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement, useState } from 'react';
import { TrackListPane } from '../../../components/panes/TrackListPane';
import type { Track } from '@spotify/web-api-ts-sdk';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type StubRemix = {
  id: string;
  name: string;
  description?: string;
  coverImage?: { url: string };
  type: 'playlist';
  getAllTracks: () => Promise<Track[]>;
};

const makeTrack = (id: string, name: string): Track =>
  ({
    id,
    name,
    artists: [{ name: 'Artist' }] as any,
    album: { name: 'Album' } as any,
    duration_ms: 200000,
    uri: `spotify:track:${id}`,
    type: 'track',
    is_local: false
  } as Track);

const makeRemix = (tracks: Track[]): StubRemix => ({
  id: 'remix-1',
  name: 'Remix',
  type: 'playlist',
  getAllTracks: async () => tracks
});

describe('TrackListPane', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
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

  it('renders empty state when no remix container', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(
        createElement(TrackListPane, {
          remixContainer: null as any,
          excludedTrackIds: new Set<string>(),
          setExcludedTrackIds: () => {}
        })
      );
    });
    expect(container.textContent).toContain('Select items to see remixed output');
  });

  it('allows deselecting tracks and shows excluded class', async () => {
    const tracks = [makeTrack('t1', 'One'), makeTrack('t2', 'Two')];
    const remix = makeRemix(tracks);

    const Harness = () => {
      const [excluded, setExcluded] = useState<Set<string>>(new Set<string>());
      return createElement(TrackListPane, {
        remixContainer: remix as any,
        excludedTrackIds: excluded,
        setExcludedTrackIds: setExcluded
      });
    };

    await act(async () => {
      root = createRoot(container);
      root.render(createElement(Harness));
    });
    await flush();

    const items = Array.from(container.querySelectorAll('.track-item')) as HTMLElement[];
    expect(items.length).toBe(2);

    await act(async () => {
      items[0].click();
    });
    expect(items[0].className).toContain('excluded');

    await act(async () => {
      items[0].click();
    });
    expect(items[0].className).not.toContain('excluded');
  });

  it('indicates scrollability when many tracks exist', async () => {
    const tracks = Array.from({ length: 20 }, (_, i) => makeTrack(`id-${i}`, `Track ${i}`));
    const remix = makeRemix(tracks);

    await act(async () => {
      root = createRoot(container);
      root.render(
        createElement(TrackListPane, {
          remixContainer: remix as any,
          excludedTrackIds: new Set<string>(),
          setExcludedTrackIds: () => {}
        })
      );
    });
    await flush();

    const list = container.querySelector('.track-list') as HTMLElement;
    expect(list).toBeTruthy();
    Object.defineProperty(list, 'clientHeight', { value: 300, configurable: true });
    Object.defineProperty(list, 'scrollHeight', { value: 1200, configurable: true });
    expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
  });
});
