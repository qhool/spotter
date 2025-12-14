import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { createPortal } from 'react-dom';

interface TestbedPageProps {
  sdk: SpotifyApi;
  titleSlot: Element | null;
}

export function TestbedPage({ titleSlot }: TestbedPageProps) {

  return (
    <div className="testbed-container" style={{ padding: '2rem' }}>
      {titleSlot ? createPortal(<span className="nav-title-suffix">: Testbed</span>, titleSlot) : null}
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
