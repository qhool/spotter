/*
 * Generic sync controller for orchestrating background or foreground sync operations.
 */

export interface SyncResult<T> {
  updated: boolean;
  /** Timestamp that represents the freshness of the fetched data (e.g., played_at). */
  lastUpdated: Date | null;
  value: T;
}

export interface SyncOperationConfig<T> {
  name: string;
  /** Performs the remote synchronization and returns data plus metadata */
  syncFn: () => Promise<SyncResult<T>>;
  /** Called whenever the syncFn resolves so consumers can react to the result */
  onUpdate: (result: SyncResult<T>) => void;
  /** Optional handler for surfacing sync errors */
  onError?: (error: unknown) => void;
  /** Interval (ms) when the page is visible/on-screen */
  onscreenIntervalMs?: number;
  /** Interval (ms) when the page is hidden/off-screen */
  offscreenIntervalMs?: number;
  /** Run the sync immediately upon registration */
  runOnRegister?: boolean;
}

interface SyncOperationState<T> {
  config: SyncOperationConfig<T>;
  onscreenIntervalMs: number;
  offscreenIntervalMs: number;
  timerId: number | null;
  running: boolean;
  disposed: boolean;
}

const DEFAULT_ONSCREEN_INTERVAL_MS = 60_000; // 1 minute
const DEFAULT_OFFSCREEN_INTERVAL_MS = 5 * 60_000; // 5 minutes

/**
 * Coordinates named sync operations and adapts their cadence based on tab visibility.
 */
export class SyncController {
  private operations = new Map<string, SyncOperationState<unknown>>();
  private disposed = false;
  private visibilityListener?: () => void;

  constructor() {
    if (typeof document !== 'undefined') {
      this.visibilityListener = () => {
        this.operations.forEach(state => this.scheduleNextRun(state));
      };
      document.addEventListener('visibilitychange', this.visibilityListener);
      if (typeof window !== 'undefined') {
        window.addEventListener('focus', this.visibilityListener);
        window.addEventListener('blur', this.visibilityListener);
      }
    }
  }

  registerOperation<T>(config: SyncOperationConfig<T>): void {
    if (this.disposed) {
      throw new Error('SyncController has been disposed');
    }
    if (this.operations.has(config.name)) {
      throw new Error(`Sync operation "${config.name}" already exists`);
    }

    const state: SyncOperationState<T> = {
      config,
      onscreenIntervalMs: Math.max(0, config.onscreenIntervalMs ?? DEFAULT_ONSCREEN_INTERVAL_MS),
      offscreenIntervalMs: Math.max(0, config.offscreenIntervalMs ?? DEFAULT_OFFSCREEN_INTERVAL_MS),
      timerId: null,
      running: false,
      disposed: false
    };

    this.operations.set(config.name, state as SyncOperationState<unknown>);

    if (config.runOnRegister) {
      void this.runOperation(state);
    } else {
      this.scheduleNextRun(state);
    }
  }

  unregisterOperation(name: string): void {
    const state = this.operations.get(name);
    if (!state) {
      return;
    }
    this.clearTimer(state);
    (state as SyncOperationState<unknown>).disposed = true;
    this.operations.delete(name);
  }

  async triggerSync(name: string): Promise<void> {
    const state = this.operations.get(name) as SyncOperationState<unknown> | undefined;
    if (!state) {
      throw new Error(`Sync operation "${name}" is not registered`);
    }
    await this.runOperation(state);
  }

  setOnscreenInterval(name: string, intervalMs: number): void {
    const state = this.operations.get(name) as SyncOperationState<unknown> | undefined;
    if (!state) {
      throw new Error(`Sync operation "${name}" is not registered`);
    }
    state.onscreenIntervalMs = Math.max(0, intervalMs);
    this.scheduleNextRun(state);
  }

  setOffscreenInterval(name: string, intervalMs: number): void {
    const state = this.operations.get(name) as SyncOperationState<unknown> | undefined;
    if (!state) {
      throw new Error(`Sync operation "${name}" is not registered`);
    }
    state.offscreenIntervalMs = Math.max(0, intervalMs);
    this.scheduleNextRun(state);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.operations.forEach(state => {
      this.clearTimer(state);
      state.disposed = true;
    });
    this.operations.clear();

    if (this.visibilityListener) {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', this.visibilityListener);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', this.visibilityListener);
        window.removeEventListener('blur', this.visibilityListener);
      }
      this.visibilityListener = undefined;
    }
  }

  private async runOperation<T>(state: SyncOperationState<T>): Promise<void> {
    if (this.disposed || state.disposed || state.running) {
      return;
    }
    this.clearTimer(state);
    state.running = true;

    try {
      const result = await state.config.syncFn();
      state.config.onUpdate(result);
    } catch (error) {
      state.config.onError?.(error);
    } finally {
      state.running = false;
      this.scheduleNextRun(state);
    }
  }

  private scheduleNextRun<T>(state: SyncOperationState<T>): void {
    if (this.disposed || state.disposed) {
      return;
    }
    this.clearTimer(state);

    const interval = this.isOnScreen() ? state.onscreenIntervalMs : state.offscreenIntervalMs;
    if (!Number.isFinite(interval) || interval <= 0) {
      return; // treat 0/negative/Infinity as disabled auto-sync
    }

    if (typeof window === 'undefined') {
      return;
    }

    state.timerId = window.setTimeout(() => {
      void this.runOperation(state);
    }, interval);
  }

  private clearTimer<T>(state: SyncOperationState<T>): void {
    if (state.timerId !== null && typeof window !== 'undefined') {
      window.clearTimeout(state.timerId);
      state.timerId = null;
    }
  }

  private isOnScreen(): boolean {
    if (typeof document === 'undefined') {
      return true;
    }
    if (document.visibilityState !== 'visible') {
      return false;
    }
    if (typeof document.hasFocus === 'function') {
      return document.hasFocus();
    }
    return true;
  }
}
