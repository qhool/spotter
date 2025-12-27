import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { RecentTracksPage } from '../../pages/RecentTracksPage';
import { RECENT_TRACKS_SYNC_NAME } from '../../data/SyncFunctions';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let lastTrackListProps: any = null;
vi.mock('../../components/containers/TrackList', () => ({
  TrackList: (props: any) => {
    lastTrackListProps = props;
    return createElement('div', { className: 'mock-track-list', 'data-refresh': props.refreshTrigger });
  }
}));

describe('RecentTracksPage', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
    lastTrackListProps = null;
  });

  afterEach(() => {
    act(() => root?.unmount());
    container.remove();
  });

  const renderPage = async (props: Partial<React.ComponentProps<typeof RecentTracksPage>>) => {
    const navSlot = props.navSlot ?? document.createElement('div');
    await act(async () => {
      root = createRoot(container);
      root.render(
        createElement(RecentTracksPage, {
          navSlot,
          syncController: props.syncController as any,
          recentTracksState: props.recentTracksState ?? null,
          recentTracksSyncReady: props.recentTracksSyncReady ?? false
        })
      );
      await Promise.resolve();
    });
    return { navSlot };
  };

  it('shows loading when no recent tracks container and disables refresh if not ready', async () => {
    await renderPage({ recentTracksSyncReady: false, syncController: { triggerSync: vi.fn() } as any });
    expect(container.textContent).toContain('Loading recent tracks');
    const refreshBtn = container.querySelector('.recent-tracks-refresh') as HTMLButtonElement;
    expect(refreshBtn.disabled).toBe(true);
  });

  it('renders track summary, nav portal, and track list when state is ready', async () => {
    const date = new Date('2023-01-01T12:34:00Z');
    const state = {
      value: { container: { getLastUpdated: () => date } as any, trackCount: 5 },
      lastUpdated: date
    };
    const { navSlot } = await renderPage({
      navSlot: document.createElement('div'),
      recentTracksState: state,
      recentTracksSyncReady: true,
      syncController: { triggerSync: vi.fn() } as any
    });

    expect(navSlot.textContent).toContain('Recently Played');
    expect(container.textContent).toContain('5 most recent tracks');
    expect(lastTrackListProps?.trackContainer).toBeTruthy();
    expect(lastTrackListProps?.refreshTrigger).toBeGreaterThan(0);
  });

  it('triggers refresh and prevents double clicks while refreshing', async () => {
    let resolveSync: (() => void) | null = null;
    const triggerSync = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveSync = resolve;
        })
    );
    await renderPage({
      recentTracksState: { value: { container: { getLastUpdated: () => null } }, lastUpdated: null } as any,
      recentTracksSyncReady: true,
      syncController: { triggerSync } as any
    });

    const refreshBtn = container.querySelector('.recent-tracks-refresh') as HTMLButtonElement;
    await act(async () => refreshBtn.click());
    expect(triggerSync).toHaveBeenCalledWith(RECENT_TRACKS_SYNC_NAME);

    await act(async () => refreshBtn.click());
    expect(triggerSync).toHaveBeenCalledTimes(1);

    resolveSync?.();
    await act(async () => Promise.resolve());
  });

  it('track list supports scrolling when content overflows', async () => {
    await renderPage({
      recentTracksState: { value: { container: { getLastUpdated: () => null } }, lastUpdated: null } as any,
      recentTracksSyncReady: true,
      syncController: { triggerSync: vi.fn() } as any
    });
    const list = container.querySelector('.mock-track-list') as HTMLElement;
    Object.defineProperty(list, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(list, 'scrollHeight', { value: 800, configurable: true });
    expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
  });
});
