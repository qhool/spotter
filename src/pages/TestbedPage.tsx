import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { responsiveSizingDump } from '../utils/responsiveSizingDump.ts';

interface TestbedPageProps {
  navSlot: Element | null;
}

export function TestbedPage({ navSlot }: TestbedPageProps) {

  const [hasClicked, setHasClicked] = useState(false);
  const buttonLabel = 'Delete All Playlists and Cancel Spotify Subscription';
  const [responsiveDump, setResponsiveDump] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const copyResetTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let rafId: number | null = null;

    const updateDump = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(() => {
        try {
          setResponsiveDump(responsiveSizingDump());
        } catch (error) {
          console.error('TestbedPage: failed to compute responsive sizing dump', error);
        }
      });
    };

    updateDump();

    window.addEventListener('resize', updateDump);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', updateDump);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('resize', updateDump);
      vv?.removeEventListener('resize', updateDump);
    };
  }, []);

  useEffect(() => {
    if (copyStatus === 'idle') {
      return;
    }
    copyResetTimeout.current = window.setTimeout(() => {
      setCopyStatus('idle');
    }, 2000);
    return () => {
      if (copyResetTimeout.current) {
        window.clearTimeout(copyResetTimeout.current);
        copyResetTimeout.current = null;
      }
    };
  }, [copyStatus]);

  const handleCopyDump = useCallback(async () => {
    if (!responsiveDump) {
      return;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(responsiveDump);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      setCopyStatus('copied');
    } catch (error) {
      console.error('TestbedPage: failed to copy responsive dump to clipboard', error);
      setCopyStatus('error');
    }
  }, [responsiveDump]);

  const copyButtonLabel = useMemo(() => {
    switch (copyStatus) {
      case 'copied':
        return 'Copied!';
      case 'error':
        return 'Copy failed';
      default:
        return 'Copy to clipboard';
    }
  }, [copyStatus]);

  return (
    <div className="testbed-container">
      {navSlot
        ? createPortal(
            <div className="nav-slot-content nav-slot-testbed">Scary Testing Page</div>,
            navSlot
          )
        : null}
      <div className="testbed-message scary-testbed">
        <button
          type="button"
          className="scary-testbed__button"
          onClick={() => setHasClicked(true)}
        >
          {buttonLabel}
        </button>
        <p className="scary-testbed__text" aria-live="polite">
          {hasClicked ? (
            <>
              That button doesn&apos;t do anything; we&apos;re not <i>monsters</i>
            </>
          ) : (
            'We told you it was scary.'
          )}
        </p>
      </div>

      <div className="responsive-dump-card" aria-live="polite">
        <div className="responsive-dump-card__header">
          <div>
            <p className="responsive-dump-card__eyebrow">Responsive debug helper</p>
            <h3>Viewport sizing dump</h3>
          </div>
          <button
            type="button"
            className="responsive-dump-card__copy-button"
            onClick={handleCopyDump}
            disabled={!responsiveDump}
          >
            {copyButtonLabel}
          </button>
        </div>
        <textarea
          className="responsive-dump-card__textarea"
          rows={4}
          value={responsiveDump}
          readOnly
          spellCheck={false}
        />
        <p className="responsive-dump-card__hint">
          Auto-refreshes as you resize or zoom; copy it into bug reports for quick context.
        </p>
      </div>
    </div>
  );
}
