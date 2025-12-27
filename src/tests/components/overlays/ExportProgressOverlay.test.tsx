import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { ExportProgressOverlay } from '../../../components/overlays/ExportProgressOverlay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('ExportProgressOverlay', () => {
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

  const renderOverlay = async (
    props: Partial<React.ComponentProps<typeof ExportProgressOverlay>> = {}
  ) => {
    await act(async () => {
      root = createRoot(container);
      root.render(
        createElement(ExportProgressOverlay, {
          description: 'Sending tracks',
          completed: 0,
          tracksProcessed: 0,
          totalTracks: 10,
          isVisible: true,
          ...props
        })
      );
      await Promise.resolve();
    });
  };

  it('hides when not visible', async () => {
    await renderOverlay({ isVisible: false });
    expect(container.innerHTML.trim()).toBe('');
  });

  it('shows progress with animated state and correct bar width', async () => {
    await renderOverlay({ completed: 0.42, tracksProcessed: 21, totalTracks: 50 });
    const overlay = container.querySelector('.export-progress-overlay') as HTMLElement;
    expect(overlay).toBeTruthy();
    const barFill = container.querySelector('.export-progress-bar-fill') as HTMLElement;
    expect(barFill.style.width).toBe('42%');
    expect(container.textContent).toContain('21 / 50 tracks');
    const rect = overlay.getBoundingClientRect();
    const vw = window.innerWidth || 1024;
    const vh = window.innerHeight || 768;
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.top).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(vw);
    expect(rect.bottom).toBeLessThanOrEqual(vh);
  });

  it('handles completion state, spotify link, and dismissal flows', async () => {
    const onDismiss = vi.fn();
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null as any);

    await renderOverlay({
      isCompleted: true,
      isVisible: true,
      completed: 1,
      tracksProcessed: 12,
      totalTracks: 12,
      completionMessage: 'All done',
      spotifyPlaylistId: 'playlist123',
      onDismiss
    });

    const overlay = container.querySelector('.export-progress-overlay') as HTMLElement;
    const modal = container.querySelector('.export-progress-modal') as HTMLElement;
    const linkBtn = container.querySelector('.spotify-link-button') as HTMLButtonElement;

    await act(async () => {
      linkBtn.click();
    });
    expect(openSpy).toHaveBeenCalledWith(
      'https://open.spotify.com/playlist/playlist123',
      '_blank'
    );
    expect(onDismiss).not.toHaveBeenCalled();

    await act(async () => {
      modal.click();
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);

    await act(async () => {
      overlay.click();
    });
    expect(onDismiss).toHaveBeenCalledTimes(2);

    openSpy.mockRestore();
  });
});
