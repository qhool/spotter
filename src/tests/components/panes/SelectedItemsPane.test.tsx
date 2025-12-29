import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { SelectedItemsPane } from '../../../components/panes/SelectedItemsPane';
import type { TrackContainer } from '../../../data/TrackContainer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Item = TrackContainer<any> & {
  id: string;
  name: string;
  type: 'playlist' | 'album' | 'liked-songs';
  coverImage?: { url: string };
  getTrackCount?: () => number | null;
  totalCount?: number;
};

let lastDragProps: any = null;

vi.mock('../../../components/containers/DragReorderContainer', () => ({
  DragReorderContainer: (props: any) => {
    lastDragProps = props;
    return createElement(
      'div',
      { className: 'mock-drag-container' },
      props.items.map((item: Item) =>
        createElement(
          'div',
          {
            key: item.id,
            className: 'mock-item',
            'data-id': item.id,
            onClick: () => props.setItems([...props.items].reverse())
          },
          props.renderItem(item)
        )
      )
    );
  }
}));

describe('SelectedItemsPane', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null;

  const makeItems = (): Item[] => [
    { id: 'a', name: 'Playlist A', type: 'playlist', coverImage: { url: 'a.png' }, getTrackCount: () => 20 } as any,
    { id: 'b', name: 'Album B', type: 'album', getTrackCount: () => 12 } as any
  ];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
    lastDragProps = null;
  });

  afterEach(() => {
    act(() => root?.unmount());
    container.remove();
  });

  const renderPane = async (props: Partial<React.ComponentProps<typeof SelectedItemsPane>> = {}) => {
    const setItems = props.setItems ?? vi.fn();
    const onRemoveItem = props.onRemoveItem ?? vi.fn();
    await act(async () => {
      root = createRoot(container);
      root.render(
        createElement(SelectedItemsPane, {
          items: (props.items as TrackContainer<any>[] | undefined) ?? (makeItems() as any),
          setItems,
          onRemoveItem,
          ...props
        })
      );
      await Promise.resolve();
    });
    return { setItems, onRemoveItem };
  };

  it('renders empty state with title and no count when no items', async () => {
    await renderPane({ items: [], title: 'Selected' });
    expect(container.textContent).toContain('Selected');
    expect(container.querySelector('.selected-items-pane__count')).toBeNull();
    expect(container.querySelector('.selected-items-pane__empty')?.textContent).toContain('No items selected');
  });

  it('renders items with remove controls and custom controls', async () => {
    const onRemoveItem = vi.fn();
    const customControl = (item: TrackContainer<any>) => createElement('span', { className: 'custom-control' }, `Meta ${item.id}`);
    await renderPane({ onRemoveItem, renderItemControls: customControl, title: 'Selected Items' });

    const tiles = Array.from(container.querySelectorAll('.item-tile')) as HTMLElement[];
    expect(tiles.length).toBe(2);
    expect(container.querySelector('.selected-items-pane__count')?.textContent).toBe('32 Tracks');
    expect(container.querySelectorAll('.custom-control').length).toBeGreaterThan(0);

    const removeButtons = Array.from(container.querySelectorAll('.remove-button')) as HTMLButtonElement[];
    await act(async () => {
      removeButtons[0].click();
    });
    expect(onRemoveItem).toHaveBeenCalledWith('a');
  });

  it('passes through drag props and calls setItems when mock drag triggers', async () => {
    const setItems = vi.fn();
    await renderPane({ setItems, disableDragToDelete: true });
    expect(lastDragProps).toBeTruthy();
    expect(lastDragProps.disableDragToDelete).toBe(true);
    expect(lastDragProps.items.map((i: Item) => i.id)).toEqual(['a', 'b']);
    expect(lastDragProps.getItemId(lastDragProps.items[0])).toBe('a');

    const mockItems = Array.from(container.querySelectorAll('.mock-item')) as HTMLElement[];
    await act(async () => {
      mockItems[0].click();
    });
    expect(setItems).toHaveBeenCalled();
    const reordered = setItems.mock.calls[0][0];
    expect(reordered.map((i: Item) => i.id)).toEqual(['b', 'a']);
  });

  it('indicates scrollable area when many items exist', async () => {
    const manyItems = Array.from({ length: 12 }, (_, i) => ({ id: `id-${i}`, name: `Item ${i}`, type: 'playlist' })) as Item[];
    await renderPane({ items: manyItems });

    const listWrapper = container.querySelector('.selected-items-pane__list-wrapper') as HTMLElement;
    Object.defineProperty(listWrapper, 'clientHeight', { value: 240, configurable: true });
    Object.defineProperty(listWrapper, 'scrollHeight', { value: 800, configurable: true });
    expect(listWrapper.scrollHeight).toBeGreaterThan(listWrapper.clientHeight);
  });

  it('sums track counts across items using getTrackCount or totalCount', async () => {
    const items: any[] = [
      { id: 'pl', name: 'Playlist', type: 'playlist', getTrackCount: () => 15 },
      { id: 'al', name: 'Album', type: 'album', totalCount: 8 },
      { id: 'ls', name: 'Liked', type: 'playlist' } // no count -> treated as 0
    ];

    await renderPane({ items, title: 'Selected Items' });
    expect(container.querySelector('.selected-items-pane__count')?.textContent).toBe('23 Tracks');
  });
});
