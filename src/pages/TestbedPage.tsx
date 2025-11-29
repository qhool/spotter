import { SpotifyApi } from '@spotify/web-api-ts-sdk';

interface TestbedPageProps {
  sdk: SpotifyApi;
}

export function TestbedPage({ sdk }: TestbedPageProps) {
  return (
    <div className="testbed-container">
      <h1>Testbed</h1>
      <p>This is a blank testbed page for experimentation.</p>
      <p>Connected to Spotify SDK: {sdk ? '✓' : '✗'}</p>
    </div>
  );
}