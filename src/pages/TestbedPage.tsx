import { createPortal } from 'react-dom';

interface TestbedPageProps {
  navSlot: Element | null;
}

export function TestbedPage({ navSlot }: TestbedPageProps) {

  return (
    <div className="testbed-container" style={{ padding: '2rem' }}>
      {navSlot
        ? createPortal(
            <div className="nav-slot-content nav-slot-testbed">Scary Testing Page</div>,
            navSlot
          )
        : null}
      <div className="testbed-message">
        <h2>Experimental Playground</h2>
        <p>
          The Remix Wizard now lives in the main app. This page is free for future experiments and
          throwaway UI mocks.
        </p>
        <p>
          Feel free to tear this down and try ideas without worrying about disrupting the primary
          flow.
        </p>
      </div>
    </div>
  );
}
