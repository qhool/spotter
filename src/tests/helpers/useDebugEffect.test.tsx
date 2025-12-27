import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { useDebugEffect } from '../helpers/useDebugEffect';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Harness = ({ deps }: { deps: any[] }) => {
  useDebugEffect('debug', () => {}, deps);
  return createElement('div');
};

describe('useDebugEffect', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => root?.unmount());
    container.remove();
    logSpy.mockRestore();
  });

  const render = async (deps: any[]) => {
    await act(async () => {
      if (!root) {
        root = createRoot(container);
      }
      root.render(createElement(Harness, { deps }));
      await Promise.resolve();
    });
  };

  it('logs initial run once', async () => {
    await render([1]);
    expect(logSpy).toHaveBeenCalledWith('[debug] initial run');
  });

  it('logs changed primitive dependencies', async () => {
    await render([1, 'a']);
    logSpy.mockClear();
    await render([2, 'a']);
    const msg = logSpy.mock.calls.flat().join('\n');
    expect(msg).toContain('dep 0 changed: 1 -> 2');
    expect(msg).not.toContain('dep 1');
  });

  it('logs object ref changes with ref ids', async () => {
    const obj1 = { x: 1 };
    const obj2 = { y: 2 };
    await render([obj1, obj2]);
    logSpy.mockClear();
    const obj3 = { y: 3 };
    await render([obj1, obj3]);
    const msgs = logSpy.mock.calls.flat().join('\n');
    expect(msgs).toContain('dep 1 changed');
    expect(msgs).toMatch(/ref#\d+ -> ref#\d+/);
  });
});
