import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { createElement } from 'react';
import { useControlsSlot } from '../../hooks/useControlsSlot';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Harness = ({ portalId }: { portalId: string }) => {
  const el = useControlsSlot(portalId);
  return createElement('div', { 'data-el': el ? 'found' : 'missing' });
};

describe('useControlsSlot', () => {
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
    document.body.innerHTML = '';
  });

  it('returns null when element is not found', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(Harness, { portalId: 'missing-slot' }));
    });
    expect(container.querySelector('[data-el="missing"]')).toBeTruthy();
  });

  it('finds element by id when present', async () => {
    const slot = document.createElement('div');
    slot.id = 'controls-slot';
    document.body.appendChild(slot);

    await act(async () => {
      root = createRoot(container);
      root.render(createElement(Harness, { portalId: 'controls-slot' }));
    });
    expect(container.querySelector('[data-el="found"]')).toBeTruthy();
  });
});
