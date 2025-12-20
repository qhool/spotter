import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './LimitSlider.css';

const AUTO_DISMISS_DELAY_MS = 3000;

const classNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export interface LimitSliderProps {
  totalCount: number | null;
  limit: number | null;
  onLimitChange: (nextLimit: number | null) => void;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
}

export function LimitSlider({
  totalCount,
  limit,
  onLimitChange,
  disabled = false,
  className,
  buttonClassName
}: LimitSliderProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [draftValue, setDraftValue] = useState<number | null>(null);
  const controlRef = useRef<HTMLDivElement | null>(null);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canAdjust = !disabled && totalCount !== null && totalCount > 0;

  const clearDismissTimer = useCallback(() => {
    if (dismissTimeoutRef.current) {
      window.clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }
  }, []);

  const closePopover = useCallback(() => {
    clearDismissTimer();
    setIsPopoverOpen(false);
    setDraftValue(null);
  }, [clearDismissTimer]);

  const scheduleDismiss = useCallback(() => {
    clearDismissTimer();
    dismissTimeoutRef.current = window.setTimeout(() => {
      closePopover();
    }, AUTO_DISMISS_DELAY_MS);
  }, [clearDismissTimer, closePopover]);

  useEffect(() => {
    return () => {
      clearDismissTimer();
    };
  }, [clearDismissTimer]);

  useEffect(() => {
    if (!isPopoverOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!controlRef.current) {
        return;
      }
      if (!controlRef.current.contains(event.target as Node)) {
        closePopover();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [closePopover, isPopoverOpen]);

  useEffect(() => {
    if (isPopoverOpen && !canAdjust) {
      closePopover();
    }
  }, [canAdjust, closePopover, isPopoverOpen]);

  const currentValue = useMemo(() => {
    if (!totalCount || totalCount <= 0) {
      return null;
    }
    if (isPopoverOpen && draftValue !== null) {
      return Math.max(1, Math.min(draftValue, totalCount));
    }
    if (limit === null) {
      return totalCount;
    }
    return Math.max(1, Math.min(limit, totalCount));
  }, [draftValue, isPopoverOpen, limit, totalCount]);

  const buttonLabel = useMemo(() => {
    if (!totalCount || totalCount <= 0) {
      return 'all tracks';
    }
    if (!currentValue || currentValue >= totalCount) {
      return `all ${totalCount}`;
    }
    if (currentValue === 1) {
      return `first of ${totalCount}`;
    }
    return `first ${currentValue} of ${totalCount}`;
  }, [currentValue, totalCount]);

  const handleButtonClick = useCallback(() => {
    if (!canAdjust) {
      return;
    }

    setIsPopoverOpen(prev => {
      const nextOpen = !prev;
      if (nextOpen) {
        const fallbackTotal = totalCount ?? 1;
        const baseValue =
          limit === null
            ? fallbackTotal
            : Math.max(1, Math.min(limit, fallbackTotal));
        setDraftValue(baseValue);
        scheduleDismiss();
      } else {
        setDraftValue(null);
        clearDismissTimer();
      }
      return nextOpen;
    });
  }, [canAdjust, clearDismissTimer, limit, scheduleDismiss, totalCount]);

  const handleSliderChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!totalCount || totalCount <= 0) {
        return;
      }
      const value = Math.max(1, Math.min(Number(event.target.value), totalCount));
      setDraftValue(value);
      if (value >= totalCount) {
        onLimitChange(null);
      } else {
        onLimitChange(value);
      }
      scheduleDismiss();
    },
    [onLimitChange, scheduleDismiss, totalCount]
  );

  const handleSliderInteraction = useCallback(() => {
    if (isPopoverOpen) {
      scheduleDismiss();
    }
  }, [isPopoverOpen, scheduleDismiss]);

  const controlClasses = classNames('track-limit-control', className);
  const buttonClasses = classNames('track-limit-button', buttonClassName);

  return (
    <div className={controlClasses} ref={controlRef}>
      <button
        type="button"
        className={buttonClasses}
        disabled={!canAdjust}
        aria-haspopup="true"
        aria-expanded={isPopoverOpen}
        onClick={event => {
          event.preventDefault();
          event.stopPropagation();
          handleButtonClick();
        }}
      >
        {buttonLabel}
      </button>
      {isPopoverOpen && totalCount !== null && totalCount > 0 && (
        <div className="track-limit-popover" role="dialog" aria-label="Limit exported tracks">
          <input
            type="range"
            min={1}
            max={totalCount}
            step={1}
            value={currentValue ?? totalCount}
            className="track-limit-slider"
            onChange={handleSliderChange}
            onPointerDown={handleSliderInteraction}
            onPointerUp={handleSliderInteraction}
            onFocus={handleSliderInteraction}
            onKeyDown={handleSliderInteraction}
          />
        </div>
      )}
    </div>
  );
}
