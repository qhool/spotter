import { useState } from 'react';
import { createPortal } from 'react-dom';

interface TestbedPageProps {
  navSlot: Element | null;
}

export function TestbedPage({ navSlot }: TestbedPageProps) {

  const [hasClicked, setHasClicked] = useState(false);
  const buttonLabel = 'Delete All Playlists and Cancel Spotify Subscription';

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
    </div>
  );
}
