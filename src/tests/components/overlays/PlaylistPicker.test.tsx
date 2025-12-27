import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { PlaylistPicker, type PlaylistSummary } from '../../../components/overlays/PlaylistPicker';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('PlaylistPicker', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null;

  const samplePlaylists: PlaylistSummary[] = [
    { id: '1', name: 'Morning Mix', ownerName: 'Alex', trackCount: 10 },
    { id: '2', name: 'Evening Vibes', ownerName: 'Sam', trackCount: 25 }
  ];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
  });

  afterEach(() => {
    act(() => root?.unmount());
    container.remove();
  });

  const renderPicker = async (
    props: Partial<React.ComponentProps<typeof PlaylistPicker>> = {}
  ) => {
    await act(async () => {
      root = createRoot(container);
      root.render(
        createElement(PlaylistPicker, {
          isOpen: true,
          isLoading: false,
          error: null,
          playlists: samplePlaylists,
          onSelect: vi.fn(),
          onClose: vi.fn(),
          onRetry: vi.fn(),
          ...props
        })
      );
      await Promise.resolve();
    });
  };

  it('does not render when closed', async () => {
    await renderPicker({ isOpen: false });
    expect(container.innerHTML.trim()).toBe('');
  });

  it('selects playlist on click and remains on-screen', async () => {
    const onSelect = vi.fn();
    await renderPicker({ onSelect });
    const items = Array.from(container.querySelectorAll('.playlist-picker-item')) as HTMLButtonElement[];
    expect(items.length).toBeGreaterThan(0);
    await act(async () => {
      items[0].click();
    });
    expect(onSelect).toHaveBeenCalledWith(samplePlaylists[0]);

    const overlay = container.querySelector('.playlist-picker-overlay') as HTMLElement;
    const rect = overlay.getBoundingClientRect();
    const vw = window.innerWidth || 1024;
    const vh = window.innerHeight || 768;
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.top).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(vw);
    expect(rect.bottom).toBeLessThanOrEqual(vh);
  });

  it('shows scrollable results when many playlists are present', async () => {
    const longList = Array.from({ length: 15 }, (_, i) => ({
      id: `p-${i}`,
      name: `Playlist ${i}`,
      trackCount: 100 + i
    })) satisfies PlaylistSummary[];

    await renderPicker({ playlists: longList });
    const listBody = container.querySelector('.playlist-picker-body') as HTMLElement;
    const items = container.querySelectorAll('.playlist-picker-item');
    expect(items.length).toBe(longList.length);

    Object.defineProperty(listBody, 'clientHeight', { value: 300, configurable: true });
    Object.defineProperty(listBody, 'scrollHeight', { value: 800, configurable: true });
    expect(listBody.scrollHeight).toBeGreaterThan(listBody.clientHeight);
  });
});
