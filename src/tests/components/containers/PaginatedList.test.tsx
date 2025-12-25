import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, forwardRef, useState, ReactNode } from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { PaginatedList } from '../../../components/containers/PaginatedList';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ItemsWrapper = forwardRef<HTMLDivElement, { className?: string; children?: ReactNode }>(({ children, className }, ref) => (
  <div ref={ref} className={className} data-testid="items-wrapper">
    {children}
  </div>
));

describe('PaginatedList', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container.remove();
    root = null;
  });

  it('renders loading, error, and empty states', () => {
    act(() => {
      root = createRoot(container);
      root.render(
        createElement(PaginatedList, {
          isLoading: true,
          items: []
        })
      );
    });
    expect(container.textContent).toContain('Loading');

    act(() => {
      root?.render(
        createElement(PaginatedList, {
          isLoading: false,
          items: [],
          errorMessage: 'Oops',
          onRetry: vi.fn()
        })
      );
    });
    expect(container.textContent).toContain('Oops');
    expect(container.querySelector('button')?.textContent).toBe('Try again');

    act(() => {
      root?.render(
        createElement(PaginatedList, {
          isLoading: false,
          items: [],
          emptyMessage: 'No rows'
        })
      );
    });
    expect(container.textContent).toContain('No rows');
  });

  it('shows load more button and disables while loading more', () => {
    const onLoadMore = vi.fn();

    act(() => {
      root = createRoot(container);
      root.render(
        createElement(PaginatedList, {
          isLoading: false,
          items: [createElement('div', { key: 'a' }, 'A')],
          hasMore: true,
          onLoadMore,
          loadingMore: false,
          loadMoreLabel: 'More please'
        })
      );
    });

    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toBe('More please');
    act(() => {
      button.click();
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    act(() => {
      root?.render(
        createElement(PaginatedList, {
          isLoading: false,
          items: [createElement('div', { key: 'a' }, 'A')],
          hasMore: true,
          onLoadMore,
          loadingMore: true,
          loadMoreLabel: 'More please'
        })
      );
    });
    const loadingButton = container.querySelector('button') as HTMLButtonElement;
    expect(loadingButton.disabled).toBe(true);
    expect(loadingButton.textContent).toContain('Loading');
  });

  it('retains scroll position across re-renders with additional items', () => {
    const Harness = () => {
      const [items, setItems] = useState([
        createElement('div', { key: 'one', style: { height: '30px' } }, 'one'),
        createElement('div', { key: 'two', style: { height: '30px' } }, 'two')
      ]);
      return createElement(PaginatedList, {
        isLoading: false,
        items,
        hasMore: true,
        onLoadMore: () =>
          setItems(prev => [...prev, createElement('div', { key: 'three', style: { height: '30px' } }, 'three')]),
        itemsWrapperElement: ItemsWrapper as any,
        itemsClassName: 'items-wrapper'
      });
    };

    act(() => {
      root = createRoot(container);
      root.render(createElement(Harness));
    });

    const wrapper = container.querySelector('[data-testid="items-wrapper"]') as HTMLElement;
    wrapper.style.height = '40px';
    wrapper.style.overflowY = 'auto';
    Object.defineProperty(wrapper, 'clientHeight', { value: 40, configurable: true });
    Object.defineProperty(wrapper, 'scrollHeight', { value: 200, configurable: true });
    wrapper.scrollTop = 15;

    const button = container.querySelector('button') as HTMLButtonElement;
    act(() => {
      button.click();
    });

    expect(wrapper.scrollTop).toBe(15);
    expect(wrapper.scrollHeight).toBeGreaterThan(wrapper.clientHeight);
    expect(wrapper.textContent).toContain('three');
  });
});
