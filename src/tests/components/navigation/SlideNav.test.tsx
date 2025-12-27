import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { SlideNav } from '../../../components/navigation/SlideNav';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const makeItems = (count: number, clicks: ReturnType<typeof vi.fn>[] = []) =>
  Array.from({ length: count }, (_, i) => ({
    text: `Pane ${i + 1}`,
    onClick: clicks[i] ?? vi.fn()
  }));

describe('SlideNav', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => root?.unmount());
    container.remove();
    root = null;
  });

const renderNav = (itemsCount: number, selectedIndex: number) => {
  const clicks = Array.from({ length: itemsCount }, () => vi.fn());
  act(() => {
    // jsdom lacks DOMMatrix; polyfill minimal piece used by component
    if (!(globalThis as any).DOMMatrix) {
      (globalThis as any).DOMMatrix = class {
        e = 0;
        constructor() {}
      };
    }
    root = createRoot(container);
    root.render(createElement(SlideNav, { items: makeItems(itemsCount, clicks), selectedIndex }));
  });
  return clicks;
};

  it('renders only adjacent items and centers active title via translateX', () => {
    const clicks = renderNav(4, 1);
    const outer = container.querySelector('.slide-nav-outer') as HTMLElement;
    const inner = container.querySelector('.slide-nav-inner') as HTMLElement;
    expect(outer).toBeTruthy();
    expect(inner.style.transform).toContain('translateX');

    const visibleButtons = Array.from(container.querySelectorAll('.slide-nav-item'))
      .filter(btn => (btn as HTMLElement).style.visibility !== 'hidden');
    expect(visibleButtons.length).toBeLessThanOrEqual(3); // active + neighbors

    const centerAfter = inner.style.transform;
    expect(centerAfter).toContain('translateX');
    (visibleButtons[0] as HTMLButtonElement).click();
    expect(clicks.some(fn => fn.mock.calls.length > 0)).toBe(true);
  });

  it('shows left/right icons for adjacent panes and responds to clicks', () => {
    const clicks = renderNav(3, 1);
    const icons = Array.from(container.querySelectorAll('.slide-nav-icon')) as HTMLElement[];
    expect(icons.length).toBeGreaterThan(0);

    const iconPropsKey = Object.keys(icons[0]).find(k => k.startsWith('__reactProps$'));
    const iconProps = iconPropsKey ? (icons[0] as any)[iconPropsKey] : {};
    iconProps.onClick?.();
    expect(clicks.some(fn => fn.mock.calls.length > 0)).toBe(true);

    const rightIcon = icons.find(el => el.classList.contains('nav-item-2'));
    const rightPropsKey = rightIcon ? Object.keys(rightIcon).find(k => k.startsWith('__reactProps$')) : null;
    const rightProps = rightPropsKey && rightIcon ? (rightIcon as any)[rightPropsKey] : {};
    act(() => {
      rightProps.onMouseEnter?.();
      rightProps.onMouseLeave?.();
    });
  });

  it('applies hover state on groups when entering and leaving', () => {
    renderNav(3, 1);
    const btn = container.querySelector('.slide-nav-item.nav-item-0') as HTMLButtonElement;
    const propsKey = Object.keys(btn).find(k => k.startsWith('__reactProps$'));
    const props = propsKey ? (btn as any)[propsKey] : {};

    act(() => {
      props.onMouseEnter?.();
    });
    expect(btn.className).toContain('group-hover');

    act(() => {
      props.onMouseLeave?.();
    });
    expect(btn.className).not.toContain('group-hover');
  });

  it('handles different visible counts up to 4 items', () => {
    [1, 2, 3, 4].forEach(count => {
      renderNav(count, Math.min(1, count - 1));
      const items = Array.from(container.querySelectorAll('.slide-nav-item'));
      expect(items.length).toBe(count);
      const visibleCount = items.filter(btn => (btn as HTMLElement).style.visibility !== 'hidden').length;
      if (count <= 2) {
        expect(visibleCount).toBe(count);
      } else {
        expect(visibleCount).toBeLessThanOrEqual(3);
      }
      act(() => root?.unmount());
    });
  });

  it('returns early when selected item ref is missing', () => {
    renderNav(0, 0);
    const inner = container.querySelector('.slide-nav-inner') as HTMLElement;
    expect(inner.style.transform).toContain('translateX(0px)');
  });
});
