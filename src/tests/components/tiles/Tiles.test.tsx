import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { ButtonTile } from '../../../components/tiles/ButtonTile';
import { ItemTile, ContentType } from '../../../components/tiles/ItemTile';
import { PlaceholderTile } from '../../../components/tiles/PlaceholderTile';
import type { TrackContainer } from '../../../data/TrackContainer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const stubItem = (overrides: Partial<TrackContainer<any>> = {}, contentType: ContentType = 'playlist') =>
  ({
    id: 'id',
    name: 'Title',
    description: 'Desc',
    coverImage: undefined,
    type: contentType,
    ...overrides
  } as unknown as TrackContainer<any>);

describe('Tiles components', () => {
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

  it('renders ButtonTile and respects disabled', () => {
    const onClick = vi.fn();
    act(() => {
      root = createRoot(container);
      root.render(createElement(ButtonTile, { name: 'Play', onClick }));
    });
    expect(container.textContent).toContain('Play');
    act(() => {
      container.querySelector('.button-tile')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onClick).toHaveBeenCalledTimes(1);

    act(() => {
      root?.render(createElement(ButtonTile, { name: 'Disabled', onClick, disabled: true }));
    });
    act(() => {
      container.querySelector('.button-tile')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onClick).toHaveBeenCalledTimes(1); // no increment
  });

  it('renders ItemTile with cover image, placeholders, and controls', () => {
    const withCover = stubItem({ coverImage: { url: 'cover.png' } });
    act(() => {
      root = createRoot(container);
      root.render(
        createElement(ItemTile, {
          item: withCover,
          contentType: 'playlist',
          controls: createElement('button', { type: 'button' }, 'Action')
        })
      );
    });
    expect(container.querySelector('img')?.getAttribute('src')).toBe('cover.png');
    expect(container.querySelector('.item-controls')?.textContent).toContain('Action');

    act(() => {
      root?.render(
        createElement(ItemTile, {
          item: stubItem({ coverImage: undefined, type: 'album' }, 'album'),
          contentType: 'album'
        })
      );
    });
    expect(container.textContent).toContain('♫');

    act(() => {
      root?.render(
        createElement(ItemTile, {
          item: stubItem({ coverImage: undefined, type: 'liked-songs' }, 'playlist'),
          contentType: 'playlist'
        })
      );
    });
    expect(container.textContent).toContain('♥');
  });

  it('handles drag start/end hooks and dragging class', () => {
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    const item = stubItem();

    act(() => {
      root = createRoot(container);
      root.render(
        createElement(ItemTile, {
          item,
          contentType: 'playlist',
          onDragStart,
          onDragEnd,
          isDragging: true
        })
      );
    });

    const tile = container.querySelector('.item-tile') as HTMLElement;
    expect(tile.className).toContain('dragging');
    expect(tile.getAttribute('draggable')).toBe('true');

    const event = new Event('dragstart', { bubbles: true, cancelable: true });
    tile.dispatchEvent(event);
    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragStart.mock.calls[0][1]).toBe(item);

    tile.dispatchEvent(new Event('dragend', { bubbles: true, cancelable: true }));
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it('renders PlaceholderTile with default and custom text', () => {
    act(() => {
      root = createRoot(container);
      root.render(createElement(PlaceholderTile, {}));
    });
    expect(container.textContent).toContain('Item being moved');

    act(() => {
      root?.render(createElement(PlaceholderTile, { text: 'Drop here' }));
    });
    expect(container.textContent).toContain('Drop here');
  });
});
