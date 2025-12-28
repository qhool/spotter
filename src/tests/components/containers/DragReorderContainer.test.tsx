import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement, createRef, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { DragReorderContainer, DragReorderItem } from '../../../components/containers/DragReorderContainer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Item = DragReorderItem;

const createDataTransfer = () => {
  const store: Record<string, string> = {};
  return {
    setData: (type: string, value: string) => { store[type] = value; },
    getData: (type: string) => store[type] ?? '',
    clearData: () => { Object.keys(store).forEach(key => delete store[key]); }
  } as DataTransfer;
};

const ensureRect = (el: HTMLElement) => {
  if (!el.getBoundingClientRect) {
    (el as any).getBoundingClientRect = () => ({
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      height: 100,
      width: 100
    });
  }
};

const getProps = (el: HTMLElement) => {
  const key = Object.keys(el).find(k => k.startsWith('__reactProps$'));
  return key ? (el as any)[key] : {};
};

const makeEvent = (target: HTMLElement, dataTransfer: DataTransfer, clientY = 0, clientX = 0) => ({
  dataTransfer,
  preventDefault: () => {},
  stopPropagation: () => {},
  currentTarget: target,
  clientY,
  clientX
});

const itemsOrThrow = (ref: { current: { getItems: () => Item[]; getLastSet: () => Item[] } | null }) => {
  if (!ref.current) {
    throw new Error('Harness ref not set');
  }
  return ref.current;
};

