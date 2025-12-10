import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SlideNav } from './SlideNav';
import './Wizard.css';

const classNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

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
  goTo: () => void;
}

export interface WizardPaneRenderContext<TMeta = unknown> {
  self: WizardPaneHandle<TMeta>;
  panes: WizardPaneHandle<TMeta>[];
}

export interface WizardProps<TMeta = unknown> {
  panes: WizardPane<TMeta>[];
  initialIndex?: number;
  visibleRange?: number;
  className?: string;
  navClassName?: string;
  navPosition?: 'top' | 'bottom';
  onIndexChange?: (index: number, pane: WizardPaneHandle<TMeta>) => void;
}

export function Wizard<TMeta = unknown>({
  panes,
  initialIndex = 0,
  visibleRange = 1,
  className,
  navClassName,
  navPosition = 'top',
  onIndexChange
}: WizardProps<TMeta>) {
  const paneCount = panes.length;
  const paneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trackOuterRef = useRef<HTMLDivElement | null>(null);

  const normalizeIndex = useCallback(
    (index: number) => {
      if (paneCount === 0) return 0;
      return Math.min(Math.max(index, 0), paneCount - 1);
    },
    [paneCount]
  );

  const [activeIndex, setActiveIndex] = useState(() => normalizeIndex(initialIndex));
  const [paneVisibility, setPaneVisibility] = useState<boolean[]>(() =>
    panes.map((_, index) => index === normalizeIndex(initialIndex))
  );

  const paneSignature = useMemo(() => panes.map(pane => pane.id).join('|'), [panes]);

  useEffect(() => {
    paneRefs.current = paneRefs.current.slice(0, paneCount);
  }, [paneCount]);

  useEffect(() => {
    setPaneVisibility(prev => panes.map((_, index) => prev[index] ?? false));
  }, [panes]);

  useEffect(() => {
    setActiveIndex(prev => normalizeIndex(prev));
  }, [normalizeIndex]);

  useEffect(() => {
    setPaneVisibility(prev => {
      if (prev[activeIndex]) {
        return prev;
      }
      const next = [...prev];
      next[activeIndex] = true;
      return next;
    });
  }, [activeIndex]);

  const goToIndex = useCallback(
    (nextIndex: number) => {
      setActiveIndex(normalizeIndex(nextIndex));
    },
    [normalizeIndex]
  );

  const navItems = useMemo(
    () =>
      panes.map((pane, index) => ({
        text: pane.title,
        onClick: () => goToIndex(index)
      })),
    [panes, goToIndex]
  );

  const paneHandles = useMemo<WizardPaneHandle<TMeta>[]>(() => {
    return panes.map((pane, index) => {
      const distance = index - activeIndex;
      const isReachable = Math.abs(distance) <= visibleRange;
      const isVisible = paneVisibility[index] ?? false;

      return {
        id: pane.id,
        title: pane.title,
        index,
        meta: pane.meta,
        element: paneRefs.current[index] ?? null,
        isActive: distance === 0,
        isVisible,
        isReachable,
        isLeftOfActive: distance < 0,
        isRightOfActive: distance > 0,
        goTo: () => goToIndex(index)
      };
    });
  }, [panes, activeIndex, visibleRange, goToIndex, paneVisibility]);

  useEffect(() => {
    const root = trackOuterRef.current;
    if (!root) {
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
        root,
        threshold: [0, 0.1, 0.2, 0.35, 0.5, 0.75, 1]
      }
    );

    paneRefs.current.forEach(element => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [paneSignature]);

  useEffect(() => {
    if (paneCount === 0) return;
    const activeHandle = paneHandles[activeIndex];
    if (activeHandle) {
      onIndexChange?.(activeIndex, activeHandle);
    }
  }, [activeIndex, paneHandles, onIndexChange, paneCount]);

  if (paneCount === 0) {
    return null;
  }

  const renderNav = () => (
    <div className={classNames('wizard-nav', navClassName)}>
      <SlideNav items={navItems} selectedIndex={activeIndex} />
    </div>
  );

  return (
    <div className={classNames('wizard', className)}>
      {navPosition === 'top' && paneCount > 1 && renderNav()}
      <div className="wizard-track-outer" ref={trackOuterRef}>
        <div
          className="wizard-track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {panes.map((pane, index) => {
            const handle = paneHandles[index];
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
                data-pane-id={handle.id}
                data-visible={handle.isVisible}
                data-pane-index={index}
                data-active={handle.isActive}
              >
                {pane.render({ self: handle, panes: paneHandles })}
              </section>
            );
          })}
        </div>
      </div>
      {navPosition === 'bottom' && paneCount > 1 && renderNav()}
    </div>
  );
}
