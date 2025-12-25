import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { Wizard } from '../../../components/navigation/Wizard';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let mockWidth = 800;
let latestIO: MockIntersectionObserver | null = null;
let latestRO: MockResizeObserver | null = null;

class MockResizeObserver {
  callback: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.callback = cb;
    latestRO = this;
  }
  observe(target: Element) {
    this.callback([{ contentRect: { width: mockWidth } } as ResizeObserverEntry], this as any);
  }
  disconnect() {}
  trigger(width = mockWidth) {
    this.callback([{ contentRect: { width } } as ResizeObserverEntry], this as any);
  }
}

class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  targets: Element[] = [];
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
    latestIO = this;
  }
  observe(target: Element) {
    this.targets.push(target);
  }
  disconnect() {}
  trigger(isIntersecting = true) {
    const entries = this.targets.map(target => ({
      target,
      isIntersecting,
      intersectionRatio: isIntersecting ? 1 : 0
    })) as IntersectionObserverEntry[];
    this.callback(entries, this as any);
  }
}

const panes = Array.from({ length: 4 }, (_, i) => ({
  id: `pane-${i}`,
  title: `Pane ${i + 1}`,
  render: () => createElement('div', { className: 'pane-content' }, `Content ${i + 1}`)
}));

const viewTitles = {
  1: panes.map(p => p.title),
  2: ['Pane 1 + Pane 2', 'Pane 2 + Pane 3', 'Pane 3 + Pane 4'],
  4: ['All Panes']
};

const breakpoints = [
  { minWidth: 1200, panes: 4 },
  { minWidth: 900, panes: 3 },
  { minWidth: 600, panes: 2 },
  { minWidth: 0, panes: 1 }
];

describe('Wizard', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    (globalThis as any).ResizeObserver = MockResizeObserver;
    (globalThis as any).IntersectionObserver = MockIntersectionObserver;
    if (!(globalThis as any).DOMMatrix) {
      (globalThis as any).DOMMatrix = class { e = 0; constructor() {} };
    }
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => root?.unmount());
    container.remove();
    root = null;
    latestIO = null;
    latestRO = null;
  });

  const flush = async (count = 2) => {
    for (let i = 0; i < count; i++) {
      await act(async () => {
        await Promise.resolve();
      });
    }
  };

  const renderWizard = async (width: number, extraProps: Partial<React.ComponentProps<typeof Wizard>> = {}) => {
    mockWidth = width;
    await act(async () => {
      if (!root) {
        root = createRoot(container);
      }
      root.render(
        createElement(Wizard, {
          panes,
          viewTitles,
          responsiveBreakpoints: breakpoints,
          ...extraProps
        })
      );
      await Promise.resolve();
    });
  };

  it('renders nav titles and switches panes via nav click', async () => {
    await renderWizard(700);
    await act(async () => {
      latestRO?.trigger(700);
    });
    await flush();
    const navButtons = Array.from(container.querySelectorAll('.slide-nav-item')) as HTMLButtonElement[];
    expect(navButtons.map(b => b.textContent)).toEqual(viewTitles[2]);

    const track = container.querySelector('.wizard-track') as HTMLElement;
    expect(track.style.transform).toContain('0%');

    await act(async () => {
      navButtons[1].click();
    });

    expect(track.style.transform).toContain('50');
    const activePanes = Array.from(container.querySelectorAll('[data-active="true"]'));
    expect(activePanes.length).toBeGreaterThan(0);
  });

  it('respects responsive breakpoints up to 4 panes', async () => {
    await renderWizard(1300);
    await act(async () => {
      latestRO?.trigger(1300);
    });
    await flush();
    // windowSize 4 -> no nav rendered (single window)
    expect(container.querySelector('.slide-nav-item')).toBeNull();

    await renderWizard(800);
    await act(async () => {
      latestRO?.trigger(800);
    });
    await flush();
    const navButtons = Array.from(container.querySelectorAll('.slide-nav-item')) as HTMLButtonElement[];
    expect(navButtons.length).toBe(3);
  });

  it('updates visibility flags via intersection observer', async () => {
    await renderWizard(700);
    expect(latestIO).toBeTruthy();
    await act(async () => {
      latestIO?.trigger(true);
    });
    const visiblePanes = Array.from(container.querySelectorAll('[data-visible="true"]'));
    expect(visiblePanes.length).toBeGreaterThan(0);
  });
});
