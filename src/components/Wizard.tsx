import { CSSProperties, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SlideNav } from './SlideNav';
import { ArrayMap } from '../data/ArrayMap';
import './Wizard.css';

const classNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

interface WizardResponsiveBreakpoint {
  minWidth: number;
  panes: number;
}

export type WizardViewTitles = Partial<Record<number, string[]>>;

interface WindowConfig {
  size: number;
  titles: string[];
}

const DEFAULT_BREAKPOINTS: WizardResponsiveBreakpoint[] = [
  { minWidth: 1440, panes: 3 },
  { minWidth: 960, panes: 2 },
  { minWidth: 0, panes: 1 }
];

const sortBreakpoints = (overrides?: WizardResponsiveBreakpoint[]): WizardResponsiveBreakpoint[] => {
  const copy = overrides && overrides.length ? [...overrides] : [...DEFAULT_BREAKPOINTS];
  if (!copy.some(bp => bp.minWidth === 0)) {
    copy.push({ minWidth: 0, panes: 1 });
  }
  return copy.sort((a, b) => b.minWidth - a.minWidth);
};

const fallbackComboName = (paneTitles: string[], start: number, size: number) =>
  paneTitles.slice(start, start + size).join(' + ');

const combosForSize = (paneCount: number, size: number) => {
  if (paneCount === 0 || size === 0) {
    return 0;
  }
  return Math.max(1, paneCount - size + 1);
};

export interface WizardPane<TMeta = unknown> {
  id: string;
  title: string;
  render: (context: WizardPaneRenderContext<TMeta>) => ReactNode;
  meta?: TMeta;
}

export interface WizardPaneHandle<TMeta = unknown> {
  id: string;
  title: string;
  index: number;
  meta?: TMeta;
  element: HTMLDivElement | null;
  isActive: boolean;
  isVisible: boolean;
  isReachable: boolean;
  isLeftOfActive: boolean;
  isRightOfActive: boolean;
  windowSize: number;
  windowStartIndex: number;
  windowEndIndex: number;
  goTo: () => void;
  getId: () => string;
}

export interface WizardPaneRenderContext<TMeta = unknown> {
  self: WizardPaneHandle<TMeta>;
  panes: ArrayMap<WizardPaneHandle<TMeta>>;
  windowSize: number;
  windowStartIndex: number;
}

export interface WizardProps<TMeta = unknown> {
  panes: WizardPane<TMeta>[];
  initialIndex?: number;
  visibleRange?: number;
  className?: string;
  navClassName?: string;
  navPosition?: 'top' | 'bottom';
  onIndexChange?: (index: number, pane: WizardPaneHandle<TMeta>) => void;
  viewTitles?: WizardViewTitles;
  responsiveBreakpoints?: WizardResponsiveBreakpoint[];
}

