import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncController } from '../../data/SyncController';

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

  it('throws when registering duplicate names or triggering unknown operations', async () => {
    const controller = new SyncController();
    const config = {
      name: 'dup',
      syncFn: vi.fn().mockResolvedValue({ updated: false, lastUpdated: null, value: {} }),
      onUpdate: vi.fn()
    };

    controller.registerOperation(config);
    expect(() => controller.registerOperation(config)).toThrow('Sync operation "dup" already exists');
    await expect(controller.triggerSync('missing')).rejects.toThrow('Sync operation "missing" is not registered');

    controller.dispose();
  });

  it('invokes onError and reschedules after failures', async () => {
    const controller = new SyncController();
    const onError = vi.fn();
    const syncFn = vi.fn().mockRejectedValue(new Error('boom'));

    controller.registerOperation({
      name: 'erroring',
      syncFn,
      onUpdate: vi.fn(),
      onError,
      onscreenIntervalMs: 50,
      runOnRegister: true
    });

    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));

    await vi.runOnlyPendingTimersAsync();
    await vi.waitFor(() => expect(syncFn).toHaveBeenCalledTimes(2));

    controller.dispose();
  });

  it('clears timers when intervals are set to zero or negative', async () => {
    const controller = new SyncController();
    const syncFn = vi.fn().mockResolvedValue({ updated: true, lastUpdated: null, value: {} });

    controller.registerOperation({
      name: 'disable',
      syncFn,
      onUpdate: vi.fn(),
      onscreenIntervalMs: 100,
      runOnRegister: true
    });

    await vi.waitFor(() => expect(syncFn).toHaveBeenCalledTimes(1));

    controller.setOnscreenInterval('disable', 0);
    vi.advanceTimersByTime(500);
    expect(syncFn).toHaveBeenCalledTimes(1);

    controller.setOffscreenInterval('disable', -5);
    vi.advanceTimersByTime(500);
    expect(syncFn).toHaveBeenCalledTimes(1);

    controller.dispose();
  });

  it('uses offscreen interval when tab hidden', async () => {
    const controller = new SyncController();
    const syncFn = vi.fn().mockResolvedValue({ updated: true, lastUpdated: null, value: {} });
    const originalVisibility = Object.getOwnPropertyDescriptor(document, 'visibilityState');
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });

    controller.registerOperation({
      name: 'hidden',
      syncFn,
      onUpdate: vi.fn(),
      onscreenIntervalMs: 5000,
      offscreenIntervalMs: 50,
      runOnRegister: false
    });

    vi.advanceTimersByTime(60);
    await vi.waitFor(() => expect(syncFn).toHaveBeenCalledTimes(1));

    if (originalVisibility) {
      Object.defineProperty(document, 'visibilityState', originalVisibility);
    }
    controller.dispose();
  });

  it('disposes idempotently and prevents further timers', () => {
    const controller = new SyncController();
    const syncFn = vi.fn().mockResolvedValue({ updated: true, lastUpdated: null, value: {} });

    controller.registerOperation({
      name: 'dispose',
      syncFn,
      onUpdate: vi.fn(),
      onscreenIntervalMs: 100
    });

    controller.dispose();
    controller.dispose(); // should not throw

    vi.advanceTimersByTime(200);
    expect(syncFn).not.toHaveBeenCalled();
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
