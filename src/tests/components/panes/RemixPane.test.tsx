import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { RemixPane } from '../../../components/panes/RemixPane';
import { TrackContainer } from '../../../data/TrackContainer';
import type { Track } from '@spotify/web-api-ts-sdk';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class StubTrackContainer extends TrackContainer<Track> {
  id: string;
  name: string;
  type: 'playlist' = 'playlist';
  constructor(id: string, name: string, private tracks: Track[]) {
    super({} as any);
    this.id = id;
    this.name = name;
  }
  protected _standardizeTrack(raw: Track): Track {
    return raw;
  }
  protected async _getTracks() {
    return { items: [], total: 0, next: null };
  }
  async getAllTracks(): Promise<Track[]> {
    return this.tracks;
  }
}

const makeTrack = (id: string, name: string): Track =>
  ({
    id,
    name,
    artists: [{ name: 'Artist' }] as any,
    album: { name: 'Album' } as any,
    duration_ms: 180000,
    uri: `spotify:track:${id}`,
    type: 'track',
    is_local: false
  } as Track);

describe('RemixPane', () => {
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

  const render = async (
    selectedItems: TrackContainer<any>[],
    opts: { onChange?: (c: any) => void; optionsById?: Record<string, any> } = {}
  ) => {
    const onChange = opts.onChange ?? vi.fn();
    const optionsById = opts.optionsById ?? {};
    await act(async () => {
      root = createRoot(container);
      root.render(
        createElement(RemixPane, {
          sdk: {} as any,
          selectedItems,
          excludedTrackIds: new Set<string>(),
          setExcludedTrackIds: () => {},
          onRemixContainerChange: onChange,
          itemOptionsById: optionsById
        })
      );
    });
    await act(async () => Promise.resolve());
  };

  it('renders empty state when no selections exist', async () => {
    await render([]);
    expect(container.textContent).toContain('Select items to see remixed output');
  });

  it('instantiates remix flow when items exist', async () => {
    const stub = new StubTrackContainer('one', 'One', [makeTrack('t1', 'One')]);
    await render([stub]);
    expect(container.querySelector('#remix-method')).toBeTruthy();
    expect(container.textContent).not.toContain('Select items to see remixed output');
    // Presence of refresh button implies remix container was created
    expect(container.querySelector('.track-list-pane__refresh-button')).toBeTruthy();
  });
});