export function Wizard<TMeta = unknown>({
  panes,
  initialIndex = 0,
  visibleRange = 1,
  className,
  navClassName,
  navPosition = 'top',
  onIndexChange,
  viewTitles,
  responsiveBreakpoints
}: WizardProps<TMeta>) {
  const paneCount = panes.length;
  const paneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [trackNode, setTrackNode] = useState<HTMLDivElement | null>(null);
  const sortedBreakpoints = useMemo(
    () => sortBreakpoints(responsiveBreakpoints),
    [responsiveBreakpoints]
  );

  const paneTitles = useMemo(() => panes.map(p => p.title), [panes]);

  const windowConfigs = useMemo<WindowConfig[]>(() => {
    const configs: WindowConfig[] = [];
    const singles = viewTitles?.[1];

    if (singles && singles.length === paneCount) {
      configs.push({ size: 1, titles: singles });
    } else {
      if (singles && singles.length !== paneCount) {
        console.warn(
          `Wizard: viewTitles[1] expected ${paneCount} entries, received ${singles.length}. Falling back to pane titles.`
        );
      }
      configs.push({ size: 1, titles: paneTitles });
    }

    Object.entries(viewTitles ?? {}).forEach(([sizeKey, titles]) => {
      const size = Number(sizeKey);
      if (!Number.isFinite(size) || size <= 1) {
        return;
      }
      if (size > paneCount || paneCount === 0) {
        return;
      }
      const expected = combosForSize(paneCount, size);
      if (!titles || titles.length < expected) {
        console.warn(
          `Wizard: viewTitles[${size}] expected ${expected} entries, received ${titles ? titles.length : 0}.`
        );
        return;
      }
      configs.push({ size, titles: titles.slice(0, expected) });
    });

    const unique = new Map<number, WindowConfig>();
    configs.forEach(cfg => {
      unique.set(cfg.size, cfg);
    });

    const ordered = Array.from(unique.values()).sort((a, b) => a.size - b.size);
    return ordered.length ? ordered : [{ size: 1, titles: paneTitles }];
  }, [paneCount, paneTitles, viewTitles]);

  const availableSizes = useMemo(() => windowConfigs.map(cfg => cfg.size), [windowConfigs]);
  const [windowSize, setWindowSize] = useState(() => availableSizes[0] ?? 1);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [paneVisibility, setPaneVisibility] = useState<boolean[]>(() =>
    panes.map(() => false)
  );

  const clampWindowStart = useCallback(
    (startIndex: number, sizeOverride?: number) => {
      const size = sizeOverride ?? windowSize;
      const maxStart = Math.max(0, paneCount - size);
      return Math.min(Math.max(startIndex, 0), maxStart);
    },
    [paneCount, windowSize]
  );

  const [activeWindowStart, setActiveWindowStart] = useState(() =>
    clampWindowStart(Math.min(initialIndex, paneCount - 1), windowSize)
  );

  useEffect(() => {
    paneRefs.current = paneRefs.current.slice(0, paneCount);
  }, [paneCount]);

  useEffect(() => {
    setWindowSize(prev => (availableSizes.includes(prev) ? prev : availableSizes[0] ?? 1));
  }, [availableSizes]);

  const pickWindowSize = useCallback(
    (width: number | null) => {
      if (!availableSizes.length) {
        return 1;
      }
      if (width === null) {
        return availableSizes[0];
      }

      const target = sortedBreakpoints.find(bp => width >= bp.minWidth)?.panes ?? 1;
      const descending = [...availableSizes].sort((a, b) => b - a);
      const match = descending.find(size => size <= target);
      return match ?? availableSizes[0];
    },
    [availableSizes, sortedBreakpoints]
  );

  useEffect(() => {
    const nextSize = pickWindowSize(containerWidth);
    setWindowSize(prev => (prev === nextSize ? prev : nextSize));
  }, [containerWidth, pickWindowSize]);

  useEffect(() => {
    if (!trackNode || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(entries => {
      if (!entries.length) {
        return;
      }
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(trackNode);
    return () => observer.disconnect();
  }, [trackNode]);

  useEffect(() => {
    if (containerWidth === null && trackNode) {
      setContainerWidth(trackNode.getBoundingClientRect().width);
    }
  }, [trackNode, containerWidth]);

  useEffect(() => {
    setActiveWindowStart(prev => clampWindowStart(prev));
  }, [windowSize, paneCount, clampWindowStart]);

  const goToWindow = useCallback(
    (startIndex: number) => {
      setActiveWindowStart(clampWindowStart(startIndex));
    },
    [clampWindowStart]
  );

  const goToPane = useCallback(
    (paneIndex: number) => {
      goToWindow(clampWindowStart(paneIndex));
    },
    [clampWindowStart, goToWindow]
  );

  const windowTitlesMap = useMemo(() => {
    const map = new Map<number, string[]>();
    windowConfigs.forEach(cfg => {
      map.set(cfg.size, cfg.titles);
    });
    return map;
  }, [windowConfigs]);

  const windowCount = paneCount === 0 ? 0 : Math.max(1, paneCount - windowSize + 1);
  const currentWindowTitles = windowTitlesMap.get(windowSize) ?? [];

  const navItems = useMemo(() => {
    if (windowCount === 0) {
      return [];
    }
    return Array.from({ length: windowCount }, (_, startIndex) => ({
      text:
        currentWindowTitles[startIndex] ??
        fallbackComboName(paneTitles, startIndex, windowSize),
      onClick: () => goToWindow(startIndex)
    }));
  }, [currentWindowTitles, goToWindow, paneTitles, windowCount, windowSize]);

  const paneSignature = useMemo(() => panes.map(pane => pane.id).join('|'), [panes]);

  useEffect(() => {
    setPaneVisibility(prev => panes.map((_, index) => prev[index] ?? false));
  }, [panes]);

  useEffect(() => {
    if (!trackNode || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        setPaneVisibility(prev => {
          const next = [...prev];
          let changed = false;

          entries.forEach(entry => {
            const paneIndexAttr = (entry.target as HTMLElement).dataset.paneIndex;
            if (paneIndexAttr == null) {
              return;
            }
            const paneIndex = Number(paneIndexAttr);
            if (Number.isNaN(paneIndex) || paneIndex >= next.length) {
              return;
            }

            const isIntersecting = entry.isIntersecting && entry.intersectionRatio > 0;
            if (next[paneIndex] !== isIntersecting) {
              next[paneIndex] = isIntersecting;
              changed = true;
            }
          });

          return changed ? next : prev;
        });
      },
      {
        root: trackNode,
        threshold: [0, 0.1, 0.2, 0.35, 0.5, 0.75, 1]
      }
    );

    paneRefs.current.forEach(element => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [paneSignature, trackNode]);

  const paneHandles = useMemo<ArrayMap<WizardPaneHandle<TMeta>>>(() => {
    const windowEnd = activeWindowStart + windowSize - 1;
    const handles = new ArrayMap<WizardPaneHandle<TMeta>>();
    panes.forEach((pane, index) => {
      const isInWindow = index >= activeWindowStart && index <= windowEnd;
      const isLeftOfWindow = index < activeWindowStart;
      const isRightOfWindow = index > windowEnd;
      const distanceFromWindow = isInWindow
        ? 0
        : isLeftOfWindow
        ? activeWindowStart - index
        : index - windowEnd;
      const isReachable = isInWindow || distanceFromWindow <= visibleRange;

      const handle: WizardPaneHandle<TMeta> = {
        id: pane.id,
        title: pane.title,
        index,
        meta: pane.meta,
        element: paneRefs.current[index] ?? null,
        isActive: isInWindow,
        isVisible: paneVisibility[index] ?? false,
        isReachable,
        isLeftOfActive: isLeftOfWindow,
        isRightOfActive: isRightOfWindow,
        windowSize,
        windowStartIndex: activeWindowStart,
        windowEndIndex: windowEnd,
        goTo: () => goToPane(index),
        getId: () => pane.id
      };
      handles.push(handle);
    });
    return handles;
  }, [activeWindowStart, goToPane, paneVisibility, panes, visibleRange, windowSize]);

  useEffect(() => {
    if (paneCount === 0) {
      return;
    }
    const activeHandle = paneHandles.at(activeWindowStart);
    if (activeHandle) {
      onIndexChange?.(activeWindowStart, activeHandle);
    }
  }, [activeWindowStart, onIndexChange, paneHandles, paneCount]);

  if (paneCount === 0) {
    return null;
  }

  const renderNav = () => {
    if (windowCount <= 1) {
      return null;
    }
    return (
      <div className={classNames('wizard-nav', navClassName)}>
        <SlideNav items={navItems} selectedIndex={activeWindowStart} />
      </div>
    );
  };

  return (
    <div className={classNames('wizard', className)}>
      {navPosition === 'top' && renderNav()}
      <div className="wizard-track-outer" ref={setTrackNode}>
        <div
          className="wizard-track"
          style={{ transform: `translateX(-${(activeWindowStart * 100) / windowSize}%)` }}
        >
          {panes.map((pane, index) => {
            const handle = paneHandles.at(index);
            if (!handle) {
              return null;
            }
            return (
              <section
                key={handle.id}
                ref={(element: HTMLDivElement | null) => {
                  paneRefs.current[index] = element;
                }}
                className={classNames(
                  'wizard-pane',
                  handle.isVisible && 'is-visible',
                  handle.isReachable && 'is-reachable',
                  handle.isActive && 'is-active',
                  handle.isLeftOfActive && 'is-left',
                  handle.isRightOfActive && 'is-right'
                )}
                style={{
                  '--wizard-pane-width': `${100 / windowSize}%`
                } as CSSProperties}
                data-pane-id={handle.id}
                data-pane-index={index}
                data-visible={handle.isVisible}
                data-active={handle.isActive}
              >
                {pane.render({
                  self: handle,
                  panes: paneHandles,
                  windowSize,
                  windowStartIndex: activeWindowStart
                })}
              </section>
            );
          })}
        </div>
      </div>
      {navPosition === 'bottom' && renderNav()}
    </div>
  );
}
