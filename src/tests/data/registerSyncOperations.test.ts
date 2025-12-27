import { describe, it, expect, vi, afterEach } from 'vitest';
import { registerRecentTracksSync } from '../../data/registerSyncOperations';

const makeController = () => {
  const registerOperation = vi.fn();
  const unregisterOperation = vi.fn();
  return { registerOperation, unregisterOperation };
};

describe('registerRecentTracksSync', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers recent-tracks sync and returns disposer that unregisters', () => {
    const controller = makeController();
    const onUpdate = vi.fn();
    const onReadyChange = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const disposer = registerRecentTracksSync({
      controller: controller as any,
      sdk: {} as any,
      onUpdate,
      onReadyChange
    });

    expect(controller.registerOperation).toHaveBeenCalledTimes(1);
    expect(onReadyChange).toHaveBeenCalledWith(true);

    const config = controller.registerOperation.mock.calls[0][0];
    config.onError?.(new Error('sync fail'));
    expect(consoleSpy).toHaveBeenCalled();

    disposer();
    expect(onReadyChange).toHaveBeenCalledWith(false);
    expect(controller.unregisterOperation).toHaveBeenCalledWith('recent-tracks-sync');
  });

  it('logs registration failures and still returns a disposer', () => {
    const controller = makeController();
    controller.registerOperation.mockImplementation(() => {
      throw new Error('boom');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onReadyChange = vi.fn();

    const disposer = registerRecentTracksSync({
      controller: controller as any,
      sdk: {} as any,
      onUpdate: vi.fn(),
      onReadyChange
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(onReadyChange).not.toHaveBeenCalledWith(true);

    disposer();
    expect(onReadyChange).toHaveBeenCalledWith(false);
    expect(controller.unregisterOperation).toHaveBeenCalledWith('recent-tracks-sync');
  });
});
