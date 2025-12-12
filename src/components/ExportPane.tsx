import { ChangeEvent } from 'react';
import './ExportPane.css';

export type ExportPaneExportType = 'playlist' | 'json';

interface ExportPaneProps {
  hasRemix: boolean;
  filteredTrackCount: number | null;
  exportType: ExportPaneExportType;
  playlistName: string;
  playlistDescription: string;
  lastCreatedPlaylistId: string | null;
  isExporting: boolean;
  actionButtonLabel: string;
  disableExportButton?: boolean;
  onExportTypeChange: (type: ExportPaneExportType) => void;
  onPlaylistNameChange: (value: string) => void;
  onPlaylistDescriptionChange: (value: string) => void;
  onExport: () => void;
}

export function ExportPane({
  hasRemix,
  filteredTrackCount,
  exportType,
  playlistName,
  playlistDescription,
  lastCreatedPlaylistId,
  isExporting,
  actionButtonLabel,
  disableExportButton = false,
  onExportTypeChange,
  onPlaylistNameChange,
  onPlaylistDescriptionChange,
  onExport
}: ExportPaneProps) {
  const handleExportTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onExportTypeChange(event.target.value as ExportPaneExportType);
  };

  const handlePlaylistNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onPlaylistNameChange(event.target.value);
  };

  const handlePlaylistDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onPlaylistDescriptionChange(event.target.value);
  };

  const handleOpenPlaylist = () => {
    if (!lastCreatedPlaylistId) {
      return;
    }
    window.open(`https://open.spotify.com/playlist/${lastCreatedPlaylistId}`, '_blank');
  };

  if (!hasRemix) {
    return (
      <div className="export-pane">
        <h3 className="export-pane__title">Export Options</h3>
        <div className="no-export">
          <p>Create a remix first to enable export options.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="export-pane">
      <h3 className="export-pane__title">Export Options</h3>

      <div className="export-options">
        <div className="export-info">
          <p className="track-count">
            {filteredTrackCount !== null ? `${filteredTrackCount} tracks selected for export` : 'Loading track count...'}
          </p>
        </div>

        <div className="export-group">
          <label className="control-label" htmlFor="export-format">
            Format
          </label>
          <select
            id="export-format"
            className="control-select"
            value={exportType}
            onChange={handleExportTypeChange}
          >
            <option value="playlist">Spotify Playlist</option>
            <option value="json">JSON Export</option>
          </select>
        </div>

        {exportType === 'playlist' && (
          <>
            <div className="export-group">
              <label className="control-label" htmlFor="playlist-name">
                Playlist Name
              </label>
              <input
                id="playlist-name"
                type="text"
                className="control-input"
                value={playlistName}
                onChange={handlePlaylistNameChange}
                placeholder="Enter playlist name"
              />
            </div>

            <div className="export-group">
              <label className="control-label" htmlFor="playlist-description">
                Description
              </label>
              <textarea
                id="playlist-description"
                className="control-textarea"
                value={playlistDescription}
                onChange={handlePlaylistDescriptionChange}
                placeholder="Enter playlist description"
                rows={3}
              />
            </div>
          </>
        )}

        {exportType === 'playlist' && lastCreatedPlaylistId && (
          <div className="export-group">
            <label className="control-label" htmlFor="last-created-playlist">
              Last Created Playlist
            </label>
            <div className="playlist-link-container">
              <button
                id="last-created-playlist"
                type="button"
                className="playlist-link-button"
                onClick={handleOpenPlaylist}
              >
                Open in Spotify
              </button>
            </div>
          </div>
        )}

        <div className="export-actions">
          <button
            className="export-button primary"
            onClick={onExport}
            disabled={isExporting || disableExportButton}
          >
            {actionButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
