import { Dispatch, SetStateAction, useMemo, useRef, useState } from 'react';

export interface SelectedSetItem {
  /**
   * Returns a stable identifier used to uniquely track the item inside a {@link SelectedSet}.
   */
  getId(): string;
}

interface SelectedSetOptions {
  onMutate?: () => void;
  notifyOnInitialLoad?: boolean;
}

export type SelectedSetVersionState = readonly [
  number,
  Dispatch<SetStateAction<number>>
];

export interface UseSelectedSetResult<T extends SelectedSetItem> {
  selectedSet: SelectedSet<T>;
  version: number;
  versionState: SelectedSetVersionState;
}

/**
 * An ordered collection that maintains insertion order like a list while also providing
 * set-like membership helpers (has/delete) based on each item's {@link SelectedSetItem.getId}.
 */
export class SelectedSet<T extends SelectedSetItem> implements Iterable<T> {
  private items: T[] = [];
  private indexById: Map<string, number> = new Map();
  private version = 0;
  private readonly onMutate?: () => void;

  constructor(initialItems: Iterable<T> = [], options: SelectedSetOptions = {}) {
    this.onMutate = options.onMutate;
    const notifyOnInitialLoad = options.notifyOnInitialLoad ?? true;
    for (const item of initialItems) {
      this.addItem(item, notifyOnInitialLoad);
    }
  }

  /**
   * Number of items currently in the collection.
   */
  get size(): number {
    return this.items.length;
  }

  /**
   * Alias for {@link size} so the collection behaves like an array in most places.
   */
  get length(): number {
    return this.size;
  }

  /**
   * Current mutation version. Increments every time the set is mutably changed via public APIs.
   */
  get currentVersion(): number {
    return this.version;
  }

  /**
   * Returns a snapshot array of the current items.
   */
  toArray(): T[] {
    return [...this.items];
  }

  /**
   * Returns the item at the provided index, supporting negative indices like {@link Array.at}.
   */
  at(index: number): T | undefined {
    const normalizedIndex = index < 0 ? this.items.length + index : index;
    if (normalizedIndex < 0 || normalizedIndex >= this.items.length) {
      return undefined;
    }
    return this.items[normalizedIndex];
  }

  /**
   * Adds an item if its id is not already present. Returns true when the set changed.
   */
  add(item: T): boolean {
    return this.addItem(item, true);
  }

  private addItem(item: T, notifyMutation: boolean): boolean {
    const id = item.getId();
    if (this.indexById.has(id)) {
      return false;
    }
    this.indexById.set(id, this.items.length);
    this.items.push(item);
    if (notifyMutation) {
      this.bumpVersion();
    }
    return true;
  }

  /**
   * Push-style helper that attempts to add every provided item in order and returns the new size.
   */
  push(...items: T[]): number {
    for (const item of items) {
      this.addItem(item, true);
    }
    return this.size;
  }

  /**
   * Pops the last item, removing it from the underlying list and membership map.
   */
  pop(): T | undefined {
    const item = this.items.pop();
    if (!item) {
      return undefined;
    }
    this.indexById.delete(item.getId());
    this.bumpVersion();
    return item;
  }

  /**
   * Returns true when an item with the provided id (or the item's own id) exists.
   */
  has(itemOrId: T | string): boolean {
    return this.indexById.has(this.resolveId(itemOrId));
  }

  /**
   * Deletes the matching item (by id) and returns true if something was removed.
   */
  delete(itemOrId: T | string): boolean {
    const id = this.resolveId(itemOrId);
    const index = this.indexById.get(id);
    if (index === undefined) {
      return false;
    }

    this.indexById.delete(id);
    this.items.splice(index, 1);
    this.reindexFrom(index);
    this.bumpVersion();
    return true;
  }

  /**
   * Removes all items from the collection.
   */
  clear(): void {
    if (this.items.length === 0) {
      return;
    }
    this.items = [];
    this.indexById.clear();
    this.bumpVersion();
  }

  /**
   * Executes the provided callback once for each item (Array.forEach proxy).
   */
  forEach(callback: (item: T, index: number, array: readonly T[]) => void): void {
    this.items.forEach(callback);
  }

  /**
   * Standard Array.map proxy to keep the API list-friendly.
   */
  map<U>(callback: (item: T, index: number, array: readonly T[]) => U): U[] {
    return this.items.map(callback);
  }

  /**
   * Enables `for ... of` iteration over SelectedSet instances.
   */
  [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]();
  }

  private resolveId(itemOrId: T | string): string {
    return typeof itemOrId === 'string' ? itemOrId : itemOrId.getId();
  }

  private reindexFrom(startIndex: number) {
    for (let i = startIndex; i < this.items.length; i++) {
      this.indexById.set(this.items[i].getId(), i);
    }
  }

  private bumpVersion() {
    this.version += 1;
    this.onMutate?.();
  }
}

export function useSelectedSet<T extends SelectedSetItem>(
  initialItems: Iterable<T> = []
): UseSelectedSetResult<T> {
  const [version, setVersion] = useState(0);
  const setRef = useRef<SelectedSet<T>>();

  if (!setRef.current) {
    setRef.current = new SelectedSet(initialItems, {
      onMutate: () => setVersion(prev => prev + 1),
      notifyOnInitialLoad: false
    });
  }
  const selectedSet = setRef.current;

  const versionState = useMemo<SelectedSetVersionState>(
    () => [version, setVersion],
    [version, setVersion]
  );

  return {
    selectedSet,
    version,
    versionState
  };
}
