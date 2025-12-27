import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, Simulate } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { ExportPane } from '../../../components/panes/ExportPane';
import type { Track } from '@spotify/web-api-ts-sdk';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const controllerCalls: any[] = [];
const queueCalls: any[] = [];
const jsonDownloads: string[] = [];

vi.mock('../../../data/ExportController', () => {
  return {
    ExportController: class {
      target: any;
      progress: any;
      constructor(target: any, _concurrency: number, progress: any) {
        this.target = target;
        this.progress = progress;
      }
      append = async (tracks: Track[]) => {
        controllerCalls.push({ op: 'append', tracks });
        this.progress?.('append', 1, tracks.length);
      };
      replace = async (tracks: Track[]) => {
        controllerCalls.push({ op: 'replace', tracks });
        this.progress?.('replace', 1, tracks.length);
      };
    }
  };
});

vi.mock('../../../data/Exporters', () => {
  return {
    JSONExportTarget: class {
      async getData() {
        return JSON.stringify({ ok: true });
      }
    },
    PlaylistExportTarget: class {
      id = 'pl-created';
      constructor(_sdk: any, _opts: any) {}
      getPlaylistId() {
        return this.id;
      }
    },
    QueueExportTarget: class {
      device: any;
      constructor(_sdk: any, opts: any) {
        this.device = opts;
      }
      getOverallDescription() {
        return 'Queue';
      }
      getInitializationDescription() {
        return 'Init';
      }
      async initialize() {
        queueCalls.push({ op: 'init', device: this.device });
      }
      async addTracks(tracks: Track[]) {
        queueCalls.push({ op: 'add', tracks });
      }
    }
  };
});

const makeTrack = (id: string): Track =>
  ({
    id,
    name: `Track ${id}`,
    artists: [{ name: 'Artist' }] as any,
    album: { name: 'Album' } as any,
    duration_ms: 180000,
    uri: `spotify:track:${id}`,
    type: 'track',
    is_local: false
  } as Track);

