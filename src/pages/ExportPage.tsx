import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { RemixContainer } from '../data/TrackContainer';
import { TrackList } from '../components/TrackList';
import { RemixOptions } from '../data/RemixFunctions';
import { ExportPane } from '../components/ExportPane';

interface ExportPageProps {
  sdk: SpotifyApi;
  remixContainer: RemixContainer<RemixOptions> | null;
  excludedTrackIds: Set<string>;
  setExcludedTrackIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function ExportPage({ sdk, remixContainer, excludedTrackIds, setExcludedTrackIds }: ExportPageProps) {
  return (
    <div className="select-items-container export-page">
      <div className="content-area">
        <div className="left-panel">
          {/* Track List showing the remix */}
          <div className="track-list-area">
            {remixContainer ? (
              <div className="playlist-container">
                <TrackList 
                  trackContainer={remixContainer} 
                  refreshTrigger={0}
                  excludedTrackIds={excludedTrackIds}
                  setExcludedTrackIds={setExcludedTrackIds}
                />
              </div>
            ) : (
              <div className="playlist-container">
                <div className="no-results">
                  No remix available. Go to Remix page to create one.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="right-panel">
          <ExportPane
            sdk={sdk}
            remixContainer={remixContainer}
            excludedTrackIds={excludedTrackIds}
          />
        </div>
      </div>
    </div>
  );
}