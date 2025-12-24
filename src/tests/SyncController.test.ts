import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncController } from '../data/SyncController';

describe('SyncController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs sync immediately when runOnRegister is true', async () => {
    const controller = new SyncController();
    const onUpdate = vi.fn();
    const syncFn = vi.fn().mockResolvedValue({ updated: true, lastUpdated: null, value: {} });

    controller.registerOperation({
      name: 'test',
      syncFn,
      onUpdate,
      runOnRegister: true
    });

    await vi.waitFor(() => {
      expect(syncFn).toHaveBeenCalledTimes(1);
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    controller.dispose();
  });

  it('supports manual triggerSync', async () => {
    const controller = new SyncController();
    const onUpdate = vi.fn();
    const syncFn = vi.fn().mockResolvedValue({ updated: true, lastUpdated: null, value: {} });

    controller.registerOperation({
      name: 'manual',
      syncFn,
      onUpdate,
      runOnRegister: false
    });

    await controller.triggerSync('manual');

    expect(syncFn).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledTimes(1);

    controller.dispose();
  });

  it('schedules next run with interval and clears on unregister', async () => {
    const controller = new SyncController();
    const onUpdate = vi.fn();
    const syncFn = vi.fn().mockResolvedValue({ updated: true, lastUpdated: null, value: {} });

    controller.registerOperation({
      name: 'interval',
      syncFn,
      onUpdate,
      onscreenIntervalMs: 100,
      offscreenIntervalMs: 100,
      runOnRegister: true
    });

    await vi.waitFor(() => expect(syncFn).toHaveBeenCalledTimes(1));

    vi.advanceTimersByTime(110);
    await vi.waitFor(() => expect(syncFn).toHaveBeenCalledTimes(2));

    controller.unregisterOperation('interval');
    vi.advanceTimersByTime(200);
    expect(syncFn).toHaveBeenCalledTimes(2);

    controller.dispose();
  });
});