describe('ExportPane', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null;

  const sdk = {
    currentUser: {
      playlists: {
        playlists: vi.fn(async () => ({
          items: [
            {
              id: 'existing',
              name: 'Existing Playlist',
              description: 'desc',
              owner: { display_name: 'owner' },
              images: [],
              tracks: { total: 3 }
            }
          ]
        }))
      }
    },
    player: {
      getAvailableDevices: vi.fn(async () => ({ devices: [] })),
      getPlaybackState: vi.fn(async () => ({ device: null }))
    }
  } as any;

  const remixContainer = {
    getTracks: vi.fn(async () => ({
      items: [makeTrack('a'), makeTrack('b'), makeTrack('c')],
      total: 3,
      next: null
    }))
  } as any;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
    controllerCalls.length = 0;
    queueCalls.length = 0;
  });

  afterEach(() => {
    act(() => root?.unmount());
    container.remove();
  });

  const render = async (
    exportType: 'playlist' | 'queue' | 'json' = 'playlist',
    opts: { excluded?: Set<string>; devices?: any[] } = {}
  ) => {
    if (opts.devices) {
      sdk.player.getAvailableDevices.mockResolvedValueOnce({ devices: opts.devices });
    }
    await act(async () => {
      root = createRoot(container);
      root.render(
        createElement(ExportPane, {
          sdk,
          remixContainer,
          excludedTrackIds: opts.excluded ?? new Set(),
          initialExportType: exportType
        })
      );
    });
    await act(async () => Promise.resolve());
  };

  it('shows playlist controls, allows selecting and clearing existing playlist', async () => {
    await render('playlist');
    expect(container.querySelector('#playlist-name')).toBeTruthy();
    expect(container.querySelector('#queue-device-select')).toBeNull();

    const pickerButton = container.querySelector('.playlist-picker-button') as HTMLButtonElement;
    await act(async () => pickerButton.click());
    await act(async () => Promise.resolve());

    const pickerItem = container.querySelector('.playlist-picker-item') as HTMLButtonElement;
    expect(pickerItem).toBeTruthy();
    await act(async () => pickerItem.click());
    await act(async () => Promise.resolve());

    const card = container.querySelector('.selected-playlist-card');
    expect(card).toBeTruthy();

    const clearBtn = container.querySelector('.selected-playlist-card__actions .icon-button') as HTMLButtonElement;
    await act(async () => clearBtn.click());
    expect(container.querySelector('.selected-playlist-card')).toBeNull();
  });

  it('filters excluded tracks when exporting and shows progress overlay', async () => {
    await render('playlist', { excluded: new Set(['b']) });

    const exportBtn = container.querySelector('.export-button') as HTMLButtonElement;
    await act(async () => exportBtn.click());
    await act(async () => Promise.resolve());

    expect(controllerCalls.length).toBeGreaterThan(0);
    const exportedTracks = controllerCalls[0]?.tracks ?? [];
    expect(exportedTracks.map(t => t.id)).not.toContain('b');
    expect(container.querySelector('.export-progress-overlay')).toBeTruthy();
  });

  it('shows queue controls when queue mode selected', async () => {
    await render('queue', { devices: [{ id: 'dev1', name: 'Device 1', is_active: true }] });
    const select = container.querySelector('#queue-device-select') as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(container.querySelector('#playlist-name')).toBeNull();
  });

  it('handles JSON export path and records download', async () => {
    (global.URL as any).createObjectURL ||= () => 'blob:url';
    (global.URL as any).revokeObjectURL ||= () => {};
    const createUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:url');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.fn();
    const origCreate = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation((tag: any) => {
      const el = origCreate.call(document, tag);
      if (tag === 'a') {
        Object.defineProperty(el, 'click', { value: clickSpy });
      }
      return el as any;
    });

    await render('json');
    const exportBtn = container.querySelector('.export-button') as HTMLButtonElement;
    await act(async () => exportBtn.click());
    expect(controllerCalls[0]?.op).toBe('append'); // JSON path uses controller append
    expect(clickSpy).toHaveBeenCalled();
    expect(createUrlSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalled();

    createUrlSpy.mockRestore();
    revokeSpy.mockRestore();
    (document.createElement as any).mockRestore?.();
  });

  it('queues tracks on selected device and filters excluded tracks', async () => {
    await render('queue', { devices: [{ id: 'dev1', name: 'Device 1', is_active: true }], excluded: new Set(['c']) });
    const exportBtn = container.querySelector('.export-button') as HTMLButtonElement;
    await act(async () => exportBtn.click());
    await act(async () => Promise.resolve());

    expect(queueCalls.find(call => call.op === 'init')).toBeTruthy();
    const adds = queueCalls.filter(call => call.op === 'add').flatMap(call => call.tracks);
    expect(adds.map((t: Track) => t.id)).not.toContain('c');
    expect(container.querySelector('.export-progress-overlay')).toBeTruthy();
  });

  it('replaces existing playlist and shows last created link on new playlist', async () => {
    await render('playlist');
    const pickerButton = container.querySelector('.playlist-picker-button') as HTMLButtonElement;
    await act(async () => pickerButton.click());
    const pickerItem = container.querySelector('.playlist-picker-item') as HTMLButtonElement;
    await act(async () => pickerItem.click());

    const toggle = container.querySelector('.playlist-mode-toggle') as HTMLButtonElement;
    await act(async () => toggle.click()); // switch to replace
    const exportBtn = container.querySelector('.export-button') as HTMLButtonElement;
    await act(async () => exportBtn.click());
    expect(controllerCalls.some(c => c.op === 'replace')).toBe(true);

    const overlay = container.querySelector('.export-progress-overlay') as HTMLElement;
    await act(async () => overlay.click()); // dismiss to reset exporting flag

    const clearBtn = container.querySelector('.selected-playlist-card__actions .icon-button') as HTMLButtonElement;
    await act(async () => clearBtn.click());
    await act(async () => exportBtn.click());
    await act(async () => new Promise(resolve => setTimeout(resolve, 0)));
    expect(container.querySelector('.playlist-link-button')).toBeTruthy();
  });
});
