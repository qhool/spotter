import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { AboutOverlay } from '../../../components/overlays/AboutOverlay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('AboutOverlay', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container.remove();
    document.body.innerHTML = '';
  });

  const renderOverlay = async (props: Partial<React.ComponentProps<typeof AboutOverlay>> = {}) => {
    const onClose = props.onClose ?? vi.fn();
    await act(async () => {
      root = createRoot(container);
      root.render(
        createElement(AboutOverlay, {
          isOpen: true,
          onClose,
          ...props
        })
      );
      await Promise.resolve();
    });
    return onClose;
  };

  it('does not render when closed', async () => {
    await renderOverlay({ isOpen: false });
    expect(document.querySelector('.about-overlay')).toBeNull();
  });

  it('renders with loading animation and stays within viewport', async () => {
    await renderOverlay();
    const overlay = document.querySelector('.about-overlay') as HTMLElement;
    expect(overlay).toBeTruthy();
    const dialog = document.querySelector('.about-modal') as HTMLElement;
    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(document.querySelector('.loading-animation-label')?.textContent).toContain('Always tuning playlists');
    const rect = overlay.getBoundingClientRect();
    const vw = window.innerWidth || 1024;
    const vh = window.innerHeight || 768;
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.top).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(vw);
    expect(rect.bottom).toBeLessThanOrEqual(vh);
  });

  it('closes when clicking backdrop but not modal content', async () => {
    const onClose = await renderOverlay();
    const overlay = document.querySelector('.about-overlay') as HTMLElement;
    const dialog = document.querySelector('.about-modal') as HTMLElement;

    await act(async () => {
      overlay.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      dialog.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