describe('DragReorderContainer', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container.remove();
  });

  const renderHarness = (initialItems: Item[], options?: { disableDragToDelete?: boolean; emptyMessage?: string; getDragItem?: (data: any) => Item | null }) => {
    const ref = createRef<{ getItems: () => Item[]; getLastSet: () => Item[] }>();

    const Harness = forwardRef<typeof ref['current'], {}>((_, refObj) => {
      const [items, setItemsState] = useState<Item[]>(initialItems);
      const latest = useRef(items);
      const lastSet = useRef<Item[]>(initialItems);
      latest.current = items;

      const setItems = (next: Item[]) => {
        lastSet.current = next;
        setItemsState(next);
      };

      useImperativeHandle(refObj, () => ({
        getItems: () => latest.current,
        getLastSet: () => lastSet.current
      }));

      return createElement(DragReorderContainer<Item>, {
        items,
        setItems,
        getItemId: (item: Item) => item.id,
        renderItem: (item: Item) => createElement('div', null, item.content ?? item.id),
        getDragItem: options?.getDragItem,
        disableDragToDelete: options?.disableDragToDelete,
        emptyMessage: options?.emptyMessage
      });
    });

    act(() => {
      root = createRoot(container);
      root.render(createElement(Harness, { ref }));
    });

    return ref;
  };

  it('renders empty message when no items', () => {
    renderHarness([], { emptyMessage: 'Nothing here' });
    expect(container.textContent).toContain('Nothing here');
  });

  it('reorders items on internal drag/drop', async () => {
    const ref = renderHarness([
      { id: 'a', content: 'A' },
      { id: 'b', content: 'B' }
    ]);

    const wrapper = container.querySelector('.drag-reorder-container') as HTMLElement;
    const items = Array.from(wrapper.querySelectorAll('.drag-item')) as HTMLElement[];
    items.forEach(ensureRect);
    ensureRect(wrapper);
    const dataTransfer = createDataTransfer();
    const containerProps = getProps(wrapper);
    const itemProps = items.map(getProps);

    expect(containerProps.onDrop).toBeTypeOf('function');
    expect(itemProps[0].onDragStart).toBeTypeOf('function');

    await act(async () => {
      itemProps[0].onDragStart?.(makeEvent(items[0], dataTransfer));
      containerProps.onDragEnter?.(makeEvent(wrapper, dataTransfer));
      // Drag over the second item (below center) so it inserts after it
      itemProps[1].onDragOver?.(makeEvent(items[1], dataTransfer, 80));
      dataTransfer.setData('application/json', JSON.stringify({ id: 'a' }));
      containerProps.onDrop?.(makeEvent(wrapper, dataTransfer));
      itemProps[0].onDragEnd?.(makeEvent(items[0], dataTransfer));
    });

    expect(dataTransfer.getData('application/json')).toContain('"id":"a"');
    const handle = itemsOrThrow(ref);
    expect(handle.getLastSet().map(item => item.id)).toEqual(['b', 'a']);
    expect(handle.getItems().map(item => item.id)).toEqual(['b', 'a']);
  });

  it('deletes item on drag end without drop when enabled', async () => {
    const ref = renderHarness([
      { id: 'x', content: 'X' },
      { id: 'y', content: 'Y' }
    ]);
    let wrapper = container.querySelector('.drag-reorder-container') as HTMLElement;
    let items = Array.from(wrapper.querySelectorAll('.drag-item')) as HTMLElement[];
    const dataTransfer = createDataTransfer();
    let itemProps = items.map(getProps);

    await act(async () => {
      itemProps[0].onDragStart?.(makeEvent(items[0], dataTransfer));
    });

    wrapper = container.querySelector('.drag-reorder-container') as HTMLElement;
    items = Array.from(wrapper.querySelectorAll('.drag-item')) as HTMLElement[];
    itemProps = items.map(getProps);

    await act(async () => {
      await Promise.resolve();
      itemProps[0].onDragEnd?.(makeEvent(items[0], dataTransfer));
    });

    const handle = itemsOrThrow(ref);
    expect(handle.getLastSet().map(item => item.id)).toEqual(['y']);
    expect(handle.getItems().map(item => item.id)).toEqual(['y']);
  });

  it('accepts external drops via getDragItem and clears drag state', async () => {
    const ref = renderHarness(
      [{ id: 'a', content: 'A' }],
      {
        getDragItem: data => data && data.uri ? { id: data.uri, content: data.uri } : null,
        disableDragToDelete: true
      }
    );
    const newData = { uri: 'new-item' };
    const dataTransfer = createDataTransfer();
    dataTransfer.setData('application/json', JSON.stringify(newData));

    let wrapper = container.querySelector('.drag-reorder-container') as HTMLElement;
    let existing = wrapper.querySelector('.drag-item') as HTMLElement;
    ensureRect(existing);
    ensureRect(wrapper);
    let containerProps = getProps(wrapper);
    let existingProps = getProps(existing);

    expect(existingProps.onDragOver).toBeTypeOf('function');

    await act(async () => {
      containerProps.onDragEnter?.(makeEvent(wrapper, dataTransfer));
      // drag over above the first item to insert at start
      existingProps.onDragOver?.(makeEvent(existing, dataTransfer, 0));
    });

    wrapper = container.querySelector('.drag-reorder-container') as HTMLElement;
    existing = wrapper.querySelector('.drag-item') as HTMLElement;
    containerProps = getProps(wrapper);
    existingProps = getProps(existing);

    await act(async () => {
      await Promise.resolve();
      containerProps.onDrop?.(makeEvent(wrapper, dataTransfer));
    });

    const handle = itemsOrThrow(ref);
    expect(handle.getLastSet().map(item => item.id)).toEqual(['a', 'new-item']);
    expect(handle.getItems().map(item => item.id)).toEqual(['a', 'new-item']);
  });

  it('ignores delete when disabled and no drop occurs', async () => {
    const ref = renderHarness(
      [{ id: 'keep', content: 'Keep' }],
      { disableDragToDelete: true }
    );
    const wrapper = container.querySelector('.drag-reorder-container') as HTMLElement;
    const item = wrapper.querySelector('.drag-item') as HTMLElement;
    const props = getProps(item);
    const dataTransfer = createDataTransfer();

    await act(async () => {
      props.onDragStart?.(makeEvent(item, dataTransfer));
      props.onDragEnd?.(makeEvent(item, dataTransfer));
    });

    const handle = itemsOrThrow(ref);
    expect(handle.getItems().map(i => i.id)).toEqual(['keep']);
  });

  it('clears hover when leaving container bounds', async () => {
    const ref = renderHarness([{ id: 'a', content: 'A' }]);
    const wrapper = container.querySelector('.drag-reorder-container') as HTMLElement;
    ensureRect(wrapper);
    const props = getProps(wrapper);
    const dataTransfer = createDataTransfer();

    await act(async () => {
      props.onDragEnter?.(makeEvent(wrapper, dataTransfer));
      props.onDragLeave?.(makeEvent(wrapper, dataTransfer, -10, -10)); // outside bounds
    });
    expect(container.querySelector('.drop-indicator')).toBeNull();
    expect(itemsOrThrow(ref).getItems().length).toBe(1);
  });

  it('returns without change when drop data is missing and logs malformed data errors', async () => {
    const ref = renderHarness([
      { id: 'a', content: 'A' },
      { id: 'b', content: 'B' }
    ]);
    const wrapper = container.querySelector('.drag-reorder-container') as HTMLElement;
    const items = Array.from(wrapper.querySelectorAll('.drag-item')) as HTMLElement[];
    items.forEach(ensureRect);
    const propsContainer = getProps(wrapper);
    const propsItems = items.map(getProps);
    const dataTransfer = createDataTransfer();
    dataTransfer.setData('application/json', JSON.stringify({ id: 'a' }));

    await act(async () => {
      // Drop with no data and no draggedItemId should no-op
      propsContainer.onDrop?.(makeEvent(wrapper, dataTransfer));
    });
    const resultingIds = itemsOrThrow(ref).getLastSet().map(i => i.id);
    expect(resultingIds).toHaveLength(2);
    expect(new Set(resultingIds)).toEqual(new Set(['a', 'b']));

    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      dataTransfer.setData('application/json', '{bad json');
      propsContainer.onDrop?.(makeEvent(wrapper, dataTransfer));
    });
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('retains scroll position while reordering overflowing lists', async () => {
    const ref = renderHarness([
      { id: 'one', content: 'One' },
      { id: 'two', content: 'Two' },
      { id: 'three', content: 'Three' }
    ]);

    const wrapper = container.querySelector('.drag-reorder-container') as HTMLElement;
    const items = Array.from(wrapper.querySelectorAll('.drag-item')) as HTMLElement[];
    items.forEach(el => { el.style.height = '30px'; });
    wrapper.style.height = '40px';
    Object.defineProperty(wrapper, 'clientHeight', { value: 40, configurable: true });
    Object.defineProperty(wrapper, 'scrollHeight', { value: 200, configurable: true });
    wrapper.scrollTop = 10;

    const dataTransfer = createDataTransfer();
    const containerProps = getProps(wrapper);
    const itemProps = items.map(getProps);

    await act(async () => {
      itemProps[0].onDragStart?.(makeEvent(items[0], dataTransfer));
      containerProps.onDragEnter?.(makeEvent(wrapper, dataTransfer));
      itemProps[2].onDragOver?.(makeEvent(items[2], dataTransfer, 80));
      dataTransfer.setData('application/json', JSON.stringify({ id: 'one' }));
      containerProps.onDrop?.(makeEvent(wrapper, dataTransfer));
      itemProps[0].onDragEnd?.(makeEvent(items[0], dataTransfer));
    });

    expect(wrapper.scrollTop).toBe(10);
    expect(wrapper.scrollHeight).toBeGreaterThan(wrapper.clientHeight);
    expect(itemsOrThrow(ref).getItems().map(item => item.id)).toEqual(['two', 'three', 'one']);
  });
});
