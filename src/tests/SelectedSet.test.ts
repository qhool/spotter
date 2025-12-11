import { describe, expect, it } from 'vitest';
import {
  SelectedSet,
  SelectedSetItem,
  SelectedSetVersionState,
  useSelectedSet
} from '../data/SelectedSet';
import { createElement, createRef, forwardRef, useImperativeHandle } from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class MockItem implements SelectedSetItem {
  constructor(private id: string, public label: string = id) {}
  getId(): string {
    return this.id;
  }
}

describe('SelectedSet', () => {
  it('preserves insertion order and list-style operations while tracking version', () => {
    const set = new SelectedSet<MockItem>();

    const first = new MockItem('a', 'Alpha');
    const second = new MockItem('b', 'Beta');
    const third = new MockItem('c', 'Gamma');

    expect(set.currentVersion).toBe(0);

    expect(set.add(first)).toBe(true);
    expect(set.currentVersion).toBe(1);
    expect(set.add(second)).toBe(true);
    expect(set.currentVersion).toBe(2);
    expect(set.add(first)).toBe(false); // duplicate ignored
    expect(set.currentVersion).toBe(2);

    expect(set.length).toBe(2);
    expect(set.at(0)).toBe(first);
    expect(set.at(-1)).toBe(second);

    // Push adds in order while ignoring duplicates
    const newSize = set.push(third, second);
    expect(newSize).toBe(3);
    expect(set.length).toBe(3);
  expect(set.currentVersion).toBe(3);

    expect(set.toArray()).toEqual([first, second, third]);
    expect([...set]).toEqual([first, second, third]);

    const labels = set.map(item => item.label);
    expect(labels).toEqual(['Alpha', 'Beta', 'Gamma']);

    const iterated: string[] = [];
    set.forEach((item, index) => {
      iterated.push(`${index}:${item.label}`);
    });
    expect(iterated).toEqual(['0:Alpha', '1:Beta', '2:Gamma']);

    expect(set.pop()).toBe(third);
    expect(set.currentVersion).toBe(4);
    expect(set.length).toBe(2);
    expect(set.pop()).toBe(second);
    expect(set.currentVersion).toBe(5);
    expect(set.pop()).toBe(first);
    expect(set.currentVersion).toBe(6);
    expect(set.pop()).toBeUndefined();
    expect(set.length).toBe(0);
    expect(set.currentVersion).toBe(6);
  });

  it('supports has/delete with consistent indexing and mutation notifications', () => {
  const notifications: number[] = [];
    const set = new SelectedSet<MockItem>([
      new MockItem('a'),
      new MockItem('b'),
      new MockItem('c')
    ], {
      onMutate: () => notifications.push(1)
    });

    expect(set.size).toBe(3);
    expect(set.currentVersion).toBe(3);
    expect(set.has('b')).toBe(true);
    expect(set.has(new MockItem('b'))).toBe(true); // same id

    expect(set.delete('b')).toBe(true);
    expect(set.has('b')).toBe(false);
    expect(set.length).toBe(2);
    expect(set.currentVersion).toBe(4);

    // Remaining items should shift and keep valid indices
    expect(set.at(0)?.getId()).toBe('a');
    expect(set.at(1)?.getId()).toBe('c');

    // Add a new item and ensure it lands at the end with correct index
    const delta = new MockItem('d');
    set.add(delta);
    expect(set.at(2)).toBe(delta);
    expect(set.currentVersion).toBe(5);

    // Deleting by item reference works and updates indices
    expect(set.delete(delta)).toBe(true);
    expect(set.has(delta)).toBe(false);
    expect(set.length).toBe(2);
    expect(set.currentVersion).toBe(6);

    // Clearing resets everything
    set.clear();
    expect(set.length).toBe(0);
    expect(set.has('a')).toBe(false);
    expect(set.delete('a')).toBe(false);
    expect(set.currentVersion).toBe(7);
    expect(notifications.length).toBe(7);
  });

  it('provides a useSelectedSet hook that exposes version state', () => {
    interface TestHandle {
      add: (id: string) => void;
      delete: (id: string) => void;
      clear: () => void;
      getVersion: () => number;
      getVersionState: () => SelectedSetVersionState;
    }

    const Harness = forwardRef<TestHandle>((_, ref) => {
      const { selectedSet, version, versionState } = useSelectedSet<MockItem>();
      useImperativeHandle(
        ref,
        () => ({
          add: id => {
            selectedSet.add(new MockItem(id));
          },
          delete: id => {
            selectedSet.delete(id);
          },
          clear: () => {
            selectedSet.clear();
          },
          getVersion: () => version,
          getVersionState: () => versionState
        }),
        [selectedSet, version, versionState]
      );
      return null;
    });

    const ref = createRef<TestHandle>();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(createElement(Harness, { ref }));
    });

    expect(ref.current?.getVersion()).toBe(0);

    act(() => {
      ref.current?.add('alpha');
    });
    expect(ref.current?.getVersion()).toBe(1);

    act(() => {
      ref.current?.add('alpha');
    });
    expect(ref.current?.getVersion()).toBe(1);

    act(() => {
      ref.current?.add('beta');
      ref.current?.delete('beta');
    });
    expect(ref.current?.getVersion()).toBe(3);

    act(() => {
      ref.current?.clear();
    });
    expect(ref.current?.getVersion()).toBe(4);

    const [versionValue] = ref.current?.getVersionState() ?? [NaN];
    expect(versionValue).toBe(4);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
